/**
 * AVAILABLE SLOTS API
 * 
 * URL: GET /api/appointments/available-slots
 * Query params: ?doctorId=xxx&date=2024-01-15&duration=30
 * 
 * PURPOSE:
 * Calculate and return available time slots for a doctor on a specific date.
 * Used for booking appointments - shows only free slots.
 * 
 * KEY FEATURES:
 * - Based on doctor's working hours
 * - Excludes existing appointments
 * - Returns slots in configurable intervals
 * - Shows slot duration based on appointment type
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Default slot duration in minutes
const DEFAULT_SLOT_DURATION = 30

// Slot interval for generating time slots (minutes)
const SLOT_INTERVAL = 15

// Default working hours
const DEFAULT_WORKING_HOURS = {
  start: '09:00',
  end: '17:00'
}

// Day name mapping
const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']

/**
 * GET AVAILABLE SLOTS
 * 
 * Query params:
 * - doctorId: Doctor's ID (required)
 * - date: Date in YYYY-MM-DD format (required)
 * - duration: Slot duration in minutes (optional, default: 30)
 * 
 * Example: /api/appointments/available-slots?doctorId=xxx&date=2024-01-15&duration=30
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

    // GET QUERY PARAMS
    const { searchParams } = new URL(request.url)
    const doctorId = searchParams.get('doctorId')
    const dateStr = searchParams.get('date')
    const duration = parseInt(searchParams.get('duration')) || DEFAULT_SLOT_DURATION

    // VALIDATE REQUIRED PARAMS
    if (!doctorId || !dateStr) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: doctorId and date are required'
        },
        { status: 400 }
      )
    }

    // VALIDATE DATE FORMAT
    const date = new Date(dateStr)
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid date format. Use YYYY-MM-DD format.'
        },
        { status: 400 }
      )
    }

    // FETCH DOCTOR INFO
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        clinicId: user.clinicId, // Clinic isolation
        isActive: true
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        clinic: {
          select: {
            businessHours: true
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

    // GET DOCTOR'S WORKING HOURS
    const workingHours = getWorkingHours(doctor, date)
    
    if (!workingHours) {
      return NextResponse.json({
        success: true,
        doctorId,
        doctorName: `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`,
        date: dateStr,
        duration,
        isWorkingDay: false,
        message: 'Doctor does not work on this day',
        availableSlots: []
      })
    }

    // GET EXISTING APPOINTMENTS FOR THIS DOCTOR ON THIS DATE
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

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
      },
      select: {
        startTime: true,
        endTime: true,
        duration: true
      },
      orderBy: {
        startTime: 'asc'
      }
    })

    // CALCULATE AVAILABLE SLOTS
    const availableSlots = calculateAvailableSlots(
      workingHours.start,
      workingHours.end,
      existingAppointments,
      duration
    )

    // RETURN AVAILABLE SLOTS
    return NextResponse.json({
      success: true,
      doctorId,
      doctorName: `Dr. ${doctor.user.firstName} ${doctor.user.lastName}`,
      date: dateStr,
      dayOfWeek: DAY_NAMES[date.getDay()],
      duration,
      isWorkingDay: true,
      workingHours,
      existingAppointments: existingAppointments.length,
      availableSlots
    })

  } catch (error) {
    console.error('Get available slots error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch available slots',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET WORKING HOURS FOR A SPECIFIC DAY
 * 
 * @param {Object} doctor - Doctor object with workingDays and workingHours
 * @param {Date} date - Date to check
 * @returns {Object|null} - { start, end } or null if not a working day
 */
function getWorkingHours(doctor, date) {
  const dayName = DAY_NAMES[date.getDay()]
  
  // Check doctor's working days
  const workingDays = doctor.workingDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
  
  if (!workingDays.includes(dayName)) {
    return null
  }

  // Get doctor's working hours
  const doctorHours = doctor.workingHours || DEFAULT_WORKING_HOURS
  
  return {
    start: doctorHours.start || DEFAULT_WORKING_HOURS.start,
    end: doctorHours.end || DEFAULT_WORKING_HOURS.end
  }
}

/**
 * CALCULATE AVAILABLE TIME SLOTS
 * 
 * Algorithm:
 * 1. Generate all possible slots based on working hours and duration
 * 2. Remove slots that conflict with existing appointments
 * 3. Return only slots that can accommodate the full duration
 * 
 * @param {string} workStart - Working hours start (e.g., "09:00")
 * @param {string} workEnd - Working hours end (e.g., "17:00")
 * @param {Array} existingAppointments - List of existing appointments
 * @param {number} duration - Required duration in minutes
 * @returns {Array} - List of available slot objects
 */
function calculateAvailableSlots(workStart, workEnd, existingAppointments, duration) {
  const slots = []
  
  const [startHour, startMin] = workStart.split(':').map(Number)
  const [endHour, endMin] = workEnd.split(':').map(Number)
  
  const workStartMinutes = startHour * 60 + startMin
  const workEndMinutes = endHour * 60 + endMin
  
  // Current time (for generating slots)
  let currentMinutes = workStartMinutes
  
  // Generate slots at intervals
  while (currentMinutes + duration <= workEndMinutes) {
    const slotStart = minutesToTime(currentMinutes)
    const slotEnd = minutesToTime(currentMinutes + duration)
    
    // Check if this slot conflicts with any existing appointment
    const hasConflict = existingAppointments.some(apt => {
      return timesOverlap(slotStart, slotEnd, apt.startTime, apt.endTime)
    })
    
    if (!hasConflict) {
      slots.push({
        start: slotStart,
        end: slotEnd,
        duration
      })
    }
    
    // Move to next slot interval
    currentMinutes += SLOT_INTERVAL
  }
  
  return slots
}

/**
 * CONVERT MINUTES TO TIME STRING
 * 
 * @param {number} minutes - Minutes since midnight
 * @returns {string} - Time in HH:MM format
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
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
 * USAGE EXAMPLES:
 * 
 * GET AVAILABLE SLOTS FOR A DOCTOR:
 * fetch('/api/appointments/available-slots?doctorId=xxx&date=2024-01-15')
 *   .then(res => res.json())
 *   .then(data => {
 *     console.log('Available slots:', data.availableSlots)
 *     // [{ start: "09:00", end: "09:30" }, { start: "09:30", end: "10:00" }, ...]
 *   })
 * 
 * GET SLOTS FOR A SPECIFIC DURATION:
 * fetch('/api/appointments/available-slots?doctorId=xxx&date=2024-01-15&duration=60')
 *   .then(res => res.json())
 *   .then(data => {
 *     console.log('Available 1-hour slots:', data.availableSlots)
 *   })
 */
