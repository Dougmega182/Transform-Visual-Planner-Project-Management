import * as XLSX from 'xlsx';
import { getDb } from './db/database';
import * as fs from 'fs';
import * as path from 'path';

const IMPORTS_DIR = path.resolve(process.cwd(), 'imports');

function excelDateToJSDate(serial: number) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return date_info.toISOString().split('T')[0];
}

export async function scanAndProcessImports() {
  console.log(`[Import] Looking in: ${IMPORTS_DIR}`);
  console.log(`[Import] Directory exists: ${fs.existsSync(IMPORTS_DIR)}`);
  
  if (fs.existsSync(IMPORTS_DIR)) {
    const allFiles = fs.readdirSync(IMPORTS_DIR);
    console.log(`[Import] All files in directory:`, allFiles);
  }
  const results = { 
    filesProcessed: 0, 
    tasksImported: 0, 
    newStaffCreated: 0, 
    validationReport: [] as any[] 
  };

  if (!fs.existsSync(IMPORTS_DIR)) {
    fs.mkdirSync(IMPORTS_DIR, { recursive: true });
    console.log(`[Import] Created imports directory: ${IMPORTS_DIR}`);
    return results;
  }

  const files = fs.readdirSync(IMPORTS_DIR).filter(f => {
    const ext = f.endsWith('.xlsx') || f.endsWith('.xlsm') || f.endsWith('.xls') || f.endsWith('.csv');
    const isSchedule = f.startsWith('Schedule_List_') || f === 'schedule_latest.xlsx';
    if (ext && !isSchedule) {
      console.log(`[Import] Skipping non-schedule file: ${f}`);
    }
    return ext && isSchedule;
  });

  console.log(`[Import] Found ${files.length} files in ${IMPORTS_DIR}`);

  for (const fileName of files) {
    try {
      const filePath = path.join(IMPORTS_DIR, fileName);
      const result = await processScheduleFile(filePath, fileName);
      
      results.filesProcessed++;
      results.tasksImported += result.tasksImported;
      results.newStaffCreated += result.newStaffCreated;
      results.validationReport.push({
        file: fileName,
        errors: result.errors || [],
        warnings: result.warnings || []
      });
    } catch (err: any) {
      console.error(`[Import] Failed: ${fileName} — ${err.message}`);
      results.validationReport.push({
        file: fileName,
        errors: [err.message],
        warnings: []
      });
    }
  }

  return results;
}

