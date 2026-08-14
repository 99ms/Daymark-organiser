import React, { useState } from 'react';
import { useOrganiser } from '../context/OrganiserContext';
import { Plus, Trash2 } from 'lucide-react';

export const NotesView: React.FC = () => {
  const { notes, addNote, updateNote, deleteNote } = useOrganiser();
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(notes[0]?.id || null);

  const activeNote = notes.find((n) => n.id === selectedNoteId);

  const handleCreate = async () => {
    const created = await addNote({
      title: 'New Note',
      content: 'Write your thoughts here...',
    });
    setSelectedNoteId(created.id);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem', height: 'calc(100vh - 120px)' }}>
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
          <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Notes</h3>
          <button onClick={handleCreate} className="btn-icon" title="New Note">
            <Plus size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', overflowY: 'auto', flex: 1 }}>
          {notes.map((n) => {
            const isSelected = n.id === selectedNoteId;
            return (
              <button
                key={n.id}
                onClick={() => setSelectedNoteId(n.id)}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--accent-light)' : 'transparent',
                  border: isSelected ? '1px solid var(--accent-primary)' : '1px solid transparent',
                  textAlign: 'left',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.2rem',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-primary)' }}>
                  {n.title || 'Untitled Note'}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {n.content.substring(0, 40) || 'Empty note...'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        {activeNote ? (
          <div
            style={{
              backgroundColor: 'var(--bg-card)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border-color)',
              padding: '1.5rem',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input
                type="text"
                value={activeNote.title}
                onChange={(e) => updateNote({ ...activeNote, title: e.target.value })}
                placeholder="Note Title"
                style={{
                  fontSize: 'var(--font-xl)',
                  fontWeight: 700,
                  border: 'none',
                  backgroundColor: 'transparent',
                  padding: 0,
                  width: '80%',
                }}
              />
              <button onClick={() => deleteNote(activeNote.id)} className="btn-icon" style={{ color: '#ef4444' }}>
                <Trash2 size={18} />
              </button>
            </div>

            <textarea
              value={activeNote.content}
              onChange={(e) => updateNote({ ...activeNote, content: e.target.value })}
              placeholder="Write Markdown or clean notes here..."
              style={{
                flex: 1,
                width: '100%',
                backgroundColor: 'transparent',
                border: 'none',
                resize: 'none',
                fontSize: 'var(--font-base)',
                lineHeight: 1.65,
                padding: '0.5rem 0',
              }}
            />
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
            Select or create a note to begin writing.
          </div>
        )}
      </div>
    </div>
  );
};
