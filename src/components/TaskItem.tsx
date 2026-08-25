import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task } from '../types';
import {
  Check,
  Calendar as CalendarIcon,
  Clock,
  Tag,
  Star,
  Trash2,
  Edit2,
  FolderKanban,
  ChevronDown,
  ChevronUp,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { isTaskOverdue } from '../utils/taskUtils';

interface TaskItemProps {
  task: Task;
  onEdit: (task: Task) => void;
  showDate?: boolean;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onEdit, showDate = false }) => {
  const {
    toggleCompleteTask,
    deleteTask,
    archiveTask,
    unarchiveTask,
    toggleTopPriority,
    priorities,
    categories,
    projects,
    rescheduleTask,
  } = useOrganiser();

  const [expanded, setExpanded] = useState(false);

  const priority = priorities.find((p) => p.id === task.priorityId) || priorities[0];
  const category = categories.find((c) => c.id === task.categoryId);
  const project = projects.find((p) => p.id === task.projectId);
  const overdue = isTaskOverdue(task);

  const completedSubtasksCount = task.subtasks.filter((st) => st.completed).length;
  const totalSubtasksCount = task.subtasks.length;

  return (
    <div
      className={`task-item ${task.completed ? 'completed' : ''}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="task-item-main">
        {/* Checkbox */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleCompleteTask(task.id);
          }}
          className={`task-checkbox ${task.completed ? 'checked' : ''}`}
          title={task.completed ? 'Mark uncompleted' : 'Mark complete'}
        >
          {task.completed && <Check size={15} strokeWidth={3} />}
        </button>

        {/* Primary Row Content */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <span
            className="task-title"
            style={{
              fontSize: 'var(--font-lg)',
              fontWeight: 600,
              color: 'var(--text-primary)',
            }}
          >
            {task.title}
          </span>

          {/* Primary Details: Priority dot & date/time */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginLeft: 'auto', fontSize: 'var(--font-sm)', color: 'var(--text-muted)' }}>
            {showDate && task.dueDate && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: overdue ? '#ef4444' : 'inherit', fontWeight: overdue ? 700 : 500 }}>
                <CalendarIcon size={14} />
                {task.dueDate} {overdue && '(Overdue)'}
              </span>
            )}

            {task.dueTime && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={14} />
                {task.dueTime}
              </span>
            )}

            {priority && (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  color: priority.color,
                  fontWeight: 600,
                  fontSize: 'var(--font-sm)',
                }}
              >
                <span className="priority-indicator" style={{ backgroundColor: priority.color }} />
                {priority.name}
              </span>
            )}
          </div>
        </div>

        {/* Hover / Touch Actions */}
        <div className="task-item-actions" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => toggleTopPriority(task.id)}
            className="btn-icon"
            style={{ width: 34, height: 34, color: task.isTopPriority ? '#f59e0b' : 'var(--text-muted)' }}
            title={task.isTopPriority ? 'Remove Top Priority' : 'Set as Top Priority'}
          >
            <Star size={18} fill={task.isTopPriority ? '#f59e0b' : 'none'} />
          </button>

          {overdue && (
            <button
              onClick={() => rescheduleTask(task.id, new Date().toISOString().split('T')[0])}
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: 'var(--font-sm)', color: '#ef4444', minHeight: '34px' }}
              title="Move overdue task to today"
            >
              Move to Today
            </button>
          )}

          <button
            onClick={() => onEdit(task)}
            className="btn-icon"
            style={{ width: 34, height: 34 }}
            title="Edit task"
          >
            <Edit2 size={16} />
          </button>

          {task.archived ? (
            <button
              onClick={() => unarchiveTask(task.id)}
              className="btn-icon"
              style={{ width: 34, height: 34, color: 'var(--accent-primary)' }}
              title="Restore task to active views"
              aria-label="Restore task to active views"
            >
              <ArchiveRestore size={16} />
            </button>
          ) : (
            <button
              onClick={() => archiveTask(task.id)}
              className="btn-icon"
              style={{ width: 34, height: 34, color: 'var(--text-muted)' }}
              title="Archive task"
              aria-label="Archive task"
            >
              <Archive size={16} />
            </button>
          )}

          <button
            onClick={() => deleteTask(task.id)}
            className="btn-icon"
            style={{ width: 34, height: 34, color: '#ef4444' }}
            title="Delete task"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={() => setExpanded(!expanded)}
            className="btn-icon"
            style={{ width: 30, height: 30 }}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Progressive Disclosure Panel */}
      {expanded && (
        <div className="task-expanded-panel" onClick={(e) => e.stopPropagation()}>
          {task.description && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-base)', lineHeight: 1.5 }}>
              {task.description}
            </div>
          )}

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            {category && (
              <span className="category-tag">
                <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: category.color }} />
                {category.name}
              </span>
            )}

            {project && (
              <span className="category-tag" style={{ borderColor: project.color }}>
                <FolderKanban size={14} style={{ color: project.color }} />
                {project.name}
              </span>
            )}

            {totalSubtasksCount > 0 && (
              <span style={{ color: 'var(--text-muted)' }}>
                Subtasks: {completedSubtasksCount} / {totalSubtasksCount} completed
              </span>
            )}

            {task.tags.map((tag) => (
              <span key={tag} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                <Tag size={13} /> #{tag}
              </span>
            ))}
          </div>

          {task.notes && (
            <div style={{ fontStyle: 'italic', color: 'var(--text-muted)', background: 'var(--bg-tertiary)', padding: '0.5rem 0.85rem', borderRadius: 'var(--radius-sm)' }}>
              Note: {task.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
