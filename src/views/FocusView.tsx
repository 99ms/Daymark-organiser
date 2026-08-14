import React, { useState, useEffect } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { Play, Pause, CheckCircle2, ArrowLeft } from 'lucide-react';

export const FocusView: React.FC = () => {
  const { tasks, activeFocusTaskId, setCurrentView, toggleCompleteTask } = useOrganiser();

  const focusTask = tasks.find((t) => t.id === activeFocusTaskId) || tasks.find((t) => !t.completed) || tasks[0];

  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');

  useEffect(() => {
    let interval: any = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isRunning) {
      setIsRunning(false);
      if (mode === 'work') {
        alert('Pomodoro work session complete! Take a 5-minute break.');
        setMode('break');
        setSecondsLeft(5 * 60);
      } else {
        alert('Break finished! Ready to focus again?');
        setMode('work');
        setSecondsLeft(25 * 60);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, secondsLeft, mode]);

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = (mins: number) => {
    setIsRunning(false);
    setSecondsLeft(mins * 60);
  };

  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 'calc(100vh - 120px)',
        textAlign: 'center',
        gap: '2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%', maxWidth: '600px', justifyContent: 'flex-start' }}>
        <button onClick={() => setCurrentView('day')} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Planner
        </button>
      </div>

      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem 3rem',
          maxWidth: '500px',
          width: '100%',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}
      >
        <span
          style={{
            fontSize: 'var(--font-sm)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: mode === 'work' ? 'var(--accent-primary)' : '#10b981',
            padding: '0.3rem 0.85rem',
            borderRadius: 'var(--radius-full)',
            background: mode === 'work' ? 'var(--accent-light)' : 'rgba(16, 185, 129, 0.15)',
          }}
        >
          {mode === 'work' ? 'Focus Work Session' : 'Rest Break'}
        </span>

        <div style={{ fontSize: '5.5rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '-0.03em' }}>
          {timeFormatted}
        </div>

        {focusTask && (
          <div
            style={{
              width: '100%',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              textAlign: 'left',
            }}
          >
            <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', fontWeight: 700 }}>CURRENT TASK</div>
            <div style={{ fontWeight: 700, fontSize: 'var(--font-lg)', marginTop: '0.3rem' }}>{focusTask.title}</div>
            {focusTask.description && (
              <div style={{ fontSize: 'var(--font-base)', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                {focusTask.description}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <button onClick={() => resetTimer(25)} className="btn btn-secondary" title="25m Pomodoro">
            25m
          </button>

          <button
            onClick={toggleTimer}
            className="btn btn-primary"
            style={{ width: '72px', height: '72px', borderRadius: '50%', padding: 0 }}
          >
            {isRunning ? <Pause size={32} /> : <Play size={32} style={{ marginLeft: '4px' }} />}
          </button>

          <button onClick={() => resetTimer(5)} className="btn btn-secondary" title="5m Short Break">
            5m
          </button>
        </div>

        {focusTask && (
          <button
            onClick={() => toggleCompleteTask(focusTask.id)}
            className="btn btn-secondary"
            style={{ width: '100%', color: '#10b981' }}
          >
            <CheckCircle2 size={18} /> Mark Task Completed
          </button>
        )}
      </div>
    </div>
  );
};
