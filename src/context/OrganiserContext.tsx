import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type {
  Task,
  Priority,
  Category,
  Project,
  Goal,
  Note,
  TaskTemplate,
  UserSettings,
  ViewMode,
  ToastMessage,
} from '../types';
import {
  initializeDatabaseWithSeedData,
  saveTaskToDB,
  deleteTaskFromDB,
  savePriorityToDB,
  deletePriorityFromDB,
  saveCategoryToDB,
  deleteCategoryFromDB,
  saveProjectToDB,
  deleteProjectFromDB,
  saveGoalToDB,
  deleteGoalFromDB,
  saveNoteToDB,
  deleteNoteFromDB,
  saveTemplateToDB,
  saveSettingsToDB,
  clearAllDataFromDB,
} from '../services/db';
import { getNextRecurrenceDate, parseNaturalLanguageTask } from '../utils/taskUtils';
import { format } from 'date-fns';

interface OrganiserContextType {
  currentView: ViewMode;
  setCurrentView: (view: ViewMode) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string | null) => void;
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
  activeFocusTaskId: string | null;
  setActiveFocusTaskId: (id: string | null) => void;

  tasks: Task[];
  priorities: Priority[];
  categories: Category[];
  projects: Project[];
  goals: Goal[];
  notes: Note[];
  templates: TaskTemplate[];
  settings: UserSettings;
  loading: boolean;
  toasts: ToastMessage[];

  addTask: (taskData: Partial<Task>) => Promise<Task>;
  quickAddTask: (input: string) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleCompleteTask: (id: string) => Promise<void>;
  rescheduleTask: (id: string, newDate: string) => Promise<void>;
  toggleTopPriority: (id: string) => Promise<void>;
  addSubtask: (taskId: string, title: string) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  applyTemplate: (templateId: string, targetDate?: string) => Promise<void>;
  archiveTask: (id: string) => Promise<void>;

  updatePriority: (priority: Priority) => Promise<void>;
  addPriority: (priority: Priority) => Promise<void>;
  deletePriority: (id: string) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  addCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addGoal: (goal: Partial<Goal>) => Promise<Goal>;
  updateGoal: (goal: Goal) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  addNote: (note: Partial<Note>) => Promise<Note>;
  updateNote: (note: Note) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  addTemplate: (template: TaskTemplate) => Promise<void>;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<void>;

  addToast: (message: string, type?: ToastMessage['type'], undoAction?: () => void) => void;
  removeToast: (id: string) => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => Promise<boolean>;
  resetAllData: () => Promise<void>;
  dismissOnboarding: () => Promise<void>;
}

const OrganiserContext = createContext<OrganiserContextType | undefined>(undefined);

