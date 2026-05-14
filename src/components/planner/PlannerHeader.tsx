'use client';
import React from 'react';
import { 
  LayoutGrid, 
  Calendar, 
  Users2, 
  AlertTriangle, 
  Filter, 
  FileUp, 
  Plus, 
  RotateCcw, 
  LayoutList,
  FileDown,
  Activity
} from 'lucide-react';
import { Task } from '@/store/usePlannerStore';

import { ThemeToggle } from './ThemeToggle';

interface PlannerHeaderProps {
  viewMode: 'board' | 'gantt';
  setViewMode: (mode: 'board' | 'gantt') => void;
  stageFilter: string;
  setStageFilter: (stage: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onToggleStaff: () => void;
  onToggleConstraints: () => void;
  onTogglePipeline: () => void;
  tasks: Task[];
}

export const PlannerHeader: React.FC<PlannerHeaderProps> = ({
  viewMode,
  setViewMode,
  stageFilter,
  setStageFilter,
  statusFilter,
  setStatusFilter,
  onToggleStaff,
  onToggleConstraints,
  onTogglePipeline,
  tasks,
}) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    delayed: tasks.filter(t => t.status === 'delayed').length,
  };

  return (
    <header className="h-16 border-b border-[var(--border-color)] bg-[var(--header-bg)] backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <img src="/mainLogo.png" alt="Transform Logo" className="h-10 w-auto object-contain" />
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-[var(--text-primary)] to-[var(--text-muted)] bg-clip-text text-transparent">
              Transform™ Visual Planner
            </h1>
            <div className="flex items-center gap-3 mt-0.5">
              <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-widest font-semibold">Lean Construction</span>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-bold">
                  {stats.completed} Done
                </span>
                <span className="flex items-center gap-1 text-[10px] text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20 font-bold">
                  {stats.blocked + stats.delayed} Risk
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-[var(--border-color)]" />

        <div className="flex bg-[var(--bg-secondary)] p-1 rounded-xl border border-[var(--border-color)] shadow-sm">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'board' ? 'bg-[var(--accent-teal)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <LayoutGrid size={14} /> Board
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'gantt' ? 'bg-[var(--accent-teal)] text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Calendar size={14} /> Gantt
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[var(--bg-secondary)] px-3 py-1.5 rounded-xl border border-[var(--border-color)]">
          <Filter size={12} className="text-[var(--text-muted)]" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-transparent text-xs text-[var(--text-secondary)] focus:outline-none appearance-none cursor-pointer font-medium"
          >
            <option value="all">All Stages</option>
            <option value="concept">Concept</option>
            <option value="design">Design</option>
            <option value="tender">Tender</option>
            <option value="construction">Construction</option>
          </select>
          <div className="w-px h-3 bg-[var(--border-color)] mx-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-xs text-[var(--text-secondary)] focus:outline-none appearance-none cursor-pointer font-medium"
          >
            <option value="all">All Status</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="delayed">Delayed</option>
            <option value="blocked">Blocked</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="w-px h-6 bg-[var(--border-color)] mx-1" />
          <button 
            onClick={onToggleStaff}
            className="p-2 text-[var(--text-secondary)] hover:text-blue-500 hover:bg-blue-500/5 rounded-xl transition-all border border-[var(--border-color)] relative group"
            title="Resources"
          >
            <Users2 size={18} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-[var(--bg-primary)] group-hover:animate-pulse" />
          </button>
          <button 
            onClick={onToggleConstraints}
            className="p-2 text-[var(--text-secondary)] hover:text-red-500 hover:bg-red-500/5 rounded-xl transition-all border border-[var(--border-color)] relative group"
            title="Constraints"
          >
            <AlertTriangle size={18} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[var(--bg-primary)] group-hover:animate-pulse" />
          </button>
          <button 
            onClick={onTogglePipeline}
            className="p-2 text-[var(--text-secondary)] hover:text-purple-500 hover:bg-purple-500/5 rounded-xl transition-all border border-[var(--border-color)] relative group"
            title="Upcoming Pipeline"
          >
            <LayoutList size={18} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border-2 border-[var(--bg-primary)] group-hover:animate-pulse" />
          </button>
          
          <div className="w-px h-6 bg-[var(--border-color)] mx-1" />

          <button 
            onClick={async () => {
              const res = await fetch('/api/import/sync', { method: 'POST' });
              const data = await res.json();
              if (res.ok) {
                alert(`Sync Complete! ${data.message}`);
                window.location.reload();
              } else {
                alert('Sync failed: ' + (data.error || 'Unknown error'));
              }
            }}
            className="p-2 text-[var(--text-secondary)] hover:text-emerald-500 hover:bg-emerald-500/5 rounded-xl transition-all border border-[var(--border-color)] group"
            title="Sync Imports"
          >
            <RotateCcw size={18} className="group-hover:rotate-180 transition-transform duration-500" />
          </button>
          <button 
            onClick={async () => {
              const res = await fetch('/api/import', { method: 'POST' });
              const data = await res.json();
              if (data.success) {
                let msg = `Import Successful!\n- ${data.tasksImported} tasks imported\n- ${data.newStaffCreated} new staff created`;
                alert(msg);
                window.location.reload();
              } else {
                alert('Import failed: ' + (data.error || 'Unknown error'));
              }
            }}
            className="p-2 text-[var(--text-secondary)] hover:text-amber-500 hover:bg-amber-500/5 rounded-xl transition-all border border-[var(--border-color)]"
            title="Bulk Import"
          >
            <FileUp size={18} />
          </button>
          <button className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] rounded-xl transition-all border border-[var(--border-color)]" title="Export Report">
            <FileDown size={18} />
          </button>
          <button className="flex items-center gap-2 bg-[var(--accent-teal)] hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-teal-500/20 active:scale-95 ml-2">
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>
    </header>
  );
};
