/**
 * DOCTORS API
 * 
 * URL: GET /api/doctors - List all doctors for appointment booking
 * 
 * PURPOSE:
 * Return list of active doctors for appointment scheduling.
 * Used when booking appointments - shows doctor info and availability.
 * 
 * KEY FEATURES:
 * - Only shows active doctors
 * - Includes working hours and specializations
 * - Clinic isolation for multi-tenant security
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, addClinicFilter } from '@/lib/middleware'
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

/**
 * GET ALL DOCTORS
 * 
 * Query params:
 * - active: Filter by active status (default: true)
 * - specialization: Filter by specialization
 * 
 * Example: /api/doctors
 */
export async function GET(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError('Authentication required')
    }

    // CHECK PERMISSION
    if (!hasPermission(user.role, PERMISSIONS.DOCTORS.VIEW)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. You do not have permission to view doctors.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // GET QUERY PARAMS
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('active') !== 'false' // Default to true
    const specialization = searchParams.get('specialization')

    // BUILD QUERY CONDITIONS
    // ADD CLINIC ISOLATION - Critical for multi-tenant security
    const where = addClinicFilter({}, user.clinicId)

    // ACTIVE FILTER
    if (activeOnly) {
      where.isActive = true
    }

    // SPECIALIZATION FILTER
    if (specialization) {
      where.specialization = {
        contains: specialization,
        mode: 'insensitive'
      }
    }

    // FETCH DOCTORS
    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true
          }
        },
        clinic: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { specialization: 'asc' },
        { createdAt: 'asc' }
      ]
    })

    // TRANSFORM DATA FOR FRONTEND
    const transformedDoctors = doctors.map(doc => ({
      id: doc.id,
      userId: doc.userId,
      firstName: doc.user.firstName,
      lastName: doc.user.lastName,
      fullName: `Dr. ${doc.user.firstName} ${doc.user.lastName}`,
      email: doc.user.email,
      phone: doc.user.phone,
      avatarUrl: doc.user.avatarUrl,
      specialization: doc.specialization,
      licenseNumber: doc.licenseNumber,
      qualification: doc.qualification,
      experience: doc.experience,
      consultationFee: doc.consultationFee,
      bio: doc.bio,
      isActive: doc.isActive,
      workingDays: formatWorkingDays(doc.workingDays),
      workingHours: {
        start: doc.workingHours?.start || '09:00',
        end: doc.workingHours?.end || '17:00'
      },
      clinic: doc.clinic
    }))

    // RETURN DOCTORS
    return NextResponse.json({
      success: true,
      count: transformedDoctors.length,
      doctors: transformedDoctors
    })

  } catch (error) {
    console.error('Get doctors error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch doctors',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * FORMAT WORKING DAYS
 * 
 * Converts working days array to human-readable format
 * 
 * @param {Array} workingDays - Array of day names
 * @returns {Object} - { short: "Mon-Fri", full: ["Monday", "Tuesday", ...] }
 */
function formatWorkingDays(workingDays) {
  if (!workingDays || !Array.isArray(workingDays)) {
    return {
      short: 'Mon-Fri',
      full: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      abbreviations: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    }
  }

  const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
  
  // Sort days in order
  const sortedDays = workingDays.sort((a, b) => 
    dayOrder.indexOf(a.toLowerCase()) - dayOrder.indexOf(b.toLowerCase())
  )

  // Get full day names
  const fullDays = sortedDays.map(day => 
    day.charAt(0).toUpperCase() + day.slice(1)
  )

  // Create abbreviations
  const abbreviations = sortedDays.map(day => 
    DAY_LABELS[day.toLowerCase()] || day.substring(0, 3)
  )

  // Create short format (e.g., "Mon-Fri" or "Mon, Wed, Fri")
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
    abbreviations
  }
}

/**
 * USAGE EXAMPLES:
 * 
 * GET ALL ACTIVE DOCTORS:
 * fetch('/api/doctors')
 *   .then(res => res.json())
 *   .then(data => console.log(data.doctors))
 * 
 * GET ALL DOCTORS (INCLUDING INACTIVE):
 * fetch('/api/doctors?active=false')
 *   .then(res => res.json())
 *   .then(data => console.log(data.doctors))
 * 
 * FILTER BY SPECIALIZATION:
 * fetch('/api/doctors?specialization=orthodontist')
 *   .then(res => res.json())
 *   .then(data => console.log(data.doctors))
 * 
 * 
 * RESPONSE FORMAT:
 * {
 *   success: true,
 *   count: 3,
 *   doctors: [
 *     {
 *       id: "doctor-uuid",
 *       fullName: "Dr. John Smith",
 *       specialization: "General Dentist",
 *       workingDays: {
 *         short: "Mon-Fri",
 *         full: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
 *         abbreviations: ["Mon", "Tue", "Wed", "Thu", "Fri"]
 *       },
 *       workingHours: {
 *         start: "09:00",
 *         end: "17:00"
 *       },
 *       consultationFee: 150.00,
 *       bio: "Experienced dentist...",
 *       clinic: { id: "...", name: "Dental Clinic" }
 *     },
 *     ...
 *   ]
 * }
 */
