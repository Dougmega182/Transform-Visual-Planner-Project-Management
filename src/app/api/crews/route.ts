import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name, color, trade, members } = data;

    const info = db.prepare(
      'INSERT INTO crews (name, color, trade, members) VALUES (?, ?, ?, ?)'
    ).run(name, color || '#3b82f6', trade || '', JSON.stringify(members || []));

    const crew = db.prepare('SELECT * FROM crews WHERE id = ?').get(info.lastInsertRowid) as any;
    return NextResponse.json({ ...crew, members: JSON.parse(crew.members || '[]') });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create crew' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, members, ...rest } = data;

    const updates: Record<string, any> = { ...rest };
    if (members !== undefined) updates.members = JSON.stringify(members);

    const fields = Object.keys(updates).map(key => `"${key}" = ?`).join(', ');
    const values = Object.values(updates);

    db.prepare(`UPDATE crews SET ${fields} WHERE id = ?`).run(...values, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update crew' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    db.prepare('DELETE FROM crews WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete crew' }, { status: 500 });
  }
}
