import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/database';

export async function GET() {
  try {
    const db = getDb();

    const fronts = db.prepare('SELECT * FROM site_fronts ORDER BY "order" ASC').all();
    const staff = db.prepare('SELECT * FROM staff ORDER BY name ASC').all();
    const tasksRaw = db.prepare('SELECT * FROM tasks ORDER BY date ASC, id ASC').all();
    const taskAssignments = db.prepare('SELECT * FROM task_assignments').all();
    const staffLeave = db.prepare('SELECT * FROM staff_leave').all();
    const constraintsRaw = db.prepare('SELECT * FROM constraints').all();

    let dependencies: any[] = [];
    try { dependencies = db.prepare('SELECT * FROM dependencies').all(); } catch { /* */ }

    // Map tasks to our new camelCase frontend interface
    const tasks = tasksRaw.map((t: any) => ({
      id: t.id,
      frontId: t.front_id,
      name: t.title || 'Untitled Task',
      description: t.description || '',
      zone: t.zone || 'Zone A',
      status: t.status || 'not-started',
      priority: t.priority || 'medium',
      progress: t.percent_complete || 0,
      startDate: t.date || t.planned_start || new Date().toISOString().split('T')[0],
      endDate: t.planned_end || new Date().toISOString().split('T')[0],
      actualStart: t.actual_start,
      actualEnd: t.actual_end,
      assignee: t.assignee || 'Unassigned',
      trade: t.trade || 'General',
      crew: t.crew_count || 1,
      dependencies: JSON.parse(t.dependencies_json || '[]'),
      comments: JSON.parse(t.comments_json || '[]'),
      constraints: JSON.parse(t.constraints_json || '[]'),
      stage: t.stage || 'construction',
      rag: t.rag || 'green'
    }));

    const constraints = constraintsRaw.map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      severity: c.severity || 'low',
      status: c.status || 'open',
      front: c.front_name || 'Front A',
      raisedDate: c.raised_date || new Date().toISOString().split('T')[0],
      owner: c.owner || 'Admin'
    }));

    return NextResponse.json({
      fronts,
      staff,
      tasks,
      taskAssignments,
      staffLeave,
      dependencies,
      constraints,
    });
  } catch (err) {
    console.error('GET /api/data error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
