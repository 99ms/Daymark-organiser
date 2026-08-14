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
}

const DB_NAME = 'DailyOrganiserDB';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<OrganiserDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OrganiserDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
        taskStore.createIndex('by-dueDate', 'dueDate');
        taskStore.createIndex('by-category', 'categoryId');
        taskStore.createIndex('by-priority', 'priorityId');

        db.createObjectStore('priorities', { keyPath: 'id' });
        db.createObjectStore('categories', { keyPath: 'id' });
        db.createObjectStore('projects', { keyPath: 'id' });
        db.createObjectStore('goals', { keyPath: 'id' });
        db.createObjectStore('notes', { keyPath: 'id' });
        db.createObjectStore('templates', { keyPath: 'id' });
        db.createObjectStore('settings', { keyPath: 'id' });
      },
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
