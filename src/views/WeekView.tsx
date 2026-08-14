import React from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task } from '../types';
import {
  format,
  parseISO,
  startOfWeek,
  addDays,
  subWeeks,
  addWeeks,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react';

interface WeekViewProps {
  onEditTask: (task: Task) => void;
  onOpenNewTaskModalForDate: (dateStr: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
  onEditTask,
  onOpenNewTaskModalForDate,
}) => {
  const { selectedDate, setSelectedDate, tasks, priorities } = useOrganiser();

  const currentObj = parseISO(selectedDate);
  const weekStart = startOfWeek(currentObj, { weekStartsOn: 1 });

  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const handlePrevWeek = () => {
    setSelectedDate(format(subWeeks(currentObj, 1), 'yyyy-MM-dd'));
  };

  const handleNextWeek = () => {
    setSelectedDate(format(addWeeks(currentObj, 1), 'yyyy-MM-dd'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Calendar size={22} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
              Week of {format(weekStart, 'MMMM d')} – {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={handlePrevWeek} className="btn btn-secondary btn-icon" title="Previous Week">
            <ChevronLeft size={18} />
          </button>
          <button onClick={handleNextWeek} className="btn btn-secondary btn-icon" title="Next Week">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="week-grid">
        {weekDays.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isToday = format(new Date(), 'yyyy-MM-dd') === dateStr;
          const isSelected = dateStr === selectedDate;

          const dayTasks = tasks.filter((t) => !t.archived && t.dueDate === dateStr);
          const completedCount = dayTasks.filter((t) => t.completed).length;

          return (
            <div
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              style={{
                backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-card)',
                border: isSelected
                  ? '2px solid var(--accent-primary)'
                  : isToday
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
                minHeight: '220px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '0.75rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: 'var(--font-sm)', fontWeight: 700, color: 'var(--text-muted)' }}>
                    {format(day, 'EEE')}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--font-lg)',
                      fontWeight: 700,
                      color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                    }}
                  >
                    {format(day, 'd')}
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenNewTaskModalForDate(dateStr);
                  }}
                  className="btn-icon"
                  style={{ width: 30, height: 30 }}
                  title="Add task to this day"
                >
                  <Plus size={16} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {dayTasks.map((task) => {
                  const p = priorities.find((pr) => pr.id === task.priorityId);
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditTask(task);
                      }}
                      style={{
                        padding: '0.55rem 0.65rem',
                        backgroundColor: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--font-md)',
                        borderLeft: `4px solid ${p?.color || 'var(--border-color)'}`,
                        opacity: task.completed ? 0.6 : 1,
                        textDecoration: task.completed ? 'line-through' : 'none',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {task.title}
                      </div>
                      {task.dueTime && (
                        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                          {task.dueTime}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {dayTasks.length > 0 && (
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    marginTop: '0.4rem',
                    textAlign: 'right',
                  }}
                >
                  {completedCount}/{dayTasks.length} done
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
