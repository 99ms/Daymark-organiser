import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task } from '../types';
import { TaskItem } from '../components/TaskItem';
import { format } from 'date-fns';
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
} from 'lucide-react';

interface OverviewViewProps {
  onEditTask: (task: Task) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onEditTask }) => {
  const { tasks, projects, goals, setSelectedDate, setCurrentView, dismissOnboarding } = useOrganiser();
  const [showDismissConfirm, setShowDismissConfirm] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

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
    .filter((t) => !t.archived)
    .sort((a, b) => (b.completedAt || b.createdAt).localeCompare(a.completedAt || a.createdAt))
    .slice(0, 3);

  const onboardingActive = tasks.some((t) => t.isOnboarding || t.categoryId === 'c-onboarding');

  const handleClearOnboarding = async () => {
    await dismissOnboarding();
    setShowDismissConfirm(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', width: '100%', margin: '0 auto' }}>
      {/* HEADER TITLE BAR */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Productivity Command Center
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-base)', marginTop: '0.3rem' }}>
            Here's your personal work overview for today.
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedDate(todayStr);
            setCurrentView('day');
          }}
          className="btn btn-primary"
          style={{ padding: '0.55rem 1.1rem', fontSize: 'var(--font-md)', minHeight: '36px' }}
        >
          <Calendar size={18} /> Open Day Workspace
        </button>
      </div>

      {/* ONBOARDING WELCOME BANNER (Only shown when onboarding active) */}
      {onboardingActive && (
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

      {/* 4-COLUMN ROW 1: PROGRESS (3 cols) | STREAK (3 cols) | WORKLOAD (3 cols) | THIS WEEK (3 cols) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        
        {/* Today's Progress Card (3 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 3',
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem 1.6rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '160px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Today's Progress</span>
            <BarChart3 size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', margin: '1rem 0' }}>
            {/* Donut Progress Dial */}
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
                  fontSize: 'var(--font-lg)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                }}
              >
                {percentToday}%
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <span style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', fontWeight: 600 }}>
                {completedToday} of {totalToday} tasks completed
              </span>
              <div style={{ height: '8px', width: '120px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${percentToday}%`, backgroundColor: 'var(--accent-primary)' }} />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            <span>{totalToday - completedToday} remaining</span>
            <span>{percentToday}% completed</span>
          </div>
        </div>

        {/* Streak Card (3 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 3',
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem 1.6rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '160px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f59e0b' }}>
              <Flame size={22} />
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Streak</span>
            </div>
            <Award size={20} style={{ color: 'var(--text-muted)' }} />
          </div>

          <div style={{ margin: '0.75rem 0' }}>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: '#f59e0b' }}>
              {completedToday > 0 ? '1 Day 🔥' : '0 Days'}
            </div>
            <div style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Complete a task to start your streak
            </div>
          </div>
        </div>

        {/* Daily Workload Card (3 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 3',
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem 1.6rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '160px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BarChart3 size={22} style={{ color: workloadColor }} />
              <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Daily Workload</span>
            </div>
            <span style={{ fontSize: 'var(--font-sm)', fontWeight: 700, padding: '0.25rem 0.75rem', borderRadius: 'var(--radius-full)', backgroundColor: `${workloadColor}22`, color: workloadColor }}>
              {workloadLabel}
            </span>
          </div>

          <div style={{ margin: '0.75rem 0' }}>
            <div style={{ fontSize: 'var(--font-base)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {totalScheduledMinutes > 0 ? `${totalScheduledMinutes} mins scheduled today` : 'Your day is clear'}
            </div>
          </div>
        </div>

        {/* This Week Card (3 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 3',
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem 1.6rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            minHeight: '160px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>This Week</span>
            <Activity size={20} style={{ color: 'var(--accent-primary)' }} />
          </div>

          <div style={{ margin: '0.75rem 0' }}>
            <div style={{ fontSize: 'var(--font-2xl)', fontWeight: 800, color: 'var(--text-primary)' }}>
              {tasks.length > 0 ? `${Math.round((tasks.filter((t) => t.completed).length / tasks.length) * 100)}%` : '0%'}
            </div>
            <div style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              Completion Rate from actual tasks
            </div>
          </div>
        </div>

      </div>

      {/* ROW 2: TOP PRIORITIES (6 cols) | OVERDUE TASKS (6 cols) — 50/50 SPLIT */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        
        {/* Top Priorities Card (6 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 6',
            backgroundColor: 'var(--bg-card)',
            padding: '1.6rem 1.85rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid #f59e0b44',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
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

        {/* Overdue Tasks Empty State Card (6 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 6',
            backgroundColor: 'var(--bg-card)',
            padding: '1.6rem 1.85rem',
            borderRadius: 'var(--radius-lg)',
            border: overdueTasks.length > 0 ? '1px solid #ef444444' : '1px solid #10b98144',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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

          {/* Overdue Items List or Clean Honest Empty State */}
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

      </div>

      {/* ROW 3: UPCOMING SCHEDULE (FULL WIDTH - 12 cols) */}
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

      {/* ROW 4: ACTIVE PROJECTS (3 cols) | PERSONAL GOALS (3 cols) | RECENT ACTIVITY (3 cols) | QUICK ACTIONS (3 cols) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '1.5rem' }}>
        
        {/* Active Projects (3 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 3',
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem 1.6rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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
                  No active projects yet. Create a project to group related tasks.
                </p>
              ) : (
                projects.map((p) => {
                  const pTasks = tasks.filter((t) => !t.archived && t.projectId === p.id);
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

        {/* Personal Goals (3 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 3',
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem 1.6rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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

        {/* Recent Activity (3 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 3',
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem 1.6rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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

        {/* Quick Actions (3 cols) */}
        <div
          className="stat-card"
          style={{
            gridColumn: 'span 3',
            backgroundColor: 'var(--bg-card)',
            padding: '1.5rem 1.6rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
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

      </div>
    </div>
  );
};
