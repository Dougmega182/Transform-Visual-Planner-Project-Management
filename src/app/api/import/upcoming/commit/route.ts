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
        let maxGroupCalendarDuration = 0;

        for (const req of group) {
          // Calculate this specific task's calendar span
          let reqDaysCounted = 0;
          let calendarOffset = 0;
          const taskStartDate = new Date(baseDate);
          taskStartDate.setDate(taskStartDate.getDate() + runningOffset);

          // Find start date if it happens to land on a weekend
          while (taskStartDate.getDay() === 0 || taskStartDate.getDay() === 6) {
            taskStartDate.setDate(taskStartDate.getDate() + 1);
          }

          while (reqDaysCounted < req.duration_days) {
            const d = new Date(taskStartDate);
            d.setDate(d.getDate() + calendarOffset);
            if (d.getDay() !== 0 && d.getDay() !== 6) reqDaysCounted++;
            calendarOffset++;
          }
          
          maxGroupCalendarDuration = Math.max(maxGroupCalendarDuration, calendarOffset);

          insertTask.run(
            `${project.name} - ${req.trade}`,
            taskStartDate.toISOString().split('T')[0],
            calendarOffset, // Use calendar span for Gantt
            req.crew_needed,
            req.trade,
            'not-started',
            'medium'
          );
        }
        runningOffset += maxGroupCalendarDuration;
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
