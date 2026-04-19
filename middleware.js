/**
 * SUPER ADMIN ROUTE PROTECTION MIDDLEWARE
 * 
 * Protects all /admin/* routes and /api/admin/* API routes.
 * Only SUPER_ADMIN or ADMIN role can access these routes.
 */

import { NextResponse } from 'next/server'

// Roles that can access admin routes
const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN']

/**
 * Extract JWT token from request
 * Check both Authorization header and cookie
 */
function getToken(request) {
  // First try Authorization header (for API calls)
  const authHeader = request.headers.get('authorization')
  
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    return authHeader
  }

  // Fallback to cookie (for page navigation after login)
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {})
    if (cookies.auth_token) {
      return cookies.auth_token
    }
  }

  return null
}

/**
 * Decode JWT token (simple implementation)
 * In production, use proper JWT verification with the secret
 */
function decodeToken(token) {
  try {
    // Simple base64 decode without verification for middleware
    // The actual verification happens in the API routes using the auth module
    const parts = token.split('.')
    if (parts.length !== 3) {
      return null
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    return payload
  } catch (error) {
    return null
  }
}

/**
 * Match admin routes
 */
function isAdminRoute(pathname) {
  return pathname.startsWith('/admin') || pathname.startsWith('/api/admin')
}

export async function middleware(request) {
  const { pathname } = request.nextUrl

  // Only protect admin routes
  if (!isAdminRoute(pathname)) {
    return NextResponse.next()
  }

  const token = getToken(request)

  if (!token) {
    // No token provided - redirect to login or return unauthorized
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }
    
    // For page routes, redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Decode and verify token
  const decoded = decodeToken(token)

  if (!decoded) {
    // Invalid token
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid or expired token',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      )
    }
    
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check for admin role
  const userRole = decoded.role

  if (!ADMIN_ROLES.includes(userRole)) {
    // User doesn't have admin role
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Super Admin access required',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }
    
    // Redirect regular users to their dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add user info to headers for API routes
  if (pathname.startsWith('/api/')) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-user-id', decoded.userId || decoded.id || '')
    requestHeaders.set('x-user-role', userRole)
    requestHeaders.set('x-clinic-id', decoded.clinicId || '')
    
    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    })
  }

  // Continue for page routes
  return NextResponse.next()
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    // Match all /admin/* routes (including nested)
    '/admin/:path*',
    // Match all /api/admin/* routes
    '/api/admin/:path*'
  ]
}
