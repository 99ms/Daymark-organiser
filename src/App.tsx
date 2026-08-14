import React, { useState, useEffect } from 'react';
import { OrganiserProvider, useOrganiser } from './context/OrganiserContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { ToastContainer } from './components/ToastContainer';
import { TaskEditorModal } from './components/TaskEditorModal';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import type { Task } from './types';
import { format } from 'date-fns';

// View Imports
import { OverviewView } from './views/OverviewView';
import { DayView } from './views/DayView';
import { WeekView } from './views/WeekView';
import { MonthView } from './views/MonthView';
import { UpcomingView } from './views/UpcomingView';
import { InboxView } from './views/InboxView';
import { ProjectsView } from './views/ProjectsView';
import { GoalsView } from './views/GoalsView';
import { NotesView } from './views/NotesView';
import { StatsView } from './views/StatsView';
import { FocusView } from './views/FocusView';
import { ArchiveView } from './views/ArchiveView';
import { SettingsView } from './views/SettingsView';

const AppContent: React.FC = () => {
  const { currentView, setCurrentView, setSelectedDate, loading } = useOrganiser();

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [taskModalDefaultDate, setTaskModalDefaultDate] = useState<string | undefined>(undefined);

  const [isShortcutsOpen, setIsShortcutsOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Escape') {
          setIsTaskModalOpen(false);
          setIsShortcutsOpen(false);
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.header-search input') as HTMLInputElement;
        if (searchInput) searchInput.focus();
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          setEditingTask(null);
          setTaskModalDefaultDate(undefined);
          setIsTaskModalOpen(true);
          break;
        case 't':
          e.preventDefault();
          setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
          break;
        case 'd':
          e.preventDefault();
          setCurrentView('day');
          break;
        case 'w':
          e.preventDefault();
          setCurrentView('week');
          break;
        case 'm':
          e.preventDefault();
          setCurrentView('month');
          break;
        case 'p':
          e.preventDefault();
          setCurrentView('projects');
          break;
        case 'f':
          e.preventDefault();
          setCurrentView('focus');
          break;
        case '?':
          e.preventDefault();
          setIsShortcutsOpen(true);
          break;
        case 'escape':
          setIsTaskModalOpen(false);
          setIsShortcutsOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setCurrentView, setSelectedDate]);

  const handleOpenNewTask = (dateStr?: string) => {
    setEditingTask(null);
    setTaskModalDefaultDate(dateStr);
    setIsTaskModalOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100vh',
          width: '100vw',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          fontSize: '1.2rem',
          fontWeight: 600,
        }}
      >
        Loading your productivity hub...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Sidebar onOpenNewTaskModal={() => handleOpenNewTask()} />

      <div className="main-layout">
        <Header onOpenShortcutsModal={() => setIsShortcutsOpen(true)} />

        <main className="main-content">
          {currentView === 'overview' && <OverviewView onEditTask={handleEditTask} />}
          {currentView === 'today' && <DayView onEditTask={handleEditTask} />}
          {currentView === 'day' && <DayView onEditTask={handleEditTask} />}
          {currentView === 'week' && (
            <WeekView
              onEditTask={handleEditTask}
              onOpenNewTaskModalForDate={(d) => handleOpenNewTask(d)}
            />
          )}
          {currentView === 'month' && <MonthView />}
          {currentView === 'upcoming' && <UpcomingView onEditTask={handleEditTask} />}
          {currentView === 'inbox' && <InboxView onEditTask={handleEditTask} />}
          {currentView === 'projects' && <ProjectsView onEditTask={handleEditTask} />}
          {currentView === 'goals' && <GoalsView />}
          {currentView === 'notes' && <NotesView />}
          {currentView === 'stats' && <StatsView />}
          {currentView === 'focus' && <FocusView />}
          {currentView === 'archive' && <ArchiveView onEditTask={handleEditTask} />}
          {currentView === 'settings' && <SettingsView />}
        </main>
      </div>

      <ToastContainer />

      <TaskEditorModal
        task={editingTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        defaultDate={taskModalDefaultDate}
      />

      <KeyboardShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
};

export function App() {
  return (
    <OrganiserProvider>
      <AppContent />
    </OrganiserProvider>
  );
}

export default App;
