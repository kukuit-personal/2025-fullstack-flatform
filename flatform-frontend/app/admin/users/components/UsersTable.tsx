"use client";

import React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import Link from "next/link";
import { User } from "../types";
import ConfirmModal from "@/components/common/ConfirmModal";

interface Props {
  data: User[];
  onToggleStatus: (user: User) => void;
  loadingIds?: string[];
  disabled?: boolean;
  /** Nếu truyền onEdit, nút Edit sẽ mở popup; nếu không, fallback về link cũ */
  onEdit?: (user: User) => void;
}

export default function UsersTable({
  data,
  onToggleStatus,
  loadingIds = [],
  onEdit,
}: Props) {
  const columns: ColumnDef<User>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const id = String(row.original.id);
        return id ? `${id.slice(0, 6)}...` : "-";
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "role.name",
      header: "Role",
      cell: ({ row }) => {
        const roleName = row.original.role?.name || "-";
        const label = roleName.charAt(0).toUpperCase() + roleName.slice(1);
        const pill =
          roleName.toLowerCase() === "admin"
            ? "bg-indigo-50 text-indigo-700"
            : "bg-sky-50 text-sky-700";
        return (
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${pill}`}
          >
            {label}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.original.status === "active";
        return (
          <span
            className={`inline-block w-[70px] rounded px-2 py-1 text-center text-xs font-semibold
              ${
                isActive
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-200 text-gray-700"
              }`}
          >
            {isActive ? "active" : "disable"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const user = row.original;
        const isLoading = loadingIds.includes(user.id);

        const confirmTitle =
          user.status === "active"
            ? "Vô hiệu hóa người dùng"
            : "Kích hoạt người dùng";
        const confirmMessage = `Bạn có chắc chắn muốn ${
          user.status === "active" ? "vô hiệu hóa" : "kích hoạt"
        } user ${user.email}?`;

        return (
          <div className="flex items-center justify-end gap-2">
            {onEdit ? (
              <button
                onClick={() => onEdit(user)}
                className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 20h4l10-10-4-4L4 16v4z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                Edit
              </button>
            ) : (
              <Link
                href={`/admin/users/${user.id}`}
                className="flex items-center gap-1 rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 20h4l10-10-4-4L4 16v4z"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                </svg>
                Edit
              </Link>
            )}

            {isLoading ? (
              <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                Đang xử lý...
              </span>
            ) : (
              <ConfirmModal
                title={confirmTitle}
                message={confirmMessage}
                onConfirm={() => onToggleStatus(user)}
                trigger={
                  <button
                    className={`w-[92px] rounded px-2 py-1 text-center text-xs font-medium transition
                      ${
                        user.status === "active"
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                  >
                    {user.status === "active" ? "Disable" : "Kích hoạt"}
                  </button>
                }
              />
            )}
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="overflow-hidden bg-white">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700"
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-gray-50">
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="whitespace-nowrap px-4 py-3 text-gray-800"
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
