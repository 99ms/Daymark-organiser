import React from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task } from '../types';
import { TaskItem } from '../components/TaskItem';
import { format, parseISO, addDays, subDays } from 'date-fns';
import { QuickAddBar } from '../components/QuickAddBar';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface DayViewProps {
  onEditTask: (task: Task) => void;
}

export const DayView: React.FC<DayViewProps> = ({ onEditTask }) => {
  const { selectedDate, setSelectedDate, tasks, searchQuery, selectedCategoryId } = useOrganiser();

  const currentObj = parseISO(selectedDate);
  const formattedDayStr = format(currentObj, 'EEEE, MMMM d, yyyy');

  const dayTasks = tasks.filter((t) => {
    if (t.archived) return false;
    if (t.dueDate !== selectedDate) return false;
    if (selectedCategoryId && t.categoryId !== selectedCategoryId) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!t.title.toLowerCase().includes(q) && !t.tags.some((tag) => tag.toLowerCase().includes(q))) {
        return false;
      }
    }
    return true;
  });

  const topPriorities = dayTasks.filter((t) => t.isTopPriority);
  const regularTasks = dayTasks.filter((t) => !t.isTopPriority);

  const completedCount = dayTasks.filter((t) => t.completed).length;
  const totalCount = dayTasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handlePrevDay = () => {
    setSelectedDate(format(subDays(currentObj, 1), 'yyyy-MM-dd'));
  };

  const handleNextDay = () => {
    setSelectedDate(format(addDays(currentObj, 1), 'yyyy-MM-dd'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Date Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-2xl)', fontWeight: 800 }}>{formattedDayStr}</h1>
          <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {completedCount} of {totalCount} tasks completed ({completionPercentage}%)
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button onClick={handlePrevDay} className="btn btn-secondary btn-icon" style={{ width: 44, height: 44 }} title="Previous Day">
            <ChevronLeft size={20} />
          </button>
          <button onClick={handleNextDay} className="btn btn-secondary btn-icon" style={{ width: 44, height: 44 }} title="Next Day">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <QuickAddBar />

      {/* Top Priorities Section */}
      {topPriorities.length > 0 && (
        <section>
          <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, color: '#f59e0b', marginBottom: '1rem' }}>
            Top Priorities
          </h2>
          <div>
            {topPriorities.map((task) => (
              <TaskItem key={task.id} task={task} onEdit={onEditTask} />
            ))}
          </div>
        </section>
      )}

      {/* Main Tasks List */}
      <section>
        <h2 style={{ fontSize: 'var(--font-xl)', fontWeight: 700, marginBottom: '1rem' }}>
          All Scheduled Tasks
        </h2>

        {dayTasks.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '4rem 1rem',
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border-color)',
            }}
          >
            <CheckCircle2 size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem' }} />
            <h3 style={{ fontSize: 'var(--font-xl)', fontWeight: 700 }}>Your day is clear!</h3>
            <p style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginTop: '0.35rem' }}>
              No tasks scheduled for {format(currentObj, 'EEEE, MMM d')}.
            </p>
          </div>
        ) : (
          regularTasks.map((task) => <TaskItem key={task.id} task={task} onEdit={onEditTask} />)
        )}
      </section>
    </div>
  );
};
