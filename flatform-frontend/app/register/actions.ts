import api from '@/lib/api';
import { RegisterDto } from './types';

export const register = async (data: RegisterDto) => {
  try {
    const res = await api.post('/auth/register', data);
    return res.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.message || 'Registration failed. Please try again.';
    throw new Error(message);
  }
};
