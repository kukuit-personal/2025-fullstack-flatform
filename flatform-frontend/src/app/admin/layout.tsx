import { RoleGuardLayout } from '@/components/RoleGuardLayout'
import AdminLayout from '@/components/layouts/admin/AdminLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuardLayout allowedRoles={['admin']}>
      <AdminLayout>{children}</AdminLayout>
    </RoleGuardLayout>
  );
}
