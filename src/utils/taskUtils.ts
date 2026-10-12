import type { Task, RecurrenceRule, Priority } from '../types';
import { addDays, addWeeks, addMonths, format, isAfter, differenceInCalendarDays } from 'date-fns';

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
  tags: string[];
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
  const tags: string[] = [];

  // Extract hashtags: #tag, #tag_name, #tag-1, #café
  // Avoid matching in URLs (e.g. https://...#section) or email addresses
  const tagRegex = /(?:^|\s)#([\p{L}\p{N}_-]+)(?=\s|$|[.,!?;:])/gu;
  const rawTags: string[] = [];
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRegex.exec(workingText)) !== null) {
    rawTags.push(tagMatch[1].toLowerCase());
  }

  if (rawTags.length > 0) {
    // Deduplicate tags while preserving lowercase canonical form
    for (const t of rawTags) {
      if (!tags.includes(t)) {
        tags.push(t);
      }
    }
    // Remove extracted hashtag tokens from title while preserving surrounding punctuation
    workingText = workingText
      .replace(/(^|\s)#[\p{L}\p{N}_-]+(?=\s|$|[.,!?;:])/gu, '$1')
      .trim();
  }

  for (const p of priorities) {
    const lowerPName = p.name.toLowerCase();
    const regex = new RegExp(`\\b(${lowerPName}|${lowerPName}\\s+priority|p:${lowerPName})\\b`, 'i');
    if (regex.test(workingText)) {
      matchedPriorityId = p.id;
      workingText = workingText.replace(regex, '').trim();
      break;
    }
  }

  // Date parsing: Only match unambiguous date expressions.
  // Destructive 2/3 letter abbreviations ('td', 'tmw') are excluded to prevent corrupting
  // words like "TD Bank", "Touchdown", or "TMW".
  if (/\b(today)\b/i.test(workingText)) {
    dueDate = format(new Date(), 'yyyy-MM-dd');
    workingText = workingText.replace(/\b(today)\b/i, '').trim();
  } else if (/\b(tomorrow|tmr)\b/i.test(workingText)) {
    dueDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    workingText = workingText.replace(/\b(tomorrow|tmr)\b/i, '').trim();
  } else if (/\bnext\s+week\b/i.test(workingText)) {
    dueDate = format(addDays(new Date(), 7), 'yyyy-MM-dd');
    workingText = workingText.replace(/\bnext\s+week\b/i, '').trim();
  }

  // Time parsing:
  // Require explicit "at <time>" or an "am/pm" marker (e.g. "at 4", "at 4:30", "4pm", "4:30pm").
  // Bare colon numbers like "3:16" or "2:1" without "at" or "am/pm" are NOT parsed as times
  // so ordinary section numbers, chapter verses, ratios, and scores remain intact.
  const timeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i;
  const timeMatch = workingText.match(timeRegex);
  if (timeMatch) {
    // Check if the actual matched token starts with "at" (case-insensitive)
    const hasAt = /^at\s+/i.test(timeMatch[0]);
    const hasAmPm = !!timeMatch[3];

    if (hasAt || hasAmPm) {
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
    tags,
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

export interface DaysToCalculation {
  diffDays: number;
  label: string;
  sublabel: string;
  isToday: boolean;
  isTomorrow: boolean;
  isPast: boolean;
}

export function calculateDaysTo(targetDateStr: string, referenceDateStr?: string): DaysToCalculation | null {
  if (!targetDateStr || !/^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
    return null;
  }

  const todayStr = referenceDateStr || format(new Date(), 'yyyy-MM-dd');
  const targetDate = parseLocalDate(targetDateStr);
  const todayDate = parseLocalDate(todayStr);

  const diffDays = differenceInCalendarDays(targetDate, todayDate);

  if (diffDays === 0) {
    return {
      diffDays: 0,
      label: 'Today',
      sublabel: 'Due today',
      isToday: true,
      isTomorrow: false,
      isPast: false,
    };
  }

  if (diffDays === 1) {
    return {
      diffDays: 1,
      label: '1 day',
      sublabel: 'Tomorrow',
      isToday: false,
      isTomorrow: true,
      isPast: false,
    };
  }

  if (diffDays > 1) {
    return {
      diffDays,
      label: `${diffDays} days`,
      sublabel: 'Remaining',
      isToday: false,
      isTomorrow: false,
      isPast: false,
    };
  }

  if (diffDays === -1) {
    return {
      diffDays: -1,
      label: 'Passed',
      sublabel: '1 day ago',
      isToday: false,
      isTomorrow: false,
      isPast: true,
    };
  }

  const absDays = Math.abs(diffDays);
  return {
    diffDays,
    label: 'Passed',
    sublabel: `${absDays} days ago`,
    isToday: false,
    isTomorrow: false,
    isPast: true,
  };
}
