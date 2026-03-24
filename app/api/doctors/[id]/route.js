/**
 * DOCTOR PROFILE API
 * 
 * GET /api/doctors/[id] - Get doctor profile with details
 * PUT /api/doctors/[id] - Update doctor profile
 * 
 * IN CODEIGNITER:
 * Like: application/controllers/api/Doctor_profile.php
 * 
 * PERMISSIONS:
 * - ADMIN: Can view and update any doctor profile
 * - DOCTOR: Can view and update their own profile
 * - RECEPTIONIST: Can view doctor profiles
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, forbiddenError } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Working days labels
const DAY_LABELS = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun'
}

// Format working days helper
function formatWorkingDays(workingDays) {
  if (!workingDays || !Array.isArray(workingDays)) {
    return {
      short: 'Mon-Fri',
      full: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      abbreviations: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      raw: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    }
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  const sortedDays = workingDays.sort((a, b) => 
    dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase())
  )

  const fullDays = sortedDays.map(day => 
    day.charAt(0).toUpperCase() + day.slice(1)
  )

  const abbreviations = sortedDays.map(day => 
    DAY_LABELS[day.toLowerCase()] || day.substring(0, 3)
  )

  let short
  if (sortedDays.length === 5 && 
      sortedDays.includes('monday') && 
      sortedDays.includes('friday')) {
    short = 'Mon-Fri'
  } else if (sortedDays.length === 7) {
    short = 'Every day'
  } else if (sortedDays.length === 0) {
    short = 'No schedule'
  } else {
    short = abbreviations.join(', ')
  }

  return {
    short,
    full: fullDays,
    abbreviations,
    raw: sortedDays
  }
}

// GET - Get doctor profile with detailed information
export async function GET(request, { params }) {
  try {
    const { id } = params
    
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    // CHECK PERMISSION - Must have doctor view permission
    if (!hasPermission(user.role, PERMISSIONS.DOCTORS.VIEW)) {
      return forbiddenError('Access denied. You do not have permission to view doctor profiles.')
    }

    const clinicId = user.clinicId

    // FETCH DOCTOR WITH FULL DETAILS
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: id,
        clinicId: clinicId
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
            status: true,
            lastLogin: true,
            createdAt: true
          }
        },
        clinic: {
          select: {
            id: true,
            name: true,
            timezone: true
          }
        },
        // Include appointment statistics
        appointments: {
          where: {
            date: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          },
          select: {
            id: true,
            status: true,
            date: true
          }
        }
      }
    })

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Doctor not found',
          code: 'DOCTOR_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // CALCULATE STATISTICS
    const todayAppointments = doctor.appointments.length
    const completedToday = doctor.appointments.filter(a => a.status === 'COMPLETED').length

    // FETCH ADDITIONAL STATS
    const [totalPatients, totalAppointments, monthlyAppointments] = await Promise.all([
      // Count unique patients for this doctor
      prisma.appointment.groupBy({
        by: ['patientId'],
        where: {
          doctorId: id,
          clinicId: clinicId
        }
      }).then(results => results.length),

      // Total appointments
      prisma.appointment.count({
        where: {
          doctorId: id,
          clinicId: clinicId
        }
      }),

      // This month's appointments
      prisma.appointment.count({
        where: {
          doctorId: id,
          clinicId: clinicId,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ])

    // BUILD RESPONSE
    const response = {
      id: doctor.id,
      userId: doctor.userId,
      // Personal info
      firstName: doctor.user.firstName,
      lastName: doctor.user.lastName,
      fullName: `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`,
      email: doctor.user.email,
      phone: doctor.user.phone,
      avatarUrl: doctor.user.avatarUrl,
      status: doctor.user.status,
      lastLogin: doctor.user.lastLogin,
      // Professional info
      specialization: doctor.specialization,
      licenseNumber: doctor.licenseNumber,
      qualification: doctor.qualification,
      experience: doctor.experience,
      consultationFee: doctor.consultationFee,
      bio: doctor.bio,
      isActive: doctor.isActive,
      // Schedule
      workingDays: formatWorkingDays(doctor.workingDays),
      workingHours: {
        start: doctor.workingHours?.start || '09:00',
        end: doctor.workingHours?.end || '17:00'
      },
      // Clinic
      clinic: doctor.clinic,
      // Statistics
      statistics: {
        totalPatients,
        totalAppointments,
        monthlyAppointments,
        todayAppointments,
        completedToday
      },
      createdAt: doctor.createdAt,
      updatedAt: doctor.updatedAt
    }

    return NextResponse.json({
      success: true,
      doctor: response
    })

  } catch (error) {
    console.error('Get doctor profile error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch doctor profile',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// PUT - Update doctor profile
export async function PUT(request, { params }) {
  try {
    const { id } = params
    
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    const clinicId = user.clinicId

    // CHECK PERMISSION
    // ADMIN can update any doctor
    // DOCTOR can update only their own profile
    const isOwnProfile = user.role === 'DOCTOR' && user.userId === id
    const canUpdate = user.role === 'ADMIN' || isOwnProfile

    if (!canUpdate) {
      return forbiddenError('You can only update your own profile')
    }

    // Verify doctor exists and belongs to clinic
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: id,
        clinicId: clinicId
      }
    })

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Doctor not found',
          code: 'DOCTOR_NOT_FOUND'
        },
        { status: 404 }
      )
    }

    // PARSE REQUEST BODY
    const body = await request.json()
    const {
      // User fields
      firstName,
      lastName,
      phone,
      avatarUrl,
      // Doctor fields
      specialization,
      licenseNumber,
      qualification,
      experience,
      consultationFee,
      bio,
      isActive,
      workingDays,
      workingHours
    } = body

    // Non-admins cannot change isActive
    const canChangeActiveStatus = user.role === 'ADMIN'

    // PREPARE UPDATE DATA
    const userUpdateData = {}
    const doctorUpdateData = {}

    // User fields (allowed for own profile or admin)
    if (firstName !== undefined) userUpdateData.firstName = firstName.trim()
    if (lastName !== undefined) userUpdateData.lastName = lastName.trim()
    if (phone !== undefined) userUpdateData.phone = phone?.trim() || null
    if (avatarUrl !== undefined) userUpdateData.avatarUrl = avatarUrl

    // Doctor fields
    if (specialization !== undefined) doctorUpdateData.specialization = specialization
    if (licenseNumber !== undefined) doctorUpdateData.licenseNumber = licenseNumber?.trim() || null
    if (qualification !== undefined) doctorUpdateData.qualification = qualification?.trim() || null
    if (experience !== undefined) doctorUpdateData.experience = parseInt(experience) || null
    if (consultationFee !== undefined) doctorUpdateData.consultationFee = parseFloat(consultationFee) || null
    if (bio !== undefined) doctorUpdateData.bio = bio?.trim() || null
    
    // Only admin can change active status
    if (canChangeActiveStatus && isActive !== undefined) {
      doctorUpdateData.isActive = isActive
    }

    if (workingDays !== undefined) {
      // Validate working days
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      const validatedDays = Array.isArray(workingDays) 
        ? workingDays.filter(d => validDays.includes(d.toLowerCase())).map(d => d.toLowerCase())
        : validDays.slice(0, 5) // Default to Mon-Fri
      doctorUpdateData.workingDays = validatedDays
    }

    if (workingHours !== undefined) {
      doctorUpdateData.workingHours = {
        start: workingHours.start || '09:00',
        end: workingHours.end || '17:00'
      }
    }

    // UPDATE WITH TRANSACTION
    const updatedDoctor = await prisma.$transaction(async (tx) => {
      // Update user if there are user changes
      if (Object.keys(userUpdateData).length > 0) {
        await tx.user.update({
          where: { id: doctor.userId },
          data: userUpdateData
        })
      }

      // Update doctor profile if there are doctor changes
      if (Object.keys(doctorUpdateData).length > 0) {
        await tx.doctor.update({
          where: { id: id },
          data: doctorUpdateData
        })
      }

      // Fetch updated doctor
      return tx.doctor.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              avatarUrl: true,
              status: true
            }
          }
        }
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Doctor profile updated successfully',
      doctor: {
        id: updatedDoctor.id,
        firstName: updatedDoctor.user.firstName,
        lastName: updatedDoctor.user.lastName,
        fullName: `Dr. ${updatedDoctor.user.firstName} ${updatedDoctor.user.lastName}`,
        email: updatedDoctor.user.email,
        phone: updatedDoctor.user.phone,
        avatarUrl: updatedDoctor.user.avatarUrl,
        specialization: updatedDoctor.specialization,
        licenseNumber: updatedDoctor.licenseNumber,
        qualification: updatedDoctor.qualification,
        experience: updatedDoctor.experience,
        consultationFee: updatedDoctor.consultationFee,
        bio: updatedDoctor.bio,
        isActive: updatedDoctor.isActive,
        workingDays: formatWorkingDays(updatedDoctor.workingDays),
        workingHours: updatedDoctor.workingHours,
        updatedAt: updatedDoctor.updatedAt
      }
    })

  } catch (error) {
    console.error('Update doctor profile error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update doctor profile',
        details: error.message
      },
      { status: 500 }
    )
  }
}
