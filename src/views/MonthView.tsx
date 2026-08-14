import React from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  subMonths,
  addMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export const MonthView: React.FC = () => {
  const { selectedDate, setSelectedDate, setCurrentView, tasks, priorities } = useOrganiser();

  const currentObj = parseISO(selectedDate);
  const monthStart = startOfMonth(currentObj);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const handlePrevMonth = () => {
    setSelectedDate(format(subMonths(currentObj, 1), 'yyyy-MM-dd'));
  };

  const handleNextMonth = () => {
    setSelectedDate(format(addMonths(currentObj, 1), 'yyyy-MM-dd'));
  };

  const daysGrid: Date[] = [];
  let dayIter = startDate;
  while (dayIter <= endDate) {
    daysGrid.push(dayIter);
    dayIter = addDays(dayIter, 1);
  }

  const weekDayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Header */}
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
          <CalendarIcon size={22} style={{ color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{format(monthStart, 'MMMM yyyy')}</h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button onClick={handlePrevMonth} className="btn btn-secondary btn-icon" title="Previous Month">
            <ChevronLeft size={18} />
          </button>
          <button onClick={handleNextMonth} className="btn btn-secondary btn-icon" title="Next Month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Days of Week Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontWeight: 700,
          fontSize: 'var(--font-sm)',
          color: 'var(--text-muted)',
          padding: '0.4rem 0',
        }}
      >
        {weekDayLabels.map((lbl) => (
          <div key={lbl}>{lbl}</div>
        ))}
      </div>

      {/* Month Calendar Grid */}
      <div className="month-grid">
        {daysGrid.map((day) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isSelected = dateStr === selectedDate;

          const dayTasks = tasks.filter((t) => !t.archived && t.dueDate === dateStr);
          const completedCount = dayTasks.filter((t) => t.completed).length;

          return (
            <div
              key={dateStr}
              onClick={() => {
                setSelectedDate(dateStr);
                setCurrentView('day');
              }}
              style={{
                backgroundColor: isSelected ? 'var(--bg-hover)' : 'var(--bg-card)',
                border: isSelected
                  ? '2px solid var(--accent-primary)'
                  : isToday
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '0.65rem',
                minHeight: '105px',
                opacity: isCurrentMonth ? 1 : 0.4,
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 'var(--font-base)',
                    color: isToday ? 'var(--accent-primary)' : 'var(--text-primary)',
                  }}
                >
                  {format(day, 'd')}
                </span>
                {dayTasks.length > 0 && (
                  <span
                    style={{
                      fontSize: 'var(--font-xs)',
                      fontWeight: 600,
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--bg-tertiary)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {completedCount}/{dayTasks.length}
                  </span>
                )}
              </div>

              {/* Priority dots or compact indicators */}
              <div style={{ display: 'flex', gap: '3px', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                {dayTasks.slice(0, 5).map((t) => {
                  const p = priorities.find((pr) => pr.id === t.priorityId);
                  return (
                    <span
                      key={t.id}
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        backgroundColor: p?.color || '#94a3b8',
                      }}
                      title={t.title}
                    />
                  );
                })}
                {dayTasks.length > 5 && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                    +{dayTasks.length - 5}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
