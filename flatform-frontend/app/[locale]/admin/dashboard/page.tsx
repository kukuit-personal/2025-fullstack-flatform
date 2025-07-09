'use client'

import { useEffect, useState } from 'react'
import api from '@/lib/api'

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [countdown, setCountdown] = useState(11)
  const [showButton, setShowButton] = useState(false)

  // Gọi API profile ban đầu
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/auth/profile')
        setProfile(res.data)
        console.log('✅ Profile ban đầu:', res.data)
      } catch (err) {
        console.error('❌ Lỗi khi gọi /auth/profile:', err)
      }
    }

    fetchProfile()
  }, [])

  // Đếm ngược 11 giây
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else {
      setShowButton(true)
    }
  }, [countdown])

  // Gọi lại profile khi bấm nút
  const handleRefetchProfile = async () => {
    try {
      const res = await api.get('/auth/profile')
      setProfile(res.data)
      console.log('🔁 Profile sau khi bấm nút:', res.data)
    } catch (err) {
      console.error('❌ Lỗi khi gọi lại /auth/profile:', err)
    }
  }

  return (
    <div>
      <h1>Chào mừng Admin!</h1>

      {profile && (
        <div>
          <p><strong>Email:</strong> {profile.user.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        {showButton ? (
          <button style={{ padding: '10px 20px', backgroundColor: '#0070f3', color: '#fff', border: 'none', borderRadius: '5px' }} onClick={handleRefetchProfile}>Gọi lại /auth/profile</button>
        ) : (
          <p>Vui lòng chờ: {countdown} giây...</p>
        )}
      </div>
    </div>
  )
}
