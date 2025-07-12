// app/admin/users/components/UsersTable.tsx
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

interface Props {
  data: User[]
  onToggleStatus: (user: User) => void
}

export default function UsersTable({ data, onToggleStatus }: Props) {
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
      cell: ({ row }) => row.original.role?.name || '-',
    },
    {
      accessorKey: 'status',
      header: 'Trạng thái',
    },
    {
      id: 'actions',
      header: 'Hành động',
      cell: ({ row }) => (
        <div className="flex gap-2">
          <Link href={`/admin/users/${row.original.id}`} className="text-blue-600">Sửa</Link>
          <button
            onClick={() => onToggleStatus(row.original)}
            className={row.original.status === 'active' ? 'text-red-600' : 'text-green-600'}
          >
            {row.original.status === 'active' ? 'Disable' : 'Kích hoạt'}
          </button>
        </div>
      ),
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
