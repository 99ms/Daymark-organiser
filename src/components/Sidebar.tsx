import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { ViewMode } from '../types';
import {
  LayoutDashboard,
  Sun,
  CalendarDays,
  Calendar,
  Inbox,
  FolderKanban,
  Target,
  FileText,
  BarChart3,
  Archive,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  Flame,
  Clock,
  Sparkles,
} from 'lucide-react';
import { isTaskOverdue } from '../utils/taskUtils';
import { format } from 'date-fns';

interface SidebarProps {
  onOpenNewTaskModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenNewTaskModal }) => {
  const { currentView, setCurrentView, tasks, setSelectedDate } = useOrganiser();
  const [collapsed, setCollapsed] = useState(false);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const todayTasksCount = tasks.filter((t) => !t.archived && !t.completed && t.dueDate === todayStr).length;
  const overdueCount = tasks.filter((t) => !t.archived && isTaskOverdue(t)).length;
  const inboxCount = tasks.filter((t) => !t.archived && !t.completed && !t.dueDate).length;

  const navItems: { view: ViewMode; label: string; icon: React.ReactNode; badge?: number; badgeAlert?: boolean }[] = [
    { view: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
    { view: 'today', label: 'Today', icon: <Sun size={18} />, badge: todayTasksCount },
    { view: 'upcoming', label: 'Upcoming', icon: <Clock size={18} /> },
    { view: 'day', label: 'Day View', icon: <CalendarDays size={18} /> },
    { view: 'week', label: 'Week View', icon: <CalendarDays size={18} /> },
    { view: 'month', label: 'Month View', icon: <Calendar size={18} /> },
    { view: 'inbox', label: 'Inbox', icon: <Inbox size={18} />, badge: inboxCount },
    { view: 'projects', label: 'Projects', icon: <FolderKanban size={18} /> },
    { view: 'goals', label: 'Goals', icon: <Target size={18} /> },
    { view: 'notes', label: 'Notes', icon: <FileText size={18} /> },
    { view: 'stats', label: 'Statistics', icon: <BarChart3 size={18} /> },
    { view: 'archive', label: 'Archive', icon: <Archive size={18} /> },
  ];

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      <div
        className={`sidebar-backdrop ${!collapsed ? 'show' : ''}`}
        onClick={() => setCollapsed(true)}
      />

      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          {!collapsed && (
            <div className="sidebar-logo">
              <Sparkles size={22} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span>Daymark</span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    letterSpacing: '0.05em',
                    padding: '0.15rem 0.45rem',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--accent-light)',
                    color: 'var(--accent-primary)',
                    border: '1px solid var(--accent-primary)',
                    textTransform: 'uppercase',
                  }}
                >
                  BETA
                </span>
              </div>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="btn-icon sidebar-toggle-btn"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        <div style={{ padding: '0.85rem' }}>
          <button
            onClick={() => {
              onOpenNewTaskModal();
              if (window.innerWidth <= 768) setCollapsed(true);
            }}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
            title="New Task (N)"
          >
            <Plus size={18} />
            {!collapsed && <span>New Task</span>}
          </button>
        </div>

        <nav className="sidebar-nav">
          {!collapsed && overdueCount > 0 && (
            <div
              onClick={() => {
                setCurrentView('today');
                setSelectedDate(todayStr);
                if (window.innerWidth <= 768) setCollapsed(true);
              }}
              className="nav-item"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              <Flame size={18} />
              <span>Overdue Tasks</span>
              <span className="nav-badge alert">{overdueCount}</span>
            </div>
          )}

          {!collapsed && <div className="nav-section-title">Views</div>}

          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                setCurrentView(item.view);
                if (item.view === 'today') setSelectedDate(todayStr);
                if (window.innerWidth <= 768) setCollapsed(true);
              }}
              className={`nav-item ${currentView === item.view ? 'active' : ''}`}
              title={item.label}
            >
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge !== undefined && item.badge > 0 && (
                <span className={`nav-badge ${item.badgeAlert ? 'alert' : ''}`}>{item.badge}</span>
              )}
            </button>
          ))}

          {!collapsed && <div className="nav-section-title" style={{ marginTop: '0.5rem' }}>Preferences</div>}
          <button
            onClick={() => {
              setCurrentView('settings');
              if (window.innerWidth <= 768) setCollapsed(true);
            }}
            className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
            title="Settings"
          >
            <Settings size={18} />
            {!collapsed && <span>Settings</span>}
          </button>
        </nav>
      </aside>
    </>
  );
};
