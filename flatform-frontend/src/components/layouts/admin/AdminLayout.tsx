'use client';
import React, { useState } from 'react';
import Sidebar from './sidebar/Sidebar';
import Header from './header/Header';
import Footer from './footer/Footer';
import './admin-layout.module.scss';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-layout flex min-h-screen bg-gray-50 text-gray-800">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-6 bg-gray-50">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
