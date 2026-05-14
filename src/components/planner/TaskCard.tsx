'use client';
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Clock, CheckCircle2, AlertTriangle, User } from 'lucide-react';
import { Task } from '@/store/usePlannerStore';

interface TaskCardProps {
  task: Task;
  overlay?: boolean;
  onTaskClick?: (task: Task) => void;
}

const statusConfig: Record<Task['status'], { icon: React.ReactNode; color: string; bg: string }> = {
  'not-started': { icon: <Clock size={10} />, color: 'text-gray-400', bg: 'bg-gray-500/20' },
  'in-progress': { icon: <Clock size={10} />, color: 'text-blue-400', bg: 'bg-blue-500/20' },
  completed: { icon: <CheckCircle2 size={10} />, color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  delayed: { icon: <AlertTriangle size={10} />, color: 'text-amber-400', bg: 'bg-amber-500/20' },
  blocked: { icon: <AlertTriangle size={10} />, color: 'text-red-400', bg: 'bg-red-500/20' },
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, overlay, onTaskClick }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { task },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const config = statusConfig[task.status] || statusConfig['not-started'];

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onTaskClick?.(task)}
      className={`
        group relative bg-gray-800/80 border border-gray-700/50 rounded-xl p-3 
        hover:border-gray-500 hover:bg-gray-800 transition-all cursor-grab active:cursor-grabbing
        ${overlay ? 'shadow-2xl ring-2 ring-blue-500/50 scale-105 opacity-100 z-50' : ''}
        ${isDragging && !overlay ? 'opacity-30' : 'opacity-100'}
      `}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-[11px] font-bold text-gray-200 leading-tight line-clamp-2">
          {task.name}
        </h4>
        <div className={`shrink-0 p-1 rounded-md ${config.bg}`}>
          {config.icon}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <div className="flex-1 h-1 bg-gray-900 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-700 ${
              task.status === 'completed' ? 'bg-emerald-500' : 'bg-blue-500'
            }`} 
            style={{ width: `${task.progress}%` }} 
          />
        </div>
        <span className="text-[9px] font-mono text-gray-500">{task.progress}%</span>
      </div>

      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
          <User size={10} />
          <span className="truncate max-w-[80px]">{task.assignee}</span>
        </div>
        <span className="text-[9px] font-mono text-gray-600">
          {new Date(task.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
};
