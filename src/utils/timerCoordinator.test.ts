import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  TimerCoordinator,
  type StorageNotificationAdapter,
  type TransactionalTimerDB,
  type LockAdapter,
} from './timerCoordinator.ts';
import type { Task, ActiveTimerState } from '../types/index.ts';

// In-memory test environment simulating transactional IndexedDB + localStorage notifications
function createMockTransactionalEnvironment(
  initialTasks: Task[] = [],
  initialTimer: ActiveTimerState | null = null,
  options: {
    simulateTxCrash?: boolean;
    simulateStorageCrash?: boolean;
  } = {}
) {
  const notificationStore = new Map<string, string>();
  if (initialTimer !== null) {
    notificationStore.set('daymark_active_task_timer', JSON.stringify(initialTimer));
  }

  const notifications: StorageNotificationAdapter = {
    getItem: (key) => notificationStore.get(key) ?? null,
    setItem: (key, val) => {
      if (options.simulateStorageCrash) {
        throw new Error('localStorage write quota exceeded / storage disabled');
      }
      notificationStore.set(key, val);
    },
    removeItem: (key) => {
      if (options.simulateStorageCrash) {
        throw new Error('localStorage write quota exceeded / storage disabled');
      }
      notificationStore.delete(key);
    },
  };

  const tasksMap = new Map<string, Task>();
  for (const t of initialTasks) {
    tasksMap.set(t.id, JSON.parse(JSON.stringify(t)));
  }

  let dbActiveTimer: ActiveTimerState | null = initialTimer
    ? JSON.parse(JSON.stringify(initialTimer))
    : null;

  const db: TransactionalTimerDB = {
    async runTransaction(operation) {
      if (options.simulateTxCrash) {
        throw new Error('IndexedDB Transaction Aborted: disk I/O failure');
      }

      // Snapshot maps to support complete rollback if callback throws
      const tasksSnapshot = new Map<string, Task>();
      for (const [k, v] of tasksMap.entries()) {
        tasksSnapshot.set(k, JSON.parse(JSON.stringify(v)));
      }
      const timerSnapshot = dbActiveTimer ? JSON.parse(JSON.stringify(dbActiveTimer)) : null;

      const stagedTasks = new Map<string, Task>(tasksSnapshot);
      let stagedTimer = timerSnapshot ? JSON.parse(JSON.stringify(timerSnapshot)) : null;

      const result = await operation({
        getTask: async (id) => stagedTasks.get(id),
        saveTask: async (task) => {
          stagedTasks.set(task.id, JSON.parse(JSON.stringify(task)));
        },
        getActiveTimer: async () => stagedTimer,
        saveActiveTimer: async (state) => {
          stagedTimer = state ? JSON.parse(JSON.stringify(state)) : null;
        },
      });

      // Commit phase
      tasksMap.clear();
      for (const [k, v] of stagedTasks.entries()) {
        tasksMap.set(k, v);
      }
      dbActiveTimer = stagedTimer;
      return result;
    },

    async getActiveTimer() {
      return dbActiveTimer ? JSON.parse(JSON.stringify(dbActiveTimer)) : null;
    },

    async getTask(id) {
      return tasksMap.get(id);
    },
  };

  let queue: Promise<void> = Promise.resolve();
  const lock: LockAdapter = {
    request: async (_name, cb) => {
      let release = () => {};
      const p = new Promise<void>((res) => {
        release = res;
      });
      const prev = queue;
      queue = prev.then(() => p);
      await prev;
      try {
        return await cb();
      } finally {
        release();
      }
    },
  };

  return { notifications, db, lock, tasksMap, getDbActiveTimer: () => dbActiveTimer };
}

