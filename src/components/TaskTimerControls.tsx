import React, { useState, useEffect } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { calculateTaskTrackedSeconds, formatDurationSeconds } from '../utils/timerUtils';
import { Play, Pause, Square, RotateCcw, Clock, AlertCircle } from 'lucide-react';
import type { Task } from '../types';

interface TaskTimerControlsProps {
  task: Task;
}

export const TaskTimerControls: React.FC<TaskTimerControlsProps> = ({ task }) => {
  const { activeTimer, startTimer, pauseTimer, resumeTimer, stopTimer, resetTimer } = useOrganiser();

  const isCurrentActive = activeTimer?.taskId === task.id;
  const isRunning = isCurrentActive && activeTimer.isRunning;
  const isPaused = isCurrentActive && !activeTimer.isRunning;

  // Local ticker to trigger live rerender every second only when this task is actively running
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 1000000);
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning]);

  // Always compute from authoritative timestamp + task.timerSessions
  const totalTrackedSeconds = calculateTaskTrackedSeconds(task, activeTimer, Date.now());
  const estimatedSeconds = typeof task.duration === 'number' && task.duration > 0 ? task.duration * 60 : 0;
  const hasEstimate = estimatedSeconds > 0;
  const isOvertime = hasEstimate && totalTrackedSeconds > estimatedSeconds;
  const overtimeSeconds = isOvertime ? totalTrackedSeconds - estimatedSeconds : 0;
  const remainingSeconds = hasEstimate && !isOvertime ? Math.max(0, estimatedSeconds - totalTrackedSeconds) : 0;

  const hasTrackedHistory = (task.timerSessions && task.timerSessions.length > 0) || totalTrackedSeconds > 0;

  // If task is completed or archived, don't show interactive play/pause controls, but show logged time if any
  if (task.completed || task.archived) {
    if (!hasTrackedHistory && !hasEstimate) return null;
    return (
      <div
        className="task-timer-badge completed-badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: 'var(--font-xs)',
          padding: '0.2rem 0.5rem',
          borderRadius: 'var(--radius-sm)',
          backgroundColor: 'var(--bg-tertiary)',
          color: 'var(--text-muted)',
        }}
      >
        <Clock size={12} />
        <span>{formatDurationSeconds(totalTrackedSeconds)}</span>
        {hasEstimate && (
          <span style={{ opacity: 0.8 }}>/ {task.duration}m</span>
        )}
      </div>
    );
  }

  const handleStartOrResume = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPaused) {
      await resumeTimer();
    } else {
      await startTimer(task.id);
    }
  };

  const handlePause = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await pauseTimer();
  };

  const handleStop = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await stopTimer();
  };

  const handleReset = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await resetTimer(task.id);
  };

  return (
    <div
      className={`task-timer-controls ${isRunning ? 'timer-running' : isPaused ? 'timer-paused' : ''}`}
      onClick={(e) => e.stopPropagation()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.4rem',
        padding: '0.2rem 0.45rem',
        borderRadius: 'var(--radius-sm)',
        backgroundColor: isRunning
          ? 'var(--accent-light)'
          : isPaused
          ? 'rgba(245, 158, 11, 0.12)'
          : isOvertime
          ? 'rgba(239, 68, 68, 0.1)'
          : 'var(--bg-tertiary)',
        border: `1px solid ${
          isRunning
            ? 'var(--accent-primary)'
            : isPaused
            ? '#f59e0b'
            : isOvertime
            ? '#ef4444'
            : 'var(--border-color)'
        }`,
        transition: 'all var(--transition-fast)',
      }}
      role="region"
      aria-label={`Timer for task: ${task.title}`}
    >
      {/* Primary Action Button (Start / Pause / Resume) */}
      {isRunning ? (
        <button
          type="button"
          onClick={handlePause}
          className="btn-icon"
          style={{
            width: 26,
            height: 26,
            color: 'var(--accent-primary)',
            backgroundColor: 'transparent',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Pause timer"
          aria-label={`Pause timer for "${task.title}". Elapsed: ${formatDurationSeconds(totalTrackedSeconds)}`}
        >
          <Pause size={14} />
        </button>
      ) : (
        <button
          type="button"
          onClick={handleStartOrResume}
          className="btn-icon"
          style={{
            width: 26,
            height: 26,
            color: isPaused ? '#f59e0b' : 'var(--text-secondary)',
            backgroundColor: 'transparent',
            borderRadius: 'var(--radius-sm)',
          }}
          title={isPaused ? 'Resume timer' : 'Start timer'}
          aria-label={
            isPaused
              ? `Resume timer for "${task.title}". Currently paused at ${formatDurationSeconds(totalTrackedSeconds)}`
              : `Start timer for "${task.title}"`
          }
        >
          <Play size={14} fill={isPaused ? '#f59e0b' : 'currentColor'} />
        </button>
      )}

      {/* Stop Button (only when this task is currently the active timer) */}
      {isCurrentActive && (
        <button
          type="button"
          onClick={handleStop}
          className="btn-icon"
          style={{
            width: 24,
            height: 24,
            color: 'var(--text-muted)',
            backgroundColor: 'transparent',
            borderRadius: 'var(--radius-sm)',
          }}
          title="Stop timer (save completed session)"
          aria-label={`Stop timer for "${task.title}"`}
        >
          <Square size={12} fill="currentColor" />
        </button>
      )}

      {/* Elapsed Tracked Time & Estimate/Overtime Metric Display */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.35rem',
          fontSize: 'var(--font-xs)',
          fontFamily: 'monospace',
          fontWeight: 600,
          color: isOvertime
            ? '#ef4444'
            : isRunning
            ? 'var(--accent-primary)'
            : isPaused
            ? '#f59e0b'
            : 'var(--text-primary)',
        }}
      >
        <span>{formatDurationSeconds(totalTrackedSeconds)}</span>

        {/* Estimate & Remaining / Overtime breakdown */}
        {hasEstimate && (
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-family)',
              fontWeight: 500,
              color: isOvertime ? '#ef4444' : 'var(--text-muted)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.2rem',
            }}
          >
            / {task.duration}m
            {isOvertime ? (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.15rem',
                  fontWeight: 700,
                  color: '#ef4444',
                }}
                title={`Overtime: ${formatDurationSeconds(overtimeSeconds)} beyond estimate`}
              >
                <AlertCircle size={10} />+{formatDurationSeconds(overtimeSeconds)}
              </span>
            ) : remainingSeconds > 0 ? (
              <span title={`Remaining: ${formatDurationSeconds(remainingSeconds)}`}>
                (-{formatDurationSeconds(remainingSeconds)})
              </span>
            ) : null}
          </span>
        )}
      </div>

      {/* Reset Button (only shown when not actively running and tracked history exists) */}
      {!isRunning && hasTrackedHistory && (
        <button
          type="button"
          onClick={handleReset}
          className="btn-icon"
          style={{
            width: 22,
            height: 22,
            color: 'var(--text-muted)',
            backgroundColor: 'transparent',
            borderRadius: 'var(--radius-sm)',
            marginLeft: '0.15rem',
          }}
          title="Reset tracked timer sessions"
          aria-label={`Reset tracked time for "${task.title}"`}
        >
          <RotateCcw size={11} />
        </button>
      )}
    </div>
  );
};
