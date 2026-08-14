import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Goal } from '../types';
import { Target, Plus, CheckCircle, Trash2 } from 'lucide-react';

export const GoalsView: React.FC = () => {
  const { goals, addGoal, updateGoal, deleteGoal } = useOrganiser();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [targetCount, setTargetCount] = useState(5);
  const [unit, setUnit] = useState('tasks');
  const [showAdd, setShowAdd] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await addGoal({
      title: title.trim(),
      type,
      targetCount: Number(targetCount),
      unit: unit.trim() || 'tasks',
      currentCount: 0,
    });

    setTitle('');
    setShowAdd(false);
  };

  const handleIncrement = async (goal: Goal) => {
    const nextCount = Math.min(goal.currentCount + 1, goal.targetCount);
    await updateGoal({
      ...goal,
      currentCount: nextCount,
      completed: nextCount >= goal.targetCount,
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Target size={24} style={{ color: 'var(--accent-primary)' }} />
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Personal Productivity Goals</h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              Track lightweight daily, weekly, and monthly target metrics.
            </p>
          </div>
        </div>

        <button onClick={() => setShowAdd(!showAdd)} className="btn btn-primary">
          <Plus size={16} /> Add Goal
        </button>
      </div>

      {showAdd && (
        <form
          onSubmit={handleCreate}
          style={{
            backgroundColor: 'var(--bg-card)',
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr 1fr auto',
            gap: '0.75rem',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>GOAL TITLE</label>
            <input
              type="text"
              placeholder="e.g. Apply to 5 companies"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>PERIOD</label>
            <select value={type} onChange={(e) => setType(e.target.value as any)}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TARGET</label>
            <input
              type="number"
              min={1}
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
            />
          </div>
          <div>
            <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>UNIT</label>
            <input
              type="text"
              placeholder="applications, hours..."
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Save
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {goals.map((g) => {
          const pct = Math.round((g.currentCount / g.targetCount) * 100);
          return (
            <div
              key={g.id}
              style={{
                backgroundColor: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.2rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: 'var(--accent-primary)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--accent-light)',
                    }}
                  >
                    {g.type}
                  </span>
                  <button onClick={() => deleteGoal(g.id)} className="btn-icon" style={{ color: '#ef4444' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginTop: '0.5rem' }}>{g.title}</h3>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {g.currentCount} / {g.targetCount} {g.unit}
                  </span>
                  <span style={{ fontWeight: 700 }}>{pct}%</span>
                </div>
                <div style={{ height: 6, backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, backgroundColor: g.completed ? '#10b981' : 'var(--accent-primary)' }} />
                </div>
              </div>

              <button
                onClick={() => handleIncrement(g)}
                disabled={g.completed}
                className={`btn ${g.completed ? 'btn-secondary' : 'btn-primary'}`}
                style={{ width: '100%' }}
              >
                {g.completed ? <CheckCircle size={16} /> : '+ Log Progress'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
