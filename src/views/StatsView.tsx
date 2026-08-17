import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { ProductivityHeatmap } from '../components/ProductivityHeatmap';
import { BarChart3, Eye } from 'lucide-react';

export const StatsView: React.FC = () => {
  const { tasks, priorities, categories, settings, updateSettings } = useOrganiser();
  const [heatmapVisible, setHeatmapVisible] = useState<boolean>(settings.showHeatmapInStats !== false);

  const handleToggleHeatmap = () => {
    const next = !heatmapVisible;
    setHeatmapVisible(next);
    updateSettings({ showHeatmapInStats: next });
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed);
  const completionRate = totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <BarChart3 size={24} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Productivity Analytics</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Insights into task velocity, priorities, and category distribution.
            </p>
          </div>
        </div>

        {!heatmapVisible && (
          <button
            onClick={handleToggleHeatmap}
            className="btn btn-secondary"
            style={{ fontSize: 'var(--font-xs)', gap: '0.4rem' }}
          >
            <Eye size={16} /> Show Activity Heatmap
          </button>
        )}
      </div>

      <ProductivityHeatmap
        visible={heatmapVisible}
        showToggle={true}
        onToggleVisibility={handleToggleHeatmap}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL TASKS CREATED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '0.2rem' }}>{totalTasks}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>TASKS COMPLETED</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#10b981', marginTop: '0.2rem' }}>{completedTasks.length}</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>COMPLETION RATE</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: 'var(--accent-primary)', marginTop: '0.2rem' }}>{completionRate}%</div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>BEST STREAK</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 700, color: '#f59e0b', marginTop: '0.2rem' }}>12 Days 🔥</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Completion by Priority</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {priorities.map((p) => {
              const pTasks = tasks.filter((t) => t.priorityId === p.id);
              const pDone = pTasks.filter((t) => t.completed).length;
              const pPct = pTasks.length > 0 ? Math.round((pDone / pTasks.length) * 100) : 0;
              return (
                <div key={p.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: p.color, fontWeight: 600 }}>{p.name} Priority</span>
                    <span>{pDone}/{pTasks.length} ({pPct}%)</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pPct}%`, backgroundColor: p.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1rem' }}>Completion by Category</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {categories.map((c) => {
              const cTasks = tasks.filter((t) => t.categoryId === c.id);
              const cDone = cTasks.filter((t) => t.completed).length;
              const cPct = cTasks.length > 0 ? Math.round((cDone / cTasks.length) * 100) : 0;
              return (
                <div key={c.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: c.color, fontWeight: 600 }}>{c.name}</span>
                    <span>{cDone}/{cTasks.length} ({cPct}%)</span>
                  </div>
                  <div style={{ height: 6, backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${cPct}%`, backgroundColor: c.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
