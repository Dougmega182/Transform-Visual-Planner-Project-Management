'use client';
import React, { useState } from 'react';
import { Calendar, Users, Briefcase, ChevronRight, CheckCircle2, AlertCircle, MapPin } from 'lucide-react';
import { usePlannerStore } from '@/store/usePlannerStore';
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

  // Get unique trades from pool
  const trades = Array.from(new Set(resourcePool.map(p => p.trade))).sort();
  // Prioritize user's specific staff
  const prioritizedTrades = ['Carpentry My staff', 'Labourers My staff', ...trades.filter(t => t !== 'Carpentry My staff' && t !== 'Labourers My staff')];

  const [results, setResults] = useState<{ date: Date; score: number; reasoning: string[] }[]>([]);

  // 1. Scoring Pipeline Configuration
  const scoringConfig = {
    zonePenalty: 15,        // Penalty for same-zone congestion
    subLimit: 3,           // Max concurrent tasks per sub
    weatherBuffer: 1.2,    // 20% duration padding for weather-sensitive tasks
    densityThreshold: 20,  // Max crew size per zone before flagging
  };

  const isBusinessDay = (date: Date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6; 
  };

  const calculateEndDate = (startDate: Date, duration: number, isWeatherSensitive: boolean) => {
    const paddedDuration = isWeatherSensitive ? Math.ceil(duration * scoringConfig.weatherBuffer) : duration;
    let current = new Date(startDate);
    let daysAdded = 0;
    while (daysAdded < paddedDuration) {
      current = addDays(current, 1);
      if (isBusinessDay(current)) {
        daysAdded++;
      }
    }
    return current;
  };

  const findOptimalDates = () => {
    const suggestions: { date: Date; score: number; reasoning: string[] }[] = [];
    const today = startOfDay(new Date());

    for (let i = 0; i < 60; i++) {
      const candidateDate = addDays(today, i);
      if (!isBusinessDay(candidateDate)) continue;

      // Basic project details for this run
      const isWeatherSensitive = requirements.weatherSensitive;
      const endDate = calculateEndDate(candidateDate, requirements.duration, isWeatherSensitive);
      
      let totalScore = 0;
      let reasons: string[] = [];
      
      if (isWeatherSensitive) reasons.push("Weather Buffered");
      
      // RUN SCORING PIPELINE
      tasks.forEach(task => {
        const taskStart = new Date(task.startDate);
        const taskEnd = addDays(taskStart, task.duration || 1);
        
        const overlap = isWithinInterval(taskStart, { start: candidateDate, end: endDate }) ||
                        isWithinInterval(taskEnd, { start: candidateDate, end: endDate }) ||
                        (taskStart <= candidateDate && taskEnd >= endDate);
        
        if (overlap) {
          // Scorer 1: Trade Load
          if (task.trade === requirements.trade || requirements.trade === 'General') {
            const load = task.crewCount || 1;
            totalScore += load;
            if (load > 5) reasons.push(`${task.trade} High Load: ${task.name}`);
          }

          // Scorer 2: Zone Density
          if (task.zone === requirements.zone) {
            totalScore += scoringConfig.zonePenalty;
            reasons.push(`Zone Congestion: ${task.zone}`);
          }

          // Scorer 3: Subcontractor Saturation
          // (Placeholder for sub-specific logic)
        }
      });

      if (totalScore === 0) reasons.push("Clear Window");

      suggestions.push({ 
        date: candidateDate, 
        score: totalScore, 
        reasoning: Array.from(new Set(reasons)).slice(0, 2) 
      });
    }

    setResults(suggestions.sort((a, b) => a.score - b.score).slice(0, 3));
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
              {Array.from(new Set(tasks.map(t => t.zone).filter(Boolean))).length > 0 ? (
                Array.from(new Set(tasks.map(t => t.zone).filter(Boolean))).sort().map(z => (
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
          onClick={findOptimalDates}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
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
                <div className="text-[10px] font-bold text-[var(--text-secondary)]">Score: {res.score}</div>
                <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-blue-500 transition-colors ml-auto" />
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
