'use client'

import React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table'
import Link from 'next/link'
import { User } from '../types'
import ConfirmModal from '@/components/common/ConfirmModal'

interface Props {
  data: User[]
  onToggleStatus: (user: User) => void
  loadingIds?: number[]
  disabled?: boolean
}

export default function UsersTable({ data, onToggleStatus, loadingIds = [] }: Props) {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'email',
      header: 'Email',
    },
    {
      accessorKey: 'role.name',
      header: 'Vai trò',
      cell: ({ row }) => {
      const roleName = row.original.role?.name || '-'
      return roleName.charAt(0).toUpperCase() + roleName.slice(1)
  }
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
      cell: ({ row }) => {
        const status = row.original.status
        const isActive = status === 'active'

        return (
          <span className={`px-2 py-1 rounded text-xs font-semibold 
            ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
            {isActive ? 'Active' : 'Disabled'}
          </span>
        )
      }
    },
    {
      id: 'actions',
      header: 'Hành động',
      cell: ({ row }) => {
        const user = row.original
        const isLoading = loadingIds.includes(user.id)

        const confirmTitle =
          user.status === 'active'
            ? 'Vô hiệu hóa người dùng'
            : 'Kích hoạt người dùng'

        const confirmMessage = `Bạn có chắc chắn muốn ${
          user.status === 'active' ? 'vô hiệu hóa' : 'kích hoạt'
        } user ${user.email}?`

        return (
          <div className="flex gap-2 items-center">
            <Link
              href={`/admin/users/${user.id}`}
              className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100 transition font-medium"
            >
              Sửa
            </Link>

            {isLoading ? (
              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded font-medium">
                Đang xử lý...
              </span>
            ) : (
              <ConfirmModal
                title={confirmTitle}
                message={confirmMessage}
                onConfirm={() => onToggleStatus(user)}
                trigger={
                  <button
                    className={`px-2 py-1 text-xs rounded font-medium transition
                      ${
                        user.status === 'active'
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                  >
                    {user.status === 'active' ? 'Disable' : 'Kích hoạt'}
                  </button>
                }
              />
            )}
          </div>

        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="overflow-auto rounded-lg shadow border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left font-semibold text-gray-700 uppercase tracking-wider"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-gray-800 whitespace-nowrap">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
