import type { DBSchema, IDBPDatabase } from 'idb';
import { openDB } from 'idb';
import type { Task, Priority, Category, Project, Goal, Note, TaskTemplate, UserSettings } from '../types';
import {
  DEFAULT_PRIORITIES,
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  DEFAULT_PROJECTS,
  DEFAULT_GOALS,
  DEFAULT_TEMPLATES,
  DEFAULT_NOTES,
  SAMPLE_TASKS,
} from './sampleData';

export interface SafetySnapshot {
  id: string; // e.g. 'snap_1786699990'
  timestamp: string;
  trigger: 'manual' | 'before_import' | 'before_reset' | 'migration';
  version: number;
  data: {
    tasks: Task[];
    priorities: Priority[];
    categories: Category[];
    projects: Project[];
    goals: Goal[];
    notes: Note[];
    templates: TaskTemplate[];
    settings: UserSettings;
  };
}

interface OrganiserDB extends DBSchema {
  tasks: {
    key: string;
    value: Task;
    indexes: { 'by-dueDate': string; 'by-category': string; 'by-priority': string };
  };
  priorities: { key: string; value: Priority };
  categories: { key: string; value: Category };
  projects: { key: string; value: Project };
  goals: { key: string; value: Goal };
  notes: { key: string; value: Note };
  templates: { key: string; value: TaskTemplate };
  settings: { key: string; value: UserSettings };
  safety_snapshots: { key: string; value: SafetySnapshot };
}

