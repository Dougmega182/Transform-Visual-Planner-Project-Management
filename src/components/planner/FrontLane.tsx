'use client';
import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Task, Front } from '@/store/usePlannerStore';
import { TaskCard } from './TaskCard';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface FrontLaneProps {
  front: Front;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const frontColorMap: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-emerald-500',
  3: 'bg-purple-500',
  4: 'bg-amber-500',
};

export const FrontLane: React.FC<FrontLaneProps> = ({ front, tasks, onTaskClick }) => {
  const [collapsed, setCollapsed] = React.useState(false);
  const { setNodeRef, isOver } = useDroppable({
    id: `front-${front.id}`,
    data: { frontId: front.id },
  });

  const dotColor = frontColorMap[front.id] || 'bg-gray-500';
  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const blockedCount = tasks.filter(t => t.status === 'blocked').length;

  return (
    <div className="mb-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-800/50 transition-colors group"
      >
        {collapsed ? (
          <ChevronRight size={14} className="text-gray-500" />
        ) : (
          <ChevronDown size={14} className="text-gray-500" />
        )}
        <div className={`w-2 h-2 rounded-full ${dotColor}`} />
        <span className="text-xs font-semibold text-gray-200">{front.name}</span>
        <span className="text-[10px] text-gray-600 ml-1">({tasks.length})</span>
        {completedCount > 0 && (
          <span className="text-[9px] text-emerald-500 ml-auto">{completedCount} done</span>
        )}
        {blockedCount > 0 && (
          <span className="text-[9px] text-red-400 ml-2">{blockedCount} blocked</span>
        )}
      </button>

      {!collapsed && (
        <div
          ref={setNodeRef}
          className={`ml-5 mt-1 space-y-2 min-h-[40px] rounded-lg p-2 transition-colors ${
            isOver ? 'bg-blue-500/10 ring-1 ring-blue-500/30' : ''
          }`}
        >
          {tasks.length === 0 && (
            <div className="flex items-center justify-center h-10 border border-dashed border-gray-800 rounded-lg">
              <span className="text-[10px] text-gray-600">Drop tasks here</span>
            </div>
          )}
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onTaskClick={() => onTaskClick(task)} />
          ))}
        </div>
      )}
    </div>
  );
};
