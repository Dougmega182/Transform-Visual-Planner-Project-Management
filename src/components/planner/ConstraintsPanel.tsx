'use client';
import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle, Clock, CheckCircle2, Search, Filter } from 'lucide-react';
import { Constraint } from '@/store/usePlannerStore';

interface ConstraintsPanelProps {
  constraints: Constraint[];
  onClose: () => void;
}

const severityConfig: Record<Constraint['severity'], { label: string; color: string; bg: string; ring: string; icon: any }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', ring: 'ring-red-500/30', icon: ShieldAlert },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', ring: 'ring-orange-500/30', icon: AlertTriangle },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', ring: 'ring-amber-500/30', icon: Clock },
  low: { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', ring: 'ring-blue-500/30', icon: CheckCircle2 },
};

const statusConfig: Record<Constraint['status'], { label: string; dot: string }> = {
  open: { label: 'Open', dot: 'bg-red-400' },
  'in-progress': { label: 'In Progress', dot: 'bg-amber-400' },
  resolved: { label: 'Resolved', dot: 'bg-emerald-400' },
};

export const ConstraintsPanel: React.FC<ConstraintsPanelProps> = ({ constraints, onClose }) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | Constraint['severity']>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | Constraint['status']>('all');
  const [search, setSearch] = useState('');

  const filtered = constraints.filter((c) => {
    if (filterSeverity !== 'all' && c.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search && !c.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const openCritical = constraints.filter((c) => c.severity === 'critical' && c.status !== 'resolved').length;
  const openHigh = constraints.filter((c) => c.severity === 'high' && c.status !== 'resolved').length;
  const totalOpen = constraints.filter((c) => c.status !== 'resolved').length;

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-gray-900 border-l border-gray-800 shadow-2xl z-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-200">Constraints & Issues</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Summary pills */}
        <div className="flex gap-2 mb-3">
          <div className="flex-1 bg-red-500/10 border border-red-500/20 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-red-400">{openCritical}</div>
            <div className="text-[8px] text-red-400/70 uppercase">Critical</div>
          </div>
          <div className="flex-1 bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-orange-400">{openHigh}</div>
            <div className="text-[8px] text-orange-400/70 uppercase">High</div>
          </div>
          <div className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg p-2 text-center">
            <div className="text-base font-bold text-gray-300">{totalOpen}</div>
            <div className="text-[8px] text-gray-500 uppercase">Total Open</div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-2">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
          <input
            type="text"
            placeholder="Search constraints..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-8 pr-3 py-1.5 text-[10px] text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value as any)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-[10px] text-gray-300 focus:outline-none focus:border-blue-500/50"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="in-progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
      </div>

      {/* Constraint list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {filtered.length === 0 && (
          <div className="text-center py-8">
            <Filter size={24} className="mx-auto text-gray-700 mb-2 opacity-20" />
            <p className="text-[10px] text-gray-600 uppercase tracking-widest">No constraints match</p>
          </div>
        )}

        {filtered.map((c) => {
          const sc = severityConfig[c.severity] || severityConfig['low'];
          const st = statusConfig[c.status] || statusConfig['open'];
          const SevIcon = sc.icon;

          return (
            <div
              key={c.id}
              className={`rounded-lg border p-3 transition-colors hover:bg-gray-800/30 ${sc.bg}`}
            >
              <div className="flex items-start gap-2 mb-1.5">
                <SevIcon size={14} className={`${sc.color} mt-0.5 shrink-0`} />
                <div className="flex-1 min-w-0">
                  <h3 className="text-[11px] font-semibold text-gray-200 leading-tight truncate">
                    {c.title}
                  </h3>
                  <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
                    {c.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${sc.bg}`}>
                  <span className={sc.color}>{sc.label}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[9px] text-gray-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${st.dot}`} />
                  {st.label}
                </span>
                <span className="text-[9px] text-gray-600 ml-auto font-medium">
                  {c.owner}
                </span>
              </div>

              <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-gray-800/50">
                <span className="text-[9px] text-gray-500 font-medium truncate max-w-[60%]">
                  {c.front}
                </span>
                <span className="text-[9px] text-gray-600">
                  {new Date(c.raisedDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
