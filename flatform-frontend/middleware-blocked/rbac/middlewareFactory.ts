import { NextRequest, NextResponse } from 'next/server'

export function middlewareFactory(allowedRoles: string[]) {
  return async function (req: NextRequest) {
    const cookie = req.headers.get('cookie') || ''
    const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001'

    try {
      // Gọi API /auth/role để lấy quyền người dùng
      const res = await fetch(`${baseUrl}/auth/role`, {
        method: 'GET',
        headers: {
          cookie, // Gửi cookie để backend kiểm tra JWT
        },
        credentials: 'include', // Gửi cookie httpOnly
      })

      if (res.status === 401) {
        // Token hết hạn hoặc không hợp lệ
        return NextResponse.redirect(new URL('/login', req.url))
      }

      const data = await res.json()
      const role = data?.role

      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      return NextResponse.next()
    } catch (err) {
      console.error('Middleware error:', err)
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
}
