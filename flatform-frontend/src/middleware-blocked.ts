import { NextRequest, NextResponse } from 'next/server'
import { middlewareFactory } from './middleware/rbac/middlewareFactory'

// Mapping role theo route
export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname

  if (pathname.startsWith('/admin')) {
    return middlewareFactory(['admin'])(req)
  }

  if (pathname.startsWith('/client')) {
    return middlewareFactory(['client', 'admin'])(req)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/client/:path*'],
}
