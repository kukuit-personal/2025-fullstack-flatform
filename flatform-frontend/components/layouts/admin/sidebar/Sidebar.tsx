'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ChevronDown,
  ChevronRight,
  File,
  Settings
} from 'lucide-react';
import { useState } from 'react';
import styles from './sidebar.module.scss';

export default function Sidebar({ sidebarOpen, setSidebarOpen }: { sidebarOpen: boolean, setSidebarOpen: (v: boolean) => void }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const isActive = (path: string) => pathname.startsWith(path);

  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Products', path: '/admin/products', icon: Package },
    {
      label: 'Admin',
      icon: File,
      submenu: [
        { label: 'Permissions', path: '/admin/permissions' },
        { label: 'Roles', path: '/admin/roles' }
      ]
    },
    {
      label: 'Settings',
      icon: Settings,
      submenu: [
        { label: 'General', path: '/admin/settings/general' },
        { label: 'Email', path: '/admin/settings/email' }
      ]
    }
  ];

  return (
    <aside
      className={`${styles.adminSidebar} fixed z-20 lg:static lg:block transform transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className={styles.adminSidebarHeader}>
        Open Admin
      </div>
      <nav className={styles.adminSidebarNav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isSubmenuOpen = openMenu === item.label;

          if (item.submenu) {
            return (
              <div key={item.label}>
                <button
                  className="w-full flex items-center gap-3 px-5 py-2 text-left hover:bg-[#2a3548]"
                  onClick={() => setOpenMenu(isSubmenuOpen ? null : item.label)}
                >
                  <Icon size={18} />
                  <span className="flex-1">{item.label}</span>
                  {isSubmenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </button>
                {isSubmenuOpen && (
                  <div className={styles.submenu}>
                    {item.submenu.map((sub) => (
                      <Link
                        key={sub.path}
                        href={sub.path}
                        className={`${isActive(sub.path) ? styles.active : ''}`}
                      >
                        {sub.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path!}
              className={`${isActive(item.path!) ? styles.active : ''}`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
