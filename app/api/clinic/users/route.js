/**
 * CLINIC USERS API
 * 
 * GET /api/clinic/users - List all users in the clinic
 * POST /api/clinic/users - Create a new user in the clinic
 * 
 * IN CODEIGNITER:
 * Like: application/controllers/api/Clinic_users.php
 * 
 * PERMISSIONS:
 * - ADMIN: Can view, create users
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, forbiddenError, requireRole } from '@/lib/middleware'
import { hashPassword } from '@/lib/auth'
import { PERMISSIONS } from '@/lib/permissions'

// GET - List all users in the clinic
export async function GET(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    // CHECK PERMISSIONS - Only ADMIN can manage users
    if (user.role !== 'ADMIN') {
      return forbiddenError('Only administrators can manage clinic users')
    }

    const clinicId = user.clinicId

    // PARSE QUERY PARAMS
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const skip = (page - 1) * limit

    // BUILD WHERE CLAUSE
    const where = { clinicId }
    
    if (role) {
      where.role = role
    }
    
    if (status) {
      where.status = status
    }
    
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ]
    }

    // FETCH USERS WITH PAGINATION
    const [users, total, roleCounts] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          lastLogin: true,
          createdAt: true,
          updatedAt: true,
          doctor: {
            select: {
              id: true,
              specialization: true,
              isActive: true
            }
          }
        },
        orderBy: [
          { role: 'asc' },
          { firstName: 'asc' }
        ],
        skip,
        take: limit
      }),
      
      prisma.user.count({ where }),
      
      // Count by role for filtering UI
      prisma.user.groupBy({
        by: ['role'],
        where: { clinicId },
        _count: true
      })
    ])

    // Format role counts
    const countsByRole = roleCounts.reduce((acc, item) => {
      acc[item.role] = item._count
      return acc
    }, {})

    // FORMAT RESPONSE
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: `${u.firstName} ${u.lastName}`,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phone: u.phone,
      role: u.role,
      status: u.status,
      avatarUrl: u.avatarUrl,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt,
      isDoctor: u.role === 'DOCTOR',
      doctor: u.doctor ? {
        id: u.doctor.id,
        specialization: u.doctor.specialization,
        isActive: u.doctor.isActive
      } : null
    }))

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      counts: {
        total,
        admins: countsByRole.ADMIN || 0,
        doctors: countsByRole.DOCTOR || 0,
        receptionists: countsByRole.RECEPTIONIST || 0
      }
    })

  } catch (error) {
    console.error('Clinic users list error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch clinic users',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// POST - Create a new user
export async function POST(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    // CHECK PERMISSIONS - Only ADMIN can create users
    if (user.role !== 'ADMIN') {
      return forbiddenError('Only administrators can create clinic users')
    }

    const clinicId = user.clinicId

    // PARSE REQUEST BODY
    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      role,
      avatarUrl,
      // Doctor-specific fields
      specialization,
      licenseNumber,
      qualification,
      experience,
      consultationFee,
      workingDays,
      workingHours,
      bio
    } = body

    // VALIDATE REQUIRED FIELDS
    const errors = []
    
    if (!firstName || !firstName.trim()) {
      errors.push('First name is required')
    }
    
    if (!lastName || !lastName.trim()) {
      errors.push('Last name is required')
    }
    
    if (!email || !email.trim()) {
      errors.push('Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push('Invalid email format')
    }
    
    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters')
    }
    
    if (!role || !['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(role)) {
      errors.push('Valid role is required (ADMIN, DOCTOR, or RECEPTIONIST)')
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: errors
        },
        { status: 400 }
      )
    }

    // CHECK IF EMAIL ALREADY EXISTS
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    })

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: 'A user with this email already exists',
          code: 'EMAIL_EXISTS'
        },
        { status: 409 }
      )
    }

    // HASH PASSWORD
    const hashedPassword = await hashPassword(password)

    // CREATE USER WITH TRANSACTION
    const newUser = await prisma.$transaction(async (tx) => {
      // Create the user
      const createdUser = await tx.user.create({
        data: {
          clinicId,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.toLowerCase().trim(),
          phone: phone?.trim() || null,
          password: hashedPassword,
          role,
          avatarUrl: avatarUrl || null,
          status: 'ACTIVE'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true
        }
      })

      // If the user is a DOCTOR, create doctor profile
      if (role === 'DOCTOR') {
        await tx.doctor.create({
          data: {
            clinicId,
            userId: createdUser.id,
            specialization: specialization || 'General Dentistry',
            licenseNumber: licenseNumber || null,
            qualification: qualification || null,
            experience: experience || null,
            consultationFee: consultationFee || null,
            workingDays: workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
            workingHours: workingHours || { start: '09:00', end: '17:00' },
            bio: bio || null,
            isActive: true
          }
        })
      }

      return createdUser
    })

    return NextResponse.json({
      success: true,
      message: `${role === 'DOCTOR' ? 'Doctor' : 'User'} created successfully`,
      user: {
        ...newUser,
        name: `${newUser.firstName} ${newUser.lastName}`,
        isDoctor: role === 'DOCTOR'
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Clinic user creation error:', error)
    
    // Handle unique constraint violations
    if (error.code === 'P2002') {
      return NextResponse.json(
        {
          success: false,
          error: 'A user with this email already exists',
          code: 'EMAIL_EXISTS'
        },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create user',
        details: error.message
      },
      { status: 500 }
    )
  }
}
