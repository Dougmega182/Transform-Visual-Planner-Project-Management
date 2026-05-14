import { create } from 'zustand';

export interface TaskDependency {
  id: string;
  name: string;
  type: 'FS' | 'FF' | 'SS' | 'SF';
  status: 'completed' | 'in-progress' | 'not-started';
}

export interface TaskComment {
  id: number;
  author: string;
  text: string;
  timestamp: string;
}

export interface Task {
  id: number;
  frontId: number | null;
  name: string;
  description: string;
  zone: string;
  status: 'not-started' | 'in-progress' | 'completed' | 'delayed' | 'blocked';
  priority: 'critical' | 'high' | 'medium' | 'low';
  progress: number;
  startDate: string; // Map plannedStart to startDate
  duration: number;  // Added duration
  endDate: string;   // Map plannedEnd to endDate
  actualStart?: string;
  actualEnd?: string;
  assignee: string;
  trade: string;
  crewCount: number;
  subcontractor?: string;
  hoursPerDay?: number;
  equipmentNeeds?: string;
  weatherSensitivity?: boolean;
  costRate?: number;
  dependencies: TaskDependency[];
  comments: TaskComment[];
  constraints: string[];
  stage: 'concept' | 'design' | 'tender' | 'construction' | 'handover';
  rag: 'green' | 'amber' | 'red';
}

export interface Front {
  id: number;
  name: string;
  order: number;
}

export interface Staff {
  id: number;
  name: string;
  role: string;
  team: string;
  trade?: string;
  type?: 'in-house' | 'subcontractor';
  dailyCost?: number;
  avatar?: string;
}

export interface TaskAssignment {
  id: number;
  task_id: number;
  staff_id: number;
  role: string;
}

export interface StaffLeave {
  id: number;
  staff_id: number;
  date: string;
  type: string;
}

export interface Constraint {
  id: number;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  front: string;
  raisedDate: string;
  owner: string;
}

interface PlannerState {
  tasks: Task[];
  fronts: Front[];
  staff: Staff[];
  taskAssignments: TaskAssignment[];
  staffLeave: StaffLeave[];
  constraints: Constraint[];
  dependencies: any[];
  resourcePool: any[];
  upcomingProjects: any[];
  
  setTasks: (tasks: Task[]) => void;
  setFronts: (fronts: Front[]) => void;
  setStaff: (staff: Staff[]) => void;
  setConstraints: (constraints: Constraint[]) => void;
  setTaskAssignments: (ta: TaskAssignment[]) => void;
  setStaffLeave: (sl: StaffLeave[]) => void;
  setDependencies: (deps: any[]) => void;
  setResourcePool: (pool: any[]) => void;
  setUpcomingProjects: (projects: any[]) => void;
  
  updateTask: (taskId: number, updates: Partial<Task>) => void;
}

export const usePlannerStore = create<PlannerState>((set) => ({
  tasks: [],
  fronts: [],
  staff: [],
  taskAssignments: [],
  staffLeave: [],
  constraints: [],
  dependencies: [],
  resourcePool: [],
  upcomingProjects: [],

  setTasks: (tasks) => set({ tasks }),
  setFronts: (fronts) => set({ fronts }),
  setStaff: (staff) => set({ staff }),
  setConstraints: (constraints) => set({ constraints }),
  setTaskAssignments: (taskAssignments) => set({ taskAssignments }),
  setStaffLeave: (staffLeave) => set({ staffLeave }),
  setDependencies: (dependencies) => set({ dependencies }),
  setResourcePool: (resourcePool) => set({ resourcePool }),
  setUpcomingProjects: (upcomingProjects) => set({ upcomingProjects }),

  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
  })),
}));
