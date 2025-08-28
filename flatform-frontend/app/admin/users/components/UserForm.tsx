"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { User } from "./../types";

interface Props {
  user?: Partial<User>;
  isEdit?: boolean;
  /** Gọi sau khi submit thành công (để đóng modal + refresh list) */
  onSuccess?: () => void;
  /** Mặc định true: submit xong sẽ push('/admin/users'); đặt false khi dùng trong modal */
  useRedirect?: boolean;
}

export default function UserForm({
  user,
  isEdit,
  onSuccess,
  useRedirect = true,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "",
    name: "",
    phone: "",
    gender: "",
    dob: "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        email: user.email || "",
        password: "",
        role: user.roleId?.toString() || "",
        name: user.profile?.name || "",
        phone: user.profile?.phone || "",
        gender: user.profile?.gender || "",
        dob: user.profile?.dob
          ? new Date(user.profile.dob).toISOString().split("T")[0]
          : "",
      });
    }
  }, [user]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      email: form.email,
      password: form.password,
      role: Number(form.role),
      name: form.name || undefined,
      phone: form.phone || undefined,
      gender: form.gender || undefined,
      dob: form.dob || undefined,
    };

    if (isEdit && user?.id) {
      await api.put(`/admin/users/${user.id}`, payload);
    } else {
      await api.post("/admin/users", payload);
    }

    if (onSuccess) onSuccess();
    if (useRedirect) router.push("/admin/users");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            placeholder="user@company.com"
            className="w-full rounded-lg border px-3 py-2"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            placeholder="••••••••"
            className="w-full rounded-lg border px-3 py-2"
            value={form.password}
            onChange={handleChange}
            required={!isEdit}
          />
          {isEdit && (
            <p className="mt-1 text-xs text-gray-500">
              Để trống nếu không muốn đổi mật khẩu
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Role</label>
          <select
            name="role"
            className="w-full rounded-lg border px-3 py-2"
            value={form.role}
            onChange={handleChange}
            required
          >
            <option value="">-- Chọn vai trò --</option>
            <option value="1">Admin</option>
            <option value="2">Client</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Tên hiển thị</label>
          <input
            name="name"
            type="text"
            placeholder="Nguyễn Văn A"
            className="w-full rounded-lg border px-3 py-2"
            value={form.name}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Số điện thoại
          </label>
          <input
            name="phone"
            type="text"
            placeholder="0123 456 789"
            className="w-full rounded-lg border px-3 py-2"
            value={form.phone}
            onChange={handleChange}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Giới tính</label>
          <select
            name="gender"
            className="w-full rounded-lg border px-3 py-2"
            value={form.gender}
            onChange={handleChange}
          >
            <option value="">-- Chọn --</option>
            <option value="male">Nam</option>
            <option value="female">Nữ</option>
            <option value="other">Khác</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Ngày sinh</label>
          <input
            name="dob"
            type="date"
            className="w-full rounded-lg border px-3 py-2"
            value={form.dob || ""}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700"
        >
          {isEdit ? "Cập nhật" : "Tạo mới"}
        </button>
      </div>
    </form>
  );
}
