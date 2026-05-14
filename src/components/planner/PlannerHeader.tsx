'use client';
import React from 'react';
import { LayoutGrid, GanttChartSquare, Users, ShieldAlert, Filter, Download, Plus } from 'lucide-react';
import { Task } from '@/store/usePlannerStore';

interface PlannerHeaderProps {
  viewMode: 'board' | 'gantt';
  setViewMode: (mode: 'board' | 'gantt') => void;
  stageFilter: string;
  setStageFilter: (stage: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  onToggleStaff: () => void;
  onToggleConstraints: () => void;
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
  tasks,
}) => {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    blocked: tasks.filter(t => t.status === 'blocked').length,
    delayed: tasks.filter(t => t.status === 'delayed').length,
  };

  return (
    <header className="h-16 border-b border-gray-800 bg-gray-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-8">
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
            Transform™ Visual Planner
          </h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Lean Construction</span>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                {stats.completed} Done
              </span>
              <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/20">
                {stats.blocked + stats.delayed} Risk
              </span>
            </div>
          </div>
        </div>

        <div className="h-8 w-px bg-gray-800" />

        <div className="flex bg-gray-800/50 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setViewMode('board')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'board' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <LayoutGrid size={14} /> Board
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              viewMode === 'gantt' ? 'bg-gray-700 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <GanttChartSquare size={14} /> Gantt
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-gray-800/30 px-3 py-1.5 rounded-xl border border-gray-800">
          <Filter size={12} className="text-gray-500" />
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="bg-transparent text-xs text-gray-300 focus:outline-none appearance-none cursor-pointer"
          >
            <option value="all">All Stages</option>
            <option value="concept">Concept</option>
            <option value="design">Design</option>
            <option value="tender">Tender</option>
            <option value="construction">Construction</option>
          </select>
          <div className="w-px h-3 bg-gray-700 mx-1" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent text-xs text-gray-300 focus:outline-none appearance-none cursor-pointer"
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
          <button 
            onClick={onToggleStaff}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all relative group"
            title="Resources"
          >
            <Users size={18} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border-2 border-gray-900 group-hover:animate-pulse" />
          </button>
          <button 
            onClick={onToggleConstraints}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all relative group"
            title="Constraints"
          >
            <ShieldAlert size={18} />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-gray-900 group-hover:animate-pulse" />
          </button>
          <button className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl transition-all">
            <Download size={18} />
          </button>
          <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95">
            <Plus size={14} /> New Task
          </button>
        </div>
      </div>
    </header>
  );
};
