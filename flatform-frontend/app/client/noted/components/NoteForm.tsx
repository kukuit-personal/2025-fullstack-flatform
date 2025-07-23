import React, { useState, useEffect } from 'react';
import { CreateNoteDto, Note } from '../types';
import styles from '../noted.module.css';
import { Plus, Edit } from 'lucide-react';

interface Props {
  initialData?: Note | null;
  onSubmit: (data: CreateNoteDto) => void;
  onCancel: () => void;
}

const NoteForm: React.FC<Props> = ({ initialData, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setContent(initialData.content);
    } else {
      setTitle('');
      setContent('');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ title, content });
    setTitle('');
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className={styles.noteForm}>
      <input
        type="text"
        placeholder="Tiêu đề ghi chú"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className={styles.input}
        required
      />
      <textarea
        placeholder="Nội dung ghi chú"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className={styles.textarea}
      />
      <div className={styles.formActions}>
        {initialData && (
          <button type="button" onClick={onCancel} className={styles.cancelBtn}>
            Huỷ
          </button>
        )}
        <button type="submit" className={styles.saveBtn}>
          {initialData ? (
            <>
              <Edit size={16} style={{ marginRight: '0.5rem' }} />
              Cập nhật
            </>
          ) : (
            <>
              <Plus size={16} style={{ marginRight: '0.5rem' }} />
              Tạo mới
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default NoteForm;
