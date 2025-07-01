'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getUserProfile } from '@/lib/auth'
import { User } from '@/types/user'

interface RoleGuardLayoutProps {
  allowedRoles: string[]
  children: React.ReactNode
}

export function RoleGuardLayout({ allowedRoles, children }: RoleGuardLayoutProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const check = async () => {
      const u = await getUserProfile()
      if (!u || !allowedRoles.includes(u.role)) {
        router.replace('/login')
      } else {
        setUser(u)
        setLoading(false)
      }
    }

    check()
  }, [])

  if (loading) return <p className="p-4">Đang kiểm tra quyền truy cập...</p>

  return <>{children}</>
}
