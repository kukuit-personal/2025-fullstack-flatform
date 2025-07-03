import { useRouter } from 'next/navigation';
import { useState } from 'react';
import api from '@/lib/api';

export const useAuth = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const res = await api.post('/auth/login', { email, password });
      const redirect = res.data.redirect;

      // ✅ Điều hướng theo role trả về
      router.push(redirect);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập thất bại';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
      router.push('/login');
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  return {
    login,
    logout,
    loading,
    error,
    setError,
  };
};
