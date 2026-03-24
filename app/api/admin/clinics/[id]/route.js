/**
 * SUPER ADMIN - Clinic Detail API
 * 
 * GET, PUT, DELETE operations for a single clinic.
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
// GET /api/admin/clinics/[id] - Get clinic details
// ============================================================================

export async function GET(request, { params }) {
  try {
    const { authorized, user, error } = requireSuperAdmin(request)
    
    if (!authorized) {
      return user ? forbiddenError(error) : authError(error)
    }

    const { id } = params

    // Fetch clinic with full details
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            appointments: true,
            doctors: true,
            invoices: true,
            treatments: true
          }
        },
        users: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            lastLogin: true,
            createdAt: true
          }
        },
        doctors: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            userId: true,
            specialization: true,
            isActive: true,
            experience: true
          }
        }
      }
    })

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: 'Clinic not found' },
        { status: 404 }
      )
    }

    // Get recent appointments
    const recentAppointments = await prisma.appointment.findMany({
      where: { clinicId: id },
      take: 10,
      orderBy: { appointmentDate: 'desc' },
      include: {
        patient: {
          select: { firstName: true, lastName: true, phone: true }
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      }
    })

    // Get monthly statistics
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [monthlyAppointments, monthlyPatients, monthlyRevenue] = await Promise.all([
      prisma.appointment.count({
        where: {
          clinicId: id,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.patient.count({
        where: {
          clinicId: id,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),
      prisma.invoice.aggregate({
        where: {
          clinicId: id,
          status: 'PAID',
          paymentDate: { gte: thirtyDaysAgo }
        },
        _sum: { total: true }
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        clinic: {
          id: clinic.id,
          name: clinic.name,
          email: clinic.email,
          phone: clinic.phone,
          address: clinic.address,
          city: clinic.city,
          state: clinic.state,
          country: clinic.country,
          logoUrl: clinic.logoUrl,
          primaryColor: clinic.primaryColor,
          secondaryColor: clinic.secondaryColor,
          timezone: clinic.timezone,
          currency: clinic.currency,
          dateFormat: clinic.dateFormat,
          timeFormat: clinic.timeFormat,
          businessHours: clinic.businessHours,
          features: clinic.features,
          licenseKey: clinic.licenseKey,
          licenseType: clinic.licenseType,
          licenseStatus: clinic.licenseStatus,
          licenseExpiry: clinic.licenseExpiry,
          activationDate: clinic.activationDate,
          activationEmail: clinic.activationEmail,
          createdAt: clinic.createdAt,
          updatedAt: clinic.updatedAt,
          stats: {
            totalUsers: clinic._count.users,
            totalPatients: clinic._count.patients,
            totalAppointments: clinic._count.appointments,
            totalDoctors: clinic._count.doctors,
            totalInvoices: clinic._count.invoices,
            totalTreatments: clinic._count.treatments,
            monthlyAppointments,
            monthlyPatients,
            monthlyRevenue: monthlyRevenue._sum.total || 0
          }
        },
        users: clinic.users,
        doctors: clinic.doctors,
        recentAppointments: recentAppointments.map(apt => ({
          id: apt.id,
          date: apt.appointmentDate,
          time: apt.startTime,
          type: apt.type,
          status: apt.status,
          patient: apt.patient,
          doctor: apt.doctor ? {
            id: apt.doctor.id,
            name: `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`,
            specialization: apt.doctor.specialization
          } : null
        }))
      }
    })

  } catch (error) {
    console.error('Error fetching clinic:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch clinic' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/admin/clinics/[id] - Update clinic
// ============================================================================

export async function PUT(request, { params }) {
  try {
    const { authorized, user, error } = requireSuperAdmin(request)
    
    if (!authorized) {
      return user ? forbiddenError(error) : authError(error)
    }

    const { id } = params
    const body = await request.json()

    // Check if clinic exists
    const existingClinic = await prisma.clinic.findUnique({
      where: { id }
    })

    if (!existingClinic) {
      return NextResponse.json(
        { success: false, error: 'Clinic not found' },
        { status: 404 }
      )
    }

    // Allowed fields for update
    const allowedFields = [
      'name', 'email', 'phone', 'address', 'city', 'state', 'zipCode', 'country',
      'logoUrl', 'primaryColor', 'secondaryColor',
      'timezone', 'currency', 'dateFormat', 'timeFormat',
      'businessHours', 'features',
      'licenseType', 'licenseStatus', 'licenseExpiry',
      'maxUsers', 'maxPatients', 'maxStorage'
    ]

    // Build update data
    const updateData = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    // Update clinic
    const clinic = await prisma.clinic.update({
      where: { id },
      data: updateData
    })

    // Log the action
    await prisma.auditLog.create({
      data: {
        clinicId: id,
        userId: user.userId,
        action: 'UPDATE',
        entity: 'CLINIC',
        entityId: id,
        details: { updatedFields: Object.keys(updateData) }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        id: clinic.id,
        name: clinic.name,
        email: clinic.email,
        phone: clinic.phone,
        licenseType: clinic.licenseType,
        licenseStatus: clinic.licenseStatus,
        licenseExpiry: clinic.licenseExpiry,
        updatedAt: clinic.updatedAt
      },
      message: 'Clinic updated successfully'
    })

  } catch (error) {
    console.error('Error updating clinic:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update clinic' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/admin/clinics/[id] - Delete clinic
// ============================================================================

export async function DELETE(request, { params }) {
  try {
    const { authorized, user, error } = requireSuperAdmin(request)
    
    if (!authorized) {
      return user ? forbiddenError(error) : authError(error)
    }

    const { id } = params

    // Check for confirmation
    const { searchParams } = new URL(request.url)
    const confirmation = searchParams.get('confirm')

    if (confirmation !== 'true') {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Confirmation required. Add ?confirm=true to delete.',
          warning: 'This will permanently delete all clinic data including users, patients, appointments, and invoices.'
        },
        { status: 400 }
      )
    }

    // Check if clinic exists
    const clinic = await prisma.clinic.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            patients: true,
            appointments: true
          }
        }
      }
    })

    if (!clinic) {
      return NextResponse.json(
        { success: false, error: 'Clinic not found' },
        { status: 404 }
      )
    }

    // Get stats before deletion
    const deletionStats = {
      users: clinic._count.users,
      patients: clinic._count.patients,
      appointments: clinic._count.appointments,
      doctors: clinic._count.doctors,
      invoices: clinic._count.invoices
    }

    // Delete clinic (cascades to all related data due to onDelete: Cascade)
    await prisma.clinic.delete({
      where: { id }
    })

    // Log the deletion
    await prisma.auditLog.create({
      data: {
        clinicId: null, // Clinic is deleted, so no clinicId
        userId: user.userId,
        action: 'DELETE',
        entity: 'CLINIC',
        entityId: id,
        details: { 
          clinicName: clinic.name,
          deletedData: deletionStats
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        deletedClinic: {
          id,
          name: clinic.name
        },
        deletedRecords: deletionStats
      },
      message: `Clinic "${clinic.name}" and all associated data has been permanently deleted`
    })

  } catch (error) {
    console.error('Error deleting clinic:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete clinic' },
      { status: 500 }
    )
  }
}
