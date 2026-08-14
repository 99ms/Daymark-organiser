import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task } from '../types';
import { TaskItem } from '../components/TaskItem';
import { format, parseISO, addDays, addMonths } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

interface UpcomingViewProps {
  onEditTask: (task: Task) => void;
}

export const UpcomingView: React.FC<UpcomingViewProps> = ({ onEditTask }) => {
  const { tasks } = useOrganiser();
  const [filterPeriod, setFilterPeriod] = useState<'all' | 'tomorrow' | 'this_week' | 'next_week' | 'month'>('all');

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  const weekEndStr = format(addDays(new Date(), 7), 'yyyy-MM-dd');
  const nextWeekEndStr = format(addDays(new Date(), 14), 'yyyy-MM-dd');
  const monthEndStr = format(addMonths(new Date(), 1), 'yyyy-MM-dd');

  const futureTasks = tasks.filter((t) => {
    if (t.archived || t.completed || !t.dueDate) return false;
    if (t.dueDate <= todayStr) return false;

    if (filterPeriod === 'tomorrow') return t.dueDate === tomorrowStr;
    if (filterPeriod === 'this_week') return t.dueDate > todayStr && t.dueDate <= weekEndStr;
    if (filterPeriod === 'next_week') return t.dueDate > weekEndStr && t.dueDate <= nextWeekEndStr;
    if (filterPeriod === 'month') return t.dueDate > todayStr && t.dueDate <= monthEndStr;
    return true;
  });

  const groupedTasks: { [date: string]: Task[] } = {};
  futureTasks.forEach((t) => {
    if (!groupedTasks[t.dueDate]) groupedTasks[t.dueDate] = [];
    groupedTasks[t.dueDate].push(t);
  });

  const sortedDates = Object.keys(groupedTasks).sort();

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
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={20} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Upcoming Schedule</h2>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Upcoming' },
            { id: 'tomorrow', label: 'Tomorrow' },
            { id: 'this_week', label: 'This Week' },
            { id: 'next_week', label: 'Next Week' },
            { id: 'month', label: 'This Month' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilterPeriod(item.id as any)}
              className={`btn ${filterPeriod === item.id ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.35rem 0.8rem', fontSize: '0.82rem' }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {sortedDates.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            backgroundColor: 'var(--bg-card)',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border-color)',
          }}
        >
          <Calendar size={40} style={{ color: 'var(--text-muted)', marginBottom: '0.75rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>No upcoming tasks for selected period</h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Enjoy the clear horizon!
          </p>
        </div>
      ) : (
        sortedDates.map((dateStr) => {
          const dateObj = parseISO(dateStr);
          const dateTitle = format(dateObj, 'EEEE, MMMM d, yyyy');

          return (
            <div key={dateStr}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-primary)', marginBottom: '0.6rem' }}>
                {dateTitle}
              </h3>
              {groupedTasks[dateStr].map((task) => (
                <TaskItem key={task.id} task={task} onEdit={onEditTask} />
              ))}
            </div>
          );
        })
      )}
    </div>
  );
};
