'use client';
import React, { useState } from 'react';
import {
  X, Calendar, Clock, User, MapPin, AlertTriangle, CheckCircle2, Save, TrendingUp, Link2, MessageSquare, Briefcase, Users, Flag, ArrowUpRight, ArrowDownRight, Edit3, ChevronRight
} from 'lucide-react';
import { Task, TaskDependency, TaskComment } from '@/store/usePlannerStore';
import { motion, AnimatePresence } from 'framer-motion';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onSave?: (updates: Partial<Task>) => void;
}

const statusConfig: Record<Task['status'], { label: string; color: string; bg: string; icon: any }> = {
  'not-started': { label: 'Not Started', color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-500/10 border-gray-200 dark:border-gray-500/20', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20', icon: TrendingUp },
  completed: { label: 'Completed', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20', icon: CheckCircle2 },
  delayed: { label: 'Delayed', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20', icon: AlertTriangle },
  blocked: { label: 'Blocked', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20', icon: AlertTriangle },
};

const priorityConfig: Record<Task['priority'], { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20' },
  high: { label: 'High', color: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-500/10 border-orange-100 dark:border-orange-500/20' },
  medium: { label: 'Medium', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20' },
  low: { label: 'Low', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-100 dark:border-blue-500/20' },
};

const depStatusDot: Record<TaskDependency['status'], string> = {
  completed: 'bg-emerald-500',
  'in-progress': 'bg-blue-500',
  'not-started': 'bg-[var(--text-muted)]',
};

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onSave }) => {
  const [activeTab, setActiveTab] = useState<'details' | 'dependencies' | 'comments'>('details');
  const [isEditing, setIsEditing] = useState(false);
  const [editProgress, setEditProgress] = useState(task?.progress || 0);
  const [editStatus, setEditStatus] = useState(task?.status || 'not-started');
  const [newComment, setNewComment] = useState('');

  if (!task) return null;

  const stat = statusConfig[task.status] || statusConfig['not-started'];
  const prio = priorityConfig[task.priority] || priorityConfig['medium'];
  const StatIcon = stat.icon;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const plannedEnd = new Date(task.endDate);
  const variance = Math.ceil((plannedEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  const plannedDays = Math.ceil(
    (new Date(task.endDate).getTime() - new Date(task.startDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const calculateQuality = () => {
    const essential = [task.name, task.startDate, task.duration, task.crewCount, task.trade].every(Boolean);
    const highValue = [task.zone, task.status].every(Boolean);
    const niceToHave = [task.subcontractor, task.costRate].every(v => v !== undefined && v !== null && v !== 0 && v !== '');

    if (essential && highValue && niceToHave) return { label: 'Gold', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20' };
    if (essential && highValue) return { label: 'Silver', color: 'text-slate-400', bg: 'bg-slate-400/10 border-slate-400/20' };
    if (essential) return { label: 'Bronze', color: 'text-orange-700', bg: 'bg-orange-700/10 border-orange-700/20' };
    return { label: 'Incomplete', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
  };

  const quality = calculateQuality();

  const handleSave = () => {
    if (onSave) {
      onSave({ progress: editProgress, status: editStatus });
    }
    setIsEditing(false);
  };

  const tabs = [
    { key: 'details' as const, label: 'Details' },
    { key: 'dependencies' as const, label: `Dependencies (${task.dependencies?.length || 0})` },
    { key: 'comments' as const, label: `Comments (${task.comments?.length || 0})` },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl flex flex-col overflow-hidden mx-4 transition-all duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)]">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded border border-[var(--border-color)] font-bold">
                  {task.id}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${prio.bg}`}>
                  <Flag size={9} className={prio.color} />
                  <span className={prio.color}>{prio.label}</span>
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${quality.bg}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${quality.color.replace('text-', 'bg-')}`} />
                  <span className={quality.color}>{quality.label} Quality</span>
                </span>
              </div>
              <h2 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                {task.name}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1 line-clamp-2">{task.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[var(--bg-primary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Status & progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg border ${stat.bg}`}>
              <StatIcon size={12} className={stat.color} />
              <span className={stat.color}>{stat.label}</span>
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Progress</span>
                <span className="text-[10px] font-bold text-[var(--text-primary)] font-mono">{task.progress}%</span>
              </div>
              <div className="h-1.5 bg-[var(--bg-primary)] rounded-full overflow-hidden border border-[var(--border-color)]/50">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    task.progress >= 100
                      ? 'bg-emerald-500'
                      : task.progress >= 50
                      ? 'bg-blue-500'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${task.progress}%` }}
                />
              </div>
            </div>
            <div className="text-right shrink-0">
              {variance >= 0 ? (
                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight size={12} />
                  <span className="text-[10px] font-bold">{variance}d ahead</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                  <ArrowDownRight size={12} />
                  <span className="text-[10px] font-bold">{Math.abs(variance)}d behind</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--border-color)] bg-[var(--bg-primary)]/30">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-xs font-bold transition-all relative ${
                activeTab === tab.key
                  ? 'text-[var(--accent-teal)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--accent-teal)]" 
                />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-[var(--bg-primary)]/10">
          {/* ── Details Tab ── */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Edit toggle */}
              <div className="flex justify-end">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:opacity-80 transition-opacity"
                  >
                    <Save size={12} />
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <Edit3 size={12} />
                    Edit
                  </button>
                )}
              </div>

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-3">
                <InfoCard icon={MapPin} label="Front" value={task.frontId ? `Front ${task.frontId}` : 'Unassigned'} />
                <InfoCard icon={MapPin} label="Zone" value={task.zone} />
                <InfoCard icon={User} label="Assignee" value={task.assignee} />
                <InfoCard icon={Briefcase} label="Trade" value={task.trade} />
                <InfoCard icon={Users} label="Crew Size" value={`${task.crewCount} workers`} />
                <InfoCard icon={Calendar} label="Duration" value={`${plannedDays} days`} />
                {task.subcontractor && <InfoCard icon={User} label="Subcontractor" value={task.subcontractor} />}
                {typeof task.costRate === 'number' && task.costRate > 0 && <InfoCard icon={TrendingUp} label="Cost Rate" value={`$${task.costRate}/day`} />}
              </div>

              {task.equipmentNeeds && (
                <div className="mt-4 p-3 bg-[var(--bg-primary)]/40 rounded-xl border border-[var(--border-color)]">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <span className="text-[11px] font-bold text-[var(--text-primary)]">Equipment Requirements</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {task.equipmentNeeds}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)] p-3 shadow-sm">
                <h4 className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Schedule</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold">Planned Start</span>
                    <span className="text-[var(--text-primary)] font-mono">{task.startDate}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold">Planned End</span>
                    <span className="text-[var(--text-primary)] font-mono">{task.endDate}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold">Actual Start</span>
                    <span className="text-[var(--text-primary)] font-mono">{task.actualStart || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)] block text-[10px] font-bold">Actual End</span>
                    <span className="text-[var(--text-primary)] font-mono">{task.actualEnd || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Edit fields */}
              {isEditing && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-4 shadow-inner">
                  <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Update Task</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] text-[var(--text-muted)] font-bold block mb-1">Status</label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                        className="w-full bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg px-2 py-1.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-teal)] transition-colors"
                      >
                        <option value="not-started">Not Started</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="delayed">Delayed</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-[10px] text-[var(--text-muted)] font-bold block">
                          Progress
                        </label>
                        <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 font-mono">{editProgress}%</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={editProgress}
                        onChange={(e) => setEditProgress(Number(e.target.value))}
                        className="w-full accent-[var(--accent-teal)]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Constraints */}
              {task.constraints?.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-3 shadow-sm">
                  <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-2 flex items-center gap-1 tracking-widest">
                    <AlertTriangle size={10} />
                    Active Constraints
                  </h4>
                  <ul className="space-y-1.5">
                    {task.constraints.map((con, i) => (
                      <li key={i} className="text-xs text-[var(--text-secondary)] flex items-start gap-2">
                        <ChevronRight size={10} className="text-amber-500 mt-0.5 shrink-0" />
                        <span className="font-medium">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ── Dependencies Tab ── */}
          {activeTab === 'dependencies' && (
            <div className="space-y-2">
              {task.dependencies?.length === 0 ? (
                <div className="text-center py-8 opacity-50">
                  <Link2 size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">No dependencies</p>
                </div>
              ) : (
                task.dependencies?.map((dep) => (
                  <div
                    key={dep.id}
                    className="flex items-center gap-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-3 hover:border-[var(--accent-teal)]/50 transition-all shadow-sm"
                  >
                    <span className={`w-2 h-2 rounded-full shrink-0 shadow-sm ${depStatusDot[dep.status]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[var(--text-primary)] truncate">{dep.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{dep.id}</div>
                    </div>
                    <span className="text-[9px] font-bold text-[var(--text-muted)] bg-[var(--bg-primary)] px-1.5 py-0.5 rounded border border-[var(--border-color)] uppercase">
                      {dep.type}
                    </span>
                    <Link2 size={12} className="text-[var(--text-muted)] shrink-0" />
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Comments Tab ── */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              <div className="space-y-4 mb-4">
                {task.comments?.length === 0 ? (
                  <div className="text-center py-8 opacity-50">
                    <MessageSquare size={24} className="mx-auto mb-2 text-[var(--text-muted)]" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">No comments yet</p>
                  </div>
                ) : (
                  task.comments?.map((comment) => (
                    <div key={comment.id} className="flex gap-3 bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] shadow-sm">
                      <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-[var(--text-muted)]">
                          {comment.author.split(' ').map((n) => n[0]).join('')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-[var(--text-primary)]">{comment.author}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono">{comment.timestamp}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* New comment input */}
              <div className="sticky bottom-0 pt-3 bg-[var(--bg-secondary)]/50 backdrop-blur-md border-t border-[var(--border-color)] flex gap-2">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-teal)]"
                />
                <button
                  onClick={() => setNewComment('')}
                  className="p-2 bg-[var(--accent-teal)] hover:opacity-90 text-white rounded-xl transition-all shadow-md active:scale-95"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Helper component ── */
const InfoCard: React.FC<{ icon: any; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-2.5 shadow-sm hover:border-[var(--accent-teal)]/30 transition-colors">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon size={10} className="text-[var(--text-muted)]" />
      <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-tighter">{label}</span>
    </div>
    <span className="text-xs font-bold text-[var(--text-primary)]">{value}</span>
  </div>
);
