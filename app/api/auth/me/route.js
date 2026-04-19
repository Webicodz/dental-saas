/**
 * CURRENT USER API
 * 
 * GET /api/auth/me
 * 
 * Returns the currently authenticated user's profile with their role,
 * clinic information, and permissions.
 * 
 * This endpoint is used by:
 * - Frontend to get current user info after login
 * - Protected routes to verify authentication
 * - UI to show user-specific data based on role
 * 
 * IN CODEIGNITER:
 * class Auth extends CI_Controller {
 *   public function me() {
 *     $user_id = $this->session->userdata('user_id');
 *     $user = $this->user_model->get($user_id);
 *     echo json_encode($user);
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError } from '@/lib/middleware'
import { getRolePermissions, PERMISSION_LABELS } from '@/lib/permissions'

export async function GET(request) {
  try {
    // AUTHENTICATE REQUEST
    const tokenUser = authenticate(request)
    
    if (!tokenUser) {
      return authError('Authentication required')
    }

    // FETCH FULL USER DATA FROM DATABASE
    // Include related data: clinic, doctor profile (if applicable)
    const user = await prisma.user.findUnique({
      where: { id: tokenUser.userId },
      include: {
        // Include clinic details
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            licenseStatus: true
          }
        },
        // Include doctor profile if user is a DOCTOR
        doctor: {
          select: {
            id: true,
            specialization: true,
            licenseNumber: true,
            consultationFee: true,
            isActive: true
          }
        }
      }
    })

    // CHECK IF USER STILL EXISTS AND IS ACTIVE
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: 'User not found',
          code: 'USER_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'User account is inactive',
          code: 'USER_INACTIVE'
        },
        { status: 403 }
      )
    }

    // GET USER'S PERMISSIONS BASED ON ROLE
    const permissions = getRolePermissions(user.role)
    const permissionLabels = permissions.map(perm => ({
      permission: perm,
      label: PERMISSION_LABELS[perm] || perm
    }))

    // BUILD RESPONSE
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      clinic: user.clinic,
      doctor: user.doctor,
      permissions: permissionLabels
    }

    return NextResponse.json({
      success: true,
      user: userResponse,
      tokenPayload: {
        // Return the data from JWT (useful for quick access)
        userId: tokenUser.userId,
        email: tokenUser.email,
        role: tokenUser.role,
        clinicId: tokenUser.clinicId
      }
    })

  } catch (error) {
    console.error('Get current user error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch user information',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * HOW TO USE THIS ENDPOINT:
 * 
 * 1. Frontend calls this after login to get user details:
 * 
 * ```javascript
 * const response = await fetch('/api/auth/me', {
 *   headers: {
 *     'Authorization': `Bearer ${token}`
 *   }
 * })
 * const data = await response.json()
 * 
 * if (data.success) {
 *   setUser(data.user)
 *   setPermissions(data.user.permissions.map(p => p.permission))
 * }
 * ```
 * 
 * 2. Protected components can verify authentication:
 * 
 * ```javascript
 * useEffect(() => {
 *   fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
 *     .then(res => {
 *       if (!res.ok) redirect('/login')
 *     })
 * }, [])
 * ```
 * 
 * 3. Role-based rendering:
 * 
 * ```javascript
 * const { permissions } = useAuth()
 * 
 * {permissions.includes('patients:create') && (
 *   <button>Add Patient</button>
 * )}
 * 
 * {permissions.includes('patients:delete') && (
 *   <button>Delete Patient</button>
 * )}
 * ```
 * 
 * RESPONSE STRUCTURE:
 * 
 * {
 *   success: true,
 *   user: {
 *     id: "user-123",
 *     email: "doctor@clinic.com",
 *     firstName: "John",
 *     lastName: "Smith",
 *     role: "DOCTOR",
 *     status: "ACTIVE",
 *     clinic: {
 *       id: "clinic-456",
 *       name: "Downtown Dental Clinic"
 *     },
 *     doctor: {
 *       specialization: "General Dentistry",
 *       licenseNumber: "DDS12345"
 *     },
 *     permissions: [
 *       { permission: "patients:view", label: "View Patients" },
 *       { permission: "patients:update", label: "Update Patients" },
 *       ...
 *     ]
 *   },
 *   tokenPayload: {
 *     userId: "user-123",
 *     email: "doctor@clinic.com",
 *     role: "DOCTOR",
 *     clinicId: "clinic-456"
 *   }
 * }
 */
