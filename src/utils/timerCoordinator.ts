import type { ActiveTimerState, Task, TimerSession } from '../types';
import {
  ACTIVE_TIMER_STORAGE_KEY,
  parseActiveTimerState,
  createFinalizedSession,
  applySessionToTask,
} from './timerUtils.ts';

export const TIMER_COORDINATION_LOCK = 'daymark_timer_coordinator_lock';

/**
 * Storage adapter interface for secondary cross-tab notification cache (localStorage).
 */
export interface StorageNotificationAdapter {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

/**
 * Transactional DB store abstraction to encapsulate the tasks & settings object stores.
 */
export interface TransactionalTimerDB {
  /**
   * Executes an atomic read-write transaction over the necessary stores (e.g. settings and tasks).
   * If any error is thrown, the transaction aborts automatically.
   */
  runTransaction<T>(
    operation: (stores: {
      getTask: (id: string) => Promise<Task | undefined>;
      saveTask: (task: Task) => Promise<void>;
      getActiveTimer: () => Promise<ActiveTimerState | null>;
      saveActiveTimer: (state: ActiveTimerState | null) => Promise<void>;
    }) => Promise<T>
  ): Promise<T>;

  /**
   * Fast non-transactional read for initial bootstrap or query.
   */
  getActiveTimer(): Promise<ActiveTimerState | null>;
  getTask(id: string): Promise<Task | undefined>;
}

/**
 * Lock adapter interface to support Web Locks API with fallback.
 */
export interface LockAdapter {
  request: <T>(name: string, callback: () => Promise<T>) => Promise<T>;
}

// In-memory fallback mutex for environments without Web Locks (e.g. Node or unsupported browsers)
class InProcessMutex implements LockAdapter {
  private queue: Promise<void> = Promise.resolve();

  async request<T>(_name: string, callback: () => Promise<T>): Promise<T> {
    let release: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      release = resolve;
    });

    const previousQueue = this.queue;
    this.queue = previousQueue.then(() => lockPromise);

    await previousQueue;
    try {
      return await callback();
    } finally {
      release();
    }
  }
}

export const inProcessMutex = new InProcessMutex();

/**
 * Default browser lock adapter utilizing navigator.locks when available.
 * If Web Locks is not available, falls back to the in-process mutex.
 */
export const defaultLockAdapter: LockAdapter = {
  request: async <T>(name: string, callback: () => Promise<T>): Promise<T> => {
    if (typeof navigator !== 'undefined' && 'locks' in navigator && navigator.locks?.request) {
      return await navigator.locks.request(name, async () => {
        return await callback();
      });
    }
    return await inProcessMutex.request(name, callback);
  },
};

/**
 * Default localStorage adapter used purely as an auxiliary notification channel for StorageEvents.
 */
export const defaultNotificationAdapter: StorageNotificationAdapter = {
  getItem: (key: string) => {
    try {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
      }
    } catch (e) {
      console.warn('Failed to set localStorage notification key:', key, e);
    }
  },
  removeItem: (key: string) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
    } catch (e) {
      console.warn('Failed to remove localStorage notification key:', key, e);
    }
  },
};

let defaultDbGetter: () => Promise<any> = async () => {
  const { getDB } = await import('../services/db.ts');
  return await getDB();
};

export function setDefaultDbGetter(getter: () => Promise<any>) {
  defaultDbGetter = getter;
}

/**
 * Default TransactionalTimerDB implementation using IndexedDB 'tasks' and 'settings' stores.
 */
export const defaultTransactionalTimerDB: TransactionalTimerDB = {
  async runTransaction<T>(
    operation: (stores: {
      getTask: (id: string) => Promise<Task | undefined>;
      saveTask: (task: Task) => Promise<void>;
      getActiveTimer: () => Promise<ActiveTimerState | null>;
      saveActiveTimer: (state: ActiveTimerState | null) => Promise<void>;
    }) => Promise<T>
  ): Promise<T> {
    const db = await defaultDbGetter();
    const tx = db.transaction(['tasks', 'settings'], 'readwrite');
    const tasksStore = tx.objectStore('tasks');
    const settingsStore = tx.objectStore('settings');

    const stores = {
      getTask: async (id: string): Promise<Task | undefined> => {
        return await tasksStore.get(id);
      },
      saveTask: async (task: Task): Promise<void> => {
        await tasksStore.put(task);
      },
      getActiveTimer: async (): Promise<ActiveTimerState | null> => {
        const record = await settingsStore.get('active_task_timer');
        if (record && record.state) {
          return parseActiveTimerState(JSON.stringify(record.state));
        }
        return null;
      },
      saveActiveTimer: async (state: ActiveTimerState | null): Promise<void> => {
        if (state) {
          await settingsStore.put({ id: 'active_task_timer', state });
        } else {
          await settingsStore.delete('active_task_timer');
        }
      },
    };

    const result = await operation(stores);
    await tx.done;
    return result;
  },

  async getActiveTimer(): Promise<ActiveTimerState | null> {
    try {
      const db = await defaultDbGetter();
      const record = await db.get('settings', 'active_task_timer');
      if (record && record.state) {
        return parseActiveTimerState(JSON.stringify(record.state));
      }
    } catch (e) {
      console.warn('Failed to read active timer from DB settings store:', e);
    }
    return null;
  },

  async getTask(id: string): Promise<Task | undefined> {
    const db = await defaultDbGetter();
    return await db.get('tasks', id);
  },
};

