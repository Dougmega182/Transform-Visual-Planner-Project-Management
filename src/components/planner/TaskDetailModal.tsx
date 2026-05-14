'use client';
import React, { useState } from 'react';
import {
  X, Calendar, Clock, User, MapPin, AlertTriangle, CheckCircle2, Save, TrendingUp, Link2, MessageSquare, Briefcase, Users, Flag, ArrowUpRight, ArrowDownRight, Edit3, ChevronRight
} from 'lucide-react';
import { Task, TaskDependency, TaskComment } from '@/store/usePlannerStore';

interface TaskDetailModalProps {
  task: Task | null;
  onClose: () => void;
  onSave?: (updates: Partial<Task>) => void;
}

const statusConfig: Record<Task['status'], { label: string; color: string; bg: string; icon: any }> = {
  'not-started': { label: 'Not Started', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', icon: Clock },
  'in-progress': { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', icon: TrendingUp },
  completed: { label: 'Completed', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', icon: CheckCircle2 },
  delayed: { label: 'Delayed', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20', icon: AlertTriangle },
  blocked: { label: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', icon: AlertTriangle },
};

const priorityConfig: Record<Task['priority'], { label: string; color: string; bg: string }> = {
  critical: { label: 'Critical', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
  high: { label: 'High', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
  medium: { label: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  low: { label: 'Low', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
};

const depStatusDot: Record<TaskDependency['status'], string> = {
  completed: 'bg-emerald-400',
  'in-progress': 'bg-blue-400',
  'not-started': 'bg-gray-500',
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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl max-h-[85vh] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col overflow-hidden mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded">
                  {task.id}
                </span>
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${prio.bg}`}>
                  <Flag size={9} className={prio.color} />
                  <span className={prio.color}>{prio.label}</span>
                </span>
              </div>
              <h2 className="text-base font-semibold text-gray-100 leading-tight">
                {task.name}
              </h2>
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Status & progress bar */}
          <div className="mt-4 flex items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border ${stat.bg}`}>
              <StatIcon size={12} className={stat.color} />
              <span className={stat.color}>{stat.label}</span>
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500">Progress</span>
                <span className="text-[10px] font-semibold text-gray-300">{task.progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
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
                <div className="flex items-center gap-1 text-emerald-400">
                  <ArrowUpRight size={12} />
                  <span className="text-[10px] font-medium">{variance}d ahead</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-400">
                  <ArrowDownRight size={12} />
                  <span className="text-[10px] font-medium">{Math.abs(variance)}d behind</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors relative ${
                activeTab === tab.key
                  ? 'text-blue-400'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
          {/* ── Details Tab ── */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Edit toggle */}
              <div className="flex justify-end">
                {isEditing ? (
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Save size={12} />
                    Save Changes
                  </button>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
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
                <InfoCard icon={Users} label="Crew Size" value={`${task.crew} workers`} />
                <InfoCard icon={Calendar} label="Duration" value={`${plannedDays} days`} />
              </div>

              {/* Dates */}
              <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-3">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase mb-2">Schedule</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500 block text-[10px]">Planned Start</span>
                    <span className="text-gray-300">{task.startDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Planned End</span>
                    <span className="text-gray-300">{task.endDate}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Actual Start</span>
                    <span className="text-gray-300">{task.actualStart || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block text-[10px]">Actual End</span>
                    <span className="text-gray-300">{task.actualEnd || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Edit fields */}
              {isEditing && (
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 space-y-3">
                  <h4 className="text-[10px] font-semibold text-blue-400 uppercase">Update Task</h4>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-xs text-gray-300 focus:outline-none focus:border-blue-500/50"
                    >
                      <option value="not-started">Not Started</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="delayed">Delayed</option>
                      <option value="blocked">Blocked</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-400 block mb-1">
                      Progress: {editProgress}%
                    </label>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={editProgress}
                      onChange={(e) => setEditProgress(Number(e.target.value))}
                      className="w-full accent-blue-500"
                    />
                  </div>
                </div>
              )}

              {/* Constraints */}
              {task.constraints?.length > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-3">
                  <h4 className="text-[10px] font-semibold text-amber-400 uppercase mb-2 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Active Constraints
                  </h4>
                  <ul className="space-y-1.5">
                    {task.constraints.map((con, i) => (
                      <li key={i} className="text-xs text-gray-400 flex items-start gap-2">
                        <ChevronRight size={10} className="text-amber-500 mt-0.5 shrink-0" />
                        {con}
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
              {task.dependencies?.map((dep) => (
                <div
                  key={dep.id}
                  className="flex items-center gap-3 bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:bg-gray-800 transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${depStatusDot[dep.status]}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-gray-300 truncate">{dep.name}</div>
                    <div className="text-[10px] text-gray-600">{dep.id}</div>
                  </div>
                  <span className="text-[9px] font-mono text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
                    {dep.type}
                  </span>
                  <Link2 size={12} className="text-gray-600 shrink-0" />
                </div>
              ))}
            </div>
          )}

          {/* ── Comments Tab ── */}
          {activeTab === 'comments' && (
            <div className="space-y-4">
              {task.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-800 border border-gray-700 flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-semibold text-gray-400">
                      {comment.author.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium text-gray-300">{comment.author}</span>
                      <span className="text-[10px] text-gray-600">{comment.timestamp}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{comment.text}</p>
                  </div>
                </div>
              ))}

              {/* New comment input */}
              <div className="flex gap-2 pt-2 border-t border-gray-800">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-300 placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                />
                <button
                  onClick={() => setNewComment('')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <MessageSquare size={14} />
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
  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-2.5">
    <div className="flex items-center gap-1.5 mb-1">
      <Icon size={10} className="text-gray-500" />
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
    <span className="text-xs font-medium text-gray-300">{value}</span>
  </div>
);
