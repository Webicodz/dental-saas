/**
 * AUTHENTICATION & RBAC MIDDLEWARE
 * 
 * Foundation layer middleware for the dental SaaS platform.
 * Provides authentication verification and role-based access control.
 * 
 * IN CODEIGNITER:
 * Equivalent to hooks in application/hooks/Auth_hook.php
 */

import { NextResponse } from 'next/server'
import { verifyToken } from './auth'
import { hasPermission, hasAnyPermission } from './permissions'

/**
 * EXTRACT TOKEN FROM REQUEST
 * 
 * Gets JWT token from Authorization header or cookie.
 * Supports both "Bearer <token>" and raw token formats.
 * 
 * @param {Request} request - HTTP request object
 * @returns {string|null} - Token string or null if not found
 */
export function extractToken(request) {
  // First try Authorization header (for API calls)
  const authHeader = request.headers.get('authorization')
  
  if (authHeader) {
    // Support "Bearer <token>" format
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7)
    }
    // Also support raw token
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
 * AUTHENTICATE REQUEST
 * 
 * Validates JWT token and returns decoded payload.
 * Returns null if token is invalid or missing.
 * 
 * @param {Request} request - HTTP request object
 * @returns {Object|null} - Decoded token payload or null
 * 
 * JWT Payload Structure: { userId, email, role, clinicId }
 */
export function authenticate(request) {
  const token = extractToken(request)
  
  if (!token) {
    return null
  }

  const decoded = verifyToken(token)
  return decoded
}

/**
 * REQUIRE AUTHENTICATION - Middleware Wrapper
 * 
 * Factory function that creates authentication enforcement middleware.
 * Use in route handlers to protect endpoints.
 * 
 * @returns {Function} - Middleware function
 * 
 * Usage:
 * ```javascript
 * export async function GET(request) {
 *   const user = requireAuth(request)
 *   if (!user) return authError()
 *   // Continue with authenticated request...
 * }
 * ```
 */
export function requireAuth() {
  return function(request) {
    return authenticate(request)
  }
}

/**
 * REQUIRE ROLE - Role Checking Middleware Factory
 * 
 * Creates middleware that checks if user has one of the specified roles.
 * 
 * @param {...string} allowedRoles - Roles that are allowed access
 * @returns {Function} - Middleware function that checks roles
 * 
 * Usage:
 * ```javascript
 * const requireAdmin = requireRole('ADMIN')
 * // or
 * const requireDoctorOrAdmin = requireRole('ADMIN', 'DOCTOR')
 * ```
 */
export function requireRole(...allowedRoles) {
  return function(request) {
    const user = authenticate(request)
    
    if (!user) {
      return { authorized: false, error: 'Authentication required', user: null }
    }

    if (!allowedRoles.includes(user.role)) {
      return { 
        authorized: false, 
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        user 
      }
    }

    return { authorized: true, user }
  }
}

/**
 * REQUIRE PERMISSION - Permission Checking Middleware Factory
 * 
 * Creates middleware that checks if user has a specific permission.
 * 
 * @param {string} permission - Permission constant to check
 * @returns {Function} - Middleware function that checks permission
 * 
 * Usage:
 * ```javascript
 * const requirePatientCreate = requirePermission(PERMISSIONS.PATIENTS.CREATE)
 * ```
 */
export function requirePermission(permission) {
  return function(request) {
    const user = authenticate(request)
    
    if (!user) {
      return { authorized: false, error: 'Authentication required', user: null }
    }

    if (!hasPermission(user.role, permission)) {
      return { 
        authorized: false, 
        error: `Access denied. Missing permission: ${permission}`,
        user 
      }
    }

    return { authorized: true, user }
  }
}

/**
 * REQUIRE ANY PERMISSION - Multiple Permission Check
 * 
 * Creates middleware that checks if user has any of the specified permissions.
 * 
 * @param {string[]} permissions - Array of permission constants
 * @returns {Function} - Middleware function
 */