describe('TimerCoordinator: Transactional Persistence & Crash Consistency', () => {
  const sampleTask1: Task = {
    id: 't-1',
    title: 'Task 1',
    priorityId: 'p-1',
    categoryId: 'c-1',
    tags: [],
    completed: false,
    subtasks: [],
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T10:00:00Z',
    duration: 30,
    totalTrackedSeconds: 0,
    actualTime: 0,
    timerSessions: [],
  };

  const sampleTask2: Task = {
    id: 't-2',
    title: 'Task 2',
    priorityId: 'p-1',
    categoryId: 'c-1',
    tags: [],
    completed: false,
    subtasks: [],
    createdAt: '2026-10-28T10:00:00Z',
    updatedAt: '2026-10-28T10:00:00Z',
    duration: 45,
    totalTrackedSeconds: 0,
    actualTime: 0,
    timerSessions: [],
  };

  test('Simultaneous timer starts serialize cleanly and commit transactionally', async () => {
    const env = createMockTransactionalEnvironment([sampleTask1, sampleTask2]);
    const coordinator1 = new TimerCoordinator(env.lock, env.db, env.notifications);
    const coordinator2 = new TimerCoordinator(env.lock, env.db, env.notifications);

    const now1 = Date.parse('2026-10-28T10:00:00Z');
    const now2 = now1 + 20000; // 20s later

    // Fire both simultaneously from two tabs
    const [, res2] = await Promise.all([
      coordinator1.startTimer('t-1', now1),
      coordinator2.startTimer('t-2', now2),
    ]);

    // Final authoritative timer in DB must be t-2
    const authoritative = await env.db.getActiveTimer();
    assert.equal(authoritative?.taskId, 't-2');
    assert.equal(authoritative?.isRunning, true);
    assert.equal(res2.activeTimer?.taskId, 't-2');

    // Task 1 should have had its elapsed 20s segment committed into DB
    const task1 = await env.db.getTask('t-1');
    assert.equal(task1?.timerSessions?.length, 1);
    assert.equal(task1?.timerSessions?.[0].durationSeconds, 20);
    assert.equal(task1?.totalTrackedSeconds, 20);

    // Notification cache is synced
    assert.equal(
      env.notifications.getItem('daymark_active_task_timer'),
      JSON.stringify(authoritative)
    );
  });

  test('Interrupted transaction rollback: no partial state or orphan sessions', async () => {
    const t0 = Date.parse('2026-10-28T11:00:00Z');
    const initialTimer: ActiveTimerState = {
      taskId: 't-1',
      startTime: new Date(t0).toISOString(),
      isRunning: true,
    };

    const env = createMockTransactionalEnvironment([sampleTask1], initialTimer, {
      simulateTxCrash: true,
    });
    const coordinator = new TimerCoordinator(env.lock, env.db, env.notifications);

    // Attempting to stop or pause when the DB transaction fails
    await assert.rejects(async () => {
      await coordinator.stopTimer(t0 + 15000);
    }, /IndexedDB Transaction Aborted/);

    // Verify complete rollback: task was not partially mutated, active timer not wiped
    const task = await env.db.getTask('t-1');
    assert.equal(task?.timerSessions?.length, 0);
    assert.equal(task?.totalTrackedSeconds, 0);

    const authoritative = await env.db.getActiveTimer();
    assert.equal(authoritative?.taskId, 't-1');
    assert.equal(authoritative?.isRunning, true);
  });

  test('Storage notification crash is non-fatal: DB transaction remains authoritative', async () => {
    const env = createMockTransactionalEnvironment([sampleTask1], null, {
      simulateStorageCrash: true,
    });
    const coordinator = new TimerCoordinator(env.lock, env.db, env.notifications);
    const t0 = Date.parse('2026-10-28T12:00:00Z');

    // Start timer with failing localStorage
    const res = await coordinator.startTimer('t-1', t0);
    assert.equal(res.activeTimer?.taskId, 't-1');

    // Authoritative state in IndexedDB is properly committed
    const authoritative = await env.db.getActiveTimer();
    assert.equal(authoritative?.taskId, 't-1');
    assert.equal(authoritative?.isRunning, true);
  });

  test('Idempotency & duplicate session prevention across retried flushes', async () => {
    const t0 = Date.parse('2026-10-28T13:00:00Z');
    const existingSession = {
      id: 'ts-existing',
      startTime: new Date(t0).toISOString(),
      endTime: new Date(t0 + 30000).toISOString(),
      durationSeconds: 30,
    };

    const taskWithSession: Task = {
      ...sampleTask1,
      timerSessions: [existingSession],
      totalTrackedSeconds: 30,
    };

    const env = createMockTransactionalEnvironment([taskWithSession]);
    const coordinator = new TimerCoordinator(env.lock, env.db, env.notifications);

    // Simulate retrying the flush with identical sessionId
    const duplicateRunningState: ActiveTimerState = {
      taskId: 't-1',
      startTime: existingSession.startTime,
      isRunning: true,
      sessionId: existingSession.id,
    };

    // Save duplicate running state directly in DB
    await env.db.runTransaction(async (stores) => {
      await stores.saveActiveTimer(duplicateRunningState);
    });

    // Pause timer (triggers flush attempt)
    await coordinator.pauseTimer(t0 + 40000);

    const task = await env.db.getTask('t-1');
    // Must remain 1 session (idempotent rejection of duplicate sessionId)
    assert.equal(task?.timerSessions?.length, 1);
    assert.equal(task?.totalTrackedSeconds, 30);
  });

  test('Legitimate distinct sessions with identical start timestamps are preserved', async () => {
    const t0 = Date.parse('2026-10-28T13:30:00Z');
    const existingSession = {
      id: 'session-id-1',
      startTime: new Date(t0).toISOString(),
      endTime: new Date(t0 + 10000).toISOString(),
      durationSeconds: 10,
    };

    const taskWithSession: Task = {
      ...sampleTask1,
      timerSessions: [existingSession],
      totalTrackedSeconds: 10,
    };

    const env = createMockTransactionalEnvironment([taskWithSession]);
    const coordinator = new TimerCoordinator(env.lock, env.db, env.notifications);

    // Another distinct session that happened to start at the exact same second, but with unique sessionId
    const distinctSessionState: ActiveTimerState = {
      taskId: 't-1',
      startTime: existingSession.startTime,
      isRunning: true,
      sessionId: 'session-id-2',
    };

    await env.db.runTransaction(async (stores) => {
      await stores.saveActiveTimer(distinctSessionState);
    });

    await coordinator.pauseTimer(t0 + 25000);

    const task = await env.db.getTask('t-1');
    // Both distinct sessions must exist because session.id is unique
    assert.equal(task?.timerSessions?.length, 2);
    assert.equal(task?.timerSessions?.[0].id, 'session-id-1');
    assert.equal(task?.timerSessions?.[1].id, 'session-id-2');
    assert.equal(task?.totalTrackedSeconds, 35); // 10 + 25 = 35s
  });

  test('Task lifecycle termination: completion commits session and clears active timer', async () => {
    const t0 = Date.parse('2026-10-28T14:00:00Z');
    const initialTimer: ActiveTimerState = {
      taskId: 't-1',
      startTime: new Date(t0).toISOString(),
      isRunning: true,
    };

    const env = createMockTransactionalEnvironment([sampleTask1], initialTimer);
    const coordinator = new TimerCoordinator(env.lock, env.db, env.notifications);

    const { activeTimer, flushedTask } = await coordinator.handleTaskLifecycleTermination(
      't-1',
      t0 + 45000
    );

    assert.equal(activeTimer, null);
    assert.equal(flushedTask?.timerSessions?.length, 1);
    assert.equal(flushedTask?.timerSessions?.[0].durationSeconds, 45);

    const dbTimer = await env.db.getActiveTimer();
    assert.equal(dbTimer, null);
    assert.equal(env.notifications.getItem('daymark_active_task_timer'), null);
  });

  test('reconcileOnStartup cleans up orphaned active timer if task deleted/completed', async () => {
    const initialTimer: ActiveTimerState = {
      taskId: 't-deleted',
      startTime: new Date().toISOString(),
      isRunning: true,
    };

    const env = createMockTransactionalEnvironment([sampleTask1], initialTimer);
    const coordinator = new TimerCoordinator(env.lock, env.db, env.notifications);

    // On startup, task 't-deleted' is missing from loaded tasks
    const reconciled = await coordinator.reconcileOnStartup([sampleTask1]);
    assert.equal(reconciled, null);

    // Orphaned DB record and storage notification are cleared
    assert.equal(await env.db.getActiveTimer(), null);
    assert.equal(env.notifications.getItem('daymark_active_task_timer'), null);
  });

  test('Reset and undo timer state reconciliation when another task starts', async () => {
    const t0 = Date.parse('2026-10-28T15:00:00Z');
    const existingSession = {
      id: 'session-t1',
      startTime: new Date(t0).toISOString(),
      endTime: new Date(t0 + 60000).toISOString(),
      durationSeconds: 60,
    };
    const task1WithHistory: Task = {
      ...sampleTask1,
      timerSessions: [existingSession],
      totalTrackedSeconds: 60,
      actualTime: 1,
    };

    const env = createMockTransactionalEnvironment([task1WithHistory, sampleTask2]);
    const coordinator = new TimerCoordinator(env.lock, env.db, env.notifications);

    // 1. Task 1 has active timer
    await coordinator.startTimer('t-1', t0);
    assert.equal((await env.db.getActiveTimer())?.taskId, 't-1');

    // 2. User resets Task 1
    const resetResult = await coordinator.resetTimer('t-1');
    assert.equal(resetResult.activeTimer, null);
    assert.equal(await env.db.getActiveTimer(), null);

    // 3. User starts Task 2 before clicking undo on Task 1
    await coordinator.startTimer('t-2', t0 + 10000);
    assert.equal((await env.db.getActiveTimer())?.taskId, 't-2');

    // 4. Undo logic checks authoritative timer: if active timer exists, it does NOT resurrect Task 1 timer
    const currentAuthoritative = await coordinator.getAuthoritativeTimer();
    assert.equal(currentAuthoritative?.taskId, 't-2'); // Task 2 is active

    // Undo should restore Task 1 session history and totals to DB, but preserve Task 2 as active
    await env.db.runTransaction(async (stores) => {
      await stores.saveTask(task1WithHistory);
    });

    const finalT1 = await env.db.getTask('t-1');
    assert.equal(finalT1?.totalTrackedSeconds, 60);
    assert.equal(finalT1?.timerSessions?.length, 1);

    const finalActive = await env.db.getActiveTimer();
    assert.equal(finalActive?.taskId, 't-2'); // Remains Task 2
  });
});
