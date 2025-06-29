import { NextRequest, NextResponse } from 'next/server'
import api from '@/lib/api'

export function middlewareFactory(allowedRoles: string[]) {
  return async function (req: NextRequest) {
    const cookie = req.headers.get('cookie') || ''

    try {
      // Gửi cookie httpOnly sang backend để xác thực JWT
      const res = await api.get('/auth/role', {
        headers: { cookie },          // 👈 Gửi cookie sang backend
        withCredentials: true,        // 👈 Cho phép gửi cookie
      })

      const role = res.data?.role

      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/login', req.url))
      }

      return NextResponse.next()
    } catch (err) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
}
