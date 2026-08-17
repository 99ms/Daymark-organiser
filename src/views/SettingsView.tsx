import React, { useState, useEffect } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { SafetySnapshot } from '../services/db';
import type { CustomTheme, ThemeTokens } from '../types';
import { applyThemeTokens, clearCustomThemeTokens, calculateContrastRatio } from '../utils/themeUtils';
import {
  Settings,
  Palette,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Shield,
  RotateCcw,
  Clock,
  AlertTriangle,
  Copy,
  Edit2,
  Check,
  X,
  Eye,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const DEFAULT_TOKENS: ThemeTokens = {
  bgPrimary: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  bgCard: '#1e293b',
  bgHover: '#334155',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  borderColor: '#334155',
  borderFocus: '#6366f1',
  accentPrimary: '#6366f1',
  accentHover: '#4f46e5',
  accentLight: 'rgba(99, 102, 241, 0.15)',
};

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
    createSnapshot,
    fetchSnapshots,
    restoreSnapshot,
  } = useOrganiser();

  const [newPriorityName, setNewPriorityName] = useState('');
  const [newPriorityColor, setNewPriorityColor] = useState('#6366f1');

  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#3b82f6');

  const [snapshots, setSnapshots] = useState<SafetySnapshot[]>([]);
  const [lastExportTime, setLastExportTime] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [restoringSnapshotId, setRestoringSnapshotId] = useState<string | null>(null);

  // Theme Editor State
  const [editingTheme, setEditingTheme] = useState<CustomTheme | null>(null);
  const [themeName, setThemeName] = useState('');
  const [themeTokens, setThemeTokens] = useState<ThemeTokens>(DEFAULT_TOKENS);
  const [deleteThemeConfirmId, setDeleteThemeConfirmId] = useState<string | null>(null);

  const loadSnapshots = React.useCallback(async () => {
    const list = await fetchSnapshots();
    setSnapshots(list);
  }, [fetchSnapshots]);

  useEffect(() => {
    loadSnapshots();
  }, [loadSnapshots]);

  const customThemes: CustomTheme[] = settings.customThemes || [];

  const handleOpenNewTheme = () => {
    const newTheme: CustomTheme = {
      id: `theme_${Date.now()}`,
      name: 'My Custom Theme',
      tokens: { ...DEFAULT_TOKENS },
    };
    setEditingTheme(newTheme);
    setThemeName(newTheme.name);
    setThemeTokens(newTheme.tokens);
    applyThemeTokens(newTheme.tokens); // live preview
  };

  const handleEditCustomTheme = (theme: CustomTheme) => {
    setEditingTheme(theme);
    setThemeName(theme.name);
    setThemeTokens({ ...theme.tokens });
    applyThemeTokens(theme.tokens); // live preview
  };

  const handleDuplicateCustomTheme = (theme: CustomTheme) => {
    const dup: CustomTheme = {
      id: `theme_${Date.now()}`,
      name: `${theme.name} (Copy)`,
      tokens: { ...theme.tokens },
    };
    const updatedList = [...customThemes, dup];
    updateSettings({ customThemes: updatedList });
  };

  const handleTokenChange = (key: keyof ThemeTokens, value: string) => {
    const updated = { ...themeTokens, [key]: value };
    if (key === 'accentPrimary') {
      updated.accentHover = value;
      updated.accentLight = `${value}25`;
    }
    setThemeTokens(updated);
    applyThemeTokens(updated); // live preview update
  };

  const handleSaveTheme = async () => {
    if (!editingTheme) return;
    const finalTheme: CustomTheme = {
      ...editingTheme,
      name: themeName.trim() || 'Untitled Theme',
      tokens: themeTokens,
    };

    const existingIdx = customThemes.findIndex((t) => t.id === finalTheme.id);
    let updatedList: CustomTheme[];
    if (existingIdx >= 0) {
      updatedList = [...customThemes];
      updatedList[existingIdx] = finalTheme;
    } else {
      updatedList = [...customThemes, finalTheme];
    }

    await updateSettings({
      customThemes: updatedList,
      theme: finalTheme.id,
      activeCustomThemeId: finalTheme.id,
    });

    setEditingTheme(null);
  };

  const handleCancelThemeEdit = () => {
    setEditingTheme(null);
    // Restore saved active theme
    const activeCustom = customThemes.find((ct) => ct.id === settings.theme || ct.id === settings.activeCustomThemeId);
    if (activeCustom) {
      applyThemeTokens(activeCustom.tokens);
    } else {
      clearCustomThemeTokens();
    }
  };

  const handleDeleteCustomTheme = async (id: string) => {
    const updatedList = customThemes.filter((t) => t.id !== id);
    let nextTheme = settings.theme;
    let nextActiveId = settings.activeCustomThemeId;

    if (settings.theme === id || settings.activeCustomThemeId === id) {
      nextTheme = 'dark';
      nextActiveId = null;
      clearCustomThemeTokens();
    }

    await updateSettings({
      customThemes: updatedList,
      theme: nextTheme,
      activeCustomThemeId: nextActiveId,
    });
    setDeleteThemeConfirmId(null);
  };

  const textContrast = calculateContrastRatio(themeTokens.textPrimary, themeTokens.bgPrimary);
  const lowContrastWarning = textContrast < 3.0;

  const handleExport = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const nowIso = new Date().toISOString();
    a.download = `organiser_backup_${nowIso.split('T')[0]}.json`;
    a.click();
    setLastExportTime(nowIso);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = await importDataJSON(content);
        if (success) {
          await loadSnapshots();
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCreateManualSnapshot = async () => {
    await createSnapshot('manual');
    await loadSnapshots();
  };

  const handleRestoreSnapshot = async (id: string) => {
    setRestoringSnapshotId(id);
    const success = await restoreSnapshot(id);
    setRestoringSnapshotId(null);
    if (success) {
      await loadSnapshots();
    }
  };

  const handleConfirmReset = async () => {
    await resetAllData();
    setShowResetConfirm(false);
    await loadSnapshots();
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

      {/* APPEARANCE & CUSTOM THEME MANAGEMENT */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '1.5rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Palette size={18} /> Appearance & Custom Themes
          </h3>
          <button onClick={handleOpenNewTheme} className="btn btn-primary" style={{ padding: '0.4rem 0.85rem', fontSize: 'var(--font-sm)' }}>
            <Plus size={16} /> Create Custom Theme
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600 }}>ACTIVE THEME</label>
            <select
              value={settings.theme}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'light' || val === 'dark' || val === 'amoled' || val === 'system') {
                  updateSettings({ theme: val as any, activeCustomThemeId: null });
                } else {
                  updateSettings({ theme: val, activeCustomThemeId: val });
                }
              }}
              style={{ width: '100%', marginTop: '0.25rem' }}
            >
              <optgroup label="Protected Built-in Presets">
                <option value="dark">Dark Mode (Default)</option>
                <option value="amoled">AMOLED (OLED True Black)</option>
                <option value="light">Light Mode</option>
                <option value="system">System Preference</option>
              </optgroup>
              {customThemes.length > 0 && (
                <optgroup label="Custom User Themes">
                  {customThemes.map((ct) => (
                    <option key={ct.id} value={ct.id}>
                      {ct.name}
                    </option>
                  ))}
                </optgroup>
              )}
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

        {/* CUSTOM THEMES LIST */}
        {customThemes.length > 0 && (
          <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: '0.75rem' }}>
              Your Custom Themes ({customThemes.length})
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {customThemes.map((theme) => {
                const isActive = settings.theme === theme.id || settings.activeCustomThemeId === theme.id;

                return (
                  <div
                    key={theme.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-card)',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-sm)',
                      border: isActive ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <div
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: '50%',
                          backgroundColor: theme.tokens.bgPrimary,
                          border: `2px solid ${theme.tokens.accentPrimary}`,
                        }}
                      />
                      <span style={{ fontSize: 'var(--font-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>{theme.name}</span>
                      {isActive && (
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)', padding: '0.15rem 0.45rem', borderRadius: 'var(--radius-full)' }}>
                          Active
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      {!isActive && (
                        <button
                          onClick={() => updateSettings({ theme: theme.id, activeCustomThemeId: theme.id })}
                          className="btn btn-secondary"
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', minHeight: '26px' }}
                        >
                          Activate
                        </button>
                      )}
                      <button
                        onClick={() => handleEditCustomTheme(theme)}
                        className="btn-icon"
                        style={{ width: '26px', height: '26px' }}
                        title="Edit Theme"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDuplicateCustomTheme(theme)}
                        className="btn-icon"
                        style={{ width: '26px', height: '26px' }}
                        title="Duplicate Theme"
                      >
                        <Copy size={14} />
                      </button>

                      {deleteThemeConfirmId !== theme.id ? (
                        <button
                          onClick={() => setDeleteThemeConfirmId(theme.id)}
                          className="btn-icon"
                          style={{ width: '26px', height: '26px', color: '#ef4444' }}
                          title="Delete Theme"
                        >
                          <Trash2 size={14} />
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <span style={{ fontSize: '10px', color: '#ef4444', fontWeight: 700 }}>Delete?</span>
                          <button
                            onClick={() => handleDeleteCustomTheme(theme.id)}
                            className="btn btn-primary"
                            style={{ backgroundColor: '#ef4444', fontSize: '10px', padding: '0.15rem 0.45rem', minHeight: '22px' }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setDeleteThemeConfirmId(null)}
                            className="btn btn-secondary"
                            style={{ fontSize: '10px', padding: '0.15rem 0.35rem', minHeight: '22px' }}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* CUSTOM THEME EDITOR MODAL / PANEL */}
        {editingTheme && (
          <div
            style={{
              marginTop: '1.25rem',
              backgroundColor: 'var(--bg-secondary)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '2px dashed var(--accent-primary)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Eye size={18} style={{ color: 'var(--accent-primary)' }} />
                <span style={{ fontSize: 'var(--font-md)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Theme Creator & Live Preview
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button onClick={handleSaveTheme} className="btn btn-primary" style={{ padding: '0.35rem 0.85rem', fontSize: 'var(--font-sm)' }}>
                  <Check size={14} /> Save Theme
                </button>
                <button onClick={handleCancelThemeEdit} className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: 'var(--font-sm)' }}>
                  <X size={14} /> Cancel
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-secondary)' }}>THEME NAME</label>
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                className="input"
                style={{ width: '100%', marginTop: '0.25rem' }}
                placeholder="e.g. Midnight Cyberpunk"
              />
            </div>

            {lowContrastWarning && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f59e0b20', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid #f59e0b44', marginBottom: '1rem', fontSize: 'var(--font-xs)', color: '#f59e0b' }}>
                <AlertTriangle size={16} />
                <span>Notice: Low contrast detected between primary text and background. Readability may be reduced.</span>
              </div>
            )}

            {/* COLOR TOKEN INPUTS GRID */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                  BACKGROUND SURFACES
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Canvas Primary
                    <input type="color" value={themeTokens.bgPrimary} onChange={(e) => handleTokenChange('bgPrimary', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Secondary Surface
                    <input type="color" value={themeTokens.bgSecondary} onChange={(e) => handleTokenChange('bgSecondary', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Card Surface
                    <input type="color" value={themeTokens.bgCard} onChange={(e) => handleTokenChange('bgCard', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Hover Surface
                    <input type="color" value={themeTokens.bgHover} onChange={(e) => handleTokenChange('bgHover', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                  TYPOGRAPHY & BORDERS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Primary Text
                    <input type="color" value={themeTokens.textPrimary} onChange={(e) => handleTokenChange('textPrimary', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Secondary Text
                    <input type="color" value={themeTokens.textSecondary} onChange={(e) => handleTokenChange('textSecondary', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Muted Text
                    <input type="color" value={themeTokens.textMuted} onChange={(e) => handleTokenChange('textMuted', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Border Color
                    <input type="color" value={themeTokens.borderColor} onChange={(e) => handleTokenChange('borderColor', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                </div>
              </div>

              <div>
                <span style={{ fontSize: 'var(--font-xs)', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>
                  ACCENTS & FOCUS
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Accent Primary
                    <input type="color" value={themeTokens.accentPrimary} onChange={(e) => handleTokenChange('accentPrimary', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    Focus Border
                    <input type="color" value={themeTokens.borderFocus} onChange={(e) => handleTokenChange('borderFocus', e.target.value)} style={{ width: 28, height: 28, border: 'none', background: 'none', cursor: 'pointer' }} />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
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
              <option value="amoled">AMOLED (OLED Black)</option>
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
          <Shield size={20} style={{ color: 'var(--accent-primary)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Data Resilience & Local Safety</h3>
        </div>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
          Your Daymark workspace data is stored locally on this device. Use exported JSON backups for long-term protection against browser/device data loss.
        </p>

        {/* Action Toolbar */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
          <button onClick={handleExport} className="btn btn-primary">
            <Download size={16} /> Export Backup (JSON)
          </button>

          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <Upload size={16} /> Import Backup JSON
            <input type="file" accept=".json" onChange={handleImportFile} style={{ display: 'none' }} />
          </label>

          <button onClick={handleCreateManualSnapshot} className="btn btn-secondary">
            <Shield size={16} style={{ color: 'var(--accent-primary)' }} /> Create Safety Snapshot
          </button>

          {!showResetConfirm ? (
            <button onClick={() => setShowResetConfirm(true)} className="btn btn-secondary" style={{ color: '#ef4444' }}>
              <RefreshCw size={16} /> Reset All Data
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#ef444415', padding: '0.4rem 0.85rem', borderRadius: 'var(--radius-md)', border: '1px solid #ef444444' }}>
              <AlertTriangle size={16} style={{ color: '#ef4444' }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#ef4444' }}>Create snapshot & clear workspace?</span>
              <button onClick={handleConfirmReset} className="btn btn-primary" style={{ backgroundColor: '#ef4444', fontSize: '0.8rem', padding: '0.35rem 0.75rem', minHeight: '32px' }}>
                Yes, Reset
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.5rem', minHeight: '32px' }}>
                Cancel
              </button>
            </div>
          )}
        </div>

        {/* Export Info */}
        {lastExportTime && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Clock size={14} /> Last manual backup exported: {format(parseISO(lastExportTime), 'MMM d, yyyy h:mm a')}
          </div>
        )}

        {/* Rolling Safety Snapshots Panel */}
        <div style={{ backgroundColor: 'var(--bg-secondary)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Automatic Local Safety Snapshots ({snapshots.length} / 5)
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Auto-created before dangerous actions</span>
          </div>

          {snapshots.length === 0 ? (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
              No safety snapshots created yet. Snapshots are created automatically before database resets or imports.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {snapshots.map((snap) => {
                const triggerLabel =
                  snap.trigger === 'before_import'
                    ? 'Before JSON Import'
                    : snap.trigger === 'before_reset'
                    ? 'Before Database Reset'
                    : snap.trigger === 'migration'
                    ? 'Before Migration'
                    : 'Manual Safety Snapshot';

                return (
                  <div
                    key={snap.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: 'var(--bg-card)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-color)',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {triggerLabel}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {format(parseISO(snap.timestamp), 'MMM d, yyyy h:mm:ss a')} • {snap.data.tasks?.length || 0} tasks
                      </div>
                    </div>

                    <button
                      onClick={() => handleRestoreSnapshot(snap.id)}
                      disabled={restoringSnapshotId === snap.id}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '0.3rem 0.65rem', minHeight: '28px' }}
                    >
                      <RotateCcw size={12} /> {restoringSnapshotId === snap.id ? 'Restoring...' : 'Restore State'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
