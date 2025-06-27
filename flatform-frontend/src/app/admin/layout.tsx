// app/admin/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className="bg-gray-100">
        <nav className="bg-blue-700 text-white p-4">Admin Panel</nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  )
}
