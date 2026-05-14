'use client';
import React, { useState } from 'react';
import { X, LayoutList, Calendar, Users, AlertCircle, CheckCircle, Clock, ChevronRight, Play } from 'lucide-react';
import { format } from 'date-fns';

interface PipelineDashboardProps {
  projects: any[];
  onClose: () => void;
  onCommit: (projectId: number) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export const PipelineDashboard: React.FC<PipelineDashboardProps> = ({ projects, onClose, onCommit, onRefresh }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [committingId, setCommittingId] = useState<number | null>(null);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const handleCommit = async (projectId: number) => {
    setCommittingId(projectId);
    await onCommit(projectId);
    setCommittingId(null);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[500px] bg-[var(--bg-secondary)] border-l border-[var(--border-color)] shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]">
        <div className="flex items-center gap-2">
          <LayoutList size={18} className="text-purple-500" />
          <h2 className="font-bold text-[var(--text-primary)]">Upcoming Pipeline</h2>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs text-blue-500 hover:bg-blue-500/10 px-2 py-1 rounded transition-all disabled:opacity-50"
          >
            {isRefreshing ? 'Scanning...' : 'Scan Folder'}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-[var(--bg-secondary)] rounded-lg text-[var(--text-muted)]">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-[var(--text-muted)] text-center px-8">
            <Clock size={48} className="mb-4 opacity-20" />
            <p className="text-sm">No projects in pipeline.</p>
            <p className="text-xs mt-2">Add .xlsx briefs to /imports/upcoming and click Scan.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div 
              key={project.id} 
              className={`p-4 rounded-xl border bg-[var(--bg-primary)] transition-all ${
                project.status === 'can_start' ? 'border-green-500/20' : 
                project.status === 'delayed' ? 'border-amber-500/20' : 'border-red-500/20'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">{project.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-[var(--text-muted)]">
                    <span className="flex items-center gap-1">
                      <Calendar size={10} /> Target: {project.projected_start || 'ASAP'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} /> Created: {format(new Date(project.created_at), 'MMM d')}
                    </span>
                  </div>
                </div>
                <StatusBadge status={project.status} />
              </div>

              {project.status === 'cannot_staff' && (
                <div className="mb-4 p-3 bg-red-500/5 rounded-lg border border-red-500/10">
                  <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold mb-1">
                    <AlertCircle size={12} /> Bottlenecks Detected
                  </div>
                  <ul className="text-[10px] text-[var(--text-secondary)] space-y-1">
                    {project.blocking_reasons?.map((reason: string, i: number) => (
                      <li key={i}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {project.status !== 'cannot_staff' && (
                <div className="space-y-3">
                  {/* Phase Summary */}
                  <div className="space-y-2">
                    {project.phases?.map((phase: any, i: number) => (
                      <div key={i} className="bg-[var(--bg-secondary)]/50 p-2 rounded-lg border border-[var(--border-color)]">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-bold text-[var(--text-secondary)]">{phase.phase}</span>
                          <span className="text-[var(--text-muted)]">{phase.start} → {phase.end}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {phase.trades.map((t: any, j: number) => (
                            <div key={j} className="flex items-center gap-1.5 px-1.5 py-0.5 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                              <span className="text-[9px] font-medium text-[var(--text-primary)]">{t.trade}</span>
                              <span className="text-[9px] text-blue-500 font-bold">{t.crew}</span>
                              <div className="w-1 h-1 rounded-full bg-[var(--border-color)]" />
                              <span className={`text-[9px] font-bold ${parseInt(t.utilization) > 90 ? 'text-amber-500' : 'text-[var(--text-muted)]'}`}>
                                {t.utilization}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[var(--border-color)]">
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Est. Completion: <span className="text-[var(--text-primary)] font-medium">{project.estimated_end}</span>
                    </div>
                    <button
                      onClick={() => handleCommit(project.id)}
                      disabled={committingId === project.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                    >
                      {committingId === project.id ? (
                        <>Committing...</>
                      ) : (
                        <>
                          <Play size={12} fill="currentColor" />
                          Commit to Live
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'can_start':
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 text-green-500 rounded text-[10px] font-bold uppercase tracking-wider">
          <CheckCircle size={10} /> Can Start
        </div>
      );
    case 'delayed':
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded text-[10px] font-bold uppercase tracking-wider">
          <Clock size={10} /> Delayed
        </div>
      );
    case 'cannot_staff':
      return (
        <div className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-500 rounded text-[10px] font-bold uppercase tracking-wider">
          <AlertCircle size={10} /> Blocked
        </div>
      );
    default:
      return null;
  }
};
