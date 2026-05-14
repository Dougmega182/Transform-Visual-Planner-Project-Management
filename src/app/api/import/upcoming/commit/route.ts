import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/database';

export async function POST(request: Request) {
  try {
    const { projectId } = await request.json();
    const db = getDb();

    // 1. Get Project & Requirements
    const project = db.prepare('SELECT * FROM upcoming_projects WHERE id = ?').get(projectId) as any;
    const requirements = db.prepare('SELECT * FROM upcoming_requirements WHERE project_id = ? ORDER BY sequence_order ASC').all() as any[];

    if (!project || requirements.length === 0) {
      return NextResponse.json({ error: 'Project not found or no requirements' }, { status: 404 });
    }

    // 2. Transactional Migration
    const migrate = db.transaction(() => {
      // Calculate start date based on the projected_start
      let baseDate = project.projected_start ? new Date(project.projected_start) : new Date();
      let runningOffset = 0;

      // Group requirements by sequence order to maintain the timeline
      const grouped: Record<number, any[]> = {};
      requirements.forEach(r => {
        if (!grouped[r.sequence_order]) grouped[r.sequence_order] = [];
        grouped[r.sequence_order].push(r);
      });
      const sortedOrders = Object.keys(grouped).map(Number).sort((a, b) => a - b);

      const insertTask = db.prepare(`
        INSERT INTO tasks (title, date, duration, crew_count, trade, status, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      for (const order of sortedOrders) {
        const group = grouped[order];
        let maxDuration = 0;

        for (const req of group) {
          maxDuration = Math.max(maxDuration, req.duration_days);
          
          const taskDate = new Date(baseDate);
          taskDate.setDate(taskDate.getDate() + runningOffset);
          const dateStr = taskDate.toISOString().split('T')[0];

          insertTask.run(
            `${project.name} - ${req.trade}`,
            dateStr,
            req.duration_days,
            req.crew_needed,
            req.trade,
            'not-started',
            'medium'
          );
        }
        runningOffset += maxDuration;
      }

      // Mark project as committed
      db.prepare('UPDATE upcoming_projects SET status = "committed" WHERE id = ?').run(projectId);
    });

    migrate();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Commit Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
