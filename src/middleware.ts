import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const { pathname } = req.nextUrl

  // Allow webhook, test endpoints and NextAuth without authentication
  if (pathname.startsWith('/api/webhook') || pathname.startsWith('/api/test-env') || pathname.startsWith('/api/test-auth') || pathname.startsWith('/api/auth')) {
    return NextResponse.next()
  }

  // Allow login page without authentication
  if (pathname.startsWith('/login')) {
    // If already authenticated, redirect to home
    if (req.auth) {
      return NextResponse.redirect(new URL('/', req.url))
    }
    return NextResponse.next()
  }

  // Protect all other routes
  if (!req.auth) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
