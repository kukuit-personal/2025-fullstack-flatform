import { RoleGuardLayout } from '@/components/RoleGuardLayout'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuardLayout allowedRoles={['admin', 'client']}>
      {/* <nav className="bg-green-500 text-white p-4">Client App</nav> */}
      <main className="p-6">{children}</main>
    </RoleGuardLayout>
  )
}
