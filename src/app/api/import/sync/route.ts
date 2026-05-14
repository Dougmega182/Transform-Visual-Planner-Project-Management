import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { processScheduleFile } from '@/lib/import-processor';

export async function POST() {
  try {
    const importsDir = path.join(process.cwd(), 'imports');
    
    if (!fs.existsSync(importsDir)) {
      return NextResponse.json({ error: 'Imports directory not found' }, { status: 404 });
    }

    const files = fs.readdirSync(importsDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xlsm'));
    const results = [];

    for (const file of files) {
      const filePath = path.join(importsDir, file);
      try {
        const result = await processScheduleFile(filePath, file);
        results.push({ file, ...result });
      } catch (err) {
        results.push({ file, error: String(err) });
      }
    }

    return NextResponse.json({
      message: `Processed ${files.length} files`,
      results
    });
  } catch (err) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
