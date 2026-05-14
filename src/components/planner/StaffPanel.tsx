'use client';
import React, { useState } from 'react';
import { X, Search, Users, UserCheck, CalendarDays, BarChart } from 'lucide-react';
import { Staff, TaskAssignment, StaffLeave } from '@/store/usePlannerStore';

interface StaffPanelProps {
  staff: Staff[];
  taskAssignments: TaskAssignment[];
  staffLeave: StaffLeave[];
  onClose: () => void;
}

export const StaffPanel: React.FC<StaffPanelProps> = ({ staff, taskAssignments, staffLeave, onClose }) => {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'available' | 'assigned' | 'leave'>('all');

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
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-blue-400" />
            <h2 className="text-sm font-semibold text-white">Resource Management</h2>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg text-gray-500 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-gray-800/40 rounded-xl p-2.5 text-center border border-gray-800/50">
            <div className="text-lg font-bold text-emerald-400">{counts.available}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-tighter">Available</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-2.5 text-center border border-gray-800/50">
            <div className="text-lg font-bold text-blue-400">{counts.assigned}</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-tighter">Assigned</div>
          </div>
          <div className="bg-gray-800/40 rounded-xl p-2.5 text-center border border-gray-800/50">
            <div className="text-lg font-bold text-amber-400">{avgUtilization}%</div>
            <div className="text-[9px] text-gray-500 uppercase tracking-tighter">Avg Util.</div>
          </div>
        </div>

        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search resources..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800/50 border border-gray-800 rounded-lg pl-8 pr-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex px-4 py-2 gap-1 border-b border-gray-800 bg-gray-900/50">
        {(['all', 'available', 'assigned', 'leave'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all ${
              filter === f ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Staff List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {filtered.map(s => (
          <div key={s.id} className="group p-3 rounded-xl bg-gray-800/30 border border-gray-800/50 hover:border-gray-700 hover:bg-gray-800/50 transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="text-xs font-semibold text-gray-200">{s.name}</h4>
                <p className="text-[10px] text-gray-500">{s.role} · {s.team}</p>
              </div>
              <div className={`w-1.5 h-1.5 rounded-full mt-1 ${
                s.availability === 'available' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' :
                s.availability === 'assigned' ? 'bg-blue-500' : 'bg-gray-600'
              }`} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-gray-500 uppercase tracking-wider">Utilization</span>
                <span className={s.utilization > 90 ? 'text-red-400' : 'text-gray-400'}>{s.utilization}%</span>
              </div>
              <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    s.utilization > 90 ? 'bg-red-500' : s.utilization > 50 ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${s.utilization}%` }}
                />
              </div>
            </div>

            {s.assignmentsCount > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-[9px] text-gray-400">
                <BarChart size={10} />
                <span>{s.assignmentsCount} active tasks</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
