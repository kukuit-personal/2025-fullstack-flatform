import React, { useState, useRef, useEffect } from 'react';
import { Note } from '../types';
import styles from '../noted.module.css';
import { MoreVertical, Edit, Trash2,  } from 'lucide-react';

interface Props {
  note: Note;
  onEdit: () => void;
  onDelete: () => void;
}

const NoteCard: React.FC<Props> = ({ note, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.noteCard}>
      <div className={styles.header}>
        <div className={styles.avatar}>KH</div>
        <div style={{ flex: 1 }}>
          <div className={styles.author}>Bạn</div>
          <div className={styles.timestamp}>
            {new Date(note.updatedAt).toLocaleString('vi-VN')}
          </div>
        </div>

        {/* Nút menu */}
        <div className={styles.menuWrapper} ref={menuRef}>
          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <MoreVertical size={20} />
          </button>
          {menuOpen && (
            <div className={styles.menuDropdown}>
              <button onClick={onEdit}>
                <Edit size={16} /> Sửa
              </button>
              <button onClick={onDelete}>
                <Trash2 size={16} /> Xoá
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={styles.title}>{note.title}</div>
      <div className={styles.content}>{note.content}</div>
    </div>
  );
};

export default NoteCard;
