import type { Task, RecurrenceRule, Priority } from '../types';
import { addDays, addWeeks, addMonths, format, isAfter } from 'date-fns';

export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function getNextRecurrenceDate(currentDateStr: string, rule: RecurrenceRule): string | null {
  if (!currentDateStr) return null;
  const current = parseLocalDate(currentDateStr);
  let nextDate: Date;

  switch (rule.frequency) {
    case 'daily':
      nextDate = addDays(current, rule.interval || 1);
      break;

    case 'weekdays': {
      let candidate = addDays(current, 1);
      while (candidate.getDay() === 0 || candidate.getDay() === 6) {
        candidate = addDays(candidate, 1);
      }
      nextDate = candidate;
      break;
    }

    case 'weekly':
      nextDate = addWeeks(current, rule.interval || 1);
      break;

    case 'monthly':
      nextDate = addMonths(current, rule.interval || 1);
      break;

    case 'custom': {
      if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
        let candidate = addDays(current, 1);
        let count = 0;
        while (!rule.daysOfWeek.includes(candidate.getDay()) && count < 14) {
          candidate = addDays(candidate, 1);
          count++;
        }
        nextDate = candidate;
      } else {
        nextDate = addDays(current, rule.interval || 1);
      }
      break;
    }

    default:
      nextDate = addDays(current, 1);
  }

  const nextDateStr = format(nextDate, 'yyyy-MM-dd');
  if (rule.endDate && isAfter(nextDate, parseLocalDate(rule.endDate))) {
    return null;
  }

  return nextDateStr;
}

export interface ParsedQuickAdd {
  title: string;
  dueDate: string;
  dueTime?: string;
  priorityId?: string;
}

export function parseNaturalLanguageTask(
  text: string,
  priorities: Priority[],
  defaultPriorityId: string,
  defaultDueDate?: string
): ParsedQuickAdd {
  let workingText = text.trim();
  let dueDate = defaultDueDate !== undefined ? defaultDueDate : format(new Date(), 'yyyy-MM-dd');
  let dueTime: string | undefined = undefined;
  let matchedPriorityId: string | undefined = undefined;

  for (const p of priorities) {
    const lowerPName = p.name.toLowerCase();
    const regex = new RegExp(`\\b(${lowerPName}|${lowerPName}\\s+priority|p:${lowerPName})\\b`, 'i');
    if (regex.test(workingText)) {
      matchedPriorityId = p.id;
      workingText = workingText.replace(regex, '').trim();
      break;
    }
  }

  if (/\b(today|td)\b/i.test(workingText)) {
    dueDate = format(new Date(), 'yyyy-MM-dd');
    workingText = workingText.replace(/\b(today|td)\b/i, '').trim();
  } else if (/\b(tomorrow|tmr|tmw)\b/i.test(workingText)) {
    dueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    workingText = workingText.replace(/\b(tomorrow|tmr|tmw)\b/i, '').trim();
  } else if (/\bnext\s+week\b/i.test(workingText)) {
    dueDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    workingText = workingText.replace(/\bnext\s+week\b/i, '').trim();
  }

  const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const timeMatch = workingText.match(timeRegex);
  if (timeMatch) {
    const hasAt = /\bat\s+\d/i.test(workingText);
    const hasAmPm = !!timeMatch[3];
    const hasColon = !!timeMatch[2];

    if (hasAt || hasAmPm || hasColon) {
      let hours = parseInt(timeMatch[1], 10);
      const minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      const ampm = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

      if (ampm === 'pm' && hours < 12) hours += 12;
      if (ampm === 'am' && hours === 12) hours = 0;

      if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
        dueTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        workingText = workingText.replace(timeMatch[0], '').trim();
      }
    }
  }

  const title = workingText.replace(/\s+/g, ' ').trim() || text.trim();

  return {
    title,
    dueDate,
    dueTime,
    priorityId: matchedPriorityId || defaultPriorityId,
  };
}

export function isTaskOverdue(task: Task, referenceDateStr: string = format(new Date(), 'yyyy-MM-dd')): boolean {
  if (task.completed || !task.dueDate) return false;
  return task.dueDate < referenceDateStr;
}

export function filterTasks(
  tasks: Task[],
  options: {
    searchQuery?: string;
    priorityId?: string;
    categoryId?: string;
    projectId?: string;
    tag?: string;
    completed?: boolean;
    overdueOnly?: boolean;
    date?: string;
  }
): Task[] {
  return tasks.filter((t) => {
    if (t.archived) return false;

    if (options.completed !== undefined && t.completed !== options.completed) {
      return false;
    }

    if (options.priorityId && t.priorityId !== options.priorityId) {
      return false;
    }

    if (options.categoryId && t.categoryId !== options.categoryId) {
      return false;
    }

    if (options.projectId && t.projectId !== options.projectId) {
      return false;
    }

    if (options.tag && !t.tags.includes(options.tag)) {
      return false;
    }

    if (options.overdueOnly && !isTaskOverdue(t)) {
      return false;
    }

    if (options.date && t.dueDate !== options.date) {
      return false;
    }

    if (options.searchQuery && options.searchQuery.trim()) {
      const q = options.searchQuery.toLowerCase().trim();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q) || false;
      const matchTag = t.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchNote = t.notes?.toLowerCase().includes(q) || false;

      if (q.startsWith('priority:')) {
        const pName = q.replace('priority:', '');
        return t.priorityId.toLowerCase().includes(pName);
      }
      if (q.startsWith('category:')) {
        const cName = q.replace('category:', '');
        return t.categoryId.toLowerCase().includes(cName);
      }

      if (!matchTitle && !matchDesc && !matchTag && !matchNote) {
        return false;
      }
    }

    return true;
  });
}
