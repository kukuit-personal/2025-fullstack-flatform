'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import api from '@/lib/api'
import { User } from './types'
import UsersTable from './components/UsersTable'
import { toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1)
  const [status, setStatus] = useState(searchParams.get('status') || 'all')
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')
  const [totalPages, setTotalPages] = useState(1)
  const [loadingIds, setLoadingIds] = useState<number[]>([])
  const [isTableDisabled, setIsTableDisabled] = useState(false)

  const fetchUsers = async () => {
    const params: any = { page, limit: 10 }
    if (status !== 'all') params.status = status
    if (keyword) params.q = keyword

    const res = await api.get('/users', { params })
    setUsers(res.data.data)
    setTotalPages(res.data.totalPages)
  }

  useEffect(() => {
    fetchUsers()
  }, [page, status, keyword])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    fetchUsers()
  }

  const handleToggleStatus = async (user: User) => {
    const isDisabling = user.status === 'active'
    const actionText = isDisabling ? 'vô hiệu hóa' : 'kích hoạt lại'

    if (!confirm(`Bạn có chắc chắn muốn ${actionText} user ${user.email}?`)) return

    const newStatus = isDisabling ? 'disable' : 'active'

    try {
      setLoadingIds((prev) => [...prev, user.id])
      setIsTableDisabled(true)

      // 👇 Gọi API DELETE hoặc PUT tùy bạn, ở đây là DELETE
      await api.delete(`/users/${user.id}`)

      // ✅ Cập nhật local state để giữ nguyên vị trí
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, status: newStatus } : u
        )
      )

      toast.success(`Đã ${newStatus === 'disable' ? 'vô hiệu hóa' : 'kích hoạt'} user ${user.email}`)
    } catch (err) {
      console.error('Thao tác thất bại:', err)
      toast.error('Thao tác thất bại')
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== user.id))
      setIsTableDisabled(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-500">
        <Link href="/admin" className="hover:underline">Admin</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">Users</span>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Quản lý Users</h1>
        <Link
          href="/admin/users/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
        >
          + Thêm user
        </Link>
      </div>

      <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border p-2 rounded min-w-[120px]"
        >
          <option value="all">Tất cả</option>
          <option value="active">Hoạt động</option>
          <option value="disable">Vô hiệu</option>
        </select>

        <input
          type="text"
          placeholder="Tìm email..."
          className="border p-2 rounded w-64"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />

        <button className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded">
          Tìm
        </button>
      </form>

      <UsersTable
        data={users}
        onToggleStatus={handleToggleStatus}
        loadingIds={loadingIds}
        disabled={isTableDisabled}
      />

      <div className="flex flex-wrap gap-2 mt-6">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            disabled={isTableDisabled}
            className={`px-3 py-1 rounded border transition ${
              page === i + 1
                ? 'bg-black text-white font-semibold'
                : 'bg-white hover:bg-gray-100 text-gray-700'
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  )
}
