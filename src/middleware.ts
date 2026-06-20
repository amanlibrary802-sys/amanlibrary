import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const pathname = request.nextUrl.pathname

  // 1. Exclude public assets and login pages from heavy checks
  if (
    pathname.startsWith('/_next') || 
    pathname === '/admin/login' || 
    pathname === '/login' ||
    pathname.startsWith('/auto-login') ||
    pathname === '/'
  ) {
    return response
  }

  // 2. Heavy checks only for protected routes
  const { data: { user } } = await supabase.auth.getUser()

  // Protect student routes
  if (pathname.startsWith('/student')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Protect admin routes
  if (pathname.startsWith('/admin')) {
    if (!user) {
      // Auto-login as admin instead of showing login form
      const redirectUrl = new URL('/auto-login', request.url)
      redirectUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check role
    const { data: profile } = await supabase
      .from('students')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.redirect(new URL('/student', request.url))
    }
  }

  return response
}

export const config = {
  matcher: ['/student/:path*', '/admin/:path*'],
}
