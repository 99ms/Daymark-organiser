import type { Task, ActiveTimerState, TimerSession } from '../types';

export const ACTIVE_TIMER_STORAGE_KEY = 'daymark_active_task_timer';

/**
 * Parses raw JSON string into a validated ActiveTimerState, or null if invalid.
 */
export function parseActiveTimerState(rawJson: string | null): ActiveTimerState | null {
  if (!rawJson) return null;
  try {
    const parsed = JSON.parse(rawJson);
    if (
      parsed &&
      typeof parsed.taskId === 'string' &&
      parsed.taskId.trim().length > 0 &&
      typeof parsed.startTime === 'string' &&
      !isNaN(new Date(parsed.startTime).getTime()) &&
      typeof parsed.isRunning === 'boolean'
    ) {
      const state: ActiveTimerState = {
        taskId: parsed.taskId,
        startTime: parsed.startTime,
        isRunning: parsed.isRunning,
      };
      if (typeof parsed.sessionId === 'string' && parsed.sessionId.trim().length > 0) {
        state.sessionId = parsed.sessionId;
      }
      return state;
    }
  } catch {
    // Malformed JSON
  }
  return null;
}

/**
 * Calculates total elapsed seconds for a task:
 * sum of all completed session durations + elapsed time of current running segment (if active for this task).
 * Uses explicit reference time (nowMs) for deterministic, timestamp-based accounting.
 */
export function calculateTaskTrackedSeconds(
  task: Pick<Task, 'id' | 'timerSessions'>,
  activeTimer: ActiveTimerState | null,
  nowMs: number = Date.now()
): number {
  const completedSeconds = (task.timerSessions || []).reduce((acc, s) => {
    return acc + (typeof s.durationSeconds === 'number' && s.durationSeconds > 0 ? s.durationSeconds : 0);
  }, 0);

  if (activeTimer && activeTimer.taskId === task.id) {
    if (activeTimer.isRunning && activeTimer.startTime) {
      const startMs = new Date(activeTimer.startTime).getTime();
      if (!isNaN(startMs) && nowMs > startMs) {
        const liveSeconds = Math.floor((nowMs - startMs) / 1000);
        return completedSeconds + liveSeconds;
      }
    }
  }

  return completedSeconds;
}

/**
 * Creates a finalized TimerSession from a running segment.
 * If elapsed <= 0 or invalid start time, returns null.
 */
export function createFinalizedSession(
  activeSegment: ActiveTimerState,
  nowMs: number = Date.now()
): TimerSession | null {
  if (!activeSegment.isRunning || !activeSegment.startTime) {
    return null;
  }

  const startMs = new Date(activeSegment.startTime).getTime();
  if (isNaN(startMs) || nowMs <= startMs) {
    return null;
  }

  const elapsed = Math.floor((nowMs - startMs) / 1000);
  if (elapsed <= 0) {
    return null;
  }

  const nowIso = new Date(nowMs).toISOString();
  const sessionId = activeSegment.sessionId || ('ts-' + nowMs + '-' + Math.random().toString(36).substring(2, 6));
  return {
    id: sessionId,
    startTime: activeSegment.startTime,
    endTime: nowIso,
    durationSeconds: elapsed,
  };
}

/**
 * Appends a finalized session to a task and updates its aggregates.
 */
export function applySessionToTask(
  task: Task,
  session: TimerSession
): Task {
  const existingSessions = task.timerSessions || [];
  const updatedSessions = [...existingSessions, session];
  const newTotalSeconds = (task.totalTrackedSeconds || 0) + session.durationSeconds;
  const newActualMinutes = secondsToMinutes(newTotalSeconds);

  return {
    ...task,
    timerSessions: updatedSessions,
    totalTrackedSeconds: newTotalSeconds,
    actualTime: newActualMinutes,
    updatedAt: session.endTime || new Date().toISOString(),
  };
}

/**
 * Normalizes timer sessions defensively when importing or restoring.
 */
export function normalizeTimerSessions(raw: any): TimerSession[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((s) => s && typeof s === 'object' && typeof s.startTime === 'string' && !isNaN(new Date(s.startTime).getTime()))
    .map((s) => {
      const durationSeconds = typeof s.durationSeconds === 'number' && !isNaN(s.durationSeconds) && s.durationSeconds >= 0
        ? Math.floor(s.durationSeconds)
        : 0;
      return {
        id: typeof s.id === 'string' && s.id ? s.id : 'ts-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        startTime: s.startTime,
        endTime: typeof s.endTime === 'string' && !isNaN(new Date(s.endTime).getTime()) ? s.endTime : undefined,
        durationSeconds,
      };
    });
}

/**
 * Helper to compute actualTime in whole minutes from seconds.
 */
export function secondsToMinutes(seconds: number): number {
  if (seconds <= 0) return 0;
  return Math.round(seconds / 60);
}

/**
 * Formats seconds into human-readable duration strings:
 * - When showHours is true or seconds >= 3600: "H:MM:SS"
 * - When seconds < 3600: "M:SS"
 */
export function formatDurationSeconds(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${minutes}:${pad(seconds)}`;
}
