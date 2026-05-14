import { NextResponse } from 'next/server';
import db from '@/lib/db/database';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { name } = data;

    const maxOrder = db.prepare('SELECT MAX("order") as mx FROM site_fronts').get() as any;
    const nextOrder = (maxOrder?.mx || 0) + 1;

    const info = db.prepare(
      'INSERT INTO site_fronts (name, "order") VALUES (?, ?)'
    ).run(name, nextOrder);

    const front = db.prepare('SELECT * FROM site_fronts WHERE id = ?').get(info.lastInsertRowid);
    return NextResponse.json(front);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create front' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const data = await request.json();
    const { id, ...updates } = data;

    const fields = Object.keys(updates).map(key => `"${key}" = ?`).join(', ');
    const values = Object.values(updates);

    db.prepare(`UPDATE site_fronts SET ${fields} WHERE id = ?`).run(...values, id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update front' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    db.prepare('DELETE FROM site_fronts WHERE id = ?').run(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete front' }, { status: 500 });
  }
}