export async function processScheduleFile(filePath: string | Buffer, fileName: string) {
  const db = getDb();
  
  // Ensure all required columns exist in tasks table
  const existingCols = db.prepare("PRAGMA table_info(tasks)").all().map((c: any) => c.name);
  const requiredCols: [string, string][] = [
    ['crew_count', 'INTEGER DEFAULT 1'],
    ['zone', 'TEXT DEFAULT ""'],
    ['subcontractor', 'TEXT DEFAULT ""'],
    ['hours_per_day', 'REAL DEFAULT 8.0'],
    ['equipment_needs', 'TEXT DEFAULT ""'],
    ['weather_sensitivity', 'INTEGER DEFAULT 0'],
    ['cost_rate', 'REAL DEFAULT 0'],
    ['trade', 'TEXT DEFAULT "General"'],
    ['percent_complete', 'REAL DEFAULT 0'],
  ];
  for (const [colName, colDef] of requiredCols) {
    if (!existingCols.includes(colName)) {
      db.prepare(`ALTER TABLE tasks ADD COLUMN ${colName} ${colDef}`).run();
      console.log(`[Import] Added missing column: tasks.${colName}`);
    }
  }

  let workbook: XLSX.WorkBook;
  if (typeof filePath === 'string') {
    const fileBuffer = fs.readFileSync(filePath);
    workbook = XLSX.read(fileBuffer);
  } else {
    workbook = XLSX.read(filePath);
  }
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

  // Find header row (usually contains 'title' or 'start')
  let headerRowIdx = -1;
  for (let i = 0; i < Math.min(data.length, 50); i++) {
    if (!data[i]) continue;
    const row = data[i].map(c => String(c || '').toLowerCase());
    // Broaden the search for common project schedule headers
    if (row.some(h => h.includes('title') || h.includes('task') || h.includes('start') || h.includes('activity') || h.includes('resource'))) {
      console.log(`[Import] Found potential header row at idx ${i}:`, row.filter(h => h).slice(0, 5));
      headerRowIdx = i;
      break;
    }
  }

  if (headerRowIdx === -1) {
    throw new Error(`Could not find header row in ${fileName}`);
  }

  const headers = data[headerRowIdx].map(h => String(h).toLowerCase());
  const col = (name: string) => {
     if (name === 'title') {
        return headers.findIndex(h => h.includes('title') || h.includes('task') || h.includes('description') || h.includes('name') || h.includes('activity'));
     }
     if (name === 'start') {
        return headers.findIndex(h => h.includes('start') || h.includes('planned start') || h.includes('date'));
     }
     if (name === 'duration') {
        return headers.findIndex(h => h.includes('duration') || h.includes('days') || h.includes('length'));
     }
     if (name === 'trade' || name === 'assignee') {
        return headers.findIndex(h => h.includes('trade') || h.includes('assignee') || h.includes('assigned to') || h.includes('resource') || h.includes('contact'));
     }
     if (name === 'progress') {
        return headers.findIndex(h => h.includes('progress') || h.includes('percent') || h.includes('%'));
     }
     if (name === 'zone' || name === 'location') {
        return headers.findIndex(h => h.includes('zone') || h.includes('location') || h.includes('area') || h.includes('front'));
     }
     if (name === 'crew') {
        return headers.findIndex(h => h.includes('crew') || h.includes('headcount') || h.includes('people'));
     }
     return headers.indexOf(name);
  };

  const frontName = fileName
    .replace('Schedule_List_', '')
    .replace('.xlsx', '')
    .replace('.xlsm', '')
    .split(' - ')[0]
    .split(' (')[0]
    .trim();

  let front = db.prepare('SELECT id FROM site_fronts WHERE name = ?').get(frontName);
  if (!front) {
    const maxOrder = db.prepare('SELECT MAX("order") as mo FROM site_fronts').get() as any;
    const info = db.prepare('INSERT INTO site_fronts (name, "order") VALUES (?, ?)').run(frontName, (maxOrder.mo || 0) + 1);
    front = { id: info.lastInsertRowid };
  }

  const rows = data.slice(headerRowIdx + 1);
  let tasksImported = 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  const insertTask = db.prepare(`
    INSERT INTO tasks (
      front_id, title, date, duration, crew_count, stage, status, 
      zone, subcontractor, hours_per_day, equipment_needs, weather_sensitivity, cost_rate, trade, percent_complete
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const upsertPool = db.prepare(`
    INSERT INTO resource_pool (trade, source, total_capacity, effective_from)
    VALUES (?, ?, ?, ?)
    ON CONFLICT DO NOTHING
  `);

  const today = new Date().toISOString().split('T')[0];
  upsertPool.run('Carpentry My staff', 'in-house', 8, today);
  upsertPool.run('Labourers My staff', 'in-house', 12, today);

  const uniqueTrades = new Set<string>();
  const titleCol = col('title');
  const startCol = col('start');

  if (titleCol === -1 || startCol === -1) {
    console.error(`[Import] Missing critical columns (title/start) in ${fileName}`);
    return { tasksImported: 0, newStaffCreated: 0, errors: [`Missing critical columns in ${fileName}`], warnings: [], uniqueZones: [] };
  }

  const durCol = col('duration');
  const crewCol = col('crew');
  const phaseCol = col('phase');
  const zoneCol = col('zone');
  const progressCol = col('progress');
  const tradeCol = col('trade');
  const assigneeCol = col('assignee');

  for (const row of rows) {
    const title = row[titleCol];
    if (!title) continue;

    const startSerial = row[startCol];
    const duration = durCol !== -1 ? Number(row[durCol]) || 1 : 1;
    const crewCount = crewCol !== -1 ? Number(row[crewCol]) || 1 : 1;
    const phase = phaseCol !== -1 ? String(row[phaseCol] || 'unassigned') : 'unassigned';
    const zone = zoneCol !== -1 ? String(row[zoneCol] || '') : '';
    const progress = progressCol !== -1 ? Number(row[progressCol]) || 0 : 0;
    
    let trade = tradeCol !== -1 ? String(row[tradeCol] || '').trim() : '';
    if (!trade || trade === 'undefined') {
       const assignee = assigneeCol !== -1 ? String(row[assigneeCol] || '').split(',')[0].trim() : '';
       trade = assignee || 'General';
    }

    if (trade && trade !== 'General') uniqueTrades.add(trade);

    const startDate = typeof startSerial === 'number' ? excelDateToJSDate(startSerial) : null;
    const status = progress === 100 ? 'completed' : (progress > 0 ? 'in-progress' : 'not-started');
    
    insertTask.run(
      (front as any).id, 
      title, 
      startDate, 
      duration,
      crewCount,
      phase, 
      status,
      zone,
      trade, 
      8.0,
      '',
      0,
      0,
      trade,
      progress
    );
    tasksImported++;
  }

  let newStaffCreated = 0;
  uniqueTrades.forEach(t => {
    const info = upsertPool.run(t, 'subcontractor', 4, today);
    if (info.changes > 0) newStaffCreated++;
  });

  const uniqueZones = Array.from(new Set(rows.map(row => String(row[zoneCol !== -1 ? zoneCol : -1] || '').trim()).filter(Boolean)));

  console.log(`[Import] ${fileName}: Processed ${rows.length} rows, imported ${tasksImported} tasks, created ${newStaffCreated} new resources.`);

  return { tasksImported, newStaffCreated, errors, warnings, uniqueZones };
}