const DB_NAME = 'DailyOrganiserDB';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<OrganiserDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OrganiserDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-dueDate', 'dueDate');
          taskStore.createIndex('by-category', 'categoryId');
          taskStore.createIndex('by-priority', 'priorityId');
        }

        if (!db.objectStoreNames.contains('priorities')) db.createObjectStore('priorities', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('projects')) db.createObjectStore('projects', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('goals')) db.createObjectStore('goals', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('notes')) db.createObjectStore('notes', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('templates')) db.createObjectStore('templates', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('safety_snapshots')) db.createObjectStore('safety_snapshots', { keyPath: 'id' });
      },
      blocked(currentVersion, blockedVersion) {
        console.warn(`Database upgrade from v${currentVersion} to v${blockedVersion} blocked.`);
      },
      blocking(currentVersion, blockedVersion, event) {
        console.warn(`Database connection (v${currentVersion}) blocking v${blockedVersion} upgrade. Closing connection.`);
        // Close database connection so the upgrade request can proceed without hanging
        const db = (event.target as any)?.result;
        if (db && typeof db.close === 'function') {
          db.close();
        }
        dbPromise = null;
      },
      terminated() {
        console.error('Database connection unexpectedly terminated.');
        dbPromise = null;
      },
    }).catch((err) => {
      console.error('Failed to open IndexedDB:', err);
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function initializeDatabaseWithSeedData(): Promise<{
  tasks: Task[];
  priorities: Priority[];
  categories: Category[];
  projects: Project[];
  goals: Goal[];
  notes: Note[];
  templates: TaskTemplate[];
  settings: UserSettings;
}> {
  const db = await getDB();
  const existingSettings = await db.get('settings', 'user_settings');

  if (!existingSettings) {
    const tx = db.transaction(
      ['tasks', 'priorities', 'categories', 'projects', 'goals', 'notes', 'templates', 'settings'],
      'readwrite'
    );

    for (const p of DEFAULT_PRIORITIES) await tx.objectStore('priorities').put(p);
    for (const c of DEFAULT_CATEGORIES) await tx.objectStore('categories').put(c);
    for (const pr of DEFAULT_PROJECTS) await tx.objectStore('projects').put(pr);
    for (const g of DEFAULT_GOALS) await tx.objectStore('goals').put(g);
    for (const n of DEFAULT_NOTES) await tx.objectStore('notes').put(n);
    for (const t of DEFAULT_TEMPLATES) await tx.objectStore('templates').put(t);
    for (const task of SAMPLE_TASKS) await tx.objectStore('tasks').put(task);

    const settingsWithKey = { ...DEFAULT_SETTINGS, id: 'user_settings' } as any;
    await tx.objectStore('settings').put(settingsWithKey);

    await tx.done;
  }

  const tasks = await db.getAll('tasks');
  const priorities = await db.getAll('priorities');
  const categories = await db.getAll('categories');
  const projects = await db.getAll('projects');
  const goals = await db.getAll('goals');
  const notes = await db.getAll('notes');
  const templates = await db.getAll('templates');
  const settingsObj = (await db.get('settings', 'user_settings')) || DEFAULT_SETTINGS;

  return {
    tasks,
    priorities: priorities.length ? priorities : DEFAULT_PRIORITIES,
    categories: categories.length ? categories : DEFAULT_CATEGORIES,
    projects,
    goals,
    notes,
    templates,
    settings: settingsObj,
  };
}

export async function saveTaskToDB(task: Task) {
  const db = await getDB();
  await db.put('tasks', task);
}

export async function deleteTaskFromDB(id: string) {
  const db = await getDB();
  await db.delete('tasks', id);
}

export async function savePriorityToDB(priority: Priority) {
  const db = await getDB();
  await db.put('priorities', priority);
}

export async function deletePriorityFromDB(id: string) {
  const db = await getDB();
  await db.delete('priorities', id);
}

export async function saveCategoryToDB(category: Category) {
  const db = await getDB();
  await db.put('categories', category);
}

export async function deleteCategoryFromDB(id: string) {
  const db = await getDB();
  await db.delete('categories', id);
}

export async function saveProjectToDB(project: Project) {
  const db = await getDB();
  await db.put('projects', project);
}

export async function deleteProjectFromDB(id: string) {
  const db = await getDB();
  await db.delete('projects', id);
}

export async function saveGoalToDB(goal: Goal) {
  const db = await getDB();
  await db.put('goals', goal);
}

export async function deleteGoalFromDB(id: string) {
  const db = await getDB();
  await db.delete('goals', id);
}

export async function saveNoteToDB(note: Note) {
  const db = await getDB();
  await db.put('notes', note);
}

export async function deleteNoteFromDB(id: string) {
  const db = await getDB();
  await db.delete('notes', id);
}

export async function saveTemplateToDB(template: TaskTemplate) {
  const db = await getDB();
  await db.put('templates', template);
}

export async function deleteTemplateFromDB(id: string) {
  const db = await getDB();
  await db.delete('templates', id);
}

export async function saveSettingsToDB(settings: UserSettings) {
  const db = await getDB();
  await db.put('settings', { ...settings, id: 'user_settings' } as any);
}

export async function clearAllDataFromDB() {
  const db = await getDB();
  await db.clear('tasks');
  await db.clear('priorities');
  await db.clear('categories');
  await db.clear('projects');
  await db.clear('goals');
  await db.clear('notes');
  await db.clear('templates');
  await db.clear('settings');
}

export async function createSafetySnapshot(trigger: 'manual' | 'before_import' | 'before_reset' | 'migration'): Promise<SafetySnapshot> {
  const db = await getDB();
  const tasks = await db.getAll('tasks');
  const priorities = await db.getAll('priorities');
  const categories = await db.getAll('categories');
  const projects = await db.getAll('projects');
  const goals = await db.getAll('goals');
  const notes = await db.getAll('notes');
  const templates = await db.getAll('templates');
  const settingsObj = (await db.get('settings', 'user_settings')) || DEFAULT_SETTINGS;

  const rawData = {
    tasks,
    priorities,
    categories,
    projects,
    goals,
    notes,
    templates,
    settings: settingsObj,
  };

  // Ensure structured clone compatibility by serializing to clean JSON object
  const cleanData = JSON.parse(JSON.stringify(rawData));

  const snapshot: SafetySnapshot = {
    id: `snap_${Date.now()}`,
    timestamp: new Date().toISOString(),
    trigger,
    version: DB_VERSION,
    data: cleanData,
  };

  await db.put('safety_snapshots', snapshot);

  // Prune rolling snapshots to keep latest 5
  const allSnapshots = await db.getAll('safety_snapshots');
  if (allSnapshots.length > 5) {
    allSnapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    const toDelete = allSnapshots.slice(5);
    for (const snap of toDelete) {
      await db.delete('safety_snapshots', snap.id);
    }
  }

  return snapshot;
}

export async function getSafetySnapshots(): Promise<SafetySnapshot[]> {
  const db = await getDB();
  const snapshots = await db.getAll('safety_snapshots');
  return snapshots.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

export async function restoreSafetySnapshot(snapshotId: string): Promise<SafetySnapshot['data']> {
  const db = await getDB();
  const snapshot = await db.get('safety_snapshots', snapshotId);
  if (!snapshot) {
    throw new Error(`Snapshot ${snapshotId} not found`);
  }

  await clearAllDataFromDB();

  const tx = db.transaction(
    ['tasks', 'priorities', 'categories', 'projects', 'goals', 'notes', 'templates', 'settings'],
    'readwrite'
  );

  for (const t of snapshot.data.tasks || []) await tx.objectStore('tasks').put(t);
  for (const p of snapshot.data.priorities || []) await tx.objectStore('priorities').put(p);
  for (const c of snapshot.data.categories || []) await tx.objectStore('categories').put(c);
  for (const pr of snapshot.data.projects || []) await tx.objectStore('projects').put(pr);
  for (const g of snapshot.data.goals || []) await tx.objectStore('goals').put(g);
  for (const n of snapshot.data.notes || []) await tx.objectStore('notes').put(n);
  for (const tm of snapshot.data.templates || []) await tx.objectStore('templates').put(tm);
  if (snapshot.data.settings) {
    await tx.objectStore('settings').put({ ...snapshot.data.settings, id: 'user_settings' } as any);
  }

  await tx.done;
  return snapshot.data;
}
