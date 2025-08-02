// app/admin/users/actions.ts
import api from '@/lib/api'

export const getUsers = (params: any) => api.get('/users', { params })
export const getUserById = (id: string) => api.get(`/users/${id}`)
export const createUser = (data: any) => api.post('/users', data)
export const updateUser = (id: string, data: any) => api.put(`/users/${id}`, data)
export const disableUser = (id: string) => api.delete(`/users/${id}`)
