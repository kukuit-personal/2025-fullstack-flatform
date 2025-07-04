'use client';
import { Bell, Menu, UserCircle, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/hooks/auth/useAuth';
import styles from './header.module.scss';

const fetcher = (url: string) =>
  new Promise((res) =>
    setTimeout(() => res({ unread: Math.floor(Math.random() * 5) }), 500)
  );


export default function Header({ setSidebarOpen }: { setSidebarOpen: (v: boolean) => void }) {
  const { logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: notification } = useSWR('/api/notifications', fetcher, {
    refreshInterval: 10000,
  });

  return (
    <header className={`${styles.adminHeader} w-full flex justify-between items-center px-6 bg-white shadow-md border-b border-gray-200`}
    >
      <button className="lg:hidden" onClick={() => setSidebarOpen(true)}>
        <Menu />
      </button>
      <div className="ml-auto flex items-center gap-4">
        <button className="relative">
          <Bell className="w-5 h-5" />
          {notification?.unread > 0 && (
            <span className="absolute top-0 right-0 w-4 h-4 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
              {notification.unread}
            </span>
          )}
        </button>
        <div className="relative">
          <button
            className="flex items-center space-x-2"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
          >
            <UserCircle className="w-6 h-6" />
            <span className="font-medium">Admin</span>
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 bg-white shadow-md rounded-lg z-10 overflow-hidden">
              <Link href="/admin/profile" className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100">
                <User size={16} /> Profile
              </Link>
              <button
                className="flex items-center gap-2 w-full px-4 py-2 hover:bg-gray-100"
                onClick={logout}
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
