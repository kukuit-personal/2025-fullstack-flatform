import api from '@/lib/api';
import { CreateNoteDto, NotesResponse } from './types';

export const getNotes = async (params: any): Promise<NotesResponse> => {
  const res = await api.get('/noted', { params });
  return res.data;
};
export const getNoteById = (id: number) => api.get(`/noted/${id}`);
export const createNote = (data: CreateNoteDto) => api.post('/noted', data);
export const updateNote = (id: number, data: CreateNoteDto) => api.put(`/noted/${id}`, data);
export const deleteNote = (id: number) => api.delete(`/noted/${id}`);
