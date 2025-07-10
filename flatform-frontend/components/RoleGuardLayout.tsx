'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/hooks/auth/useUser';

interface RoleGuardLayoutProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export function RoleGuardLayout({ allowedRoles, children }: RoleGuardLayoutProps) {
  const router = useRouter();
  const { user, isLoading, isError } = useUser();

  useEffect(() => {
    if (!isLoading && (!user || !allowedRoles.includes(user.role))) {
      router.replace('/login');
    }
  }, [isLoading, user, allowedRoles, router]);

  if (isLoading || !user) {
    return <p className="p-4">Đang kiểm tra quyền truy cập...</p>;
  }

  return <>{children}</>;
}
