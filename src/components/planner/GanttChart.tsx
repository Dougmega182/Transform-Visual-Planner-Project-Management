'use client';
import React from 'react';
import { Task, Front } from '@/store/usePlannerStore';

interface GanttChartProps {
  fronts: Front[];
  tasks: Task[];
  currentWeekStart: Date;
  onTaskClick: (task: Task) => void;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const stageBarColors: Record<Task['stage'], string> = {
  concept: 'bg-purple-500',
  design: 'bg-blue-500',
  tender: 'bg-amber-500',
  construction: 'bg-emerald-500',
  handover: 'bg-gray-400',
};

const stageBarBorders: Record<Task['stage'], string> = {
  concept: 'border-purple-400',
  design: 'border-blue-400',
  tender: 'border-amber-400',
  construction: 'border-emerald-400',
  handover: 'border-gray-300',
};

const frontDotColors: Record<number, string> = {
  1: 'bg-blue-500',
  2: 'bg-emerald-500',
  3: 'bg-purple-500',
  4: 'bg-amber-500',
};

export const GanttChart: React.FC<GanttChartProps> = ({
  fronts,
  tasks,
  currentWeekStart,
  onTaskClick,
}) => {
  const totalDays = 28;
  const days = Array.from({ length: totalDays }, (_, i) => addDays(currentWeekStart, i));

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayOffset = daysBetween(currentWeekStart, today);

  const getTasksForFront = (frontId: number) =>
    tasks.filter((t) => t.frontId === frontId);

  return (
    <div className="flex-1 overflow-auto">
      <div className="min-w-[900px] relative">
        {/* Today vertical line */}
        {todayOffset >= 0 && todayOffset < totalDays && (
          <div
            className="absolute top-0 bottom-0 w-px bg-blue-500/40 z-20 pointer-events-none"
            style={{
              left: `calc(176px + ((100% - 176px) * ${todayOffset} / ${totalDays}))`,
            }}
          />
        )}

        {/* Day column headers */}
        <div className="flex border-b border-gray-800 sticky top-0 bg-gray-900 z-10">
          <div className="w-44 shrink-0 px-3 py-2 border-r border-gray-800">
            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
              Front / Task
            </span>
          </div>
          <div className="flex-1 flex">
            {days.map((d, i) => {
              const dow = d.getDay();
              const isWeekend = dow === 0 || dow === 6;
              const isToday = d.getTime() === today.getTime();
              return (
                <div
                  key={i}
                  className={`flex-1 text-center py-1.5 border-r border-gray-800/50 ${
                    isWeekend ? 'bg-gray-800/30' : ''
                  } ${isToday ? 'bg-blue-500/10' : ''}`}
                >
                  <div
                    className={`text-[8px] uppercase ${
                      isToday
                        ? 'text-blue-400'
                        : isWeekend
                        ? 'text-gray-700'
                        : 'text-gray-600'
                    }`}
                  >
                    {d.toLocaleDateString('en-GB', { weekday: 'narrow' })}
                  </div>
                  <div
                    className={`text-[10px] font-medium ${
                      isToday
                        ? 'text-blue-300'
                        : isWeekend
                        ? 'text-gray-700'
                        : 'text-gray-400'
                    }`}
                  >
                    {d.getDate()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Front sections */}
        {fronts.map((front) => {
          const frontTasks = getTasksForFront(front.id);
          const dotColor = frontDotColors[front.id] || 'bg-gray-500';

          return (
            <div key={front.id}>
              {/* Front label row */}
              <div className="flex border-b border-gray-800/50">
                <div className="w-44 shrink-0 px-3 py-1.5 border-r border-gray-800 flex items-center gap-2 bg-gray-800/20">
                  <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                  <span className="text-[11px] font-semibold text-gray-300 truncate">
                    {front.name}
                  </span>
                  <span className="text-[9px] text-gray-600 ml-auto">
                    {frontTasks.length}
                  </span>
                </div>
                <div className="flex-1 bg-gray-800/10" />
              </div>
              {/* Task bar rows */}
              {frontTasks.map((task) => {
                const taskStart = new Date(task.startDate);
                const taskEnd = new Date(task.endDate);
                taskStart.setHours(0, 0, 0, 0);
                taskEnd.setHours(0, 0, 0, 0);

                const offsetDays = daysBetween(currentWeekStart, taskStart);
                const durationDays = Math.max(1, daysBetween(taskStart, taskEnd) + 1);

                const clampedLeft = Math.max(0, offsetDays);
                const clampedRight = Math.min(totalDays, offsetDays + durationDays);
                const visibleWidth = clampedRight - clampedLeft;
                const isVisible = visibleWidth > 0;

                const leftPercent = (clampedLeft / totalDays) * 100;
                const widthPercent = (visibleWidth / totalDays) * 100;

                const barColor = stageBarColors[task.stage];
                const barBorder = stageBarBorders[task.stage];
                const isBlocked = task.status === 'blocked';
                const isCompleted = task.status === 'completed';

                const progressWidth =
                  task.progress != null ? Math.min(100, Math.max(0, task.progress)) : 0;

                return (
                  <div key={task.id} className="flex border-b border-gray-800/30 hover:bg-gray-800/20">
                    {/* Task name */}
                    <div className="w-44 shrink-0 px-3 py-2 border-r border-gray-800 flex items-center">
                      <span className="text-[10px] text-gray-400 truncate pl-4">
                        {task.name}
                      </span>
                    </div>

                    {/* Bar area */}
                    <div className="flex-1 relative h-9">
                      {isVisible && (
                        <button
                          onClick={() => onTaskClick(task)}
                          className={`absolute top-1.5 h-6 rounded border cursor-pointer transition-all hover:brightness-125 ${barColor} ${barBorder} ${
                            isBlocked ? 'opacity-50 border-dashed' : ''
                          } ${isCompleted ? 'opacity-60' : ''}`}
                          style={{
                            left: `${leftPercent}%`,
                            width: `${widthPercent}%`,
                            minWidth: '18px',
                          }}
                          title={`${task.name} — ${task.stage} (${progressWidth}%)`}
                        >
                          {/* Progress fill */}
                          <div
                            className="absolute inset-0 rounded bg-white/10"
                            style={{ width: `${progressWidth}%` }}
                          />

                          {/* Label */}
                          {widthPercent > 8 && (
                            <span className="relative z-10 text-[9px] text-white font-medium px-1.5 truncate block leading-6">
                              {task.name}
                            </span>
                          )}

                          {/* Blocked indicator */}
                          {isBlocked && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-gray-900 flex items-center justify-center">
                              <span className="text-[7px] text-white font-bold">!</span>
                            </div>
                          )}

                          {/* Completed checkmark */}
                          {isCompleted && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-gray-900 flex items-center justify-center">
                              <span className="text-[7px] text-white">✓</span>
                            </div>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};
