import React, { useMemo } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { format, subDays, startOfWeek, addDays, parseISO, isSameDay } from 'date-fns';
import { Calendar, EyeOff } from 'lucide-react';

interface ProductivityHeatmapProps {
  showToggle?: boolean;
  onToggleVisibility?: () => void;
  visible?: boolean;
}

export const ProductivityHeatmap: React.FC<ProductivityHeatmapProps> = ({
  showToggle = false,
  onToggleVisibility,
  visible = true,
}) => {
  const { tasks } = useOrganiser();

  // 1. Calculate date -> count map efficiently once per tasks change
  const { completionMap, totalCompletionsInYear, activeDaysCount } = useMemo(() => {
    const map = new Map<string, number>();
    let total = 0;

    for (const task of tasks) {
      if (task.completed && task.completedAt) {
        try {
          const dateStr = format(parseISO(task.completedAt), 'yyyy-MM-dd');
          const current = map.get(dateStr) || 0;
          const next = current + 1;
          map.set(dateStr, next);
          total++;
        } catch {
          // ignore invalid date strings
        }
      }
    }

    return {
      completionMap: map,
      totalCompletionsInYear: total,
      activeDaysCount: map.size,
    };
  }, [tasks]);

  // 2. Generate 52 weeks (364 days) grid ending on today
  const weeksData = useMemo(() => {
    const today = new Date();
    // Start grid 51 weeks before the start of the current week (52 weeks total)
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 0 }); // Sunday start
    const gridStart = subDays(currentWeekStart, 51 * 7);

    const weeks: { date: Date; dateStr: string; count: number; dayOfWeek: number }[][] = [];

    let curDate = gridStart;
    for (let w = 0; w < 52; w++) {
      const daysInWeek: { date: Date; dateStr: string; count: number; dayOfWeek: number }[] = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = format(curDate, 'yyyy-MM-dd');
        const count = completionMap.get(dateStr) || 0;
        daysInWeek.push({
          date: curDate,
          dateStr,
          count,
          dayOfWeek: d,
        });
        curDate = addDays(curDate, 1);
      }
      weeks.push(daysInWeek);
    }

    return weeks;
  }, [completionMap]);

  // 3. Month labels header calculation
  const monthLabels = useMemo(() => {
    const labels: { name: string; colIndex: number }[] = [];
    let lastMonth = -1;

    weeksData.forEach((week, colIdx) => {
      const firstDayOfWeek = week[0].date;
      const m = firstDayOfWeek.getMonth();
      if (m !== lastMonth) {
        labels.push({
          name: format(firstDayOfWeek, 'MMM'),
          colIndex: colIdx,
        });
        lastMonth = m;
      }
    });

    return labels;
  }, [weeksData]);

  // 4. Intensity level calculation (5-level scale: 0, 1, 2, 3, 4+)
  const getLevel = (count: number): 0 | 1 | 2 | 3 | 4 => {
    if (count <= 0) return 0;
    if (count === 1) return 1;
    if (count <= 3) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  // Helper for cell background style depending on level
  const getCellBg = (level: 0 | 1 | 2 | 3 | 4) => {
    switch (level) {
      case 0:
        return 'var(--bg-tertiary)';
      case 1:
        return 'rgba(99, 102, 241, 0.3)';
      case 2:
        return 'rgba(99, 102, 241, 0.55)';
      case 3:
        return 'rgba(99, 102, 241, 0.8)';
      case 4:
        return 'var(--accent-primary)';
    }
  };

  if (!visible) return null;

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1.4rem 1.6rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
      }}
    >
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={20} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Productivity Activity</h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
            {totalCompletionsInYear} completed tasks across {activeDaysCount} active days
          </span>
          {showToggle && onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="btn-icon"
              style={{ width: 28, height: 28 }}
              title="Hide Productivity Activity heatmap"
              aria-label="Hide Productivity Activity heatmap"
            >
              <EyeOff size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Centered Compact Heatmap Wrapper Container */}
      <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
        <div style={{ overflowX: 'auto', maxWidth: '100%', paddingBottom: '0.5rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', width: 'max-content', margin: '0 auto' }}>
            {/* Month Labels Row */}
            <div style={{ display: 'flex', paddingLeft: '45px', position: 'relative', height: '22px' }}>
              {monthLabels.map((lbl, idx) => (
                <span
                  key={idx}
                  style={{
                    position: 'absolute',
                    left: `${45 + lbl.colIndex * 27.5}px`,
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--text-muted)',
                  }}
                >
                  {lbl.name}
                </span>
              ))}
            </div>

            {/* Grid Content: Day Labels + Week Columns */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* Day of Week Labels (Sun, Tue, Thu, Sat) */}
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '35px', height: '185px', paddingTop: '1px' }}>
                <span style={{ fontSize: '11px', lineHeight: '20px', color: 'var(--text-muted)' }}>Sun</span>
                <span style={{ fontSize: '11px', lineHeight: '20px', color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '11px', lineHeight: '20px', color: 'var(--text-muted)' }}>Tue</span>
                <span style={{ fontSize: '11px', lineHeight: '20px', color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '11px', lineHeight: '20px', color: 'var(--text-muted)' }}>Thu</span>
                <span style={{ fontSize: '11px', lineHeight: '20px', color: 'var(--text-muted)' }} />
                <span style={{ fontSize: '11px', lineHeight: '20px', color: 'var(--text-muted)' }}>Sat</span>
              </div>

              {/* 52 Columns */}
              <div style={{ display: 'flex', gap: '7.5px' }}>
                {weeksData.map((week, wIdx) => (
                  <div key={wIdx} style={{ display: 'flex', flexDirection: 'column', gap: '7.5px' }}>
                    {week.map((cell) => {
                      const level = getLevel(cell.count);
                      const isToday = isSameDay(cell.date, new Date());
                      const tooltipText = `${format(cell.date, 'MMMM d, yyyy')} — ${cell.count} task${cell.count === 1 ? '' : 's'} completed`;

                      return (
                        <div
                          key={cell.dateStr}
                          tabIndex={0}
                          title={tooltipText}
                          aria-label={tooltipText}
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '4px',
                            backgroundColor: getCellBg(level),
                            border: isToday ? '2px solid var(--text-primary)' : 'none',
                            cursor: 'pointer',
                            outline: 'none',
                            transition: 'transform 0.1s ease',
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Bar with Left-Aligned Legend aligned to Heatmap Content */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '0.6rem', paddingLeft: '45px', fontSize: '12px', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 600 }}>Less</span>
                <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: getCellBg(0) }} />
                <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: getCellBg(1) }} />
                <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: getCellBg(2) }} />
                <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: getCellBg(3) }} />
                <div style={{ width: 16, height: 16, borderRadius: 3, backgroundColor: getCellBg(4) }} />
                <span style={{ fontWeight: 600 }}>More</span>
              </div>

              <span>{totalCompletionsInYear === 0 ? 'No task completion activity recorded yet.' : 'Hover or focus cell for details.'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