export const OrganiserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('overview');
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [activeFocusTaskId, setActiveFocusTaskId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'dark',
    accentColor: '#6366f1',
    startOfWeek: 1,
    dateFormat: 'MMM d, yyyy',
    timeFormat: '12h',
    defaultDuration: 30,
    defaultPriorityId: 'p-med',
    notificationsEnabled: false,
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    async function init() {
      try {
        const data = await initializeDatabaseWithSeedData();
        setTasks(data.tasks);
        setPriorities(data.priorities);
        setCategories(data.categories);
        setProjects(data.projects);
        setGoals(data.goals);
        setNotes(data.notes);
        setTemplates(data.templates);
        setSettings(data.settings);
      } catch (err) {
        console.error('Failed to initialize IndexedDB:', err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else if (settings.theme === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        root.classList.add('dark');
        root.classList.remove('light');
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
      }
    }
  }, [settings.theme]);

  const addToast = (message: string, type: ToastMessage['type'] = 'info', undoAction?: () => void) => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    const newToast: ToastMessage = { id, message, type, undoAction };
    setToasts((prev) => [...prev.slice(-4), newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addTask = async (taskData: Partial<Task>): Promise<Task> => {
    const nowIso = new Date().toISOString();
    const newTask: Task = {
      id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      title: taskData.title || 'Untitled Task',
      description: taskData.description || '',
      dueDate: taskData.dueDate || format(new Date(), 'yyyy-MM-dd'),
      dueTime: taskData.dueTime || undefined,
      duration: taskData.duration || settings.defaultDuration,
      priorityId: taskData.priorityId || settings.defaultPriorityId || priorities[0]?.id || 'p-med',
      categoryId: taskData.categoryId || categories[0]?.id || 'c-work',
      tags: taskData.tags || [],
      completed: taskData.completed || false,
      recurrence: taskData.recurrence,
      reminder: taskData.reminder || 'none',
      subtasks: taskData.subtasks || [],
      notes: taskData.notes || '',
      projectId: taskData.projectId,
      isTopPriority: taskData.isTopPriority || false,
      archived: false,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    setTasks((prev) => [newTask, ...prev]);
    await saveTaskToDB(newTask);
    addToast('Task created', 'success');
    return newTask;
  };

  const quickAddTask = async (input: string): Promise<Task> => {
    const parsed = parseNaturalLanguageTask(input, priorities, settings.defaultPriorityId);
    return await addTask({
      title: parsed.title,
      dueDate: parsed.dueDate,
      dueTime: parsed.dueTime,
      priorityId: parsed.priorityId,
    });
  };

  const updateTask = async (task: Task) => {
    const updated = { ...task, updatedAt: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    await saveTaskToDB(updated);
  };

  const deleteTask = async (id: string) => {
    const taskToDelete = tasks.find((t) => t.id === id);
    if (!taskToDelete) return;

    setTasks((prev) => prev.filter((t) => t.id !== id));
    await deleteTaskFromDB(id);

    addToast(`Deleted "${taskToDelete.title.substring(0, 20)}..."`, 'info', async () => {
      setTasks((prev) => [taskToDelete, ...prev]);
      await saveTaskToDB(taskToDelete);
    });
  };

  const toggleCompleteTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newCompleted = !task.completed;
    const nowIso = new Date().toISOString();
    const updatedTask: Task = {
      ...task,
      completed: newCompleted,
      completedAt: newCompleted ? nowIso : undefined,
      updatedAt: nowIso,
    };

    setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)));
    await saveTaskToDB(updatedTask);

    if (newCompleted && task.recurrence) {
      const nextDate = getNextRecurrenceDate(task.dueDate, task.recurrence);
      if (nextDate) {
        const recurringInstance: Task = {
          ...task,
          id: 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          dueDate: nextDate,
          completed: false,
          completedAt: undefined,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        setTasks((prev) => [recurringInstance, ...prev]);
        await saveTaskToDB(recurringInstance);
        addToast(`Next recurring instance scheduled for ${nextDate}`, 'info');
      }
    } else {
      addToast(newCompleted ? 'Task marked complete' : 'Task uncompleted', 'success', async () => {
        setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
        await saveTaskToDB(task);
      });
    }
  };

  const rescheduleTask = async (id: string, newDate: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const oldDate = task.dueDate;
    const updated: Task = { ...task, dueDate: newDate, updatedAt: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    await saveTaskToDB(updated);

    addToast(`Rescheduled to ${newDate}`, 'info', async () => {
      const reverted: Task = { ...task, dueDate: oldDate };
      setTasks((prev) => prev.map((t) => (t.id === id ? reverted : t)));
      await saveTaskToDB(reverted);
    });
  };

  const toggleTopPriority = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updated: Task = { ...task, isTopPriority: !task.isTopPriority, updatedAt: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    await saveTaskToDB(updated);
  };

  const addSubtask = async (taskId: string, title: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const newSubtask = {
      id: 'sub-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      title: title.trim(),
      completed: false,
    };
    const updated: Task = {
      ...task,
      subtasks: [...task.subtasks, newSubtask],
      updatedAt: new Date().toISOString(),
    };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    await saveTaskToDB(updated);
  };

  const toggleSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    const updated: Task = { ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    await saveTaskToDB(updated);
  };

  const deleteSubtask = async (taskId: string, subtaskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const updatedSubtasks = task.subtasks.filter((st) => st.id !== subtaskId);
    const updated: Task = { ...task, subtasks: updatedSubtasks, updatedAt: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    await saveTaskToDB(updated);
  };

  const applyTemplate = async (templateId: string, targetDate?: string) => {
    const tpl = templates.find((t) => t.id === templateId);
    if (!tpl) return;

    const dateToUse = targetDate || selectedDate;
    for (const item of tpl.tasks) {
      await addTask({
        ...item,
        dueDate: dateToUse,
      });
    }
    addToast(`Applied template "${tpl.name}"`, 'success');
  };

  const archiveTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const updated: Task = { ...task, archived: true, updatedAt: new Date().toISOString() };
    setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    await saveTaskToDB(updated);
    addToast('Task moved to archive', 'info');
  };

  const updatePriority = async (priority: Priority) => {
    setPriorities((prev) => prev.map((p) => (p.id === priority.id ? priority : p)));
    await savePriorityToDB(priority);
  };

  const addPriority = async (priority: Priority) => {
    setPriorities((prev) => [...prev, priority]);
    await savePriorityToDB(priority);
  };

  const deletePriority = async (id: string) => {
    if (priorities.length <= 1) {
      addToast('Cannot delete the only priority level', 'error');
      return;
    }
    const remaining = priorities.filter((p) => p.id !== id);
    const fallbackPriority = remaining[0];
    setPriorities(remaining);
    await deletePriorityFromDB(id);

    // Safe fallback for tasks referencing deleted priority
    const affectedTasks = tasks.filter((t) => t.priorityId === id);
    for (const t of affectedTasks) {
      const updated = { ...t, priorityId: fallbackPriority.id, updatedAt: new Date().toISOString() };
      setTasks((prev) => prev.map((item) => (item.id === t.id ? updated : item)));
      await saveTaskToDB(updated);
    }
  };

  const updateCategory = async (category: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === category.id ? category : c)));
    await saveCategoryToDB(category);
  };

  const addCategory = async (category: Category) => {
    setCategories((prev) => [...prev, category]);
    await saveCategoryToDB(category);
  };

  const deleteCategory = async (id: string) => {
    const remaining = categories.filter((c) => c.id !== id);
    const fallbackCategory = remaining[0] || { id: 'c-general', name: 'General', color: '#64748b' };
    setCategories(remaining);
    await deleteCategoryFromDB(id);

    // Safe fallback for tasks referencing deleted category
    const affectedTasks = tasks.filter((t) => t.categoryId === id);
    for (const t of affectedTasks) {
      const updated = { ...t, categoryId: fallbackCategory.id, updatedAt: new Date().toISOString() };
      setTasks((prev) => prev.map((item) => (item.id === t.id ? updated : item)));
      await saveTaskToDB(updated);
    }
  };

  const addProject = async (project: Partial<Project>): Promise<Project> => {
    const newProject: Project = {
      id: 'proj-' + Date.now(),
      name: project.name || 'New Project',
      description: project.description || '',
      color: project.color || '#6366f1',
      deadline: project.deadline,
      notes: project.notes || '',
      createdAt: format(new Date(), 'yyyy-MM-dd'),
    };
    setProjects((prev) => [...prev, newProject]);
    await saveProjectToDB(newProject);
    addToast('Project created', 'success');
    return newProject;
  };

  const updateProject = async (project: Project) => {
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    await saveProjectToDB(project);
  };

  const deleteProject = async (id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    await deleteProjectFromDB(id);

    // Unlink tasks
    const affectedTasks = tasks.filter((t) => t.projectId === id);
    for (const t of affectedTasks) {
      const updated = { ...t, projectId: undefined, updatedAt: new Date().toISOString() };
      setTasks((prev) => prev.map((item) => (item.id === t.id ? updated : item)));
      await saveTaskToDB(updated);
    }

    // Unlink notes
    const affectedNotes = notes.filter((n) => n.projectId === id);
    for (const n of affectedNotes) {
      const updated = { ...n, projectId: undefined, updatedAt: format(new Date(), 'yyyy-MM-dd') };
      setNotes((prev) => prev.map((item) => (item.id === n.id ? updated : item)));
      await saveNoteToDB(updated);
    }
  };

  const addGoal = async (goal: Partial<Goal>): Promise<Goal> => {
    const newGoal: Goal = {
      id: 'goal-' + Date.now(),
      title: goal.title || 'New Goal',
      type: goal.type || 'weekly',
      targetCount: goal.targetCount || 1,
      currentCount: goal.currentCount || 0,
      unit: goal.unit || 'tasks',
      periodStart: format(new Date(), 'yyyy-MM-dd'),
      completed: false,
    };
    setGoals((prev) => [...prev, newGoal]);
    await saveGoalToDB(newGoal);
    addToast('Goal added', 'success');
    return newGoal;
  };

  const updateGoal = async (goal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === goal.id ? goal : g)));
    await saveGoalToDB(goal);
  };

  const deleteGoal = async (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    await deleteGoalFromDB(id);
  };

  const addNote = async (note: Partial<Note>): Promise<Note> => {
    const nowStr = format(new Date(), 'yyyy-MM-dd');
    const newNote: Note = {
      id: 'note-' + Date.now(),
      title: note.title || 'Untitled Note',
      content: note.content || '',
      categoryId: note.categoryId,
      projectId: note.projectId,
      taskId: note.taskId,
      createdAt: nowStr,
      updatedAt: nowStr,
    };
    setNotes((prev) => [newNote, ...prev]);
    await saveNoteToDB(newNote);
    addToast('Note created', 'success');
    return newNote;
  };

  const updateNote = async (note: Note) => {
    const updated = { ...note, updatedAt: format(new Date(), 'yyyy-MM-dd') };
    setNotes((prev) => prev.map((n) => (n.id === note.id ? updated : n)));
    await saveNoteToDB(updated);
  };

  const deleteNote = async (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await deleteNoteFromDB(id);
  };

  const addTemplate = async (template: TaskTemplate) => {
    setTemplates((prev) => [...prev, template]);
    await saveTemplateToDB(template);
    addToast('Template saved', 'success');
  };

  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    const merged = { ...settings, ...newSettings };
    setSettings(merged);
    await saveSettingsToDB(merged);
    addToast('Settings saved', 'success');
  };

  const exportDataJSON = (): string => {
    const exportObject = {
      tasks,
      priorities,
      categories,
      projects,
      goals,
      notes,
      templates,
      settings,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(exportObject, null, 2);
  };

  const importDataJSON = async (jsonStr: string): Promise<boolean> => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed || typeof parsed !== 'object') {
        addToast('Invalid JSON payload structure', 'error');
        return false;
      }
      if (!Array.isArray(parsed.tasks)) {
        addToast('JSON import missing "tasks" array', 'error');
        return false;
      }

      await clearAllDataFromDB();
      const data = await initializeDatabaseWithSeedData();
      setTasks(parsed.tasks || data.tasks);
      setPriorities(Array.isArray(parsed.priorities) && parsed.priorities.length ? parsed.priorities : data.priorities);
      setCategories(Array.isArray(parsed.categories) && parsed.categories.length ? parsed.categories : data.categories);
      setProjects(Array.isArray(parsed.projects) ? parsed.projects : data.projects);
      setGoals(Array.isArray(parsed.goals) ? parsed.goals : data.goals);
      setNotes(Array.isArray(parsed.notes) ? parsed.notes : data.notes);
      setTemplates(Array.isArray(parsed.templates) ? parsed.templates : data.templates);
      if (parsed.settings && typeof parsed.settings === 'object') setSettings(parsed.settings);
      addToast('Data imported successfully!', 'success');
      return true;
    } catch (e) {
      console.error(e);
      addToast('Malformed JSON file', 'error');
      return false;
    }
  };

  const resetAllData = async () => {
    await clearAllDataFromDB();
    const data = await initializeDatabaseWithSeedData();
    setTasks(data.tasks);
    setPriorities(data.priorities);
    setCategories(data.categories);
    setProjects(data.projects);
    setGoals(data.goals);
    setNotes(data.notes);
    setTemplates(data.templates);
    setSettings(data.settings);
    addToast('Database reset to defaults', 'info');
  };

  const dismissOnboarding = async () => {
    // 1. Delete onboarding tasks
    const onboardingTaskIds = tasks.filter((t) => t.isOnboarding || t.categoryId === 'c-onboarding').map((t) => t.id);
    for (const id of onboardingTaskIds) {
      await deleteTaskFromDB(id);
    }
    setTasks((prev) => prev.filter((t) => !onboardingTaskIds.includes(t.id)));

    // 2. Delete onboarding project
    if (projects.some((p) => p.id === 'proj-onboarding')) {
      await deleteProjectFromDB('proj-onboarding');
      setProjects((prev) => prev.filter((p) => p.id !== 'proj-onboarding'));
    }

    // 3. Delete onboarding goal
    if (goals.some((g) => g.id === 'g-onboarding')) {
      await deleteGoalFromDB('g-onboarding');
      setGoals((prev) => prev.filter((g) => g.id !== 'g-onboarding'));
    }

    // 4. Delete onboarding category if unused by non-onboarding tasks
    const remainingTasksUsingCat = tasks.filter((t) => !onboardingTaskIds.includes(t.id) && t.categoryId === 'c-onboarding');
    if (remainingTasksUsingCat.length === 0) {
      await deleteCategoryFromDB('c-onboarding');
      setCategories((prev) => prev.filter((c) => c.id !== 'c-onboarding'));
    }

    // 5. Delete onboarding note
    if (notes.some((n) => n.id === 'n-onboarding')) {
      await deleteNoteFromDB('n-onboarding');
      setNotes((prev) => prev.filter((n) => n.id !== 'n-onboarding'));
    }

    addToast('Getting Started tasks cleared. Enjoy Daymark!', 'success');
  };

  return (
    <OrganiserContext.Provider
      value={{
        currentView,
        setCurrentView,
        selectedDate,
        setSelectedDate,
        searchQuery,
        setSearchQuery,
        selectedCategoryId,
        setSelectedCategoryId,
        selectedProjectId,
        setSelectedProjectId,
        selectedTag,
        setSelectedTag,
        activeFocusTaskId,
        setActiveFocusTaskId,
        tasks,
        priorities,
        categories,
        projects,
        goals,
        notes,
        templates,
        settings,
        loading,
        toasts,
        addTask,
        quickAddTask,
        updateTask,
        deleteTask,
        toggleCompleteTask,
        rescheduleTask,
        toggleTopPriority,
        addSubtask,
        toggleSubtask,
        deleteSubtask,
        applyTemplate,
        archiveTask,
        updatePriority,
        addPriority,
        deletePriority,
        updateCategory,
        addCategory,
        deleteCategory,
        addProject,
        updateProject,
        deleteProject,
        addGoal,
        updateGoal,
        deleteGoal,
        addNote,
        updateNote,
        deleteNote,
        addTemplate,
        updateSettings,
        addToast,
        removeToast,
        exportDataJSON,
        importDataJSON,
        resetAllData,
        dismissOnboarding,
      }}
    >
      {children}
    </OrganiserContext.Provider>
  );
};

export const useOrganiser = () => {
  const context = useContext(OrganiserContext);
  if (!context) {
    throw new Error('useOrganiser must be used within an OrganiserProvider');
  }
  return context;
};
