'use client';

import React, { useEffect, useState } from 'react';
import styles from './noted.module.css';
import { getNotes, createNote, updateNote, deleteNote } from './actions';
import { Note, CreateNoteDto } from './types';
import NoteCard from './components/NoteCard';
import NoteForm from './components/NoteForm';

export default function NotedPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(false);

  const loadNotes = async () => {
    setLoading(true);
    const res = await getNotes({
      page: 1,
      limit: 10,
      sortBy: 'updatedAt',
      isArchived: false,
      statusId: 1,
    });
    setNotes(res.data);
    setLoading(false);
  };

  useEffect(() => {
    loadNotes();
  }, []);

  const handleCreateOrUpdate = async (data: CreateNoteDto) => {
    if (editingNote) {
      await updateNote(editingNote.id, data);
      setEditingNote(null);
    } else {
      await createNote(data);
    }
    loadNotes();
  };

  const handleDelete = async (id: number) => {
    await deleteNote(id);
    loadNotes();
  };

  return (
    <div className={styles.container}>
      <NoteForm
        initialData={editingNote}
        onSubmit={handleCreateOrUpdate}
        onCancel={() => setEditingNote(null)}
      />

      <div className={styles.listWrapper}>
        {loading ? (
          <div>Đang tải ghi chú...</div>
        ) : (
          notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onEdit={() => setEditingNote(note)}
              onDelete={() => handleDelete(note.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
