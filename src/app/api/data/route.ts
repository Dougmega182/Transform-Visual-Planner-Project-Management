import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db/database';

async function calculateProjectForecast(projectId: number) {
  // Stub — returns empty forecast until forecasting module is built
  void projectId;
  return {
    success: true,
    projectedStart: null,
    estimatedEnd: null,
    confidence: 0,
    resourceConflicts: [],
    blockingReasons: [],
    phases: [],
    totalDurationDays: 0
  };
}

export async function GET() {
  try {
    const db = getDb();

    const fronts = db.prepare('SELECT * FROM site_fronts ORDER BY "order" ASC').all();
    const staffRaw = db.prepare('SELECT * FROM staff ORDER BY name ASC').all();
    const staff = staffRaw.map((s: any) => ({
      id: s.id,
      name: s.name,
      role: s.role,
      trade: s.trade || 'General',
      type: s.type || 'in-house',
      dailyCost: s.daily_cost || 0,
      avatar: s.avatar
    }));
    
    let resourcePool: any[] = [];
    try { resourcePool = db.prepare('SELECT * FROM resource_pool').all(); } catch { /* */ }

    let resources: any[] = [];
    try { resources = db.prepare('SELECT * FROM resources ORDER BY is_preferred DESC, usage_score DESC').all(); } catch { /* */ }

    let upcomingProjects: any[] = [];
    try { 
      const projects = db.prepare("SELECT * FROM upcoming_projects WHERE status != 'committed'").all();
      upcomingProjects = await Promise.all(projects.map(async (p: any) => {
        const forecast = await calculateProjectForecast(p.id);
        return {
          id: p.id,
          name: p.name,
          sourceFile: p.source_file,
          status: p.status,
          projectedStart: p.projected_start,
          notes: p.notes,
          createdAt: p.created_at,
          blockingReasons: forecast.success ? [] : forecast.blockingReasons,
          phases: forecast.phases || [],
          estimatedEnd: forecast.estimatedEnd,
          totalDurationDays: forecast.totalDurationDays
        };
      }));
    } catch (err) { console.error('Upcoming Fetch Error:', err); }

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
      crewCount: t.crew_count || 1,
      subcontractor: t.subcontractor || '',
      hoursPerDay: t.hours_per_day || 8.0,
      equipmentNeeds: t.equipment_needs || '',
      weatherSensitivity: Boolean(t.weather_sensitivity),
      costRate: t.cost_rate || 0,
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
      resourcePool,
      resources,
      upcomingProjects
    });
  } catch (err) {
    console.error('GET /api/data error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