/**
 * Result returned by atomic coordinator operations.
 */
export interface MutationResult {
  activeTimer: ActiveTimerState | null;
  updatedTasks: Task[];
}

/**
 * Coordinator engine that guarantees atomic single-active-timer transitions.
 * Authoritative state is stored in IndexedDB ('settings' and 'tasks' stores) via transactions.
 * localStorage is used strictly as a secondary notification channel for cross-tab StorageEvents.
 */
export class TimerCoordinator {
  private lock: LockAdapter;
  private db: TransactionalTimerDB;
  private notifications: StorageNotificationAdapter;

  constructor(
    lock: LockAdapter = defaultLockAdapter,
    db: TransactionalTimerDB = defaultTransactionalTimerDB,
    notifications: StorageNotificationAdapter = defaultNotificationAdapter
  ) {
    this.lock = lock;
    this.db = db;
    this.notifications = notifications;
  }

  /**
   * Broadcasts active timer update to other tabs via localStorage.
   */
  private broadcastNotification(timer: ActiveTimerState | null): void {
    try {
      if (timer) {
        this.notifications.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(timer));
      } else {
        this.notifications.removeItem(ACTIVE_TIMER_STORAGE_KEY);
      }
    } catch {
      // Non-fatal broadcast error
    }
  }

  /**
   * Reads the current authoritative ActiveTimerState directly from IndexedDB.
   */
  async getAuthoritativeTimer(): Promise<ActiveTimerState | null> {
    return await this.db.getActiveTimer();
  }

  /**
   * Helper executed within transaction: flushes active running segment to task if needed.
   * Uses the stable sessionId as the primary deduplication key across retries.
   */
  private finalizeAndApplySegment(
    active: ActiveTimerState,
    task: Task,
    nowMs: number
  ): { updatedTask: Task; session: TimerSession } | null {
    if (!active.isRunning || !active.startTime) {
      return null;
    }

    const session = createFinalizedSession(active, nowMs);
    if (!session) {
      return null;
    }

    // Idempotency: prevent duplicate session using session.id as the primary deduplication key
    const hasDuplicate = (task.timerSessions || []).some(
      (s) => s.id === session.id
    );
    if (hasDuplicate) {
      return null;
    }

    const updatedTask = applySessionToTask(task, session);
    return { updatedTask, session };
  }

  /**
   * Serialized start operation:
   * Atomic IndexedDB transaction:
   * 1. Acquires coordination lock.
   * 2. Reads authoritative timer and task from DB inside transaction.
   * 3. Validates task exists and is eligible (not completed, not archived).
   * 4. If another task (or same task) was running, finalizes its elapsed session to DB.
   * 5. Sets active timer record to target task with isRunning: true in 'settings' store.
   * 6. Commits transaction.
   * 7. Broadcasts to localStorage.
   */
  async startTimer(taskId: string, nowMs: number = Date.now()): Promise<MutationResult> {
    return await this.lock.request(TIMER_COORDINATION_LOCK, async () => {
      const { newActive, updatedTasks } = await this.db.runTransaction(async (stores) => {
        const task = await stores.getTask(taskId);
        if (!task) {
          throw new Error(`Cannot start timer: Task "${taskId}" not found`);
        }
        if (task.completed) {
          throw new Error(`Cannot start timer: Task "${task.title}" is already completed`);
        }
        if (task.archived) {
          throw new Error(`Cannot start timer: Task "${task.title}" is archived`);
        }

        const currentActive = await stores.getActiveTimer();
        const updatedTasksList: Task[] = [];

        // If already running this exact task, no-op
        if (currentActive && currentActive.taskId === taskId && currentActive.isRunning) {
          return { newActive: currentActive, updatedTasks: [] };
        }

        // Flush running segment if there was one
        if (currentActive && currentActive.isRunning) {
          const currentTask =
            currentActive.taskId === taskId ? task : await stores.getTask(currentActive.taskId);

          if (currentTask) {
            const flushResult = this.finalizeAndApplySegment(currentActive, currentTask, nowMs);
            if (flushResult) {
              await stores.saveTask(flushResult.updatedTask);
              updatedTasksList.push(flushResult.updatedTask);
            }
          }
        }

        const nextActive: ActiveTimerState = {
          taskId,
          startTime: new Date(nowMs).toISOString(),
          isRunning: true,
          sessionId: 'ts-' + nowMs + '-' + Math.random().toString(36).substring(2, 6),
        };

        await stores.saveActiveTimer(nextActive);
        return { newActive: nextActive, updatedTasks: updatedTasksList };
      });

      this.broadcastNotification(newActive);
      return { activeTimer: newActive, updatedTasks };
    });
  }

  /**
   * Serialized pause operation:
   * Atomic IndexedDB transaction:
   * 1. Reads authoritative timer.
   * 2. Flushes running segment into task sessions.
   * 3. Updates active timer record in DB with isRunning: false.
   * 4. Commits transaction.
   * 5. Broadcasts notification.
   */
  async pauseTimer(nowMs: number = Date.now()): Promise<MutationResult> {
    return await this.lock.request(TIMER_COORDINATION_LOCK, async () => {
      const { pausedState, updatedTasks } = await this.db.runTransaction(async (stores) => {
        const currentActive = await stores.getActiveTimer();
        const updatedTasksList: Task[] = [];

        if (!currentActive || !currentActive.isRunning) {
          return { pausedState: currentActive, updatedTasks: [] };
        }

        const task = await stores.getTask(currentActive.taskId);
        if (task) {
          const flushResult = this.finalizeAndApplySegment(currentActive, task, nowMs);
          if (flushResult) {
            await stores.saveTask(flushResult.updatedTask);
            updatedTasksList.push(flushResult.updatedTask);
          }
        }

        const paused: ActiveTimerState = {
          taskId: currentActive.taskId,
          startTime: new Date(nowMs).toISOString(),
          isRunning: false,
        };

        await stores.saveActiveTimer(paused);
        return { pausedState: paused, updatedTasks: updatedTasksList };
      });

      this.broadcastNotification(pausedState);
      return { activeTimer: pausedState, updatedTasks };
    });
  }

  /**
   * Serialized resume operation:
   * Atomic IndexedDB transaction:
   * 1. Reads authoritative timer and task.
   * 2. Verifies eligibility.
   * 3. Sets isRunning: true with fresh startTime.
   * 4. Commits transaction and broadcasts.
   */
  async resumeTimer(nowMs: number = Date.now()): Promise<MutationResult> {
    return await this.lock.request(TIMER_COORDINATION_LOCK, async () => {
      const { resumedState, updatedTasks } = await this.db.runTransaction(async (stores) => {
        const currentActive = await stores.getActiveTimer();
        if (!currentActive || currentActive.isRunning) {
          return { resumedState: currentActive, updatedTasks: [] };
        }

        const task = await stores.getTask(currentActive.taskId);
        if (!task || task.completed || task.archived) {
          await stores.saveActiveTimer(null);
          return { resumedState: null, updatedTasks: [] };
        }

        const resumed: ActiveTimerState = {
          taskId: currentActive.taskId,
          startTime: new Date(nowMs).toISOString(),
          isRunning: true,
          sessionId: 'ts-' + nowMs + '-' + Math.random().toString(36).substring(2, 6),
        };

        await stores.saveActiveTimer(resumed);
        return { resumedState: resumed, updatedTasks: [] };
      });

      this.broadcastNotification(resumedState);
      return { activeTimer: resumedState, updatedTasks };
    });
  }

  /**
   * Serialized stop operation:
   * Atomic IndexedDB transaction:
   * 1. Reads authoritative timer and task.
   * 2. Flushes running segment into task sessions.
   * 3. Deletes active timer record from DB.
   * 4. Commits transaction and clears notification cache.
   */
  async stopTimer(nowMs: number = Date.now()): Promise<MutationResult> {
    return await this.lock.request(TIMER_COORDINATION_LOCK, async () => {
      const { updatedTasks } = await this.db.runTransaction(async (stores) => {
        const currentActive = await stores.getActiveTimer();
        const updatedTasksList: Task[] = [];

        if (!currentActive) {
          await stores.saveActiveTimer(null);
          return { updatedTasks: [] };
        }

        if (currentActive.isRunning) {
          const task = await stores.getTask(currentActive.taskId);
          if (task) {
            const flushResult = this.finalizeAndApplySegment(currentActive, task, nowMs);
            if (flushResult) {
              await stores.saveTask(flushResult.updatedTask);
              updatedTasksList.push(flushResult.updatedTask);
            }
          }
        }

        await stores.saveActiveTimer(null);
        return { updatedTasks: updatedTasksList };
      });

      this.broadcastNotification(null);
      return { activeTimer: null, updatedTasks };
    });
  }

  /**
   * Serialized reset operation for a specific task:
   * Atomic IndexedDB transaction:
   * 1. Resets task timerSessions, actualTime, and totalTrackedSeconds to 0.
   * 2. If the active timer belonged to this task, clears it from DB.
   * 3. Commits transaction.
   */
  async resetTimer(taskId: string): Promise<MutationResult> {
    return await this.lock.request(TIMER_COORDINATION_LOCK, async () => {
      const { nextActive, updatedTasks } = await this.db.runTransaction(async (stores) => {
        const currentActive = await stores.getActiveTimer();
        let activeChanged = false;

        if (currentActive && currentActive.taskId === taskId) {
          await stores.saveActiveTimer(null);
          activeChanged = true;
        }

        const task = await stores.getTask(taskId);
        const updatedTasksList: Task[] = [];
        if (task) {
          const updated: Task = {
            ...task,
            timerSessions: [],
            totalTrackedSeconds: 0,
            actualTime: 0,
            updatedAt: new Date().toISOString(),
          };
          await stores.saveTask(updated);
          updatedTasksList.push(updated);
        }

        return {
          nextActive: activeChanged ? null : currentActive,
          updatedTasks: updatedTasksList,
        };
      });

      this.broadcastNotification(nextActive);
      return { activeTimer: nextActive, updatedTasks };
    });
  }

  /**
   * Atomic task lifecycle termination (complete, delete, archive):
   * Inside single transaction:
   * 1. Checks if active timer belongs to this task.
   * 2. If running, finalizes session directly on the task.
   * 3. Clears active timer from DB.
   * 4. Commits transaction and broadcasts notification.
   */
  async handleTaskLifecycleTermination(
    taskId: string,
    nowMs: number = Date.now()
  ): Promise<{ activeTimer: ActiveTimerState | null; flushedTask: Task | null }> {
    return await this.lock.request(TIMER_COORDINATION_LOCK, async () => {
      const { flushedTask } = await this.db.runTransaction(async (stores) => {
        const currentActive = await stores.getActiveTimer();
        if (!currentActive || currentActive.taskId !== taskId) {
          return { flushedTask: null };
        }

        let updatedTask: Task | null = null;
        if (currentActive.isRunning) {
          const task = await stores.getTask(taskId);
          if (task) {
            const flushResult = this.finalizeAndApplySegment(currentActive, task, nowMs);
            if (flushResult) {
              await stores.saveTask(flushResult.updatedTask);
              updatedTask = flushResult.updatedTask;
            }
          }
        }

        await stores.saveActiveTimer(null);
        return { flushedTask: updatedTask };
      });

      this.broadcastNotification(null);
      return { activeTimer: null, flushedTask };
    });
  }

  /**
   * Reconciles authoritative state on startup or recovery:
   * 1. Loads authoritative timer from DB.
   * 2. Validates referenced task exists and is active. If invalid, cleans up DB atomically.
   * 3. Syncs notification cache.
   */
  async reconcileOnStartup(tasks: Task[]): Promise<ActiveTimerState | null> {
    const authoritative = await this.getAuthoritativeTimer();
    if (!authoritative) {
      this.broadcastNotification(null);
      return null;
    }

    const task = tasks.find((t) => t.id === authoritative.taskId);
    if (!task || task.completed || task.archived) {
      await this.db.runTransaction(async (stores) => {
        await stores.saveActiveTimer(null);
      });
      this.broadcastNotification(null);
      return null;
    }

    this.broadcastNotification(authoritative);
    return authoritative;
  }
}

export const defaultTimerCoordinator = new TimerCoordinator();
