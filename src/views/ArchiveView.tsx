import React from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task } from '../types';
import { Archive, Search } from 'lucide-react';
import { TaskItem } from '../components/TaskItem';

interface ArchiveViewProps {
  onEditTask: (task: Task) => void;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ onEditTask }) => {
  const { tasks } = useOrganiser();
  const [filter, setFilter] = React.useState('');

  const completedOrArchived = tasks.filter((t) => {
    if (!t.completed && !t.archived) return false;
    if (filter) {
      return t.title.toLowerCase().includes(filter.toLowerCase());
    }
    return true;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Archive size={24} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Completed Task History & Archive</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Review past accomplishments and searchable archive records.
            </p>
          </div>
        </div>

        <div style={{ position: 'relative', width: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Filter archive..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '100%', paddingLeft: '2.2rem' }}
          />
        </div>
      </div>

      <div>
        {completedOrArchived.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            No archived or completed tasks match your search.
          </div>
        ) : (
          completedOrArchived.map((task) => <TaskItem key={task.id} task={task} onEdit={onEditTask} showDate />)
        )}
      </div>
    </div>
  );
};
