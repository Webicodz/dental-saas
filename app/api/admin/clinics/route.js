/**
 * SUPER ADMIN - Clinic Management API
 * 
 * CRUD operations for managing all clinics on the platform.
 * Super Admin only - bypasses clinic isolation.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, forbiddenError } from '@/lib/middleware'

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

  // Check for SUPER_ADMIN role
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
// GET /api/admin/clinics - List all clinics
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
    const licenseStatus = searchParams.get('licenseStatus')
    const licenseType = searchParams.get('licenseType')
    const page = parseInt(searchParams.get('page')) || 1
    const limit = parseInt(searchParams.get('limit')) || 20
    const skip = (page - 1) * limit

    // Build where clause
    const where = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { licenseKey: { contains: search, mode: 'insensitive' } }
      ]
    }
    
    if (licenseStatus) {
      where.licenseStatus = licenseStatus
    }
    
    if (licenseType) {
      where.licenseType = licenseType
    }

    // Fetch clinics with counts
    const [clinics, total, stats] = await Promise.all([
      prisma.clinic.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          country: true,
          licenseKey: true,
          licenseType: true,
          licenseStatus: true,
          licenseExpiry: true,
          activationDate: true,
          timezone: true,
          currency: true,
          features: true,
          businessHours: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              users: true,
              patients: true,
              appointments: true
            }
          }
        }
      }),
      prisma.clinic.count({ where }),
      // Overall stats
      prisma.clinic.aggregate({
        _count: true,
        where: { licenseStatus: 'ACTIVE' }
      })
    ])

    // Format response
    const formattedClinics = clinics.map(clinic => ({
      id: clinic.id,
      name: clinic.name,
      email: clinic.email,
      phone: clinic.phone,
      address: clinic.address,
      city: clinic.city,
      state: clinic.state,
      country: clinic.country,
      licenseKey: clinic.licenseKey,
      licenseType: clinic.licenseType,
      licenseStatus: clinic.licenseStatus,
      licenseExpiry: clinic.licenseExpiry,
      activationDate: clinic.activationDate,
      timezone: clinic.timezone,
      currency: clinic.currency,
      features: clinic.features,
      createdAt: clinic.createdAt,
      updatedAt: clinic.updatedAt,
      stats: {
        userCount: clinic._count.users,
        patientCount: clinic._count.patients,
        appointmentCount: clinic._count.appointments
      }
    }))

    return NextResponse.json({
      success: true,
      data: {
        clinics: formattedClinics,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        },
        summary: {
          totalClinics: total,
          activeClinics: stats._count
        }
      }
    })

  } catch (error) {
    console.error('Error fetching clinics:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clinics' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/admin/clinics - Create new clinic
// ============================================================================

export async function POST(request) {
  try {
    const { authorized, user, error } = requireSuperAdmin(request)
    
    if (!authorized) {
      return user ? forbiddenError(error) : authError(error)
    }

    const body = await request.json()
    const {
      name,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      country = 'US',
      timezone = 'America/New_York',
      currency = 'USD',
      licenseType = 'STANDARD',
      licenseDurationMonths = 12,
      adminEmail,
      adminPassword,
      maxUsers = 10,
      maxPatients = 1000,
      maxStorage = 5000,
      features = {}
    } = body

    // Validate required fields
    if (!name || !email || !phone || !address) {
      return NextResponse.json(
        { success: false, error: 'Name, email, phone, and address are required' },
        { status: 400 }
      )
    }

    // Check for existing clinic with same email
    const existingClinic = await prisma.clinic.findFirst({
      where: { email }
    })

    if (existingClinic) {
      return NextResponse.json(
        { success: false, error: 'A clinic with this email already exists' },
        { status: 409 }
      )
    }

    // Generate license key
    const licenseKey = generateLicenseKey(licenseType)
    
    // Calculate license expiry
    const licenseExpiry = new Date()
    licenseExpiry.setMonth(licenseExpiry.getMonth() + licenseDurationMonths)

    // Default features based on license type
    const defaultFeatures = getDefaultFeatures(licenseType)

    // Create clinic
    const clinic = await prisma.clinic.create({
      data: {
        name,
        email,
        phone,
        address,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        country,
        timezone,
        currency,
        licenseKey,
        licenseType,
        licenseStatus: 'ACTIVE',
        licenseExpiry,
        activationEmail: email,
        businessHours: getDefaultBusinessHours(),
        features: { ...defaultFeatures, ...features },
        maxUsers,
        maxPatients,
        maxStorage
      }
    })

    // Create admin user for the clinic if email and password provided
    let adminUser = null
    if (adminEmail && adminPassword) {
      const { hashPassword } = await import('@/lib/auth')
      const hashedPassword = await hashPassword(adminPassword)

      adminUser = await prisma.user.create({
        data: {
          clinicId: clinic.id,
          email: adminEmail,
          password: hashedPassword,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      })
    }

    return NextResponse.json({
      success: true,
      data: {
        clinic: {
          id: clinic.id,
          name: clinic.name,
          email: clinic.email,
          licenseKey: clinic.licenseKey,
          licenseType: clinic.licenseType,
          licenseStatus: clinic.licenseStatus,
          licenseExpiry: clinic.licenseExpiry,
          createdAt: clinic.createdAt
        },
        adminUser: adminUser ? {
          id: adminUser.id,
          email: adminUser.email,
          role: adminUser.role
        } : null
      },
      message: 'Clinic created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating clinic:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create clinic' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a unique license key
 */
function generateLicenseKey(licenseType) {
  const year = new Date().getFullYear()
  const typeCode = {
    'STANDARD': 'STD',
    'PROFESSIONAL': 'PRO',
    'ENTERPRISE': 'ENT'
  }[licenseType] || 'STD'
  
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  
  return `DXK-${year}-${typeCode}-${code}`
}

/**
 * Get default features based on license type
 */
function getDefaultFeatures(licenseType) {
  const baseFeatures = {
    smsReminders: true,
    emailReminders: true,
    patientPortal: true
  }

  switch (licenseType) {
    case 'STANDARD':
      return {
        ...baseFeatures,
        aiChatbot: false,
        voiceAgent: false,
        analytics: false
      }
    case 'PROFESSIONAL':
      return {
        ...baseFeatures,
        aiChatbot: true,
        voiceAgent: false,
        analytics: true
      }
    case 'ENTERPRISE':
      return {
        ...baseFeatures,
        aiChatbot: true,
        voiceAgent: true,
        analytics: true,
        multiLocation: true,
        apiAccess: true
      }
    default:
      return baseFeatures
  }
}

/**
 * Get default business hours
 */
function getDefaultBusinessHours() {
  return {
    monday: { start: '09:00', end: '17:00', closed: false },
    tuesday: { start: '09:00', end: '17:00', closed: false },
    wednesday: { start: '09:00', end: '17:00', closed: false },
    thursday: { start: '09:00', end: '17:00', closed: false },
    friday: { start: '09:00', end: '17:00', closed: false },
    saturday: { start: '09:00', end: '13:00', closed: false },
    sunday: { start: '00:00', end: '00:00', closed: true }
  }
}
