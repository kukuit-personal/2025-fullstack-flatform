// app/admin/users/actions.ts
import api from "@/lib/api";

export const getUsers = (params: any) => api.get("/admin/users", { params });
export const getUserById = (id: string) => api.get(`/admin/users/${id}`);
export const createUser = (data: any) => api.post("/admin/users", data);
export const updateUser = (id: string, data: any) =>
  api.put(`/admin/users/${id}`, data);
export const disableUser = (id: string) => api.delete(`/admin/users/${id}`);
