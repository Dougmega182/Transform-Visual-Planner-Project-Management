import { NextResponse } from 'next/server';
import { scanAndProcessImports } from '@/lib/import-processor';

export async function POST() {
  try {
    const results = await scanAndProcessImports();
    
    return NextResponse.json({ 
      success: true, 
      ...results
    });
  } catch (error: any) {
    console.error('Import pipeline error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}
