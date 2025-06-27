// app/client/layout.tsx
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body className="bg-white">
        <nav className="bg-green-500 text-white p-4">Client App</nav>
        <main className="p-6">{children}</main>
      </body>
    </html>
  )
}
