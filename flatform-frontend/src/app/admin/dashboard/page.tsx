'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile') // 👈 Gọi API profile
        setProfile(res.data)
        console.log('✅ Profile:', res.data)
      } catch (err) {
        console.error('❌ Lỗi khi gọi /auth/profile:', err)
      }
    }

    fetchProfile()
  }, [])

  return (
    <div>
      <h1>Chào mừng Admin!</h1>
      {profile && (
        <div>
          <p><strong>Email:</strong> {profile.user.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
        </div>
      )}
    </div>
  )
}
