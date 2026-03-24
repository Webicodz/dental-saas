/**
 * APPOINTMENTS API
 * 
 * URL: GET /api/appointments - List appointments with filters
 * URL: POST /api/appointments - Create new appointment
 * 
 * IN CODEIGNITER:
 * class Appointments extends CI_Controller {
 *   public function index() {
 *     // GET: list appointments
 *     // POST: create appointment
 *   }
 * }
 * 
 * APPOINTMENT MODEL:
 * - patientId, doctorId, appointmentDate, startTime, endTime, duration
 * - type: CONSULTATION, CLEANING, FILLING, ROOT_CANAL, CROWN, BRIDGE, EXTRACTION, CHECKUP, EMERGENCY, FOLLOW_UP
 * - status: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, addClinicFilter } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Appointment type constants
export const APPOINTMENT_TYPES = [
  'CONSULTATION',
  'CLEANING',
  'FILLING',
  'ROOT_CANAL',
  'CROWN',
  'BRIDGE',
  'EXTRACTION',
  'CHECKUP',
  'EMERGENCY',
  'FOLLOW_UP'
]

// Appointment status constants
export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
]

// Default durations by type (in minutes)
export const DEFAULT_DURATIONS = {
  CONSULTATION: 30,
  CLEANING: 45,
  FILLING: 60,
  ROOT_CANAL: 90,
  CROWN: 60,
  BRIDGE: 90,
  EXTRACTION: 45,
  CHECKUP: 30,
  EMERGENCY: 30,
  FOLLOW_UP: 15
}

/**
 * GET APPOINTMENTS
 * 
 * Query params:
 * - date: Specific date (YYYY-MM-DD)
 * - startDate: Start of date range
 * - endDate: End of date range
 * - doctorId: Filter by doctor
 * - patientId: Filter by patient
 * - status: Filter by status
 * - type: Filter by appointment type
 * 
 * Example: /api/appointments?date=2024-01-15&doctorId=xxx
 */
