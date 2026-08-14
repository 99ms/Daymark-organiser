import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task, RecurrenceFrequency, ReminderType } from '../types';
import { X, Calendar, Clock, Tag, Repeat, Bell, Flag, Folder, Trash2, Plus } from 'lucide-react';

interface TaskEditorModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: string;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({
  task,
  isOpen,
  onClose,
  defaultDate,
}) => {
  const {
    addTask,
    updateTask,
    priorities,
    categories,
    projects,
    selectedDate,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
  } = useOrganiser();

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [dueDate, setDueDate] = useState(task?.dueDate || defaultDate || selectedDate || '');
  const [dueTime, setDueTime] = useState(task?.dueTime || '');
  const [duration, setDuration] = useState<number>(task?.duration || 30);
  const [priorityId, setPriorityId] = useState(task?.priorityId || priorities[0]?.id || 'p-med');
  const [categoryId, setCategoryId] = useState(task?.categoryId || categories[0]?.id || 'c-work');
  const [projectId, setProjectId] = useState(task?.projectId || '');
  const [tagsInput, setTagsInput] = useState(task?.tags ? task.tags.join(', ') : '');
  const [isTopPriority, setIsTopPriority] = useState(task?.isTopPriority || false);
  const [notes] = useState(task?.notes || '');
  const [reminder, setReminder] = useState<ReminderType>(task?.reminder || 'none');

  const [hasRecurrence, setHasRecurrence] = useState(!!task?.recurrence);
  const [recFreq, setRecFreq] = useState<RecurrenceFrequency>(task?.recurrence?.frequency || 'daily');

  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const recurrence = hasRecurrence ? { frequency: recFreq } : undefined;

    if (task) {
      await updateTask({
        ...task,
        title: title.trim(),
        description,
        dueDate,
        dueTime: dueTime || undefined,
        duration: Number(duration) || 30,
        priorityId,
        categoryId,
        projectId: projectId || undefined,
        tags: parsedTags,
        isTopPriority,
        notes,
        reminder,
        recurrence,
      });
    } else {
      await addTask({
        title: title.trim(),
        description,
        dueDate,
        dueTime: dueTime || undefined,
        duration: Number(duration) || 30,
        priorityId,
        categoryId,
        projectId: projectId || undefined,
        tags: parsedTags,
        isTopPriority,
        notes,
        reminder,
        recurrence,
      });
    }
    onClose();
  };

  const handleAddSubtaskLocal = async () => {
    if (!newSubtaskTitle.trim() || !task) return;
    await addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
            {task ? 'Edit Task' : 'Create New Task'}
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              TASK TITLE *
            </label>
            <input
              type="text"
              placeholder="e.g. Finish quarterly presentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
              DESCRIPTION
            </label>
            <textarea
              rows={2}
              placeholder="Add details, links, or context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', marginTop: '0.25rem' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Calendar size={14} /> DUE DATE
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                style={{ width: '100%', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={14} /> DUE TIME
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                style={{ width: '100%', marginTop: '0.25rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                EST. DURATION (MINS)
              </label>
              <input
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{ width: '100%', marginTop: '0.25rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Flag size={14} /> PRIORITY
              </label>
              <select
                value={priorityId}
                onChange={(e) => setPriorityId(e.target.value)}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                {priorities.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                CATEGORY
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Folder size={14} /> PROJECT
              </label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                <option value="">No Project</option>
                {projects.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Tag size={14} /> TAGS (comma separated)
              </label>
              <input
                type="text"
                placeholder="design, work, urgent"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                style={{ width: '100%', marginTop: '0.25rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label
                style={{
                  fontSize: '0.82rem',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <input
                  type="checkbox"
                  checked={hasRecurrence}
                  onChange={(e) => setHasRecurrence(e.target.checked)}
                />
                <Repeat size={14} /> RECURRING TASK
              </label>
              {hasRecurrence && (
                <select
                  value={recFreq}
                  onChange={(e) => setRecFreq(e.target.value as RecurrenceFrequency)}
                  style={{ width: '100%', marginTop: '0.25rem' }}
                >
                  <option value="daily">Every day</option>
                  <option value="weekdays">Weekdays (Mon-Fri)</option>
                  <option value="weekly">Every week</option>
                  <option value="monthly">Every month</option>
                </select>
              )}
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Bell size={14} /> REMINDER
              </label>
              <select
                value={reminder}
                onChange={(e) => setReminder(e.target.value as ReminderType)}
                style={{ width: '100%', marginTop: '0.25rem' }}
              >
                <option value="none">No reminder</option>
                <option value="at_due">At due time</option>
                <option value="5m">5 minutes before</option>
                <option value="15m">15 minutes before</option>
                <option value="30m">30 minutes before</option>
                <option value="1h">1 hour before</option>
                <option value="1d">1 day before</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="top-priority-check"
              checked={isTopPriority}
              onChange={(e) => setIsTopPriority(e.target.checked)}
            />
            <label htmlFor="top-priority-check" style={{ fontSize: '0.9rem', cursor: 'pointer' }}>
              Designate as Top Priority for the day
            </label>
          </div>

          {task && (
            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, display: 'block', marginBottom: '0.5rem' }}>
                SUBTASKS ({task.subtasks.filter((s) => s.completed).length}/{task.subtasks.length})
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', marginBottom: '0.5rem' }}>
                {task.subtasks.map((st) => (
                  <div
                    key={st.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontSize: '0.88rem',
                      background: 'var(--bg-tertiary)',
                      padding: '0.3rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleSubtask(task.id, st.id)}
                    />
                    <span style={{ flex: 1, textDecoration: st.completed ? 'line-through' : 'none' }}>
                      {st.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteSubtask(task.id, st.id)}
                      className="btn-icon"
                      style={{ width: 22, height: 22, color: '#ef4444' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSubtaskLocal();
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={handleAddSubtaskLocal} className="btn btn-secondary">
                  <Plus size={16} /> Add
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
