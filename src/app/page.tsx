'use client';
import React, { useEffect, useState } from 'react';
import { DndContext, DragOverlay, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { PlannerHeader } from '@/components/planner/PlannerHeader';
import { WeekStrip } from '@/components/planner/WeekStrip';
import { FrontLane } from '@/components/planner/FrontLane';
import { GanttChart } from '@/components/planner/GanttChart';
import { StaffPanel } from '@/components/planner/StaffPanel';
import { ConstraintsPanel } from '@/components/planner/ConstraintsPanel';
import { TaskDetailModal } from '@/components/planner/TaskDetailModal';
import { TaskCard } from '@/components/planner/TaskCard';
import { PipelineDashboard } from '@/components/planner/PipelineDashboard';
import { usePlannerStore, Task } from '@/store/usePlannerStore';

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export default function PlannerPage() {
  const { 
    tasks, fronts, staff, taskAssignments, staffLeave, constraints, resourcePool, upcomingProjects,
    setTasks, setFronts, setStaff, setConstraints, setTaskAssignments, setStaffLeave, setResourcePool, setUpcomingProjects,
    updateTask 
  } = usePlannerStore();

  const [viewMode, setViewMode] = useState<'board' | 'gantt'>('board');
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    // Start of current week (Monday)
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
    return new Date(d.setDate(diff));
  });
  const [stageFilter, setStageFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showStaffPanel, setShowStaffPanel] = useState(false);
  const [showConstraints, setShowConstraints] = useState(false);
  const [showPipeline, setShowPipeline] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSyncPipeline = async () => {
    await fetch('/api/import/upcoming', { method: 'POST' });
    const res = await fetch('/api/data');
    const data = await res.json();
    setUpcomingProjects(data.upcomingProjects || []);
  };

  const handleCommitPipeline = async (projectId: number) => {
    const res = await fetch('/api/import/upcoming/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId })
    });
    if (res.ok) {
      const dataRes = await fetch('/api/data');
      const data = await dataRes.json();
      setTasks(data.tasks);
      setUpcomingProjects(data.upcomingProjects || []);
      alert('Project committed to schedule!');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch('/api/data');
      const data = await res.json();
      setTasks(data.tasks);
      setFronts(data.fronts);
      setStaff(data.staff);
      setConstraints(data.constraints);
      setTaskAssignments(data.taskAssignments);
      setStaffLeave(data.staffLeave);
      setResourcePool(data.resourcePool);
      setUpcomingProjects(data.upcomingProjects || []);
    };
    fetchData();
  }, [setTasks, setFronts, setStaff, setConstraints, setTaskAssignments, setStaffLeave, setResourcePool, setUpcomingProjects]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveTask(active.data.current?.task);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const task = active.data.current?.task as Task;
    const overData = over.data.current;

    if (overData?.frontId !== undefined) {
      const frontId = overData.frontId;
      updateTask(task.id, { frontId: frontId });
      await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: task.id, frontId: frontId })
      });
    }
  };

  const filteredTasks = tasks.filter(t => {
    if (stageFilter !== 'all' && t.stage !== stageFilter) return false;
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const handlePrevWeek = () => setCurrentWeekStart(prev => addDays(prev, -7));
  const handleNextWeek = () => setCurrentWeekStart(prev => addDays(prev, 7));
  const handleToday = () => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    setCurrentWeekStart(new Date(d.setDate(diff)));
  };

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] overflow-hidden font-sans transition-colors duration-300">
      <PlannerHeader 
        viewMode={viewMode}
        setViewMode={setViewMode}
        stageFilter={stageFilter}
        setStageFilter={setStageFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        onToggleStaff={() => setShowStaffPanel(!showStaffPanel)}
        onToggleConstraints={() => setShowConstraints(!showConstraints)}
        onTogglePipeline={() => setShowPipeline(!showPipeline)}
        tasks={tasks}
      />

      <WeekStrip 
        currentWeekStart={currentWeekStart}
        onPrev={handlePrevWeek}
        onNext={handleNextWeek}
        onToday={handleToday}
      />

      <main className="flex-1 flex overflow-hidden relative">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {viewMode === 'board' ? (
            <div className="flex-1 flex gap-6 p-6 overflow-x-auto custom-scrollbar">
              {fronts.map(front => (
                <FrontLane 
                  key={front.id}
                  front={front}
                  tasks={filteredTasks.filter(t => t.frontId === front.id)}
                  onTaskClick={setSelectedTask}
                />
              ))}
            </div>
          ) : (
            <GanttChart 
              fronts={fronts}
              tasks={filteredTasks}
              currentWeekStart={currentWeekStart}
              onTaskClick={setSelectedTask}
            />
          )}

          <DragOverlay>
            {activeTask ? (
              <TaskCard task={activeTask} overlay />
            ) : null}
          </DragOverlay>
        </DndContext>

        {showStaffPanel && (
          <StaffPanel 
            staff={staff}
            tasks={tasks}
            taskAssignments={taskAssignments}
            staffLeave={staffLeave}
            resourcePool={resourcePool}
            onClose={() => setShowStaffPanel(false)}
          />
        )}

        {showConstraints && (
          <ConstraintsPanel 
            constraints={constraints}
            onClose={() => setShowConstraints(false)}
          />
        )}

        {showPipeline && (
          <PipelineDashboard 
            projects={upcomingProjects.filter(p => p.status !== 'committed')}
            onClose={() => setShowPipeline(false)}
            onRefresh={handleSyncPipeline}
            onCommit={handleCommitPipeline}
          />
        )}
      </main>

      {selectedTask && (
        <TaskDetailModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={(updates: Partial<Task>) => {
            updateTask(selectedTask.id, updates);
            // In a real app, you'd also hit an API here
          }}
        />
      )}
    </div>
  );
}
