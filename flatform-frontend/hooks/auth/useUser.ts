"use client";

import useSWR from "swr";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import { User } from "@/types/profile";

export const useUser = () => {
  const pathname = usePathname();

  // ❗ Không gọi /auth/profile ở trang /login hoặc public routes
  const shouldFetch = pathname !== "/login";

  const { data, error, isLoading, mutate } = useSWR<User | null>(
    shouldFetch ? "/auth/profile" : null,
    async () => {
      const res = await api.get("/auth/profile");
      return res.data.user;
    }
  );

  return {
    user: data,
    isLoading,
    isError: !!error,
    mutate,
  };
};
