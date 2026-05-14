import { getDb } from './db/database';
import { addDays, format, isWithinInterval, startOfDay } from 'date-fns';

interface ResourceRequirement {
  trade: string;
  crewNeeded: number;
  durationDays: number;
}

export async function calculateProjectForecast(projectId: number) {
  const db = getDb();
  
  // 1. Get Project Data
  const project = db.prepare('SELECT * FROM upcoming_projects WHERE id = ?').get(projectId) as any;
  if (!project) return { success: false, message: 'Project not found' };

  // 2. Get Requirements
  const requirements = db.prepare('SELECT * FROM upcoming_requirements WHERE project_id = ? ORDER BY sequence_order ASC').all(projectId) as any[];
  if (!requirements || requirements.length === 0) return { success: false, message: 'No requirements found' };

  // 2. Group by Sequence Order
  const groups: Record<number, any[]> = {};
  requirements.forEach(r => {
    if (!groups[r.sequence_order]) groups[r.sequence_order] = [];
    groups[r.sequence_order].push(r);
  });
  const sortedOrders = Object.keys(groups).map(Number).sort((a, b) => a - b);

  // 3. Get Global Resource Pool & Active Commitments
  console.log('ALLOC: Fetching pool');
  const pool = db.prepare('SELECT * FROM resource_pool').all() as any[];
  
  console.log('ALLOC: Fetching active tasks');
  const activeTasks = db.prepare("SELECT * FROM tasks WHERE date IS NOT NULL AND status != 'completed'").all() as any[];

  const candidateDays = 120; // Expanded window
  const today = startOfDay(new Date());
  
  // Start search from target_start if provided, else today
  let searchStart = today;
  if (project.projected_start) {
    const target = new Date(project.projected_start);
    if (target > today) searchStart = target;
  }

  let bestStartDate: Date | null = null;

  for (let d = 0; d < candidateDays; d++) {
    const candidateStart = addDays(searchStart, d);
    let allRequirementsMet = true;
    let currentGroupOffset = 0;

    // Check each Sequence Group
    for (const order of sortedOrders) {
      const group = groups[order];
      const groupStart = addDays(candidateStart, currentGroupOffset);
      let maxGroupDuration = 0;

      for (const req of group) {
        maxGroupDuration = Math.max(maxGroupDuration, req.duration_days);
        
        // Check availability for this requirement in its window
        for (let dayOffset = 0; dayOffset < req.duration_days; dayOffset++) {
          const checkDay = addDays(groupStart, dayOffset);
          
          // Committed
          const committed = activeTasks
            .filter(t => t.trade === req.trade)
            .filter(t => {
              const tStart = new Date(t.date);
              const tEnd = addDays(tStart, t.duration || 1);
              return checkDay >= tStart && checkDay < tEnd;
            })
            .reduce((sum, t) => sum + (t.crew_count || 0), 0);

          // Pool
          const poolCapacity = pool
            .filter(p => p.trade === req.trade)
            .filter(p => {
               const from = new Date(p.effective_from);
               const until = p.effective_until ? new Date(p.effective_until) : addDays(today, 365);
               return checkDay >= from && checkDay <= until;
            })
            .reduce((sum, p) => sum + (p.total_capacity || 0), 0);

          if (poolCapacity - committed < req.crew_needed) {
            allRequirementsMet = false;
            break;
          }
        }
        if (!allRequirementsMet) break;
      }
      
      if (!allRequirementsMet) break;
      currentGroupOffset += maxGroupDuration; // Sequential move
    }

    if (allRequirementsMet) {
      bestStartDate = candidateStart;
      break;
    }
  }

  if (bestStartDate) {
    const startStr = format(bestStartDate, 'yyyy-MM-dd');
    db.prepare('UPDATE upcoming_projects SET projected_start = ? WHERE id = ?').run(startStr, projectId);
    
    // Calculate Phase Breakdown for the winning date
    const phases: any[] = [];
    let currentGroupOffset = 0;
    for (const order of sortedOrders) {
      const group = groups[order];
      const groupStart = addDays(bestStartDate, currentGroupOffset);
      let maxDuration = 0;
      
      const trades: any[] = [];
      for (const req of group) {
        maxDuration = Math.max(maxDuration, req.duration_days);
        
        // Simple capacity lookup for reporting
        const poolCapacity = pool
          .filter(p => p.trade === req.trade)
          .reduce((sum, p) => sum + (p.total_capacity || 0), 0);
        
        trades.push({
          trade: req.trade,
          crew: req.crew_needed,
          available: poolCapacity,
          utilization: poolCapacity > 0 ? `${Math.round((req.crew_needed / poolCapacity) * 100)}%` : 'N/A'
        });
      }
      
      phases.push({
        order,
        start: format(groupStart, 'yyyy-MM-dd'),
        end: format(addDays(groupStart, maxDuration), 'yyyy-MM-dd'),
        trades
      });
      currentGroupOffset += maxDuration;
    }

    return { 
      success: true, 
      projectedStart: startStr,
      estimatedEnd: format(addDays(bestStartDate, currentGroupOffset), 'yyyy-MM-dd'),
      totalDurationDays: currentGroupOffset,
      phases 
    };
  } else {
    return { 
      success: false, 
      message: 'Could not find a staffing window in the next 120 days. Check if requirements exceed total pool capacity.' 
    };
  }
}