export function requireAnyPermission(permissions) {
  return function(request) {
    const user = authenticate(request)
    
    if (!user) {
      return { authorized: false, error: 'Authentication required', user: null }
    }

    if (!hasAnyPermission(user.role, permissions)) {
      return { 
        authorized: false, 
        error: `Access denied. Missing required permissions`,
        user 
      }
    }

    return { authorized: true, user }
  }
}

/**
 * REQUIRE CLINIC ADMIN
 * 
 * Checks if the authenticated user is an ADMIN of their clinic.
 * ADMINs can manage their clinic's resources.
 * 
 * @param {Request} request - HTTP request object
 * @returns {Object} - { authorized: boolean, user: Object|null, error: string|null }
 */
export function requireClinicAdmin(request) {
  return requireRole('ADMIN')(request)
}

/**
 * GET CLINIC CONTEXT
 * 
 * Extracts clinicId from authenticated user's token.
 * Used to filter database queries for multi-tenant isolation.
 * 
 * @param {Request} request - HTTP request object
 * @returns {Object} - { clinicId: string, user: Object } or throws error
 * 
 * Usage:
 * ```javascript
 * export async function GET(request) {
 *   const { clinicId, user } = getClinicContext(request)
 *   
 *   const patients = await prisma.patient.findMany({
 *     where: { clinicId } // Only return this clinic's patients
 *   })
 * }
 * ```
 */
export function getClinicContext(request) {
  const user = authenticate(request)
  
  if (!user) {
    throw new AuthError('Authentication required', 401)
  }

  if (!user.clinicId) {
    throw new AuthError('Clinic context not found', 403)
  }

  return {
    clinicId: user.clinicId,
    userId: user.userId,
    user
  }
}

/**
 * AUTH ERROR RESPONSE
 * 
 * Creates a standardized 401 Unauthorized response.
 * 
 * @param {string} message - Error message
 * @returns {NextResponse}
 */
export function authError(message = 'Authentication required') {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'UNAUTHORIZED'
    },
    { status: 401 }
  )
}

/**
 * FORBIDDEN ERROR RESPONSE
 * 
 * Creates a standardized 403 Forbidden response.
 * 
 * @param {string} message - Error message
 * @returns {NextResponse}
 */
export function forbiddenError(message = 'Access denied') {
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: 'FORBIDDEN'
    },
    { status: 403 }
  )
}

/**
 * CUSTOM ERROR CLASS FOR AUTH ERRORS
 */
export class AuthError extends Error {
  constructor(message, statusCode = 401) {
    super(message)
    this.name = 'AuthError'
    this.statusCode = statusCode
  }
}

/**
 * HANDLE AUTH RESULT
 * 
 * Utility to handle the result from auth middleware.
 * Returns appropriate error response if unauthorized.
 * 
 * @param {Object} result - Result from requireRole/requirePermission
 * @returns {NextResponse|null} - Error response or null if authorized
 */
export function handleAuthResult(result) {
  if (!result.authorized) {
    if (result.user) {
      return forbiddenError(result.error)
    }
    return authError(result.error)
  }
  return null
}

/**
 * VALIDATE CLINIC ACCESS
 * 
 * Ensures a resource belongs to the user's clinic.
 * Prevents cross-tenant data access.
 * 
 * @param {Object} resource - Resource with clinicId field
 * @param {string} userClinicId - User's clinicId from token
 * @returns {boolean} - True if access is allowed
 */
export function validateClinicAccess(resource, userClinicId) {
  if (!resource || !resource.clinicId) {
    return false
  }
  return resource.clinicId === userClinicId
}

/**
 * ADD CLINIC FILTER
 * 
 * Adds clinicId to a Prisma where clause for multi-tenant isolation.
 * 
 * @param {Object} where - Existing Prisma where clause
 * @param {string} clinicId - Clinic ID to filter by
 * @returns {Object} - Updated where clause with clinic filter
 */
export function addClinicFilter(where = {}, clinicId) {
  return {
    ...where,
    clinicId
  }
}
