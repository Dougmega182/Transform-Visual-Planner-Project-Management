'use client';
import React, { useState } from 'react';
import { Calendar, ChevronRight, CheckCircle2, AlertCircle, Clock, Play } from 'lucide-react';
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
    while (!isBusinessDay(next)) next = addDays(next, 1);
    return next;
  };

  const getBusinessDaysEnd = (start: Date, days: number): Date => {
    let current = start;
    let counted = 0;
    while (counted < days) { current = getNextBusinessDay(current); counted++; }
    return current;
  };

  const getActiveTasksOnDate = (date: Date): Task[] => {
    const day = startOfDay(date);
    return tasks.filter(t => {
      if (!t.startDate || !t.endDate || t.status === 'completed') return false;
      return isWithinInterval(day, { start: startOfDay(new Date(t.startDate)), end: startOfDay(new Date(t.endDate)) });
    });
  };

  const getZoneDensity = (date: Date, zone: string): number =>
    getActiveTasksOnDate(date).filter(t => t.zone === zone).reduce((s, t) => s + (t.crewCount || 1), 0);

  const getTradeUtilization = (date: Date, trade: string) => {
    const used = getActiveTasksOnDate(date).filter(t => t.trade === trade).reduce((s, t) => s + (t.crewCount || 1), 0);
    const capacity = resourcePool.filter(p => p.trade === trade).reduce((s, p) => s + (p.total_capacity || 0), 0);
    return { used, capacity };
  };

  const scoreStartDate = (candidateDate: Date): { score: number; reasoning: string[] } => {
    const reasoning: string[] = [];
    let score = 100;
    const dur = requirements.weatherSensitive ? Math.ceil(requirements.duration * scoringConfig.weatherBuffer) : requirements.duration;
    const endDate = getBusinessDaysEnd(candidateDate, dur);
    let worstUtil = 0;
    let cur = candidateDate;
    while (cur <= endDate) {
      if (isBusinessDay(cur)) {
        const { used, capacity } = getTradeUtilization(cur, requirements.trade);
        const needed = used + requirements.crewSize;
        if (capacity > 0 && needed > capacity) { 
          score -= (needed - capacity) * 10; 
          reasoning.push(`${format(cur, 'MMM d')}: ${requirements.trade} over capacity by ${needed - capacity}`); 
        }
        if (capacity > 0) worstUtil = Math.max(worstUtil, needed / capacity);
        const density = getZoneDensity(cur, requirements.zone) + requirements.crewSize;
        if (density > scoringConfig.densityThreshold) { 
          score -= scoringConfig.zonePenalty; 
          reasoning.push(`${format(cur, 'MMM d')}: ${requirements.zone} congested (${density} crew)`); 
        }
      }
      cur = addDays(cur, 1);
    }
    if (worstUtil < 0.7) { score += 10; reasoning.push(`Good trade availability (peak ${Math.round(worstUtil * 100)}%)`); }
    else if (worstUtil > 0.9) { score -= 15; reasoning.push(`Tight trade availability (peak ${Math.round(worstUtil * 100)}%)`); }
    
    const sameTrade = getActiveTasksOnDate(candidateDate).filter(t => t.trade === requirements.trade);
    if (sameTrade.length >= scoringConfig.subLimit) { 
      score -= 20; 
      reasoning.push(`${sameTrade.length} concurrent ${requirements.trade} tasks`); 
    }
    
    if (requirements.weatherSensitive) {
      const m = candidateDate.getMonth();
      if (m >= 10 || m <= 2) { score -= 10; reasoning.push('Winter — weather risk elevated'); }
      else if (m >= 4 && m <= 8) { score += 5; reasoning.push('Summer — favorable weather'); }
    }
    
    const busyStaff = staff.filter(s => taskAssignments.filter(a => a.staff_id === s.id).some(a => {
      const t = tasks.find(tk => tk.id === a.task_id);
      return t?.startDate && t?.endDate && isWithinInterval(startOfDay(candidateDate), { start: startOfDay(new Date(t.startDate)), end: startOfDay(new Date(t.endDate)) });
    })).length;
    
    if (staff.length > 0 && staff.length - busyStaff < requirements.crewSize) { 
      score -= 15; 
      reasoning.push(`Only ${staff.length - busyStaff}/${requirements.crewSize} staff free`); 
    }
    
    if (!reasoning.length) reasoning.push('No conflicts — clear window');
    return { score: Math.max(0, Math.min(100, score)), reasoning };
  };

  const runAnalysis = () => {
    const candidates: { date: Date; score: number; reasoning: string[] }[] = [];
    let d = startOfDay(new Date());
    for (let i = 0; i < 90; i++) { 
      if (isBusinessDay(d)) { 
        const r = scoreStartDate(d); 
        candidates.push({ date: new Date(d), ...r }); 
      } 
      d = addDays(d, 1); 
    }
    candidates.sort((a, b) => b.score - a.score);
    setResults(candidates.slice(0, 5));
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return 'text-green-400';
    if (s >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  const prioritizedTrades = trades.filter(t => t !== 'General');

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
              onChange={(e) => setRequirements({ ...requirements, duration: parseInt(e.target.value) || 1 })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1.5 block">Crew Size</label>
            <input 
              type="number" 
              value={requirements.crewSize}
              onChange={(e) => setRequirements({ ...requirements, crewSize: parseInt(e.target.value) || 1 })}
              className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)]"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1.5 block">Zone</label>
          <select
            value={requirements.zone}
            onChange={(e) => setRequirements({ ...requirements, zone: e.target.value })}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {zones.map(z => (
              <option key={z} value={z}>{z}</option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input 
            type="checkbox"
            checked={requirements.weatherSensitive}
            onChange={(e) => setRequirements({ ...requirements, weatherSensitive: e.target.checked })}
            className="rounded border-[var(--border-color)] bg-[var(--bg-primary)]"
          />
          <span className="text-xs text-[var(--text-secondary)]">Weather-sensitive activity</span>
        </label>

        <button 
          onClick={runAnalysis}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <ChevronRight size={14} />
          Find Best Dates
        </button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] uppercase font-bold text-[var(--text-muted)]">Top Recommendations</h3>
          {results.map((r, i) => (
            <div key={i} className="bg-[var(--bg-primary)] rounded-xl p-3 border border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {r.score >= 80 ? <CheckCircle2 size={14} className="text-green-400" /> : <AlertCircle size={14} className={getScoreColor(r.score)} />}
                  <span className="text-xs font-bold text-[var(--text-primary)]">{format(r.date, 'EEE, MMM d, yyyy')}</span>
                </div>
                <span className={`text-sm font-black ${getScoreColor(r.score)}`}>{r.score}</span>
              </div>
              <div className="space-y-1">
                {r.reasoning.map((reason, j) => (
                  <p key={j} className="text-[10px] text-[var(--text-muted)] flex items-start gap-1.5">
                    <span className="mt-0.5 shrink-0">•</span>
                    {reason}
                  </p>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-[var(--border-color)] flex items-center justify-between">
                <span className="text-[10px] text-[var(--text-muted)]">
                  Ends: {format(getBusinessDaysEnd(r.date, requirements.weatherSensitive ? Math.ceil(requirements.duration * scoringConfig.weatherBuffer) : requirements.duration), 'MMM d, yyyy')}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  r.score >= 80 ? 'bg-green-500/10 text-green-400' : 
                  r.score >= 60 ? 'bg-yellow-500/10 text-yellow-400' : 
                  'bg-red-500/10 text-red-400'
                }`}>
                  {r.score >= 80 ? 'Recommended' : r.score >= 60 ? 'Acceptable' : 'Risky'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
      {results.length === 0 && (
        <div className="text-center py-6">
          <Clock size={24} className="mx-auto text-[var(--text-muted)] mb-2 opacity-40" />
          <p className="text-[10px] text-[var(--text-muted)]">Configure requirements above and click Find Best Dates</p>
        </div>
      )}
    </div>
  );
};

export default SchedulingAssistant;
