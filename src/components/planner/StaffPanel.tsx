'use client';
import React, { useState } from 'react';
import { X, Search, Users, UserCheck, CalendarDays, BarChart } from 'lucide-react';
import { Staff, TaskAssignment, StaffLeave, Task } from '@/store/usePlannerStore';
import { SchedulingAssistant } from './SchedulingAssistant';
import { ResourcePoolModal } from './ResourcePoolModal';

interface StaffPanelProps {
  staff: Staff[];
  tasks: Task[];
  taskAssignments: TaskAssignment[];
  staffLeave: StaffLeave[];
  resourcePool: any[];
  onClose: () => void;
}

export const StaffPanel: React.FC<StaffPanelProps> = ({ staff, tasks, taskAssignments, staffLeave, resourcePool, onClose }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'assigned' | 'leave'>('all');
  const [isPoolModalOpen, setIsPoolModalOpen] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  const staffWithMeta = staff.map(s => {
    const isOnLeave = staffLeave.some(l => l.staff_id === s.id && l.date === todayStr);
    const assignments = taskAssignments.filter(ta => ta.staff_id === s.id);
    const availability = isOnLeave ? 'leave' : assignments.length > 0 ? 'assigned' : 'available';
    
    // Calculate mock utilization based on assignments for visualization
    const utilization = isOnLeave ? 0 : Math.min(100, assignments.length * 25); 

    return { ...s, availability, utilization, assignmentsCount: assignments.length };
  });

  const filtered = staffWithMeta.filter(s => {
    if (filter !== 'all' && s.availability !== filter) return false;
    if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.role.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: staffWithMeta.length,
    available: staffWithMeta.filter(s => s.availability === 'available').length,
    assigned: staffWithMeta.filter(s => s.availability === 'assigned').length,
    leave: staffWithMeta.filter(s => s.availability === 'leave').length,
  };

  const avgUtilization = staffWithMeta.length > 0 
    ? Math.round(staffWithMeta.reduce((acc, s) => acc + s.utilization, 0) / staffWithMeta.length)
    : 0;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-[var(--bg-secondary)] border-l border-[var(--border-color)] shadow-2xl z-50 flex flex-col transition-all duration-300">
      {/* Header */}
      <div className="p-4 border-b border-[var(--border-color)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-500" />
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Resource Management</h2>
          </div>
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsPoolModalOpen(true)}
              className="p-1.5 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all text-[10px] font-bold"
              title="Manage Capacity Pool"
            >
              Manage Pool
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-[var(--bg-primary)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-[var(--bg-primary)] rounded-xl p-2.5 text-center border border-[var(--border-color)]">
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{counts.available}</div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter font-bold">Available</div>
          </div>
          <div className="bg-[var(--bg-primary)] rounded-xl p-2.5 text-center border border-[var(--border-color)]">
            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{counts.assigned}</div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter font-bold">Assigned</div>
          </div>
          <div className="bg-[var(--bg-primary)] rounded-xl p-2.5 text-center border border-[var(--border-color)]">
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{avgUtilization}%</div>
            <div className="text-[9px] text-[var(--text-muted)] uppercase tracking-tighter font-bold">Avg Util.</div>
          </div>
        </div>

        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg pl-8 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-teal)]/50 transition-colors"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-4 py-2 gap-1 border-b border-[var(--border-color)] bg-[var(--bg-primary)]/50">
        {(['all', 'available', 'assigned', 'leave'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              filter === f ? 'bg-[var(--accent-teal)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Staff List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-[var(--bg-primary)]/20">
        {filtered.map(s => (
          <div key={s.id} className="group p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] hover:border-[var(--accent-teal)]/50 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">{s.name}</h4>
                <p className="text-[10px] text-[var(--text-secondary)]">{s.role} · {s.team}</p>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                s.availability === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                s.availability === 'assigned' ? 'bg-blue-500' : 'bg-[var(--text-muted)]'
              }`} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-[var(--text-muted)] uppercase tracking-wider font-bold">Utilization</span>
                <span className={`font-mono ${s.utilization > 90 ? 'text-red-500 font-bold' : 'text-[var(--text-secondary)]'}`}>{s.utilization}%</span>
              </div>
              <div className="h-1 w-full bg-[var(--bg-primary)] rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    s.utilization > 90 ? 'bg-red-500' : s.utilization > 50 ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${s.utilization}%` }}
                />
              </div>
            </div>

            {s.assignmentsCount > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-[9px] text-[var(--text-muted)]">
                <BarChart size={10} />
                <span className="font-medium">{s.assignmentsCount} active tasks</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Scheduling Assistant Section */}
      <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/30">
        <SchedulingAssistant tasks={tasks} staff={staff} taskAssignments={taskAssignments} />
      </div>

      <ResourcePoolModal 
        isOpen={isPoolModalOpen} 
        onClose={() => setIsPoolModalOpen(false)} 
        initialData={resourcePool} 
      />
    </div>
  );
};
