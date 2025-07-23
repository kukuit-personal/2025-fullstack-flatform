import React from 'react';
import { Note } from '../types';
import styles from '../noted.module.css';

interface Props {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}

const NoteCard: React.FC<Props> = ({ note, onEdit, onDelete }) => {
  return (
    <div className={styles.noteCard}>
      <div className={styles.header}>
        <div className={styles.avatar}>KH</div>
        <div>
          <div className={styles.author}>Bạn</div>
          <div className={styles.timestamp}>
            {new Date(note.updatedAt).toLocaleString('vi-VN')}
          </div>
        </div>
      </div>

      <div className={styles.title}>{note.title}</div>
      <div className={styles.content}>{note.content}</div>

      <div className={styles.noteActions}>
        <button className={styles.editBtn} onClick={onEdit}>
          Sửa
        </button>
        <button className={styles.deleteBtn} onClick={onDelete}>
          Xoá
        </button>
      </div>
    </div>
  );
};

export default NoteCard;
