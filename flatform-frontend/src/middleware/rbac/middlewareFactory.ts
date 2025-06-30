import { NextRequest, NextResponse } from 'next/server'
import api from '@/lib/api'

export function middlewareFactory(allowedRoles: string[]) {
  return async function (req: NextRequest) {
    const cookie = req.headers.get('cookie') || ''

    let res

    try {
      // Gọi API kiểm tra role lần đầu
      res = await api.get('/auth/role', {
        headers: { cookie },
        withCredentials: true,
      })
    } catch (err: any) {
      // Nếu token hết hạn (401) thì thử refresh
      if (err.response?.status === 401) {
        try {
          // Gọi API refresh token
          await api.post(
            '/auth/refresh',
            {},
            {
              headers: { cookie },
              withCredentials: true,
            }
          )

          // Gọi lại API role sau khi refresh thành công
          res = await api.get('/auth/role', {
            headers: { cookie },
            withCredentials: true,
          })
        } catch (refreshErr) {
          console.error('Refresh token failed in middleware:', refreshErr)
          return NextResponse.redirect(new URL('/login', req.url))
        }
      } else {
        // Các lỗi khác (403, 500,...) cũng redirect về login
        console.error('Unexpected error in /auth/role:', err)
        return NextResponse.redirect(new URL('/login', req.url))
      }
    }

    const role = res?.data?.role

    // Nếu role không phù hợp → redirect
    if (!allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Hợp lệ → tiếp tục
    return NextResponse.next()
  }
}
