import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/database';

export async function POST(request: Request) {
  try {
    const { pools } = await request.json();
    const db = getDb();

    // Transactional update
    const deleteOld = db.prepare('DELETE FROM resource_pool');
    const insertNew = db.prepare(`
      INSERT INTO resource_pool (trade, source, company_name, total_capacity, effective_from, daily_cost)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const runTransaction = db.transaction((data) => {
      deleteOld.run();
      for (const pool of data) {
        insertNew.run(
          pool.trade,
          pool.source,
          pool.company_name || null,
          pool.total_capacity,
          pool.effective_from,
          pool.daily_cost || 0
        );
      }
    });

    runTransaction(pools);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Resource Pool Save Error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