export async function GET(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError('Authentication required')
    }

    // CHECK PERMISSION
    if (!hasPermission(user.role, PERMISSIONS.APPOINTMENTS.VIEW)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. You do not have permission to view appointments.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // GET QUERY PARAMS FROM URL
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const doctorId = searchParams.get('doctorId')
    const patientId = searchParams.get('patientId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    // BUILD QUERY CONDITIONS
    // ADD CLINIC ISOLATION - Critical for multi-tenant security
    const where = addClinicFilter({}, user.clinicId)

    // DATE FILTER
    // If specific date provided, filter by that date
    if (date) {
      const startOfDay = new Date(date)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date)
      endOfDay.setHours(23, 59, 59, 999)
      
      where.appointmentDate = {
        gte: startOfDay,
        lte: endOfDay
      }
    }
    
    // DATE RANGE FILTER
    if (startDate && endDate) {
      const start = new Date(startDate)
      start.setHours(0, 0, 0, 0)
      const end = new Date(endDate)
      end.setHours(23, 59, 59, 999)
      
      where.appointmentDate = {
        gte: start,
        lte: end
      }
    }

    // DOCTOR FILTER
    if (doctorId) {
      where.doctorId = doctorId
    }

    // PATIENT FILTER
    if (patientId) {
      where.patientId = patientId
    }

    // STATUS FILTER
    if (status) {
      where.status = status
    }

    // TYPE FILTER
    if (type) {
      where.type = type
    }

    // EXCLUDE CANCELLED by default? Optional - keeping for transparency
    // where.status = { not: 'CANCELLED' } // Uncomment to hide cancelled

    // QUERY DATABASE WITH RELATED DATA
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        // JOIN with patient info
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        // JOIN with doctor info (via user)
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        // JOIN with clinic info
        clinic: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // TRANSFORM DATA FOR FRONTEND
    const transformedAppointments = appointments.map(apt => ({
      id: apt.id,
      patientId: apt.patientId,
      patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
      patientPhone: apt.patient.phone,
      patientEmail: apt.patient.email,
      doctorId: apt.doctorId,
      doctorName: `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`,
      doctorSpecialization: apt.doctor.specialization,
      appointmentDate: apt.appointmentDate,
      startTime: apt.startTime,
      endTime: apt.endTime,
      duration: apt.duration,
      type: apt.type,
      reason: apt.reason,
      notes: apt.notes,
      status: apt.status,
      clinicId: apt.clinicId,
      clinicName: apt.clinic.name,
      createdAt: apt.createdAt,
      updatedAt: apt.updatedAt
    }))

    // RETURN APPOINTMENTS
    return NextResponse.json({
      success: true,
      count: transformedAppointments.length,
      appointments: transformedAppointments
    })

  } catch (error) {
    console.error('Get appointments error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointments',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * CREATE NEW APPOINTMENT
 * 
 * URL: POST /api/appointments
 * Body: {
 *   patientId, doctorId, appointmentDate, startTime, type,
 *   reason, notes, duration (optional - defaults by type)
 * }
 * 
 * KEY FEATURES:
 * - Conflict detection: Checks if doctor has overlapping appointments
 * - Duration defaults based on appointment type
 * - Clinic isolation: Sets clinicId from authenticated user
 */
export async function POST(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError('Authentication required')
    }

    // CHECK PERMISSION
    if (!hasPermission(user.role, PERMISSIONS.APPOINTMENTS.CREATE)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. You do not have permission to create appointments.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // GET DATA FROM REQUEST BODY
    const body = await request.json()
    const {
      patientId,
      doctorId,
      appointmentDate,
      startTime,
      type,
      reason,
      notes,
      duration
    } = body

    // VALIDATE REQUIRED FIELDS
    if (!patientId || !doctorId || !appointmentDate || !startTime || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: patientId, doctorId, appointmentDate, startTime, and type are required'
        },
        { status: 400 }
      )
    }

    // VALIDATE APPOINTMENT TYPE
    if (!APPOINTMENT_TYPES.includes(type)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid appointment type. Must be one of: ${APPOINTMENT_TYPES.join(', ')}`
        },
        { status: 400 }
      )
    }

    // CALCULATE DURATION (default based on type or use provided)
    const appointmentDuration = duration || DEFAULT_DURATIONS[type] || 30

    // CALCULATE END TIME
    const endTime = calculateEndTime(startTime, appointmentDuration)

    // VERIFY PATIENT EXISTS IN THIS CLINIC
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        clinicId: user.clinicId
      }
    })

    if (!patient) {
      return NextResponse.json(
        {
          success: false,
          error: 'Patient not found or does not belong to your clinic'
        },
        { status: 404 }
      )
    }

    // VERIFY DOCTOR EXISTS IN THIS CLINIC
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        clinicId: user.clinicId,
        isActive: true
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      }
    })

    if (!doctor) {
      return NextResponse.json(
        {
          success: false,
          error: 'Doctor not found, inactive, or does not belong to your clinic'
        },
        { status: 404 }
      )
    }

    // CONFLICT DETECTION: Check for overlapping appointments
    const appointmentDateObj = new Date(appointmentDate)
    const startOfDay = new Date(appointmentDateObj)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(appointmentDateObj)
    endOfDay.setHours(23, 59, 59, 999)

    // Find existing appointments for this doctor on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: {
          notIn: ['CANCELLED', 'NO_SHOW']
        }
      }
    })

    // Check for time overlap
    const conflict = existingAppointments.find(existing => {
      return timesOverlap(startTime, endTime, existing.startTime, existing.endTime)
    })

    if (conflict) {
      return NextResponse.json(
        {
          success: false,
          error: 'Time slot conflict detected',
          details: `Doctor has an existing appointment from ${conflict.startTime} to ${conflict.endTime}`,
          conflictAppointmentId: conflict.id
        },
        { status: 409 }
      )
    }

    // CREATE APPOINTMENT IN DATABASE
    const newAppointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId,
        appointmentDate: appointmentDateObj,
        startTime,
        endTime,
        duration: appointmentDuration,
        type,
        reason: reason || null,
        notes: notes || null,
        status: 'SCHEDULED',
        clinicId: user.clinicId,
        createdBy: user.userId
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        },
        clinic: {
          select: {
            name: true
          }
        }
      }
    })

    // RETURN SUCCESS
    return NextResponse.json({
      success: true,
      message: 'Appointment created successfully',
      appointment: {
        id: newAppointment.id,
        patientName: `${newAppointment.patient.firstName} ${newAppointment.patient.lastName}`,
        doctorName: `Dr. ${newAppointment.doctor.user.firstName} ${newAppointment.doctor.user.lastName}`,
        appointmentDate: newAppointment.appointmentDate,
        startTime: newAppointment.startTime,
        endTime: newAppointment.endTime,
        duration: newAppointment.duration,
        type: newAppointment.type,
        status: newAppointment.status,
        clinicName: newAppointment.clinic.name
      }
    }, { status: 201 })

  } catch (error) {
    console.error('Create appointment error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create appointment',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * CALCULATE END TIME FROM START TIME AND DURATION
 * 
 * @param {string} startTime - Start time in "HH:MM" format
 * @param {number} duration - Duration in minutes
 * @returns {string} - End time in "HH:MM" format
 */
function calculateEndTime(startTime, duration) {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + duration
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  
  // Handle case where end time goes past midnight (shouldn't happen for appointments)
  const validEndHours = endHours >= 24 ? 23 : endHours
  
  return `${String(validEndHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}

/**
 * CHECK IF TWO TIME RANGES OVERLAP
 * 
 * @param {string} start1 - Start time of first range
 * @param {string} end1 - End time of first range
 * @param {string} start2 - Start time of second range
 * @param {string} end2 - End time of second range
 * @returns {boolean} - True if ranges overlap
 */
function timesOverlap(start1, end1, start2, end2) {
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }
  
  const s1 = toMinutes(start1)
  const e1 = toMinutes(end1)
  const s2 = toMinutes(start2)
  const e2 = toMinutes(end2)
  
  // Two ranges overlap if one starts before the other ends and ends after the other starts
  return s1 < e2 && e1 > s2
}

/**
 * HOW TO USE THESE APIs:
 * 
 * GET ALL APPOINTMENTS:
 * fetch('/api/appointments')
 *   .then(res => res.json())
 *   .then(data => console.log(data.appointments))
 * 
 * GET TODAY'S APPOINTMENTS:
 * fetch('/api/appointments?date=2024-01-15')
 *   .then(res => res.json())
 *   .then(data => console.log(data.appointments))
 * 
 * GET APPOINTMENTS BY DOCTOR:
 * fetch('/api/appointments?doctorId=xxx')
 *   .then(res => res.json())
 *   .then(data => console.log(data.appointments))
 * 
 * CREATE APPOINTMENT:
 * fetch('/api/appointments', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     patientId: 'patient-uuid',
 *     doctorId: 'doctor-uuid',
 *     appointmentDate: '2024-01-15',
 *     startTime: '09:00',
 *     type: 'CHECKUP',
 *     reason: 'Regular checkup',
 *     notes: 'Patient has sensitive teeth'
 *   })
 * })
 */
