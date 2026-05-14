import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { processScheduleFile } from '@/lib/import-processor';

export async function POST() {
  try {
    const importDir = path.resolve(process.cwd(), 'imports');
    
    if (!fs.existsSync(importDir)) {
      return NextResponse.json({ error: 'Imports directory not found' }, { status: 404 });
    }

    const files = fs.readdirSync(importDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xlsm'));
    
    if (files.length === 0) {
      return NextResponse.json({ error: 'No Excel files found in imports/ folder' }, { status: 400 });
    }

    let totalTasksImported = 0;
    const validationReport: { file: string; errors: string[]; warnings: string[] }[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(importDir, file);
        const result = await processScheduleFile(filePath, file);
        totalTasksImported += result.tasksImported;
        validationReport.push({
          file,
          errors: result.errors || [],
          warnings: result.warnings || []
        });
      } catch (err) {
        validationReport.push({
          file,
          errors: [String(err)],
          warnings: []
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      filesProcessed: files.length,
      tasksImported: totalTasksImported,
      validationReport
    });
  } catch (error: any) {
    console.error('Import pipeline error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
