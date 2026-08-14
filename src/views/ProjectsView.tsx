import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import type { Task } from '../types';
import { TaskItem } from '../components/TaskItem';
import { FolderKanban, Plus, Trash2 } from 'lucide-react';

interface ProjectsViewProps {
  onEditTask: (task: Task) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onEditTask }) => {
  const { projects, tasks, addProject, deleteProject } = useOrganiser();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);

  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];

  const projectTasks = activeProject
    ? tasks.filter((t) => !t.archived && t.projectId === activeProject.id)
    : [];

  const completedCount = projectTasks.filter((t) => t.completed).length;
  const totalCount = projectTasks.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    const created = await addProject({
      name: newProjName.trim(),
      description: newProjDesc.trim(),
      color: '#6366f1',
    });

    setSelectedProjectId(created.id);
    setNewProjName('');
    setNewProjDesc('');
    setShowAddForm(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '1.5rem' }}>
      <div
        style={{
          backgroundColor: 'var(--bg-card)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-color)',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Projects</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-icon"
            style={{ width: 28, height: 28 }}
            title="New Project"
          >
            <Plus size={16} />
          </button>
        </div>

        {showAddForm && (
          <form
            onSubmit={handleCreateProject}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              background: 'var(--bg-tertiary)',
              padding: '0.75rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <input
              type="text"
              placeholder="Project Name"
              value={newProjName}
              onChange={(e) => setNewProjName(e.target.value)}
              required
            />
            <input
              type="text"
              placeholder="Description"
              value={newProjDesc}
              onChange={(e) => setNewProjDesc(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}>
              Save Project
            </button>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {projects.map((p) => {
            const isSelected = p.id === selectedProjectId;
            const pTasks = tasks.filter((t) => !t.archived && t.projectId === p.id);
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.6rem',
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                  color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)',
                  fontWeight: isSelected ? 600 : 500,
                  fontSize: '0.9rem',
                  textAlign: 'left',
                }}
              >
                <FolderKanban size={16} style={{ color: p.color }} />
                <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {p.name}
                </span>
                <span className="nav-badge">{pTasks.length}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {activeProject ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                backgroundColor: 'var(--bg-card)',
                padding: '1.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <FolderKanban size={24} style={{ color: activeProject.color }} />
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{activeProject.name}</h2>
                </div>
                {activeProject.description && (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.4rem' }}>
                    {activeProject.description}
                  </p>
                )}

                <div style={{ marginTop: '1rem', width: '300px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                    <span>Progress</span>
                    <span>{percent}%</span>
                  </div>
                  <div style={{ height: '6px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, backgroundColor: activeProject.color }} />
                  </div>
                </div>
              </div>

              <button
                onClick={() => deleteProject(activeProject.id)}
                className="btn-icon"
                style={{ color: '#ef4444' }}
                title="Delete project"
              >
                <Trash2 size={18} />
              </button>
            </div>

            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                Project Tasks ({completedCount}/{totalCount})
              </h3>
              {projectTasks.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '2.5rem 1rem',
                    backgroundColor: 'var(--bg-card)',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px dashed var(--border-color)',
                  }}
                >
                  <p style={{ color: 'var(--text-muted)' }}>No tasks linked to this project yet.</p>
                </div>
              ) : (
                projectTasks.map((task) => <TaskItem key={task.id} task={task} onEdit={onEditTask} showDate />)
              )}
            </div>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            Select or create a project.
          </div>
        )}
      </div>
    </div>
  );
};
