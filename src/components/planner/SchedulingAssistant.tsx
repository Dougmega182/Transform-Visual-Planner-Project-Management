'use client';
import React, { useState } from 'react';
import { Calendar, ChevronRight, CheckCircle2, AlertCircle, Play } from 'lucide-react';
import { usePlannerStore, Task, Staff, TaskAssignment } from '@/store/usePlannerStore';
import { addDays, format, isWithinInterval, startOfDay } from 'date-fns';

interface SchedulingAssistantProps {
  tasks: Task[];
  staff: Staff[];
  taskAssignments: TaskAssignment[];
}

export const SchedulingAssistant: React.FC<SchedulingAssistantProps> = ({ tasks, staff, taskAssignments }) => {
  const resourcePool = usePlannerStore((state) => state.resourcePool);

  const [requirements, setRequirements] = useState({
    duration: 14,
    crewSize: 4,
    trade: 'General',
    zone: 'Zone A',
    weatherSensitive: false,
  });

  const trades = Array.from(new Set(resourcePool.map(p => p.trade))).sort();
  const prioritizedTrades = ['Carpentry My staff', 'Labourers My staff', ...trades.filter(t => t !== 'Carpentry My staff' && t !== 'Labourers My staff')];
  const zones = Array.from(new Set(tasks.map(t => t.zone || 'Unassigned').filter(Boolean))).sort();

  const [results, setResults] = useState<{ date: Date; score: number; reasoning: string[] }[]>([]);

  const scoringConfig = {
    zonePenalty: 15,
    subLimit: 3,
    weatherBuffer: 1.2,
    densityThreshold: 20,
  };

  const isBusinessDay = (date: Date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  const getNextBusinessDay = (date: Date): Date => {
    let next = addDays(date, 1);
    while (!isBusinessDay(next)) {
      next = addDays(next, 1);
    }
    return next;
  };

  const getBusinessDaysEnd = (start: Date, durationDays: number): Date => {
    let current = start;
    let counted = 0;
    while (counted < durationDays) {
      current = getNextBusinessDay(current);
      counted++;
    }
    return current;
  };

  const getActiveTasksOnDate = (date: Date): Task[] => {
    const day = startOfDay(date);
    return tasks.filter(t => {
      if (!t.startDate || !t.endDate || t.status === 'completed') return false;
      return isWithinInterval(day, {
        start: startOfDay(new Date(t.startDate)),
        end: startOfDay(new Date(t.endDate)),
      });
    });
  };

  const getZoneDensity = (date: Date, zone: string): number => {
    const active = getActiveTasksOnDate(date);
    return active
      .filter(t => t.zone === zone)
      .reduce((sum, t) => sum + (t.crewCount || 1), 0);
  };

  const getTradeUtilization = (date: Date, trade: string): { used: number; capacity: number } => {
    const active = getActiveTasksOnDate(date);
    const used = active
      .filter(t => t.trade === trade)
      .reduce((sum, t) => sum + (t.crewCount || 1), 0);

    const capacity = resourcePool
      .filter(p => p.trade === trade)
      .reduce((sum, p) => sum + (p.total_capacity || 0), 0);

    return { used, capacity };
  };

  const scoreStartDate = (candidateDate: Date): { score: number; reasoning: string[] } => {
    const reasoning: string[] = [];
    let score = 100;

    const effectiveDuration = requirements.weatherSensitive
      ? Math.ceil(requirements.duration * scoringConfig.weatherBuffer)
      : requirements.duration;

    const endDate = getBusinessDaysEnd(candidateDate, effectiveDuration);

    let worstUtilization = 0;
    let current = candidateDate;

    while (current <= endDate) {
      if (isBusinessDay(current)) {
        const { used, capacity } = getTradeUtilization(current, requirements.trade);
        const needed = used + requirements.crewSize;

        if (capacity > 0 && needed > capacity) {
          const overBy = needed - capacity;
          score -= overBy * 10;
          reasoning.push(`${format(current, 'MMM d')}: ${requirements.trade} over capacity by ${overBy}`);
        }

        if (capacity > 0) {
          worstUtilization = Math.max(worstUtilization, needed / capacity);
        }

        const density = getZoneDensity(current, requirements.zone) + requirements.crewSize;
        if (density > scoringConfig.densityThreshold) {
          score -= scoringConfig.zonePenalty;
          reasoning.push(`${format(current, 'MMM d')}: ${requirements.zone} congested (${density} crew)`);
        }
      }
      current = addDays(current, 1);
    }

    if (worstUtilization < 0.7) {
      score += 10;
      reasoning.push(`Good trade availability (peak ${Math.round(worstUtilization * 100)}%)`);
    } else if (worstUtilization > 0.9) {
      score -= 15;
      reasoning.push(`Tight trade availability (peak ${Math.round(worstUtilization * 100)}%)`);
    }

    // Subcontractor concurrency check
    const activeOnStart = getActiveTasksOnDate(candidateDate);
    const sameTradeActive = activeOnStart.filter(t => t.trade === requirements.trade);
    if (sameTradeActive.length >= scoringConfig.subLimit) {
      score -= 20;
      reasoning.push(`${sameTradeActive.length} concurrent ${requirements.trade} tasks already running`);
    }

    if (requirements.weatherSensitive) {
      const month = candidateDate.getMonth();
      if (month >= 10 || month <= 2) {
        score -= 10;
        reasoning.push('Winter period — weather risk elevated');
      } else if (month >= 4 && month <= 8) {
        score += 5;
        reasoning.push('Summer period — favorable weather window');
      }
    }

    if (reasoning.length === 0) {
      reasoning.push('No conflicts detected — clear window');
    }

    return { score: Math.max(0, Math.min(100, score)), reasoning };
  };

  const runAnalysis = () => {
    const candidates: { date: Date; score: number; reasoning: string[] }[] = [];
    let scanDate = startOfDay(new Date());

    for (let i = 0; i < 90; i++) {
      if (isBusinessDay(scanDate)) {
        const { score, reasoning } = scoreStartDate(scanDate);
        candidates.push({ date: new Date(scanDate), score, reasoning });
      }
      scanDate = addDays(scanDate, 1);
    }

    candidates.sort((a, b) => b.score - a.score);
    setResults(candidates.slice(0, 5));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl border border-[var(--border-color)] p-5 shadow-xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Calendar className="text-blue-500" size={20} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-[var(--text-primary)]">Scheduling Assistant</h2>
          <p className="text-[10px] text-[var(--text-muted)]">Find the best start date for new work</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1.5 block">Trade Requirement</label>
          <select 
            value={requirements.trade}
            onChange={(e) => setRequirements({ ...requirements, trade: e.target.value })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="General">All Trades</option>
            {prioritizedTrades.map(trade => (
              <option key={trade} value={trade}>{trade}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1.5 block">Duration (Days)</label>
            <input 
              type="number" 
              value={requirements.duration}
              onChange={(e) => setRequirements({ ...requirements, duration: parseInt(e.target.value) })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1.5 block">Crew Size</label>
            <input 
              type="number" 
              value={requirements.crewSize}
              onChange={(e) => setRequirements({ ...requirements, crewSize: parseInt(e.target.value) })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1.5 block">Location / Zone</label>
            <select
              value={requirements.zone}
              onChange={(e) => setRequirements({ ...requirements, zone: e.target.value })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
            >
              {zones.length > 0 ? (
                zones.map(z => (
                  <option key={z} value={z}>{z}</option>
                ))
              ) : (
                <option value="All Zones">All Zones</option>
              )}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-500/5 rounded-xl border border-blue-500/10">
          <input 
            type="checkbox"
            id="weatherSensitive"
            checked={requirements.weatherSensitive}
            onChange={(e) => setRequirements({ ...requirements, weatherSensitive: e.target.checked })}
            className="w-4 h-4 rounded border-[var(--border-color)] text-blue-600 focus:ring-blue-500/20"
          />
          <label htmlFor="weatherSensitive" className="text-xs font-medium text-[var(--text-secondary)] cursor-pointer">
            Weather Sensitive (Apply 20% Duration Buffer)
          </label>
        </div>

        <button 
          onClick={runAnalysis}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
        >
          <Play size={14} fill="currentColor" />
          Check Availability
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] block">Recommended Start Dates</label>
          {results.map((res, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl group hover:border-blue-500/50 transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${i === 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
                  {i === 0 ? <CheckCircle2 size={16} /> : <Calendar size={16} />}
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">{format(res.date, 'EEEE, MMM do')}</div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {res.reasoning.map((reason, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-md bg-[var(--bg-secondary)] border border-[var(--border-color)] text-[var(--text-muted)] font-medium">
                        {reason}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-[10px] font-black ${getScoreColor(res.score)}`}>{res.score}%</div>
                <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-blue-500 transition-colors ml-auto mt-1" />
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-[var(--border-color)] rounded-2xl">
          <AlertCircle size={24} className="text-[var(--text-muted)] mb-2" />
          <p className="text-xs text-[var(--text-muted)]">Select requirements and check availability to see suggestions</p>
        </div>
      )}
    </div>
  );
};
