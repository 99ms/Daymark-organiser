import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { Settings, Palette, Download, Upload, RefreshCw, Plus, Trash2 } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    updateSettings,
    priorities,
    updatePriority,
    addPriority,
    deletePriority,
    categories,
    updateCategory,
    addCategory,
    deleteCategory,
    exportDataJSON,
    importDataJSON,
    resetAllData,
  } = useOrganiser();

  const [newPriorityName, setNewPriorityName] = useState('');
  const [newPriorityColor, setNewPriorityColor] = useState('#6366f1');

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `organiser_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        await importDataJSON(content);
      }
    };
    reader.readAsText(file);
  };

  const handleAddPriority = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPriorityName.trim()) return;
    await addPriority({
      id: 'p-' + Date.now(),
      name: newPriorityName.trim(),
      color: newPriorityColor,
      level: priorities.length + 1,
    });
    setNewPriorityName('');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    await addCategory({
      id: 'c-' + Date.now(),
      name: newCatName.trim(),
      color: newCatColor,
    });
    setNewCatName('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          backgroundColor: 'var(--bg-card)',
          padding: '1.25rem 1.5rem',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
        }}
      >
        <Settings size={24} style={{ color: 'var(--accent-primary)' }} />
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Settings & Preferences</h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Customize themes, priority colors, categories, backup & restore data.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Palette size={18} /> Appearance & Defaults
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>THEME MODE</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSettings({ theme: e.target.value as any })}
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              <option value="dark">Dark Mode</option>
              <option value="light">Light Mode</option>
              <option value="system">System Preference</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>DEFAULT TASK DURATION</label>
            <select
              value={settings.defaultDuration}
              onChange={(e) => updateSettings({ defaultDuration: Number(e.target.value) })}
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Custom Priority Levels & Colors
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {priorities.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <input
                type="color"
                value={p.color}
                onChange={(e) => updatePriority({ ...p, color: e.target.value })}
                style={{ width: 32, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={p.name}
                onChange={(e) => updatePriority({ ...p, name: e.target.value })}
                style={{ flex: 1 }}
              />
              <button onClick={() => deletePriority(p.id)} className="btn-icon" style={{ color: '#ef4444' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddPriority} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="color"
            value={newPriorityColor}
            onChange={(e) => setNewPriorityColor(e.target.value)}
            style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
          />
          <input
            type="text"
            placeholder="New priority name..."
            value={newPriorityName}
            onChange={(e) => setNewPriorityName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary">
            <Plus size={16} /> Add Priority
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Custom Categories & Colors
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1rem' }}>
          {categories.map((c) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                backgroundColor: 'var(--bg-tertiary)',
                padding: '0.6rem 0.85rem',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <input
                type="color"
                value={c.color}
                onChange={(e) => updateCategory({ ...c, color: e.target.value })}
                style={{ width: 32, height: 32, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
              />
              <input
                type="text"
                value={c.name}
                onChange={(e) => updateCategory({ ...c, name: e.target.value })}
                style={{ flex: 1 }}
              />
              <button onClick={() => deleteCategory(c.id)} className="btn-icon" style={{ color: '#ef4444' }}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '0.75rem' }}>
          <input
            type="color"
            value={newCatColor}
            onChange={(e) => setNewCatColor(e.target.value)}
            style={{ width: 40, height: 40, padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
          />
          <input
            type="text"
            placeholder="New category name..."
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            style={{ flex: 1 }}
          />
          <button type="submit" className="btn btn-secondary">
            <Plus size={16} /> Add Category
          </button>
        </form>
      </div>

      <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Data Backup & Management
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={handleExport} className="btn btn-primary">
            <Download size={16} /> Export Backup (JSON)
          </button>

          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> Import Backup JSON
            <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>

          <button onClick={resetAllData} className="btn btn-secondary" style={{ color: '#ef4444' }}>
            <RefreshCw size={16} /> Reset All Data
          </button>
        </div>
      </div>
    </div>
  );
};
