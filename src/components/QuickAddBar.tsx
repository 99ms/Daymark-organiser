import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { Plus, Zap } from 'lucide-react';

export const QuickAddBar: React.FC = () => {
  const { quickAddTask } = useOrganiser();
  const [input, setInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    await quickAddTask(input.trim());
    setInput('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '0.65rem 1rem',
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem',
      }}
    >
      <Zap size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
      <input
        type="text"
        placeholder='Quick add: "Finish presentation tomorrow at 4pm high priority"'
        value={input}
        onChange={(e) => setInput(e.target.value)}
        style={{
          flex: 1,
          border: 'none',
          backgroundColor: 'transparent',
          padding: '0.4rem 0',
          fontSize: 'var(--font-base)',
          boxShadow: 'none',
        }}
      />
      <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.1rem' }}>
        <Plus size={18} /> Add
      </button>
    </form>
  );
};
