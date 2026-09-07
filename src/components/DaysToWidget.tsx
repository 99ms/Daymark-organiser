import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { CalendarClock, Edit2, Plus, X, Check, Trash2, AlertCircle } from 'lucide-react';
import { calculateDaysTo, parseLocalDate } from '../utils/taskUtils';
import { format } from 'date-fns';

export const DaysToWidget: React.FC = () => {
  const { settings, updateSettings } = useOrganiser();
  const event = settings.daysToEvent;

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(event?.title || '');
  const [targetDate, setTargetDate] = useState(event?.targetDate || '');
  const [errorMsg, setErrorMsg] = useState('');

  const calculation = event?.targetDate ? calculateDaysTo(event.targetDate) : null;

  const handleStartEdit = () => {
    setTitle(event?.title || '');
    setTargetDate(event?.targetDate || '');
    setErrorMsg('');
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrorMsg('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) {
      setErrorMsg('Please select a target date');
      return;
    }

    await updateSettings({
      daysToEvent: {
        title: title.trim() || 'Countdown',
        targetDate,
      },
    });

    setIsEditing(false);
    setErrorMsg('');
  };

  const handleClear = async () => {
    await updateSettings({
      daysToEvent: null,
    });
    setIsEditing(false);
    setErrorMsg('');
  };

  // Inline Configuration Form View
  if (isEditing) {
    return (
      <div
        className="stat-card"
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.4rem 1.6rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarClock size={18} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 'var(--font-base)', fontWeight: 700, color: 'var(--text-primary)' }}>
              {event ? 'Edit Countdown' : 'Set Countdown'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleCancelEdit}
            className="btn-icon"
            style={{ width: 28, height: 28 }}
            title="Cancel"
            aria-label="Cancel editing countdown"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <label
              htmlFor="days-to-input-title"
              style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}
            >
              EVENT / TITLE
            </label>
            <input
              id="days-to-input-title"
              type="text"
              placeholder="e.g. Project Launch, Vacation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              style={{ width: '100%', fontSize: 'var(--font-sm)', padding: '0.45rem 0.65rem' }}
            />
          </div>

          <div>
            <label
              htmlFor="days-to-input-date"
              style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}
            >
              TARGET DATE *
            </label>
            <input
              id="days-to-input-date"
              type="date"
              required
              value={targetDate}
              onChange={(e) => {
                setTargetDate(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              style={{ width: '100%', fontSize: 'var(--font-sm)', padding: '0.45rem 0.65rem' }}
            />
          </div>

          {errorMsg && (
            <div
              style={{
                fontSize: 'var(--font-xs)',
                color: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
            >
              <AlertCircle size={13} /> {errorMsg}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '0.25rem' }}>
            {event ? (
              <button
                type="button"
                onClick={handleClear}
                className="btn btn-secondary"
                style={{
                  fontSize: 'var(--font-xs)',
                  padding: '0.4rem 0.65rem',
                  minHeight: '32px',
                  color: '#ef4444',
                }}
                title="Remove countdown"
                aria-label="Remove countdown"
              >
                <Trash2 size={13} /> Clear
              </button>
            ) : (
              <div />
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn btn-secondary"
                style={{ fontSize: 'var(--font-xs)', padding: '0.4rem 0.75rem', minHeight: '32px' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ fontSize: 'var(--font-xs)', padding: '0.4rem 0.85rem', minHeight: '32px' }}
              >
                <Check size={14} /> Save
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Empty / Unconfigured View
  if (!event || !event.targetDate || !calculation) {
    return (
      <div
        className="stat-card"
        style={{
          backgroundColor: 'var(--bg-card)',
          padding: '1.4rem 1.6rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarClock size={20} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Days To</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            padding: '1rem 0',
          }}
        >
          <CalendarClock size={28} style={{ color: 'var(--text-muted)', opacity: 0.5, marginBottom: '0.4rem' }} />
          <div style={{ fontSize: 'var(--font-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
            No countdown set
          </div>
          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            Track an event, launch, or milestone
          </div>
          <button
            type="button"
            onClick={handleStartEdit}
            className="btn btn-primary"
            style={{ marginTop: '0.85rem', fontSize: 'var(--font-xs)', padding: '0.4rem 0.85rem', minHeight: '32px' }}
            aria-label="Set a countdown date"
          >
            <Plus size={14} /> Set a date
          </button>
        </div>

        <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)', textAlign: 'center' }}>
          Configurable widget
        </div>
      </div>
    );
  }

  // Active Countdown View
  const formattedDate = format(parseLocalDate(event.targetDate), 'MMMM d, yyyy');

  return (
    <div
      className="stat-card"
      style={{
        backgroundColor: 'var(--bg-card)',
        padding: '1.4rem 1.6rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CalendarClock size={20} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>Days To</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span
              style={{
                fontSize: 'var(--font-xs)',
                fontWeight: 700,
                padding: '0.15rem 0.5rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: calculation.isPast
                  ? 'rgba(239, 68, 68, 0.12)'
                  : calculation.isToday
                  ? 'var(--accent-light)'
                  : 'var(--bg-hover)',
                color: calculation.isPast
                  ? '#ef4444'
                  : calculation.isToday
                  ? 'var(--accent-primary)'
                  : 'var(--text-secondary)',
                border: calculation.isPast
                  ? '1px solid rgba(239, 68, 68, 0.25)'
                  : calculation.isToday
                  ? '1px solid var(--accent-primary)'
                  : '1px solid var(--border-color)',
              }}
            >
              {calculation.sublabel}
            </span>

            <button
              type="button"
              onClick={handleStartEdit}
              className="btn-icon"
              style={{ width: 28, height: 28 }}
              title="Edit countdown"
              aria-label="Edit countdown"
            >
              <Edit2 size={13} />
            </button>
          </div>
        </div>

        <div style={{ margin: '0.6rem 0' }}>
          <div
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: calculation.isPast
                ? 'var(--text-muted)'
                : calculation.isToday
                ? 'var(--accent-primary)'
                : 'var(--text-primary)',
            }}
          >
            {calculation.label}
          </div>

          <div
            title={event.title}
            style={{
              fontSize: 'var(--font-md)',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginTop: '0.4rem',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {event.title}
          </div>

          <div style={{ fontSize: 'var(--font-xs)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {formattedDate}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '0.65rem',
          marginTop: '0.5rem',
          borderTop: '1px solid var(--border-color)',
        }}
      >
        <span style={{ fontSize: 'var(--font-xs)', color: 'var(--text-muted)' }}>
          {calculation.isPast
            ? 'Event has concluded'
            : calculation.isToday
            ? 'Target date is today'
            : 'Counting down'}
        </span>
        <button
          type="button"
          onClick={handleStartEdit}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            fontSize: 'var(--font-xs)',
            color: 'var(--accent-primary)',
            fontWeight: 600,
            cursor: 'pointer',
          }}
          aria-label="Configure event"
        >
          Change
        </button>
      </div>
    </div>
  );
};
