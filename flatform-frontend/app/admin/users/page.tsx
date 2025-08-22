"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { User } from "./types";
import UsersTable from "./components/UsersTable";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Modal from "./components/Modal";
import UserForm from "./components/UserForm";

export default function UsersPage() {
  const searchParams = useSearchParams();

  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(Number(searchParams.get("page")) || 1);
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [totalPages, setTotalPages] = useState(1);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const [isTableDisabled, setIsTableDisabled] = useState(false);

  // popup state
  const [openModal, setOpenModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const res = await api.get("/users/filter/search", {
        params: {
          status: status !== "all" ? status : undefined,
          email: keyword || undefined,
          page,
          limit: 10,
        },
      });
      setUsers(res.data.data);
      setTotalPages(res.data.totalPages || 1);
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng");
      console.error(error);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [status, keyword]);
  useEffect(() => {
    fetchUsers();
  }, [page, status, keyword]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleToggleStatus = async (user: User) => {
    const isDisabling = user.status === "active";
    const newStatus = isDisabling ? "disable" : "active";
    try {
      setLoadingIds((prev) => [...prev, user.id]);
      setIsTableDisabled(true);
      await api.patch(`/users/${user.id}/status`, { status: newStatus });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
      );
      toast.success(
        `Đã ${newStatus === "disable" ? "vô hiệu hóa" : "kích hoạt"} user ${
          user.email
        }`
      );
    } catch (err) {
      console.error("Thao tác thất bại:", err);
      toast.error("Thao tác thất bại");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== user.id));
      setIsTableDisabled(false);
    }
  };

  // modal helpers
  const openCreate = () => {
    setEditingUser(null);
    setOpenModal(true);
  };
  const openEdit = (user: User) => {
    setEditingUser(user);
    setOpenModal(true);
  };
  const closeModalAndRefresh = () => {
    setOpenModal(false);
    setEditingUser(null);
    fetchUsers();
  };

  const showingText = useMemo(() => {
    const start = users.length ? (page - 1) * 10 + 1 : 0;
    const end = (page - 1) * 10 + users.length;
    const total = totalPages * 10;
    return `Showing ${start}-${end} of ${total}`;
  }, [users, page, totalPages]);

  return (
    <div className="space-y-6">
      {/* breadcrumb */}
      <div className="text-sm text-gray-500">
        <Link href="/admin/dashboard" className="hover:underline">
          Admin
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-800 font-medium">Users</span>
      </div>

      {/* header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Users</h1>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-1 text-white shadow hover:bg-gray-900"
        >
          + New User
        </button>
      </div>

      {/* filTer */}
      <div className="">
        <form
          onSubmit={handleSearch}
          className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center"
        >
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="py-2 min-w-[140px] rounded-lg border border-gray-300 px-3 text-sm"
          >
            <option value="all">Tất cả</option>
            <option value="active">Hoạt động</option>
            <option value="disable">Vô hiệu</option>
          </select>

          <input
            type="text"
            placeholder="Tìm email..."
            className="py-2 w-full rounded-lg border border-gray-300 px-3 text-sm sm:w-64"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <button
            type="submit"
            className="py-2 rounded-lg bg-gray-800 px-4 text-sm text-white hover:bg-gray-900 sm:w-auto"
          >
            Tìm
          </button>
        </form>
      </div>

      {/* card */}
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-gray-500">{showingText}</div>
        </div>

        {/* table */}
        <div className="">
          <UsersTable
            data={users}
            onToggleStatus={handleToggleStatus}
            loadingIds={loadingIds}
            disabled={isTableDisabled}
            onEdit={openEdit} // mở popup thay vì điều hướng
          />
        </div>

        {/* pagination */}
        <div className="flex items-center justify-end gap-2 border-t border-gray-300 px-4 pb-4 pt-3">
          {/* Prev */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1 || isTableDisabled}
            className={`h-9 rounded-lg border px-3 text-sm transition
      ${
        page === 1
          ? "cursor-not-allowed border-gray-300 bg-white text-gray-400"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
      }`}
          >
            Prev
          </button>

          {/* page numbers */}
          {Array.from({ length: totalPages }, (_, i) => {
            const idx = i + 1;
            const isActive = page === idx;
            return (
              <button
                key={idx}
                onClick={() => setPage(idx)}
                disabled={isTableDisabled}
                className={`h-9 w-9 rounded-lg border text-sm transition
          ${
            isActive
              ? "border-black bg-black font-semibold text-white"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
          }`}
              >
                {idx}
              </button>
            );
          })}

          {/* Next */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages || isTableDisabled}
            className={`h-9 rounded-lg border px-3 text-sm transition
      ${
        page === totalPages
          ? "cursor-not-allowed border-gray-300 bg-white text-gray-400"
          : "border-gray-300 bg-white hover:bg-gray-100"
      }`}
          >
            Next
          </button>
        </div>
      </div>

      {/* MODAL */}
      <Modal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={editingUser ? "Edit User" : "New User"}
        width="max-w-xl"
      >
        <UserForm
          isEdit={!!editingUser}
          user={editingUser || undefined}
          useRedirect={false}
          onSuccess={closeModalAndRefresh}
        />
      </Modal>
    </div>
  );
}
