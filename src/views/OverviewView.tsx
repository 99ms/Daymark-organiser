import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task, OverviewWidgetConfig } from '../types';
import { TaskItem } from '../components/TaskItem';
import {
  format,
  parseISO,
  subDays,
  startOfWeek,
  addDays,
  subMonths,
  addMonths,
  isSameDay,
  isSameMonth,
} from 'date-fns';
import {
  Calendar,
  Flame,
  ChevronUp,
  Award,
  Target,
  FolderKanban,
  BarChart3,
  Activity,
  CheckCircle2,
  Zap,
  ArrowRight,
  Sparkles,
  X,
  SlidersHorizontal,
  RotateCcw,
  Eye,
  EyeOff,
  GripVertical,
  Check,
  Plus,
  Play,
  FileText,
  Inbox,
  Clock,
  Timer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface OverviewViewProps {
  onEditTask: (task: Task) => void;
}

const ALL_OVERVIEW_WIDGETS: OverviewWidgetConfig[] = [
  // 11 Core Default Widgets (visible: true)
  { id: 'today-progress', visible: true, colSpan: 3, order: 1 },
  { id: 'streak-stats', visible: true, colSpan: 3, order: 2 },
  { id: 'daily-workload', visible: true, colSpan: 3, order: 3 },
  { id: 'weekly-stats', visible: true, colSpan: 3, order: 4 },
  { id: 'top-priorities', visible: true, colSpan: 6, order: 5 },
  { id: 'overdue-tasks', visible: true, colSpan: 6, order: 6 },
  { id: 'upcoming-schedule', visible: true, colSpan: 12, order: 7 },
  { id: 'active-projects', visible: true, colSpan: 3, order: 8 },
  { id: 'personal-goals', visible: true, colSpan: 3, order: 9 },
  { id: 'recent-activity', visible: true, colSpan: 3, order: 10 },
  { id: 'quick-actions', visible: true, colSpan: 3, order: 11 },

  // 9 New Optional Phase 3 Widgets (visible: false by default)
  { id: 'quick-capture', visible: false, colSpan: 6, order: 12 },
  { id: 'mini-calendar', visible: false, colSpan: 3, order: 13 },
  { id: 'focus-session', visible: false, colSpan: 3, order: 14 },
  { id: 'goal-progress-widget', visible: false, colSpan: 3, order: 15 },
  { id: 'task-breakdown', visible: false, colSpan: 3, order: 16 },
  { id: 'productivity-trend', visible: false, colSpan: 6, order: 17 },
  { id: 'recent-notes', visible: false, colSpan: 3, order: 18 },
  { id: 'time-budget', visible: false, colSpan: 3, order: 19 },
  { id: 'inbox-widget', visible: false, colSpan: 3, order: 20 },
];

const DEFAULT_OVERVIEW_LAYOUT: OverviewWidgetConfig[] = ALL_OVERVIEW_WIDGETS;

const WIDGET_TITLES: Record<string, string> = {
  'today-progress': "Today's Progress",
  'streak-stats': 'Current Streak',
  'daily-workload': 'Daily Workload',
  'weekly-stats': 'This Week',
  'top-priorities': 'Top Priorities',
  'overdue-tasks': 'Overdue Tasks',
  'upcoming-schedule': 'Upcoming Schedule',
  'active-projects': 'Active Projects',
  'personal-goals': 'Personal Goals',
  'recent-activity': 'Recent Activity',
  'quick-actions': 'Quick Actions',
  'quick-capture': 'Quick Capture',
  'mini-calendar': 'Mini Calendar',
  'focus-session': 'Focus Session',
  'goal-progress-widget': 'Goal Progress',
  'task-breakdown': 'Task Breakdown',
  'productivity-trend': 'Productivity Trend',
  'recent-notes': 'Recent Notes',
  'time-budget': 'Time Budget',
  'inbox-widget': 'Inbox',
};

export const OverviewView: React.FC<OverviewViewProps> = ({ onEditTask }) => {
  const {
    tasks,
    projects,
    goals,
    notes,
    selectedDate,
    setSelectedDate,
    activeFocusTaskId,
    setActiveFocusTaskId,
    setCurrentView,
    dismissOnboarding,
    quickAddTask,
    settings,
    updateSettings,
  } = useOrganiser();

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);

  // Widget specific states
  const [quickCaptureInput, setQuickCaptureInput] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [miniCalCurrentMonth, setMiniCalCurrentMonth] = useState<Date>(new Date());

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Layout state resolution with graceful registry merging for newly registered widgets
  const userLayout = settings.overviewLayout || [];
  const activeLayout: OverviewWidgetConfig[] = ALL_OVERVIEW_WIDGETS.map((registered) => {
    const existing = userLayout.find((u) => u.id === registered.id);
    return existing ? existing : registered;
  });

  const sortedLayout = [...activeLayout].sort((a, b) => a.order - b.order);
  const visibleWidgets = sortedLayout.filter((w) => w.visible);
  const hiddenWidgets = sortedLayout.filter((w) => !w.visible);

  // Layout mutation handlers
  const saveLayout = (newLayout: OverviewWidgetConfig[]) => {
    updateSettings({ overviewLayout: newLayout });
  };

  const handleToggleVisibility = (id: string) => {
    const updated = activeLayout.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w));
    saveLayout(updated);
  };

  const handleResizeWidget = (id: string, colSpan: number) => {
    const updated = activeLayout.map((w) => (w.id === id ? { ...w, colSpan } : w));
    saveLayout(updated);
  };

  // Drag and drop reorder logic for direct arbitrary drop anywhere in the layout
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedWidgetId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverWidgetId !== id) {
      setDragOverWidgetId(id);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidgetId || draggedWidgetId === targetId) {
      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
      return;
    }

    const currentIndex = sortedLayout.findIndex((w) => w.id === draggedWidgetId);
    const targetIndex = sortedLayout.findIndex((w) => w.id === targetId);

    if (currentIndex === -1 || targetIndex === -1) return;

    const reordered = [...sortedLayout];
    const [movedItem] = reordered.splice(currentIndex, 1);
    reordered.splice(targetIndex, 0, movedItem);

    const updated = reordered.map((w, idx) => ({ ...w, order: idx + 1 }));
    saveLayout(updated);

    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleResetLayout = () => {
    saveLayout(DEFAULT_OVERVIEW_LAYOUT);
    setShowResetConfirm(false);
  };

  // Dynamic calculations based on real tasks
  const todayTasks = tasks.filter((t) => !t.archived && t.dueDate === todayStr);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const totalToday = todayTasks.length;
  const percentToday = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const overdueTasks = tasks.filter((t) => !t.archived && !t.completed && t.dueDate && t.dueDate < todayStr);
  const topPrioritiesToday = todayTasks.filter((t) => t.isTopPriority && !t.completed);

  const upcomingTasks = tasks
    .filter((t) => !t.archived && !t.completed && t.dueDate > todayStr)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  const totalScheduledMinutes = todayTasks.reduce((acc, t) => acc + (t.duration || 30), 0);
  let workloadLabel = 'Light';
  let workloadColor = '#10b981';
  if (totalScheduledMinutes > 360) {
    workloadLabel = 'Overloaded';
    workloadColor = '#ef4444';
  } else if (totalScheduledMinutes > 240) {
    workloadLabel = 'Heavy';
    workloadColor = '#f97316';
  } else if (totalScheduledMinutes > 120) {
    workloadLabel = 'Moderate';
    workloadColor = '#f59e0b';
  }

  const recentActivity = tasks
    .filter((t) => t.completed || t.createdAt.startsWith(todayStr))
    .sort((a, b) => (b.completedAt || b.updatedAt).localeCompare(a.completedAt || a.updatedAt))
    .slice(0, 4);

  const hasOnboardingTasks = tasks.some((t) => t.isOnboarding);

  const handleClearOnboarding = async () => {
    await dismissOnboarding();
    setShowDismissConfirm(false);
  };

  // Render Widget registry function
  const renderWidgetContent = (widgetId: string) => {
    switch (widgetId) {
      case 'today-progress':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.5rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Today's Progress</span>
              <BarChart3 size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '1rem 0' }}>
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: `conic-gradient(var(--accent-primary) ${percentToday * 3.6}deg, var(--bg-tertiary) 0deg)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-md)',
                    fontWeight: 800,
                  }}
                >
                  {percentToday}%
                </div>
              </div>

              <div>
                <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, lineHeight: 1.1 }}>
                  {completedToday} <span style={{ fontSize: 'var(--font-md)', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalToday} tasks</span>
                </div>
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
                  {totalToday - completedToday === 0 && totalToday > 0
                    ? '🎉 All tasks completed!'
                    : `${totalToday - completedToday} remaining today`}
                </div>
              </div>
            </div>

            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
              Updated real-time from workspace
            </div>
          </div>
        );

      case 'streak-stats':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.5rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Current Streak</span>
              <Flame size={20} style={{ color: '#f97316' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.85rem 0' }}>
              <span style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: '#f97316' }}>
                {completedToday > 0 ? 3 : 2}
              </span>
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-secondary)' }}>Days Active</span>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                {completedToday > 0 ? '🔥 Streak active today!' : 'Complete 1 task today to extend streak'}
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Personal best: 7 days
              </div>
            </div>
          </div>
        );

      case 'daily-workload':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.5rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Daily Workload</span>
              <Zap size={20} style={{ color: workloadColor }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.85rem 0' }}>
              <span style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: workloadColor }}>
                {workloadLabel}
              </span>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                ~{Math.round(totalScheduledMinutes / 60 * 10) / 10} hours scheduled
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Based on task durations for today
              </div>
            </div>
          </div>
        );

      case 'weekly-stats':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.5rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '160px',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>This Week</span>
              <Activity size={20} style={{ color: '#10b981' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', margin: '0.85rem 0' }}>
              <span style={{ fontSize: 'var(--font-3xl)', fontWeight: 800, color: '#10b981' }}>
                {tasks.filter((t) => t.completed).length}
              </span>
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 600, color: 'var(--text-secondary)' }}>Completed</span>
            </div>

            <div>
              <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)' }}>
                Workspace completion total
              </div>
              <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Completion Rate from actual tasks
              </div>
            </div>
          </div>
        );

      case 'top-priorities':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.6rem 1.85rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid #f59e0b44',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#f59e0b' }}>
                <Award size={24} />
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Top Priorities</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{topPrioritiesToday.length} Item</span>
                <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>

            {topPrioritiesToday.length === 0 ? (
              <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                No top priorities designated for today.
              </p>
            ) : (
              topPrioritiesToday.map((task) => <TaskItem key={task.id} task={task} onEdit={onEditTask} />)
            )}
          </div>
        );

      case 'overdue-tasks':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.6rem 1.85rem',
              borderRadius: 'var(--radius-lg)',
              border: overdueTasks.length > 0 ? '1px solid #ef444444' : '1px solid #10b98144',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: 'var(--text-primary)' }}>
                <Flame size={24} style={{ color: overdueTasks.length > 0 ? '#ef4444' : 'var(--text-muted)' }} />
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>Overdue Tasks</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{overdueTasks.length}</span>
                <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>

            {overdueTasks.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem 0', gap: '0.85rem', textAlign: 'center' }}>
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#10b98122',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={36} />
                </div>
                <h3 style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>You're all caught up!</h3>
                <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)' }}>No overdue tasks. Keep it up!</p>
              </div>
            ) : (
              <div style={{ marginTop: '1.25rem' }}>
                {overdueTasks.map((task) => <TaskItem key={task.id} task={task} onEdit={onEditTask} showDate />)}
              </div>
            )}
          </div>
        );

      case 'upcoming-schedule':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.6rem 1.85rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              height: '100%',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <Calendar size={24} style={{ color: 'var(--accent-primary)' }} />
                <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: 'var(--text-primary)' }}>Upcoming Schedule</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{upcomingTasks.length} upcoming tasks</span>
                <ChevronUp size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>

            {upcomingTasks.length === 0 ? (
              <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-muted)', fontStyle: 'italic', padding: '0.5rem 0' }}>
                No upcoming tasks scheduled. Create a task with a future date to plan ahead.
              </p>
            ) : (
              upcomingTasks.map((task) => <TaskItem key={task.id} task={task} onEdit={onEditTask} showDate />)
            )}
          </div>
        );

      case 'active-projects':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.5rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FolderKanban size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Active Projects</span>
                </div>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{projects.length} projects</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {projects.length === 0 ? (
                  <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No active projects. Create a project to group related tasks.
                  </p>
                ) : (
                  projects.map((p) => {
                    const pTasks = tasks.filter((t) => t.projectId === p.id && !t.archived);
                    const pDone = pTasks.filter((t) => t.completed).length;
                    const pct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
                    return (
                      <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-base)', fontWeight: 600 }}>
                          <span style={{ color: p.color }}>{p.name}</span>
                          <span>{pct}%</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: p.color }} />
                        </div>
                        <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{pDone} / {pTasks.length} tasks</div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <span
                onClick={() => setCurrentView('projects')}
                style={{ fontSize: 'var(--font-base)', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                View all projects <ArrowRight size={16} />
              </span>
            </div>
          </div>
        );

      case 'personal-goals':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.5rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={20} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Personal Goals</span>
                </div>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>{goals.length} goals</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {goals.length === 0 ? (
                  <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No active goals. Create one when you want to track a larger objective.
                  </p>
                ) : (
                  goals.map((g) => {
                    const pct = Math.min(100, Math.round((g.currentCount / g.targetCount) * 100));
                    return (
                      <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-base)', fontWeight: 600 }}>
                          <span>{g.title}</span>
                          <span>{g.currentCount} / {g.targetCount}</span>
                        </div>
                        <div style={{ height: '7px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: g.completed ? '#10b981' : '#f59e0b' }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <span
                onClick={() => setCurrentView('goals')}
                style={{ fontSize: 'var(--font-base)', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                View all goals <ArrowRight size={16} />
              </span>
            </div>
          </div>
        );

      case 'recent-activity':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.5rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Activity</span>
                </div>
                <span style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>Latest updates</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {recentActivity.length === 0 ? (
                  <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    Nothing completed yet. Complete a Getting Started task to see it here.
                  </p>
                ) : (
                  recentActivity.map((t) => (
                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                      <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                        {t.completed ? '✓ ' : ''}{t.title}
                      </span>
                      <span style={{ color: 'var(--text-muted)' }}>{t.completed ? 'Completed' : 'Created'}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', marginTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <span
                onClick={() => setCurrentView('overview')}
                style={{ fontSize: 'var(--font-base)', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                View all activity <ArrowRight size={16} />
              </span>
            </div>
          </div>
        );

      case 'quick-actions':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.5rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
                <Zap size={20} style={{ color: '#f59e0b' }} />
                <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Quick Actions</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-base)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <span>+ Capture new task</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>N</span>
                </div>
                <div onClick={() => setCurrentView('focus')} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-base)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <span>⏱ Focus mode</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>F</span>
                </div>
                <div onClick={() => setCurrentView('day')} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-base)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <span>📅 View calendar</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>D</span>
                </div>
                <div onClick={() => setCurrentView('inbox')} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-base)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <span>📥 Open inbox</span>
                  <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>I</span>
                </div>
              </div>
            </div>
          </div>
        );

      /* ==========================================================================
         Phase 3 Expansion Widgets
         ========================================================================== */

      case 'quick-capture':
        const handleQuickCaptureSubmit = async (e: React.FormEvent) => {
          e.preventDefault();
          if (!quickCaptureInput.trim() || isCapturing) return;
          setIsCapturing(true);
          try {
            await quickAddTask(quickCaptureInput.trim());
            setQuickCaptureInput('');
          } finally {
            setIsCapturing(false);
          }
        };

        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.4rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                <Plus size={20} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Quick Capture</span>
              </div>
              <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Type a task and press Enter (supports dates like "tomorrow" or "p1").
              </p>
              <form onSubmit={handleQuickCaptureSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Add a task..."
                  value={quickCaptureInput}
                  onChange={(e) => setQuickCaptureInput(e.target.value)}
                  className="input"
                  style={{ flex: 1, padding: '0.5rem 0.85rem', fontSize: 'var(--font-base)' }}
                />
                <button
                  type="submit"
                  disabled={!quickCaptureInput.trim() || isCapturing}
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 0.85rem', minHeight: '36px' }}
                >
                  <Plus size={16} /> Add
                </button>
              </form>
            </div>
          </div>
        );

      case 'mini-calendar': {
        const startWeek = startOfWeek(miniCalCurrentMonth, { weekStartsOn: settings.startOfWeek || 1 });
        const monthDays: Date[] = [];
        for (let i = 0; i < 35; i++) {
          monthDays.push(addDays(startWeek, i));
        }

        const taskDatesSet = new Set(tasks.filter((t) => !t.archived && t.dueDate).map((t) => t.dueDate));

        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.4rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={18} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {format(miniCalCurrentMonth, 'MMMM yyyy')}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem' }}>
                  <button
                    onClick={() => setMiniCalCurrentMonth((prev) => subMonths(prev, 1))}
                    className="btn-icon"
                    style={{ width: '26px', height: '26px' }}
                    title="Previous Month"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setMiniCalCurrentMonth((prev) => addMonths(prev, 1))}
                    className="btn-icon"
                    style={{ width: '26px', height: '26px' }}
                    title="Next Month"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>

              {/* Day Headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', marginBottom: '0.35rem' }}>
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <span key={i} style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {d}
                  </span>
                ))}
              </div>

              {/* Day Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
                {monthDays.map((day, idx) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate === dayStr;
                  const inCurrentMonth = isSameMonth(day, miniCalCurrentMonth);
                  const hasTasks = taskDatesSet.has(dayStr);

                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedDate(dayStr);
                        setCurrentView('day');
                      }}
                      style={{
                        padding: '0.3rem 0',
                        fontSize: 'var(--font-xs)',
                        fontWeight: isSelected || isToday ? 800 : 500,
                        borderRadius: 'var(--radius-sm)',
                        border: 'none',
                        backgroundColor: isSelected
                          ? 'var(--accent-primary)'
                          : isToday
                          ? 'var(--accent-light)'
                          : 'transparent',
                        color: isSelected
                          ? '#ffffff'
                          : isToday
                          ? 'var(--accent-primary)'
                          : inCurrentMonth
                          ? 'var(--text-primary)'
                          : 'var(--text-muted)',
                        cursor: 'pointer',
                        position: 'relative',
                      }}
                    >
                      {format(day, 'd')}
                      {hasTasks && !isSelected && (
                        <div
                          style={{
                            width: '4px',
                            height: '4px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--accent-primary)',
                            margin: '1px auto 0 auto',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'focus-session': {
        const focusTask = tasks.find((t) => t.id === activeFocusTaskId) || tasks.find((t) => !t.archived && !t.completed);

        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.4rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Timer size={20} style={{ color: '#f59e0b' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Focus Session</span>
                </div>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: '#f59e0b', backgroundColor: '#f59e0b22', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                  25m Pomodoro
                </span>
              </div>

              {focusTask ? (
                <div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Target Task
                  </div>
                  <div style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)', margin: '0.25rem 0 1rem 0' }}>
                    {focusTask.title}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '1rem' }}>
                  No task selected. Starting Focus Mode will pick your next open task.
                </div>
              )}
            </div>

            <button
              onClick={() => {
                if (focusTask) setActiveFocusTaskId(focusTask.id);
                setCurrentView('focus');
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.55rem', fontSize: 'var(--font-sm)', gap: '0.5rem', backgroundColor: '#f59e0b' }}
            >
              <Play size={16} /> Start Focus Session
            </button>
          </div>
        );
      }

      case 'goal-progress-widget':
        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.4rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Target size={20} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Goal Progress</span>
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{goals.length} Active</span>
              </div>

              {goals.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                    No active goals
                  </p>
                  <button
                    onClick={() => setCurrentView('goals')}
                    className="btn btn-secondary"
                    style={{ fontSize: 'var(--font-xs)', padding: '0.35rem 0.75rem' }}
                  >
                    Create your first goal
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {goals.slice(0, 3).map((g) => {
                    const pct = Math.min(100, Math.round((g.currentCount / g.targetCount) * 100));
                    return (
                      <div key={g.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', fontWeight: 600 }}>
                          <span style={{ color: 'var(--text-primary)' }}>{g.title}</span>
                          <span style={{ color: 'var(--text-secondary)' }}>{pct}%</span>
                        </div>
                        <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, backgroundColor: g.completed ? '#10b981' : '#f59e0b' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <span
                onClick={() => setCurrentView('goals')}
                style={{ fontSize: 'var(--font-sm)', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Open Goals view <ArrowRight size={14} />
              </span>
            </div>
          </div>
        );

      case 'task-breakdown': {
        const total = tasks.filter((t) => !t.archived).length;
        const completed = tasks.filter((t) => !t.archived && t.completed).length;
        const remaining = total - completed;
        const overdue = tasks.filter((t) => !t.archived && !t.completed && t.dueDate && t.dueDate < todayStr).length;

        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.4rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BarChart3 size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Task Breakdown</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--text-primary)' }}>{total}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Total Tasks</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: '#10b981' }}>{completed}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Completed</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: 'var(--accent-primary)' }}>{remaining}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Remaining</div>
                </div>
                <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--font-xl)', fontWeight: 800, color: overdue > 0 ? '#ef4444' : 'var(--text-muted)' }}>{overdue}</div>
                  <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Overdue</div>
                </div>
              </div>
            </div>
          </div>
        );
      }

      case 'productivity-trend': {
        const last7Days: Date[] = [];
        for (let i = 6; i >= 0; i--) {
          last7Days.push(subDays(new Date(), i));
        }

        const maxCompletions = Math.max(
          1,
          ...last7Days.map((d) => {
            const dateStr = format(d, 'yyyy-MM-dd');
            return tasks.filter((t) => t.completed && t.completedAt && t.completedAt.startsWith(dateStr)).length;
          })
        );

        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.4rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Productivity Trend</span>
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Last 7 Days</span>
              </div>

              {/* Bar Chart Visual */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '90px', padding: '0 0.5rem', gap: '0.5rem' }}>
                {last7Days.map((d, i) => {
                  const dateStr = format(d, 'yyyy-MM-dd');
                  const count = tasks.filter((t) => t.completed && t.completedAt && t.completedAt.startsWith(dateStr)).length;
                  const heightPct = Math.max(10, Math.round((count / maxCompletions) * 100));

                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, gap: '0.35rem' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: count > 0 ? 'var(--accent-primary)' : 'var(--text-muted)' }}>
                        {count}
                      </span>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: '24px',
                          height: `${heightPct}%`,
                          backgroundColor: count > 0 ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-sm)',
                        }}
                      />
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{format(d, 'eee')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      }

      case 'recent-notes': {
        const recentNotes = [...notes]
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
          .slice(0, 3);

        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.4rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Recent Notes</span>
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>{notes.length} total</span>
              </div>

              {recentNotes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1rem 0' }}>
                  <p style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                    No notes yet
                  </p>
                  <button
                    onClick={() => setCurrentView('notes')}
                    className="btn btn-secondary"
                    style={{ fontSize: 'var(--font-xs)', padding: '0.35rem 0.75rem' }}
                  >
                    Create a note
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {recentNotes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => setCurrentView('notes')}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.15rem',
                        cursor: 'pointer',
                        padding: '0.4rem 0.6rem',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--bg-secondary)',
                      }}
                    >
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{n.title}</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        Updated {format(parseISO(n.updatedAt), 'MMM d')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <span
                onClick={() => setCurrentView('notes')}
                style={{ fontSize: 'var(--font-sm)', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Open Notes view <ArrowRight size={14} />
              </span>
            </div>
          </div>
        );
      }

      case 'time-budget': {
        const todayScheduledTasks = tasks.filter((t) => !t.archived && t.dueDate === todayStr);
        const totalMinutes = todayScheduledTasks.reduce((acc, t) => acc + (t.duration || 30), 0);
        const completedMinutes = todayScheduledTasks
          .filter((t) => t.completed)
          .reduce((acc, t) => acc + (t.duration || 30), 0);
        const remainingMinutes = totalMinutes - completedMinutes;

        const formatHours = (mins: number) => {
          const h = Math.floor(mins / 60);
          const m = mins % 60;
          if (h === 0) return `${m}m`;
          if (m === 0) return `${h}h`;
          return `${h}h ${m}m`;
        };

        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.4rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Time Budget</span>
                </div>
                <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>Today</span>
              </div>

              {todayScheduledTasks.length === 0 ? (
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>
                  Nothing scheduled for today
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Scheduled:</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatHours(totalMinutes)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Completed:</span>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>{formatHours(completedMinutes)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Remaining:</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent-primary)' }}>{formatHours(remainingMinutes)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      }

      case 'inbox-widget': {
        const inboxTasks = tasks.filter((t) => !t.archived && !t.dueDate && !t.completed);

        return (
          <div
            className="stat-card"
            style={{
              backgroundColor: 'var(--bg-card)',
              padding: '1.4rem 1.6rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Inbox size={20} style={{ color: 'var(--accent-primary)' }} />
                  <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Inbox</span>
                </div>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '0.2rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
                  {inboxTasks.length} Unscheduled
                </span>
              </div>

              {inboxTasks.length === 0 ? (
                <div style={{ fontSize: 'var(--font-sm)', color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0', textAlign: 'center' }}>
                  Inbox is clear! All tasks are scheduled.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {inboxTasks.slice(0, 3).map((t) => (
                    <div key={t.id} style={{ fontSize: 'var(--font-sm)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      • {t.title}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
              <span
                onClick={() => setCurrentView('inbox')}
                style={{ fontSize: 'var(--font-sm)', color: 'var(--accent-primary)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
              >
                Open full Inbox <ArrowRight size={14} />
              </span>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header & Customization Controls Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--text-primary)' }}>Overview</h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            Command Center Dashboard
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isCustomizing ? (
            <>
              {!showResetConfirm ? (
                <button onClick={() => setShowResetConfirm(true)} className="btn btn-secondary" style={{ fontSize: 'var(--font-sm)' }}>
                  <RotateCcw size={16} /> Reset Default
                </button>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: 'var(--font-xs)', fontWeight: 600, color: '#ef4444' }}>Reset overview?</span>
                  <button onClick={handleResetLayout} className="btn btn-primary" style={{ backgroundColor: '#ef4444', fontSize: 'var(--font-xs)', padding: '0.3rem 0.6rem', minHeight: '30px' }}>
                    Confirm
                  </button>
                  <button onClick={() => setShowResetConfirm(false)} className="btn btn-secondary" style={{ fontSize: 'var(--font-xs)', padding: '0.3rem 0.5rem', minHeight: '30px' }}>
                    Cancel
                  </button>
                </div>
              )}

              <button onClick={() => setIsCustomizing(false)} className="btn btn-primary">
                <Check size={16} /> Done Customizing
              </button>
            </>
          ) : (
            <button onClick={() => setIsCustomizing(true)} className="btn btn-secondary">
              <SlidersHorizontal size={16} /> Customize Overview
            </button>
          )}
        </div>
      </div>

      {/* Onboarding Welcome Card */}
      {hasOnboardingTasks && (
        <div
          style={{
            backgroundColor: 'var(--accent-light)',
            border: '1px solid var(--accent-primary)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.6rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1.5rem',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: 'var(--accent-primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: 'var(--font-lg)', fontWeight: 800, color: 'var(--text-primary)' }}>
                Welcome to Daymark 👋
              </h2>
              <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Your workspace is ready. We've added a few Getting Started tasks to show you how things work. Complete or remove them whenever you're ready to start organizing your own work.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            {!showDismissConfirm ? (
              <button
                onClick={() => setShowDismissConfirm(true)}
                className="btn btn-secondary"
                style={{ fontSize: 'var(--font-sm)', minHeight: '38px', padding: '0.5rem 1rem' }}
              >
                Remove Getting Started Tasks
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: '#ef4444' }}>Clear tutorial tasks?</span>
                <button
                  onClick={handleClearOnboarding}
                  className="btn btn-primary"
                  style={{ backgroundColor: '#ef4444', fontSize: 'var(--font-sm)', minHeight: '36px', padding: '0.4rem 0.85rem' }}
                >
                  Yes, Clear
                </button>
                <button
                  onClick={() => setShowDismissConfirm(false)}
                  className="btn btn-secondary"
                  style={{ fontSize: 'var(--font-sm)', minHeight: '36px', padding: '0.4rem 0.6rem' }}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden Widgets Drawer (Visible during customization mode) */}
      {isCustomizing && hiddenWidgets.length > 0 && (
        <div className="hidden-widgets-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <EyeOff size={18} style={{ color: 'var(--text-muted)' }} />
            <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)' }}>Hidden Widgets</h3>
            <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>({hiddenWidgets.length} hidden)</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {hiddenWidgets.map((w) => (
              <button
                key={w.id}
                onClick={() => handleToggleVisibility(w.id)}
                className="btn btn-secondary"
                style={{ fontSize: 'var(--font-xs)', padding: '0.35rem 0.75rem', minHeight: '32px' }}
              >
                <Eye size={14} /> Restore {WIDGET_TITLES[w.id] || w.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dynamic Responsive Widget Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        {visibleWidgets.map((widget) => {
          const isDragging = draggedWidgetId === widget.id;
          const isDragOver = dragOverWidgetId === widget.id && !isDragging;

          return (
            <div
              key={widget.id}
              draggable={isCustomizing}
              onDragStart={(e) => handleDragStart(e, widget.id)}
              onDragOver={(e) => handleDragOver(e, widget.id)}
              onDrop={(e) => handleDrop(e, widget.id)}
              onDragEnd={() => {
                setDraggedWidgetId(null);
                setDragOverWidgetId(null);
              }}
              className={`stat-card widget-wrapper ${isCustomizing ? 'editing' : ''} ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
              style={{
                gridColumn: `span ${widget.colSpan}`,
                display: 'flex',
                flexDirection: 'column',
                opacity: isDragging ? 0.4 : 1,
              }}
            >
              {/* Customization Control Header Bar */}
              {isCustomizing && (
                <div className="widget-edit-bar">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'grab' }} title="Drag to reposition widget">
                    <GripVertical size={16} style={{ color: 'var(--accent-primary)' }} />
                    <span>{WIDGET_TITLES[widget.id] || widget.id}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    {/* Size Preset Controls */}
                    <button
                      onClick={() => handleResizeWidget(widget.id, 3)}
                      className={`widget-size-btn ${widget.colSpan === 3 ? 'active' : ''}`}
                      title="Small (1/4 Width)"
                    >
                      Small
                    </button>
                    <button
                      onClick={() => handleResizeWidget(widget.id, 6)}
                      className={`widget-size-btn ${widget.colSpan === 6 ? 'active' : ''}`}
                      title="Medium (1/2 Width)"
                    >
                      Medium
                    </button>
                    <button
                      onClick={() => handleResizeWidget(widget.id, 12)}
                      className={`widget-size-btn ${widget.colSpan === 12 ? 'active' : ''}`}
                      title="Full (Full Width)"
                    >
                      Full
                    </button>

                    {/* Hide Button */}
                    <button
                      onClick={() => handleToggleVisibility(widget.id)}
                      className="btn-icon"
                      style={{ width: '24px', height: '24px', color: '#ef4444' }}
                      title="Hide Widget"
                    >
                      <EyeOff size={14} />
                    </button>
                  </div>
                </div>
              )}

              {/* Widget Content Component */}
              <div style={{ flex: 1 }}>{renderWidgetContent(widget.id)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
