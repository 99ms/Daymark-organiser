import React from 'react';
import { X, Command } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'N', desc: 'Create new task' },
    { key: 'Ctrl / Cmd + K', desc: 'Focus global search bar' },
    { key: 'T', desc: 'Jump to Today' },
    { key: 'D', desc: 'Switch to Day view' },
    { key: 'W', desc: 'Switch to Week view' },
    { key: 'M', desc: 'Switch to Month view' },
    { key: 'P', desc: 'Switch to Projects view' },
    { key: 'F', desc: 'Launch Focus mode / Pomodoro timer' },
    { key: 'Esc', desc: 'Close open modal' },
  ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Command size={20} style={{ color: 'var(--accent-primary)' }} />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Keyboard Shortcuts</h2>
          </div>
          <button onClick={onClose} className="btn-icon">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.5rem 0.75rem',
                backgroundColor: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{sc.desc}</span>
              <kbd
                style={{
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  padding: '0.15rem 0.5rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
