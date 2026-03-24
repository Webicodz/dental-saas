/**
 * SUPER ADMIN - User Management API
 * 
 * CRUD operations for managing all users across all clinics.
 * Super Admin only - bypasses clinic isolation.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, forbiddenError } from '@/lib/middleware'
import { hashPassword } from '@/lib/auth'

// ============================================================================
// SUPER ADMIN CHECK
// ============================================================================

/**
 * Verify user is a Super Admin
 */
function requireSuperAdmin(request) {
  const user = authenticate(request)
  
  if (!user) {
    return { authorized: false, error: 'Authentication required', user: null }
  }

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return { 
      authorized: false, 
      error: 'Super Admin access required',
      user 
    }
  }

  return { authorized: true, user }
}

// ============================================================================
// GET /api/admin/users - List all users
// ============================================================================

export async function GET(request) {
  try {
    const { authorized, user, error } = requireSuperAdmin(request)
    
    if (!authorized) {
      return user ? forbiddenError(error) : authError(error)
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const clinicId = searchParams.get('clinicId')
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const skip = (page - 1) * limit

    // Build where clause
    const where = {}
    
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (clinicId) {
      where.clinicId = clinicId
    }
    
    if (role) {
      where.role = role
    }
    
    if (status) {
      where.status = status
    }

    // Fetch users with clinic info
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          avatarUrl: true,
          role: true,
          status: true,
          lastLogin: true,
          loginCount: true,
          twoFactorEnabled: true,
          createdAt: true,
          updatedAt: true,
          clinic: {
            select: {
              id: true,
              name: true,
              licenseType: true
            }
          },
          doctor: {
            select: {
              id: true,
              specialization: true,
              isActive: true
            }
          },
          _count: {
            select: {
              appointments: true,
              auditLogs: true
            }
          }
        }
      }),
      prisma.user.count({ where })
    ])

    // Format response
    const formattedUsers = users.map(u => ({
      id: u.id,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      name: `${u.firstName} ${u.lastName}`,
      phone: u.phone,
      avatarUrl: u.avatarUrl,
      role: u.role,
      status: u.status,
      lastLogin: u.lastLogin,
      loginCount: u.loginCount,
      twoFactorEnabled: u.twoFactorEnabled,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      clinic: u.clinic,
      doctor: u.doctor,
      stats: {
        appointmentsCreated: u._count.appointments,
        auditLogs: u._count.auditLogs
      }
    }))

    // Get role distribution
    const roleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    })

    return NextResponse.json({
      success: true,
      data: {
        users: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        roleDistribution: roleDistribution.reduce((acc, item) => {
          acc[item.role] = item._count
          return acc
        }, {})
      }
    })

  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/admin/users - Create user in any clinic
// ============================================================================

export async function POST(request) {
  try {
    const { authorized, user, error } = requireSuperAdmin(request)
    
    if (!authorized) {
      return user ? forbiddenError(error) : authError(error)
    }

    const body = await request.json()
    const {
      clinicId,
      email,
      password,
      firstName,
      lastName,
      phone,
      role = 'RECEPTIONIST',
      status = 'ACTIVE'
    } = body

    // Validate required fields
    if (!clinicId || !email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { success: false, error: 'Clinic, email, password, firstName, and lastName are required' },
        { status: 400 }
      )
    }

    // Validate role
    const validRoles = ['ADMIN', 'DOCTOR', 'RECEPTIONIST']
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: `Invalid role. Must be one of: ${validRoles.join(', ')}` },
        { status: 400 }
      )
    }

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId }
    })

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: 'Clinic not found' },
        { status: 404 }
      )
    }

    // Check for existing user with same email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Check if clinic has reached user limit
    const currentUserCount = await prisma.user.count({
      where: { clinicId }
    })

    if (currentUserCount >= clinic.maxUsers) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Clinic has reached its user limit (${clinic.maxUsers}). Please upgrade the license or deactivate existing users.` 
        },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user
    const newUser = await prisma.user.create({
      data: {
        clinicId,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role,
        status
      }
    })

    // If user is a doctor, create doctor record
    let doctorRecord = null
    if (role === 'DOCTOR') {
      doctorRecord = await prisma.doctor.create({
        data: {
          clinicId,
          userId: newUser.id,
          specialization: body.specialization || 'General Dentist',
          qualification: body.qualification || null,
          experience: body.experience || null,
          workingDays: body.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          workingHours: body.workingHours || { start: '09:00', end: '17:00' }
        }
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        clinicId,
        userId: user.userId,
        action: 'CREATE',
        entity: 'USER',
        entityId: newUser.id,
        details: { 
          createdEmail: email,
          createdRole: role,
          createdClinic: clinic.name
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: newUser.id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          role: newUser.role,
          status: newUser.status,
          createdAt: newUser.createdAt
        },
        clinic: {
          id: clinic.id,
          name: clinic.name
        },
        doctor: doctorRecord ? {
          id: doctorRecord.id,
          specialization: doctorRecord.specialization
        } : null
      },
      message: 'User created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
