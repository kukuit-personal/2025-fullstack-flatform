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
  // ===== Desktop/Table columns =====
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
        const label = roleName
          ? roleName.charAt(0).toUpperCase() + roleName.slice(1)
          : "-";
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
      header: () => <div className="text-center">Actions</div>,
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
          <div className="flex items-center justify-center gap-2">
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
    <div className="bg-white">
      {/* ===== Mobile/List (sm) ===== */}
      <div className="md:hidden space-y-3">
        {data.map((user) => {
          const isActive = user.status === "active";
          const isLoading = loadingIds.includes(user.id);
          const roleName = user.role?.name || "-";
          const rolePill =
            roleName.toLowerCase() === "admin"
              ? "bg-indigo-50 text-indigo-700"
              : "bg-sky-50 text-sky-700";

          const confirmTitle =
            user.status === "active"
              ? "Vô hiệu hóa người dùng"
              : "Kích hoạt người dùng";
          const confirmMessage = `Bạn có chắc chắn muốn ${
            user.status === "active" ? "vô hiệu hóa" : "kích hoạt"
          } user ${user.email}?`;

          return (
            <div key={user.id} className="border border-gray-200 p-3 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs text-gray-500">
                    ID: {String(user.id).slice(0, 6)}...
                  </div>
                  <div className="truncate font-medium text-gray-900">
                    {user.email}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${rolePill}`}
                    >
                      {roleName.charAt(0).toUpperCase() + roleName.slice(1)}
                    </span>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-center text-[11px] font-semibold
                        ${
                          isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                    >
                      {isActive ? "active" : "disable"}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  {onEdit ? (
                    <button
                      onClick={() => onEdit(user)}
                      className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                    >
                      Edit
                    </button>
                  ) : (
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 transition hover:bg-blue-100"
                    >
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
                          className={`rounded px-2 py-1 text-xs font-medium transition
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
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Desktop/Table (md+) ===== */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full table-fixed divide-y divide-gray-100 text-sm">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header, idx, arr) => (
                  <th
                    key={header.id}
                    className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-700
                      ${
                        header.id === "actions"
                          ? "w-[140px] text-center"
                          : "w-1/4 text-left"
                      }
                      ${idx === arr.length - 1 ? "text-center" : ""}
                    `}
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
                    className={`whitespace-nowrap px-4 py-3 text-gray-800
                      ${
                        cell.column.id === "actions"
                          ? "text-center w-[140px]"
                          : "w-1/4"
                      }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
