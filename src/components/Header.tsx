import React from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { UserSettings } from '../types';
import { Search, Sun, Moon, Timer, HelpCircle, Zap, Menu } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface HeaderProps {
  onOpenShortcutsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenShortcutsModal }) => {
  const {
    selectedDate,
    setSelectedDate,
    searchQuery,
    setSearchQuery,
    settings,
    updateSettings,
    setCurrentView,
    currentView,
  } = useOrganiser();

  const formattedDateTitle = format(parseISO(selectedDate), 'EEEE, MMMM d, yyyy');

  const handleTodayClick = () => {
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  };

  const toggleTheme = () => {
    let nextTheme: UserSettings['theme'] = 'dark';
    if (settings.theme === 'dark') nextTheme = 'amoled';
    else if (settings.theme === 'amoled') nextTheme = 'light';
    else nextTheme = 'dark';
    updateSettings({ theme: nextTheme });
  };

  return (
    <header className="top-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => {
            const sidebarBtn = document.querySelector('.sidebar-toggle-btn') as HTMLButtonElement;
            if (sidebarBtn) sidebarBtn.click();
          }}
          className="btn-icon mobile-menu-btn"
          title="Open Menu"
        >
          <Menu size={20} />
        </button>

        <button onClick={handleTodayClick} className="btn btn-secondary" title="Jump to Today (T)">
          Today
        </button>

        <input
          type="date"
          value={selectedDate}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          style={{ width: '135px', cursor: 'pointer', fontSize: 'var(--font-md)', minHeight: '36px' }}
        />

        <span className="header-date-title" style={{ fontSize: 'var(--font-lg)', fontWeight: 700, color: 'var(--text-primary)' }}>
          {formattedDateTitle}
        </span>
      </div>

      <div className="header-search">
        <Search className="search-icon" size={18} />
        <input
          type="text"
          placeholder="Search tasks, notes, categories (Ctrl+K)..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <span className="search-shortcut">Ctrl K</span>
      </div>

      <div className="header-actions">
        <button
          onClick={() => setCurrentView('focus')}
          className={`btn-icon ${currentView === 'focus' ? 'active' : ''}`}
          title="Focus Mode / Pomodoro Timer"
          aria-label="Focus Mode / Pomodoro Timer"
        >
          <Timer size={20} />
        </button>

        <button onClick={toggleTheme} className="btn-icon" title={`Theme: ${settings.theme.toUpperCase()} (Click to switch)`} aria-label={`Theme: ${settings.theme.toUpperCase()}`}>
          {settings.theme === 'light' ? <Sun size={20} /> : settings.theme === 'amoled' ? <Zap size={20} style={{ color: '#818cf8' }} /> : <Moon size={20} />}
        </button>

        <button onClick={onOpenShortcutsModal} className="btn-icon" title="Keyboard Shortcuts (?)" aria-label="Keyboard Shortcuts">
          <HelpCircle size={20} />
        </button>
      </div>
    </header>
  );
};
