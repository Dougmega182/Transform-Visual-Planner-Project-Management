import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db/database';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;
    if (!id) return NextResponse.json({ error: 'Missing task id' }, { status: 400 });

    const db = getDb();
    
    // Map camelCase frontend keys to snake_case DB columns
    const fieldMap: Record<string, string> = {
      frontId: 'front_id',
      name: 'title',
      progress: 'percent_complete',
      status: 'status',
      priority: 'priority',
      description: 'description',
      startDate: 'date',
      endDate: 'planned_end',
      zone: 'zone',
      trade: 'trade',
      crew: 'crew_count'
    };

    const sets: string[] = [];
    const vals: any[] = [];

    for (const [key, value] of Object.entries(updates)) {
      const dbField = fieldMap[key];
      if (dbField) {
        sets.push(`${dbField} = ?`);
        vals.push(value);
      }
    }

    if (sets.length === 0) return NextResponse.json({ error: 'No valid fields' }, { status: 400 });

    vals.push(id);
    db.prepare(`UPDATE tasks SET ${sets.join(', ')} WHERE id = ?`).run(...vals);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/tasks error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY date ASC').all();
  return NextResponse.json(tasks);
}
