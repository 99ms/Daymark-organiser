import React, { useState, useEffect } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { calculateTaskTrackedSeconds, formatDurationSeconds } from '../utils/timerUtils';
import { Play, Pause, Square, Timer, AlertCircle } from 'lucide-react';

export const GlobalTimerIndicator: React.FC = () => {
  const { activeTimer, tasks, pauseTimer, resumeTimer, stopTimer, setCurrentView, setSelectedDate } = useOrganiser();

  const isRunning = !!activeTimer?.isRunning;
  const isPaused = activeTimer ? !activeTimer.isRunning : false;

  // Local tick for live rerender only when timer is running
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 1000000);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  if (!activeTimer) {
    return null;
  }

  const activeTask = tasks.find((t) => t.id === activeTimer.taskId);
  if (!activeTask) {
    return null;
  }

  const totalTrackedSeconds = calculateTaskTrackedSeconds(activeTask, activeTimer, Date.now());
  const estimatedSeconds = typeof activeTask.duration === 'number' && activeTask.duration > 0 ? activeTask.duration * 60 : 0;
  const hasEstimate = estimatedSeconds > 0;
  const isOvertime = hasEstimate && totalTrackedSeconds > estimatedSeconds;
  const overtimeSeconds = isOvertime ? totalTrackedSeconds - estimatedSeconds : 0;

  const handleTogglePlayPause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isRunning) {
      await pauseTimer();
    } else {
      await resumeTimer();
    }
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await stopTimer();
  };

  const handleNavigateToTask = () => {
    if (activeTask.dueDate) {
      setSelectedDate(activeTask.dueDate);
      setCurrentView('day');
    } else {
      setCurrentView('inbox');
    }
  };

  return (
    <aside
      className="global-timer-bar"
      role="complementary"
      aria-label="Active Task Timer Bar"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.45rem 1rem',
        backgroundColor: isOvertime
          ? 'rgba(239, 68, 68, 0.12)'
          : isPaused
          ? 'rgba(245, 158, 11, 0.12)'
          : 'var(--accent-light)',
        borderBottom: `1px solid ${
          isOvertime ? '#ef4444' : isPaused ? '#f59e0b' : 'var(--accent-primary)'
        }`,
        zIndex: 25,
        animation: 'fadeIn 0.2s ease-in',
      }}
    >
      {/* Clickable Info Section (navigates to the task) */}
      <button
        type="button"
        onClick={handleNavigateToTask}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.65rem',
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          textAlign: 'left',
          minWidth: 0,
          flex: 1,
          color: 'inherit',
        }}
        title={`View task "${activeTask.title}" (${activeTask.dueDate ? activeTask.dueDate : 'Quick Tasks'})`}
        aria-label={`Active task: "${activeTask.title}". Click to navigate to this task.`}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isOvertime ? '#ef4444' : isPaused ? '#f59e0b' : 'var(--accent-primary)',
            flexShrink: 0,
          }}
        >
          <Timer size={18} className={isRunning ? 'animate-pulse' : ''} />
        </span>

        <span
          style={{
            fontSize: 'var(--font-sm)',
            fontWeight: 600,
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: 'min(360px, 45vw)',
          }}
        >
          {activeTask.title}
        </span>

        {/* State Tag */}
        <span
          style={{
            fontSize: '11px',
            padding: '0.15rem 0.45rem',
            borderRadius: 'var(--radius-sm)',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            backgroundColor: isOvertime
              ? 'rgba(239, 68, 68, 0.2)'
              : isPaused
              ? 'rgba(245, 158, 11, 0.2)'
              : 'rgba(99, 102, 241, 0.2)',
            color: isOvertime ? '#ef4444' : isPaused ? '#f59e0b' : 'var(--accent-primary)',
          }}
        >
          {isOvertime ? 'Overtime' : isPaused ? 'Paused' : 'Running'}
        </span>
      </button>

      {/* Metrics & Quick Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexShrink: 0 }}>
        {/* Time display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            fontFamily: 'monospace',
            fontSize: 'var(--font-base)',
            fontWeight: 700,
            color: isOvertime ? '#ef4444' : isPaused ? '#f59e0b' : 'var(--text-primary)',
          }}
          aria-live="off"
        >
          <span>{formatDurationSeconds(totalTrackedSeconds)}</span>
          {hasEstimate && (
            <span style={{ fontSize: 'var(--font-xs)', fontFamily: 'var(--font-family)', color: 'var(--text-muted)' }}>
              / {activeTask.duration}m
              {isOvertime && (
                <span
                  style={{
                    color: '#ef4444',
                    marginLeft: '0.25rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.15rem',
                  }}
                  title={`Overtime: +${formatDurationSeconds(overtimeSeconds)}`}
                >
                  <AlertCircle size={12} />+{formatDurationSeconds(overtimeSeconds)}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className="btn-icon"
            style={{
              width: 32,
              height: 32,
              color: isPaused ? '#f59e0b' : 'var(--accent-primary)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
            }}
            title={isRunning ? 'Pause active timer' : 'Resume active timer'}
            aria-label={
              isRunning
                ? `Pause timer for "${activeTask.title}"`
                : `Resume timer for "${activeTask.title}"`
            }
          >
            {isRunning ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          </button>

          <button
            type="button"
            onClick={handleStop}
            className="btn-icon"
            style={{
              width: 32,
              height: 32,
              color: 'var(--text-muted)',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
            }}
            title="Stop timer (commit session to task)"
            aria-label={`Stop timer for "${activeTask.title}"`}
          >
            <Square size={13} fill="currentColor" />
          </button>
        </div>
      </div>
    </aside>
  );
};
