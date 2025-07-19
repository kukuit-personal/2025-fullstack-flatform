'use client'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import UserForm from '../components/UserForm'
import api from '@/lib/api'
import { User } from './../types'
import Link from 'next/link'

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

  if (isEdit && !user) return <p>Đang tải...</p>

  return (
    <div className="space-y-6">


      <div className="text-sm text-gray-500">
        <Link href="/admin/dashboard" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <Link href="/admin/users" className="hover:underline">Users</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">
          {isEdit ? 'Update' : 'Add New'} User
        </span>
      </div>



      <h1 className="text-xl font-bold mb-4">{isEdit ? 'Cập nhật' : 'Tạo mới'} User</h1>
      <UserForm isEdit={isEdit} user={user || undefined} />
    </div>
  )
}
