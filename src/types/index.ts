export type ViewMode =
  | 'overview'
  | 'today'
  | 'upcoming'
  | 'day'
  | 'week'
  | 'month'
  | 'inbox'
  | 'projects'
  | 'goals'
  | 'notes'
  | 'stats'
  | 'focus'
  | 'archive'
  | 'settings';

export type RecurrenceFrequency = 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'custom';

export interface RecurrenceRule {
  frequency: RecurrenceFrequency;
  interval?: number; // e.g., every 2 weeks
  daysOfWeek?: number[]; // 0=Sun, 1=Mon...
  dayOfMonth?: number;
  endDate?: string;
  exceptions?: string[]; // ISO date strings YYYY-MM-DD to skip
}

export type ReminderType = 'none' | 'at_due' | '5m' | '15m' | '30m' | '1h' | '1d';

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm format
  duration?: number; // in minutes
  actualTime?: number; // in minutes
  priorityId: string;
  categoryId: string;
  tags: string[];
  completed: boolean;
  completedAt?: string;
  recurrence?: RecurrenceRule;
  reminder?: ReminderType;
  subtasks: Subtask[];
  notes?: string;
  projectId?: string;
  isTopPriority?: boolean;
  isOnboarding?: boolean;
  archived?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Priority {
  id: string;
  name: string;
  color: string;
  level: number; // 1 (lowest) to 4 (highest)
  icon?: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string;
  deadline?: string;
  notes?: string;
  createdAt: string;
}

export interface Goal {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly';
  targetCount: number;
  currentCount: number;
  unit: string;
  periodStart: string;
  completed?: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId?: string;
  projectId?: string;
  taskId?: string;
  updatedAt: string;
  createdAt: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  description?: string;
  tasks: Partial<Task>[];
}

export interface UserSettings {
  theme: 'light' | 'dark' | 'amoled' | 'system';
  accentColor: string;
  startOfWeek: 0 | 1; // 0 = Sunday, 1 = Monday
  dateFormat: string;
  timeFormat: '12h' | '24h';
  defaultDuration: number;
  defaultPriorityId: string;
  notificationsEnabled: boolean;
}

export interface TaskFilterOptions {
  searchQuery?: string;
  priorityId?: string;
  categoryId?: string;
  projectId?: string;
  tag?: string;
  completed?: boolean;
  overdueOnly?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface ToastMessage {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  undoAction?: () => void;
}
