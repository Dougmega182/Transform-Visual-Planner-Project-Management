import * as XLSX from 'xlsx';
import { getDb } from './db/database';

function excelDateToJSDate(serial: number) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split('T')[0];
}

export async function processScheduleFile(filePath: string | Buffer, fileName: string) {
  const db = getDb();
  const workbook = typeof filePath === 'string' ? XLSX.readFile(filePath) : XLSX.read(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Find header row (usually contains 'title' or 'start')
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(data.length, 20); i++) {
    const row = data[i].map(c => String(c).toLowerCase());
    if (row.includes('title') || row.includes('task') || row.includes('start')) {
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(`Could not find header row in ${fileName}`);
  }

  const headers = data[headerRowIdx].map(h => String(h).toLowerCase());
  const col = (name: string) => {
     // Handle multiple possible header names
     if (name === 'title') {
        const idx = headers.findIndex(h => h.includes('title') || h.includes('task') || h.includes('description'));
        return idx;
     }
     if (name === 'start') {
        return headers.findIndex(h => h.includes('start') || h.includes('date'));
     }
     return headers.indexOf(name);
  };

  // Find or create site front based on filename
  const frontName = fileName.replace('Schedule_List_', '').replace('.xlsx', '').replace('.xlsm', '').split(' - ')[0];
  let front = db.prepare('SELECT id FROM site_fronts WHERE name = ?').get(frontName);
  if (!front) {
    const info = db.prepare('INSERT INTO site_fronts (name, "order") VALUES (?, ?)').run(frontName, 0);
    front = { id: info.lastInsertRowid };
  }

  const rows = data.slice(headerRowIdx + 1);
  let tasksImported = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  const insertTask = db.prepare(`
    INSERT INTO tasks (
      front_id, title, date, duration, crew_count, stage, status, 
      zone, subcontractor, hours_per_day, equipment_needs, weather_sensitivity, cost_rate, trade
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const upsertPool = db.prepare(`
    INSERT INTO resource_pool (trade, source, total_capacity, effective_from)
    VALUES (?, ?, ?, ?)
    ON CONFLICT DO NOTHING
  `);

  // Explicitly ensure user priorities exist
  const today = new Date().toISOString().split('T')[0];
  upsertPool.run('Carpentry My staff', 'in-house', 8, today);
  upsertPool.run('Labourers My staff', 'in-house', 12, today);

  const uniqueTrades = new Set<string>();

  for (const row of rows) {
    const title = row[col('title')];
    if (!title) continue;

    const startSerial = row[col('start')];
    const duration = Number(row[col('duration')]) || 1;
    const crewCount = Number(row[col('crew')] || row[col('crew count')]) || 1;
    const phase = String(row[col('phase')] || 'unassigned');
    const zone = String(row[col('zone')] || row[col('location')] || '');
    const trade = String(row[col('trade')] || row[col('subcontractor')] || row[col('company')] || 'General').trim();

    if (trade && trade !== 'General') uniqueTrades.add(trade);

    const startDate = typeof startSerial === 'number' ? excelDateToJSDate(startSerial) : null;
    
    insertTask.run(
      (front as any).id, 
      title, 
      startDate, 
      duration,
      crewCount,
      phase, 
      'not-started',
      zone,
      trade, // Using trade for subcontractor field if that's what's available
      8.0,
      '',
      0,
      0,
      trade  // Actual trade field
    );
    tasksImported++;
  }

  // Populate pool with discovered trades
  uniqueTrades.forEach(t => {
    upsertPool.run(t, 'subcontractor', 4, today);
  });

  const uniqueZones = Array.from(new Set(rows.map(row => String(row[col('zone')] || row[col('location')] || '').trim()).filter(Boolean)));

  return { tasksImported, errors, warnings, uniqueZones };
}
