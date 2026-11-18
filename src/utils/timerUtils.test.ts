import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTaskTrackedSeconds,
  normalizeTimerSessions,
  secondsToMinutes,
  formatDurationSeconds,
  parseActiveTimerState,
  createFinalizedSession,
  applySessionToTask,
} from './timerUtils.ts';
import type { Task, ActiveTimerState } from '../types/index.ts';

describe('Timer Engine: Core Math & Session Logic', () => {
  test('calculateTaskTrackedSeconds sums completed sessions when no active timer', () => {
    const task: Pick<Task, 'id' | 'timerSessions'> = {
      id: 'task-1',
      timerSessions: [
        { id: 's1', startTime: '2026-10-28T10:00:00Z', endTime: '2026-10-28T10:15:00Z', durationSeconds: 900 },
        { id: 's2', startTime: '2026-10-28T11:00:00Z', endTime: '2026-10-28T11:05:00Z', durationSeconds: 300 },
      ],
    };

    const total = calculateTaskTrackedSeconds(task as any, null);
    assert.equal(total, 1200);
    assert.equal(secondsToMinutes(total), 20);
  });

  test('calculateTaskTrackedSeconds adds live running seconds for active task', () => {
    const task: Pick<Task, 'id' | 'timerSessions'> = {
      id: 'task-1',
      timerSessions: [
        { id: 's1', startTime: '2026-10-28T10:00:00Z', endTime: '2026-10-28T10:10:00Z', durationSeconds: 600 },
      ],
    };

    const startMs = Date.parse('2026-10-28T12:00:00.000Z');
    const nowMs = startMs + 45000; // 45 seconds later

    const activeTimer: ActiveTimerState = {
      taskId: 'task-1',
      startTime: new Date(startMs).toISOString(),
      isRunning: true,
    };

    const total = calculateTaskTrackedSeconds(task as any, activeTimer, nowMs);
    assert.equal(total, 645);
    assert.equal(secondsToMinutes(total), 11); // 645 / 60 = 10.75 -> 11 min
  });

  test('calculateTaskTrackedSeconds ignores active timer if paused or for another task', () => {
    const task: Pick<Task, 'id' | 'timerSessions'> = {
      id: 'task-1',
      timerSessions: [
        { id: 's1', startTime: '2026-10-28T10:00:00Z', endTime: '2026-10-28T10:10:00Z', durationSeconds: 600 },
      ],
    };

    // Paused timer
    const pausedTimer: ActiveTimerState = {
      taskId: 'task-1',
      startTime: '2026-10-28T12:00:00Z',
      isRunning: false,
    };
    assert.equal(calculateTaskTrackedSeconds(task as any, pausedTimer, Date.parse('2026-10-28T12:05:00Z')), 600);

    // Active timer for another task
    const otherTaskTimer: ActiveTimerState = {
      taskId: 'task-2',
      startTime: '2026-10-28T12:00:00Z',
      isRunning: true,
    };
    assert.equal(calculateTaskTrackedSeconds(task as any, otherTaskTimer, Date.parse('2026-10-28T12:05:00Z')), 600);
  });

  test('Overtime tracking calculation beyond estimated duration', () => {
    const task: Pick<Task, 'id' | 'duration' | 'timerSessions'> = {
      id: 'task-1',
      duration: 15, // 15 minutes estimate = 900 seconds
      timerSessions: [
        { id: 's1', startTime: '2026-10-28T10:00:00Z', endTime: '2026-10-28T10:20:00Z', durationSeconds: 1200 },
      ],
    };

    const tracked = calculateTaskTrackedSeconds(task as any, null);
    const estimateSecs = (task.duration || 0) * 60;
    const isOvertime = tracked > estimateSecs;
    const overtimeSecs = Math.max(0, tracked - estimateSecs);

    assert.equal(tracked, 1200);
    assert.equal(isOvertime, true);
    assert.equal(overtimeSecs, 300); // 5 minutes overtime
    assert.equal(secondsToMinutes(overtimeSecs), 5);
  });

  test('Clock rollback / backwards timestamp safeguards', () => {
    const task: Pick<Task, 'id' | 'timerSessions'> = {
      id: 'task-1',
      timerSessions: [
        { id: 's1', startTime: '2026-10-28T10:00:00Z', endTime: '2026-10-28T10:05:00Z', durationSeconds: 300 },
      ],
    };

    const startMs = Date.parse('2026-10-28T12:00:00.000Z');
    const nowMs = startMs - 10000; // 10 seconds before start time due to system clock shift

    const activeTimer: ActiveTimerState = {
      taskId: 'task-1',
      startTime: new Date(startMs).toISOString(),
      isRunning: true,
    };

    // Must not produce negative time or subtract from completed sessions
    const total = calculateTaskTrackedSeconds(task as any, activeTimer, nowMs);
    assert.equal(total, 300);
  });

  test('normalizeTimerSessions defensively cleans malformed payloads', () => {
    const malformed = [
      null,
      undefined,
      'invalid-string',
      { id: 'ts-1', startTime: '2026-10-28T10:00:00Z', durationSeconds: 400 },
      { startTime: '2026-10-28T11:00:00Z', durationSeconds: -50 }, // negative duration
      { startTime: '2026-10-28T12:00:00Z', durationSeconds: 'not-a-number' },
      { startTime: 'invalid-iso-date', durationSeconds: 100 }, // invalid ISO date
    ];

    const cleaned = normalizeTimerSessions(malformed);
    assert.equal(cleaned.length, 3);
    assert.equal(cleaned[0].id, 'ts-1');
    assert.equal(cleaned[0].durationSeconds, 400);
    assert.equal(cleaned[1].durationSeconds, 0); // negative clamped to 0
    assert.equal(cleaned[2].durationSeconds, 0); // NaN clamped to 0
  });

  test('Recurring instance isolation: reset timer state fields', () => {
    const completedParentTask: Task = {
      id: 'parent-task',
      title: 'Weekly Report',
      dueDate: '2026-10-28',
      duration: 30,
      actualTime: 45,
      totalTrackedSeconds: 2700,
      timerSessions: [
        { id: 'ts-1', startTime: '2026-10-28T09:00:00Z', endTime: '2026-10-28T09:45:00Z', durationSeconds: 2700 },
      ],
      priorityId: 'p-med',
      categoryId: 'c-work',
      tags: ['report'],
      completed: true,
      subtasks: [],
      createdAt: '2026-10-28T08:00:00Z',
      updatedAt: '2026-10-28T09:45:00Z',
    };

    // As implemented in OrganiserContext toggleCompleteTask:
    const nextInstance: Task = {
      ...completedParentTask,
      id: 'task-new-recurring',
      dueDate: '2026-11-04',
      completed: false,
      actualTime: 0,
      totalTrackedSeconds: 0,
      timerSessions: [],
    };

    assert.equal(nextInstance.actualTime, 0);
    assert.equal(nextInstance.totalTrackedSeconds, 0);
    assert.deepEqual(nextInstance.timerSessions, []);
    assert.equal(calculateTaskTrackedSeconds(nextInstance, null), 0);
  });

  test('parseActiveTimerState safely validates raw JSON storage states', () => {
    assert.equal(parseActiveTimerState(null), null);
    assert.equal(parseActiveTimerState(''), null);
    assert.equal(parseActiveTimerState('{invalid json'), null);
    assert.equal(parseActiveTimerState(JSON.stringify({ taskId: '', startTime: '2026-10-28T10:00:00Z', isRunning: true })), null);
    assert.equal(parseActiveTimerState(JSON.stringify({ taskId: 't1', startTime: 'invalid-date', isRunning: true })), null);
    assert.equal(parseActiveTimerState(JSON.stringify({ taskId: 't1', startTime: '2026-10-28T10:00:00Z', isRunning: 'not-bool' })), null);

    const validJson = JSON.stringify({
      taskId: 't1',
      startTime: '2026-10-28T10:00:00.000Z',
      isRunning: true,
    });
    const parsed = parseActiveTimerState(validJson);
    assert.deepEqual(parsed, {
      taskId: 't1',
      startTime: '2026-10-28T10:00:00.000Z',
      isRunning: true,
    });
  });

  test('createFinalizedSession and applySessionToTask maintain session integrity and aggregates', () => {
    const startMs = Date.parse('2026-10-28T10:00:00.000Z');
    const runningTimer: ActiveTimerState = {
      taskId: 'task-1',
      startTime: new Date(startMs).toISOString(),
      isRunning: true,
    };

    // Returns null if paused or zero elapsed
    assert.equal(createFinalizedSession({ ...runningTimer, isRunning: false }, startMs + 10000), null);
    assert.equal(createFinalizedSession(runningTimer, startMs), null);
    assert.equal(createFinalizedSession(runningTimer, startMs - 1000), null); // clock skew

    // Successful finalization after 125 seconds
    const endMs = startMs + 125000;
    const session = createFinalizedSession(runningTimer, endMs);
    assert.ok(session);
    assert.equal(session.durationSeconds, 125);
    assert.equal(session.startTime, runningTimer.startTime);
    assert.equal(session.endTime, new Date(endMs).toISOString());

    // Apply to task with existing 300 seconds
    const initialTask: Task = {
      id: 'task-1',
      title: 'Audit Task',
      priorityId: 'p-low',
      categoryId: 'c-work',
      tags: [],
      completed: false,
      subtasks: [],
      createdAt: '2026-10-28T09:00:00Z',
      updatedAt: '2026-10-28T09:00:00Z',
      duration: 10,
      totalTrackedSeconds: 300,
      actualTime: 5,
      timerSessions: [
        { id: 's0', startTime: '2026-10-28T09:30:00Z', endTime: '2026-10-28T09:35:00Z', durationSeconds: 300 },
      ],
    };

    const updatedTask = applySessionToTask(initialTask, session);
    assert.equal(updatedTask.totalTrackedSeconds, 425);
    assert.equal(updatedTask.actualTime, 7); // 425 / 60 = 7.08 -> 7 minutes
    assert.equal(updatedTask.timerSessions?.length, 2);
    assert.equal(updatedTask.timerSessions?.[1].durationSeconds, 125);
    assert.equal(updatedTask.updatedAt, session.endTime);
  });

  test('formatDurationSeconds formats M:SS and H:MM:SS properly', () => {
    assert.equal(formatDurationSeconds(0), '0:00');
    assert.equal(formatDurationSeconds(45), '0:45');
    assert.equal(formatDurationSeconds(65), '1:05');
    assert.equal(formatDurationSeconds(599), '9:59');
    assert.equal(formatDurationSeconds(3600), '1:00:00');
    assert.equal(formatDurationSeconds(3665), '1:01:05');
    assert.equal(formatDurationSeconds(7322), '2:02:02');
  });

  test('Stable sessionId preservation in createFinalizedSession', () => {
    const runningTimer: ActiveTimerState = {
      taskId: 't-test',
      startTime: '2026-10-28T10:00:00.000Z',
      isRunning: true,
      sessionId: 'custom-session-id-123',
    };
    const nowMs = Date.parse('2026-10-28T10:02:30.000Z');
    const session = createFinalizedSession(runningTimer, nowMs);
    assert.ok(session);
    assert.equal(session.id, 'custom-session-id-123');
    assert.equal(session.durationSeconds, 150);
  });
});
