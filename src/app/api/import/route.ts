import { NextResponse } from 'next/server';
import db from '@/lib/db/database';
import * as XLSX from 'xlsx';
import path from 'path';
import fs from 'fs';

export async function POST() {
  try {
    const importDir = path.resolve(process.cwd(), 'imports');
    const files = fs.readdirSync(importDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xlsm'));

    if (files.length === 0) {
      return NextResponse.json({ error: 'No Excel files found in imports/ folder' }, { status: 400 });
    }

    // 1. Process Master Dashboard First (to ensure site_fronts exist)
    const masterFile = files.find(f => f.toLowerCase().includes('summary') || f.toLowerCase().includes('live'));
    if (masterFile) {
      await processMasterDashboard(path.join(importDir, masterFile));
    }

    // 2. Process Individual Schedule Lists
    const scheduleFiles = files.filter(f => f.toLowerCase().includes('schedule_list'));
    let totalTasksImported = 0;
    let staffCreated = 0;

    for (const file of scheduleFiles) {
      const result = await processScheduleList(path.join(importDir, file), file);
      totalTasksImported += result.tasks;
      staffCreated += result.staff;
    }

    return NextResponse.json({ 
      success: true, 
      filesProcessed: files.length,
      tasksImported: totalTasksImported,
      newStaffCreated: staffCreated
    });
  } catch (error: any) {
    console.error('Import pipeline error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}

// --- HELPER FUNCTIONS ---

function excelDateToJSDate(serial: number) {
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString().split('T')[0];
}

async function processMasterDashboard(filePath: string) {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames.find(n => n.toLowerCase().includes('dashboard'));
  if (!sheetName) return;

  const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
  let headerRowIdx = data.findIndex(row => row.some((cell: any) => String(cell).toLowerCase().includes('project')));
  if (headerRowIdx === -1) return;

  const headers = data[headerRowIdx];
  const projectColIdx = headers.findIndex((h: any) => String(h).toLowerCase().includes('project'));
  
  const rows = data.slice(headerRowIdx + 1).filter(row => {
    const p = String(row[projectColIdx] || '').trim();
    return p.length > 3 && !p.toLowerCase().includes('summary') && !p.toLowerCase().includes('total');
  });

  const insertFront = db.prepare('INSERT OR IGNORE INTO site_fronts (name, "order") VALUES (?, ?)');
  rows.forEach((row, i) => insertFront.run(String(row[projectColIdx]).trim(), i + 1));
}

async function processScheduleList(filePath: string, filename: string) {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const data: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });

  // 1. Determine Project Name from Filename or Row 0
  let projectName = '';
  const firstRowStr = String(data[0]?.[0] || '');
  if (firstRowStr.includes('Schedule - List -')) {
    projectName = firstRowStr.replace('Schedule - List - ', '').split(' (exported')[0].trim();
  } else {
    projectName = filename.replace('Schedule_List_', '').replace('.xlsx', '').split(',')[0].trim();
  }

  // 2. Find or Create Site Front (Fuzzy Match)
  const fronts = db.prepare('SELECT id, name FROM site_fronts').all() as any[];
  let front = fronts.find((f: any) => projectName.toLowerCase().includes(f.name.toLowerCase()) || f.name.toLowerCase().includes(projectName.toLowerCase()));
  
  if (!front) {
    const info = db.prepare('INSERT INTO site_fronts (name) VALUES (?)').run(projectName);
    front = { id: info.lastInsertRowid as number, name: projectName };
  }

  // 3. Find Headers
  const headerRowIdx = data.findIndex(row => row.some((cell: any) => String(cell).toLowerCase() === 'title'));
  if (headerRowIdx === -1) return { tasks: 0, staff: 0 };
  
  const headers = data[headerRowIdx].map((h: any) => String(h).toLowerCase());
  const col = (name: string) => headers.indexOf(name);

  const rows = data.slice(headerRowIdx + 1);
  let tasksImported = 0;
  let staffCreatedCount = 0;

  // Prepared Statements
  const insertTask = db.prepare(`
    INSERT INTO tasks (front_id, title, date, duration, stage, status) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const findStaff = db.prepare('SELECT id FROM staff WHERE name = ?');
  const insertStaff = db.prepare('INSERT INTO staff (name, role) VALUES (?, ?)');
  const insertAssignment = db.prepare('INSERT INTO task_assignments (task_id, staff_id) VALUES (?, ?)');

  for (const row of rows) {
    const title = row[col('title')];
    if (!title) continue;

    const startSerial = row[col('start')];
    const duration = row[col('duration')] || 1;
    const phase = row[col('phase')] || 'unassigned';
    const assignedStr = row[col('assigned to')] || '';
    const isComplete = String(row[col('complete')]).toLowerCase() === 'true';

    const startDate = typeof startSerial === 'number' ? excelDateToJSDate(startSerial) : null;
    
    const taskInfo = insertTask.run(
      (front as any).id, 
      title, 
      startDate, 
      duration, 
      phase, 
      isComplete ? 'completed' : 'planned'
    );
    const taskId = taskInfo.lastInsertRowid as number;
    tasksImported++;

    // Process Staff Assignments
    if (assignedStr) {
      const names = assignedStr.split(',').map((n: string) => n.trim()).filter(Boolean);
      for (const name of names) {
        let staff = findStaff.get(name);
        if (!staff) {
          const sInfo = insertStaff.run(name, 'Staff');
          staff = { id: sInfo.lastInsertRowid };
          staffCreatedCount++;
        }
        insertAssignment.run(taskId, (staff as any).id);
      }
    }
  }

  return { tasks: tasksImported, staff: staffCreatedCount };
}

