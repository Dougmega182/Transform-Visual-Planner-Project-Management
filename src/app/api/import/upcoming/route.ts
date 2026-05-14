import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import { getDb } from '@/lib/db/database';
import { calculateProjectForecast } from '@/lib/allocation-engine';

function excelDateToJSDate(serial: number): string {
  const utc_days = Math.floor(serial - 25569);
  const date = new Date(utc_days * 86400 * 1000);
  return date.toISOString().split('T')[0];
}

export async function POST() {
  try {
    const db = getDb();
    const upcomingDir = path.join(process.cwd(), 'imports', 'upcoming');

    if (!fs.existsSync(upcomingDir)) {
      fs.mkdirSync(upcomingDir, { recursive: true });
      return NextResponse.json({ processed: [], summary: { files_scanned: 0 } });
    }

    const files = fs.readdirSync(upcomingDir).filter(f => f.endsWith('.xlsx') || f.endsWith('.xlsm'));
    const processed: any[] = [];
    const summary = { files_scanned: files.length, projects_parsed: 0, can_start: 0, delayed: 0, cannot_staff: 0 };

    // Trade capacity map for early validation
    const poolTradesRaw = db.prepare('SELECT DISTINCT trade FROM resource_pool').all() as any[];
    const poolTrades = poolTradesRaw.map(r => r.trade.toLowerCase());
    const poolCapacities = db.prepare('SELECT trade, SUM(total_capacity) as cap FROM resource_pool GROUP BY trade').all() as any[];
    const capMap: Record<string, number> = {};
    poolCapacities.forEach(p => { capMap[p.trade.toLowerCase()] = p.cap; });

    for (const file of files) {
      const filePath = path.join(upcomingDir, file);
      try {
        const workbook = XLSX.read(fs.readFileSync(filePath));

        // 1. Project Info
        const infoSheet = workbook.Sheets['Project Info'] || workbook.Sheets[workbook.SheetNames[0]];
        const infoData: any[][] = XLSX.utils.sheet_to_json(infoSheet, { header: 1 });
        const infoHeaders = (infoData[0] || []).map((h: any) => String(h).toLowerCase().trim());
        const infoRow = infoData[1] || [];

        const nameIdx = infoHeaders.findIndex(h => h.includes('name'));
        const startIdx = infoHeaders.findIndex(h => h.includes('start'));
        const notesIdx = infoHeaders.findIndex(h => h.includes('note'));

        const projectName = String(infoRow[nameIdx >= 0 ? nameIdx : 0] || file.replace(/\.(xlsx|xlsm)$/, ''));

        let targetStart: string | null = null;
        if (startIdx >= 0 && infoRow[startIdx]) {
          const raw = infoRow[startIdx];
          targetStart = typeof raw === 'number' ? excelDateToJSDate(raw) : String(raw).trim();
        }
        const notes = notesIdx >= 0 ? String(infoRow[notesIdx] || '').trim() : '';

        // 2. Resource Requirements
        const reqSheetName = workbook.SheetNames.find(s => 
          s.toLowerCase().includes('requirement') || s.toLowerCase().includes('resource')
        ) || workbook.SheetNames[1];

        if (!reqSheetName || !workbook.Sheets[reqSheetName]) {
          processed.push({ file, name: projectName, status: 'error', message: 'Missing Resource Requirements sheet' });
          continue;
        }

        const reqSheet = workbook.Sheets[reqSheetName];
        const reqData: any[][] = XLSX.utils.sheet_to_json(reqSheet, { header: 1 });
        const reqHeaders = (reqData[0] || []).map((h: any) => String(h).toLowerCase().trim());

        const phaseIdx = reqHeaders.findIndex(h => h.includes('phase'));
        const tradeIdx = reqHeaders.findIndex(h => h.includes('trade'));
        const crewIdx = reqHeaders.findIndex(h => h.includes('crew'));
        const durationIdx = reqHeaders.findIndex(h => h.includes('duration'));
        const orderIdx = reqHeaders.findIndex(h => h.includes('order'));

        if (tradeIdx === -1 || crewIdx === -1 || durationIdx === -1) {
          processed.push({ file, name: projectName, status: 'error', message: 'Missing required columns (Trade, Crew, Duration)' });
          continue;
        }

        const requirements: any[] = [];
        const missingTrades: string[] = [];
        const capacityIssues: string[] = [];

        for (let i = 1; i < reqData.length; i++) {
          const row = reqData[i];
          if (!row || row.length === 0) continue;

          const trade = String(row[tradeIdx] || '').trim();
          const crewNeeded = Number(row[crewIdx]) || 0;
          const durationDays = Number(row[durationIdx]) || 0;
          const sequenceOrder = orderIdx >= 0 ? Number(row[orderIdx]) || 1 : i;
          const phase = phaseIdx >= 0 ? String(row[phaseIdx] || '').trim() : `Phase ${sequenceOrder}`;

          if (!trade || crewNeeded <= 0 || durationDays <= 0) continue;

          if (!poolTrades.includes(trade.toLowerCase())) {
            if (!missingTrades.includes(trade)) missingTrades.push(trade);
          }

          const available = capMap[trade.toLowerCase()] || 0;
          if (crewNeeded > available) {
            capacityIssues.push(`${trade}: need ${crewNeeded}, pool max ${available}`);
          }

          requirements.push({ phase, trade, crew_needed: crewNeeded, duration_days: durationDays, sequence_order: sequenceOrder });
        }

        if (requirements.length === 0) {
          processed.push({ file, name: projectName, status: 'error', message: 'No valid requirements parsed' });
          continue;
        }

        if (missingTrades.length > 0) {
          processed.push({ file, name: projectName, status: 'missing_trade', message: `Trades not in pool: ${missingTrades.join(', ')}` });
          summary.cannot_staff++;
          continue;
        }

        if (capacityIssues.length > 0) {
          processed.push({ file, name: projectName, status: 'cannot_staff', message: `Insufficient capacity: ${capacityIssues.join('; ')}` });
          summary.cannot_staff++;
          continue;
        }

        // Upsert into DB
        const existing = db.prepare('SELECT id FROM upcoming_projects WHERE source_file = ?').get(file) as any;
        let projectId: number;
        if (existing) {
          db.prepare('UPDATE upcoming_projects SET name = ?, projected_start = ?, notes = ? WHERE id = ?')
            .run(projectName, targetStart, notes, existing.id);
          db.prepare('DELETE FROM upcoming_requirements WHERE project_id = ?').run(existing.id);
          projectId = existing.id;
        } else {
          const result = db.prepare('INSERT INTO upcoming_projects (name, source_file, status, projected_start, notes) VALUES (?, ?, ?, ?, ?)')
            .run(projectName, file, 'tentative', targetStart, notes);
          projectId = Number(result.lastInsertRowid);
        }

        for (const req of requirements) {
          db.prepare('INSERT INTO upcoming_requirements (project_id, trade, crew_needed, duration_days, sequence_order) VALUES (?, ?, ?, ?, ?)')
            .run(projectId, req.trade, req.crew_needed, req.duration_days, req.sequence_order);
        }

        // 3. Forecast
        const forecast = await calculateProjectForecast(projectId);
        summary.projects_parsed++;

        let status: string;
        let calculatedStart = forecast.success ? forecast.projectedStart : null;
        let blockingReasons: string[] = [];

        if (!forecast.success) {
          status = 'cannot_staff';
          blockingReasons = forecast.blockingReasons || [forecast.message || 'No staffing window found'];
          summary.cannot_staff++;
        } else {
          if (targetStart && calculatedStart && calculatedStart > targetStart) {
            status = 'delayed';
            blockingReasons = forecast.blockingReasons || [`Earliest availability is ${calculatedStart}, target was ${targetStart}`];
            summary.delayed++;
          } else {
            status = 'can_start';
            summary.can_start++;
          }
        }

        db.prepare('UPDATE upcoming_projects SET status = ?, projected_start = ? WHERE id = ?').run(status, calculatedStart || targetStart, projectId);

        // Build Response Phases
        const phases: any[] = [];
        const baseDate = calculatedStart ? new Date(calculatedStart) : (targetStart ? new Date(targetStart) : new Date());
        let runningOffset = 0;
        
        const groupedByOrder: Record<number, any[]> = {};
        requirements.forEach(r => {
          if (!groupedByOrder[r.sequence_order]) groupedByOrder[r.sequence_order] = [];
          groupedByOrder[r.sequence_order].push(r);
        });
        const sortedOrders = Object.keys(groupedByOrder).map(Number).sort((a, b) => a - b);

        for (const order of sortedOrders) {
          const group = groupedByOrder[order];
          const maxDuration = Math.max(...group.map(r => r.duration_days));
          const phaseStart = new Date(baseDate);
          phaseStart.setDate(phaseStart.getDate() + runningOffset);
          const phaseEnd = new Date(phaseStart);
          phaseEnd.setDate(phaseEnd.getDate() + maxDuration);

          phases.push({
            order,
            phase: group[0].phase,
            start: phaseStart.toISOString().split('T')[0],
            end: phaseEnd.toISOString().split('T')[0],
            duration: maxDuration,
            trades: group.map(r => ({
              trade: r.trade,
              crew: r.crew_needed,
              available: capMap[r.trade.toLowerCase()] || 0,
              utilization: (capMap[r.trade.toLowerCase()] || 0) > 0 ? `${Math.round((r.crew_needed / capMap[r.trade.toLowerCase()]) * 100)}%` : 'N/A'
            }))
          });
          runningOffset += maxDuration;
        }

        const estimatedEnd = new Date(baseDate);
        estimatedEnd.setDate(estimatedEnd.getDate() + runningOffset);

        processed.push({
          file,
          name: projectName,
          status,
          requirementsFound: requirements.length,
          targetStart: targetStart || 'ASAP',
          calculatedStart: calculatedStart || 'No window found',
          totalDurationDays: runningOffset,
          estimatedEnd: estimatedEnd.toISOString().split('T')[0],
          phases,
          capacityWarnings: capacityIssues.length > 0 ? capacityIssues : undefined,
          blockingReasons: blockingReasons.length > 0 ? blockingReasons : undefined
        });

      } catch (fileErr: any) {
        processed.push({
          file,
          status: 'error',
          message: `Failed to parse: ${fileErr.message}`
        });
      }
    }

    return NextResponse.json({ processed, summary });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
