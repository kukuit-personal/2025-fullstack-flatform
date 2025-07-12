'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import UserForm from '../components/UserForm'
import api from '@/lib/api'
import { User } from './../types'

export default function UserFormPage() {
  const { id } = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  const isEdit = id !== 'new'

  useEffect(() => {
    if (isEdit) {
      api.get(`/users/${id}`).then((res) => setUser(res.data))
    }
  }, [id])

  if (isEdit && !user) return <p className="p-6">Đang tải...</p>

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">{isEdit ? 'Cập nhật' : 'Tạo mới'} User</h1>
      <UserForm isEdit={isEdit} user={user || undefined} />
    </div>
  )
}
