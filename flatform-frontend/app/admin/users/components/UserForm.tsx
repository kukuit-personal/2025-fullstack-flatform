'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import { User } from './../types'

interface Props {
  user?: Partial<User>
  isEdit?: boolean
}

export default function UserForm({ user, isEdit }: Props) {
  const router = useRouter()
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: '',
    name: '',
    phone: '',
    gender: '',
    dob: '',
  })

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || '',
        password: '',
        role: user.roleId?.toString() || '',
        name: user.profile?.name || '',
        phone: user.profile?.phone || '',
        gender: user.profile?.gender || '',
        dob: user.profile?.dob
          ? new Date(user.profile.dob).toISOString().split('T')[0]
          : '',
      })
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      email: form.email,
      password: form.password,
      role: Number(form.role),
      name: form.name,
      phone: form.phone,
      gender: form.gender,
      dob: form.dob,
    }

    if (isEdit && user?.id) {
      await api.put(`/users/${user.id}`, payload)
    } else {
      await api.post('/users', payload)
    }
    router.push('/admin/users')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <input
        name="email"
        type="email"
        placeholder="Email"
        className="border p-2 w-full rounded"
        value={form.email}
        onChange={handleChange}
        required
      />

      <input
        name="password"
        type="password"
        placeholder="Password"
        className="border p-2 w-full rounded"
        value={form.password}
        onChange={handleChange}
        required={!isEdit}
      />

      <select
        name="role"
        className="border p-2 w-full rounded"
        value={form.role}
        onChange={handleChange}
        required
      >
        <option value="">-- Vai trò --</option>
        <option value="1">Admin</option>
        <option value="2">Client</option>
      </select>

      <input
        name="name"
        type="text"
        placeholder="Tên hiển thị"
        className="border p-2 w-full rounded"
        value={form.name}
        onChange={handleChange}
      />

      <input
        name="phone"
        type="text"
        placeholder="Số điện thoại"
        className="border p-2 w-full rounded"
        value={form.phone}
        onChange={handleChange}
      />

      <select
        name="gender"
        className="border p-2 w-full rounded"
        value={form.gender}
        onChange={handleChange}
      >
        <option value="">-- Giới tính --</option>
        <option value="male">Nam</option>
        <option value="female">Nữ</option>
        <option value="other">Khác</option>
      </select>

      <input
        name="dob"
        type="date"
        className="border p-2 w-full rounded"
        value={form.dob || ''}
        onChange={handleChange}
      />

      <button className="bg-blue-600 text-white px-4 py-2 rounded shadow">
        {isEdit ? 'Cập nhật' : 'Tạo mới'}
      </button>
    </form>
  )
}
