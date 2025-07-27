export interface Note {
  id: number;
  title: string;
  content: string;
  color?: string;
  isFavorite: boolean;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateNoteDto {
  title: string;
  content: string;
  color?: string;
  isFavorite?: boolean;
  isArchived?: boolean;
  categoryId?: number | null;
  parentId?: number | null;
}

export interface NotesResponse {
  data: Note[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
