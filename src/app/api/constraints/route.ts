import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    const constraints = taskId
      ? db.prepare('SELECT * FROM constraints WHERE task_id = ?').all(taskId)
      : db.prepare('SELECT * FROM constraints').all();

    return NextResponse.json({ constraints });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch constraints' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { task_id, type, description } = data;

    const info = db.prepare(
      'INSERT INTO constraints (task_id, type, description) VALUES (?, ?, ?)'
    ).run(task_id, type || 'other', description || '');

    const constraint = db.prepare('SELECT * FROM constraints WHERE id = ?').get(info.lastInsertRowid);
    return NextResponse.json(constraint);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create constraint' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, status } = data;

    if (status === 'resolved') {
      db.prepare('UPDATE constraints SET status = ?, resolved_at = datetime("now") WHERE id = ?').run('resolved', id);
    } else {
      db.prepare('UPDATE constraints SET status = ?, resolved_at = NULL WHERE id = ?').run(status, id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update constraint' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    db.prepare('DELETE FROM constraints WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete constraint' }, { status: 500 });
  }
}
