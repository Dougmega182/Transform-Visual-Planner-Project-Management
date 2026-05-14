import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

export async function GET() {
  try {
    const dependencies = db.prepare('SELECT * FROM dependencies').all();
    return NextResponse.json({ dependencies });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch dependencies' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { from_task_id, to_task_id, type } = data;

    const info = db.prepare(
      'INSERT INTO dependencies (from_task_id, to_task_id, type) VALUES (?, ?, ?)'
    ).run(from_task_id, to_task_id, type || 'finish_to_start');

    const dep = db.prepare('SELECT * FROM dependencies WHERE id = ?').get(info.lastInsertRowid);
    return NextResponse.json(dep);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create dependency' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    db.prepare('DELETE FROM dependencies WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete dependency' }, { status: 500 });
  }
}
