import React from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task } from '../types';
import { TaskItem } from '../components/TaskItem';
import { QuickAddBar } from '../components/QuickAddBar';
import { Inbox as InboxIcon } from 'lucide-react';

interface InboxViewProps {
  onEditTask: (task: Task) => void;
}

export const InboxView: React.FC<InboxViewProps> = ({ onEditTask }) => {
  const { tasks } = useOrganiser();

  const inboxTasks = tasks.filter((t) => !t.archived && !t.dueDate);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <InboxIcon size={24} style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Inbox / Quick Capture</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Dump thoughts & tasks quickly without worrying about dates. Organize them later.
          </p>
        </div>
      </div>

      <QuickAddBar
        defaultDueDate=""
        placeholder='Quick capture to inbox (e.g. "Buy coffee" or "Review proposal tomorrow")'
      />

      <div>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
          Unscheduled Tasks ({inboxTasks.length})
        </h3>

        {inboxTasks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <InboxIcon size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Inbox is empty</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              All captured items are organized!
            </p>
          </div>
        ) : (
          inboxTasks.map((task) => <TaskItem key={task.id} task={task} onEdit={onEditTask} />)
        )}
      </div>
    </div>
  );
};
