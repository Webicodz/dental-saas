/**
 * CALENDAR DATA API
 * 
 * URL: GET /api/calendar
 * Query params: ?startDate=2024-01-01&endDate=2024-01-31&doctorId=xxx
 * 
 * PURPOSE:
 * Return calendar data formatted for calendar views (month/week/day).
 * Returns events with all necessary information for rendering.
 * 
 * KEY FEATURES:
 * - Date range support for calendar views
 * - Doctor filtering for multi-doctor calendars
 * - Color coding by doctor or appointment type
 * - Event data optimized for calendar libraries
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, addClinicFilter } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Appointment type colors for calendar
export const TYPE_COLORS = {
  CONSULTATION: { bg: '#e0e7ff', text: '#4338ca', border: '#6366f1' },
  CLEANING: { bg: '#d1fae5', text: '#047857', border: '#10b981' },
  FILLING: { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' },
  ROOT_CANAL: { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
  CROWN: { bg: '#fce7f3', text: '#be185d', border: '#ec4899' },
  BRIDGE: { bg: '#f3e8ff', text: '#7c3aed', border: '#8b5cf6' },
  EXTRACTION: { bg: '#ffedd5', text: '#c2410c', border: '#fb923c' },
  CHECKUP: { bg: '#e0f2fe', text: '#0369a1', border: '#0ea5e9' },
  EMERGENCY: { bg: '#fef9c3', text: '#a16207', border: '#eab308' },
  FOLLOW_UP: { bg: '#f1f5f9', text: '#475569', border: '#64748b' }
}

// Status colors
export const STATUS_COLORS = {
  SCHEDULED: { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },
  CONFIRMED: { bg: '#d1fae5', text: '#047857', border: '#10b981' },
  IN_PROGRESS: { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' },
  COMPLETED: { bg: '#e5e7eb', text: '#374151', border: '#6b7280' },
  CANCELLED: { bg: '#fee2e2', text: '#b91c1c', border: '#ef4444' },
  NO_SHOW: { bg: '#fce7f3', text: '#be185d', border: '#ec4899' }
}

// Doctor colors for multi-doctor calendar
export const DOCTOR_COLORS = [
  { bg: '#dbeafe', text: '#1e40af', border: '#3b82f6' },  // Blue
  { bg: '#d1fae5', text: '#047857', border: '#10b981' },  // Green
  { bg: '#fef3c7', text: '#b45309', border: '#f59e0b' },  // Yellow
  { bg: '#fce7f3', text: '#be185d', border: '#ec4899' },  // Pink
  { bg: '#f3e8ff', text: '#7c3aed', border: '#8b5cf6' },  // Purple
  { bg: '#ffedd5', text: '#c2410c', border: '#fb923c' },  // Orange
  { bg: '#e0f2fe', text: '#0369a1', border: '#0ea5e9' },  // Cyan
  { bg: '#fef9c3', text: '#a16207', border: '#eab308' }   // Gold
]

/**
 * GET CALENDAR DATA
 * 
 * Query params:
 * - startDate: Start of date range (YYYY-MM-DD) - required
 * - endDate: End of date range (YYYY-MM-DD) - required
 * - doctorId: Filter by doctor (optional)
 * - colorBy: 'type' or 'doctor' (optional, default: 'type')
 * 
 * Example: /api/calendar?startDate=2024-01-01&endDate=2024-01-31
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
          error: 'Access denied. You do not have permission to view calendar.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // GET QUERY PARAMS
    const { searchParams } = new URL(request.url)
    const startDateStr = searchParams.get('startDate')
    const endDateStr = searchParams.get('endDate')
    const doctorId = searchParams.get('doctorId')
    const colorBy = searchParams.get('colorBy') || 'type'

    // VALIDATE REQUIRED PARAMS
    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: startDate and endDate are required'
        },
        { status: 400 }
      )
    }

    // PARSE DATES
    const startDate = new Date(startDateStr)
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(endDateStr)
    endDate.setHours(23, 59, 59, 999)

    // BUILD QUERY CONDITIONS
    const where = addClinicFilter({}, user.clinicId)
    
    where.appointmentDate = {
      gte: startDate,
      lte: endDate
    }

    // DOCTOR FILTER
    if (doctorId) {
      where.doctorId = doctorId
    }

    // EXCLUDE CANCELLED by default for cleaner calendar view
    // where.status = { not: 'CANCELLED' }

    // FETCH APPOINTMENTS
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        },
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
        }
      },
      orderBy: [
        { appointmentDate: 'asc' },
        { startTime: 'asc' }
      ]
    })

    // GET ALL DOCTORS FOR COLOR MAPPING
    const doctors = await prisma.doctor.findMany({
      where: {
        clinicId: user.clinicId,
        isActive: true
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    // Create doctor color map
    const doctorColorMap = {}
    doctors.forEach((doc, index) => {
      doctorColorMap[doc.id] = DOCTOR_COLORS[index % DOCTOR_COLORS.length]
    })

    // TRANSFORM TO CALENDAR EVENTS
    const events = appointments.map(apt => {
      // Get colors based on colorBy setting
      const typeColor = TYPE_COLORS[apt.type] || TYPE_COLORS.CHECKUP
      const doctorColor = doctorColorMap[apt.doctorId] || DOCTOR_COLORS[0]
      const statusColor = STATUS_COLORS[apt.status] || STATUS_COLORS.SCHEDULED
      
      const colors = colorBy === 'doctor' ? doctorColor : typeColor

      // Combine date and time for full datetime
      const appointmentDate = new Date(apt.appointmentDate)
      const [hours, minutes] = apt.startTime.split(':').map(Number)
      const startDateTime = new Date(appointmentDate)
      startDateTime.setHours(hours, minutes, 0, 0)
      
      const endDateTime = new Date(appointmentDate)
      const [endHours, endMinutes] = apt.endTime.split(':').map(Number)
      endDateTime.setHours(endHours, endMinutes, 0, 0)

      return {
        id: apt.id,
        title: `${apt.patient.firstName} ${apt.patient.lastName}`,
        start: startDateTime.toISOString(),
        end: endDateTime.toISOString(),
        allDay: false,
        extendedProps: {
          patientId: apt.patientId,
          patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          patientPhone: apt.patient.phone,
          doctorId: apt.doctorId,
          doctorName: `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`,
          appointmentType: apt.type,
          status: apt.status,
          duration: apt.duration,
          reason: apt.reason,
          notes: apt.notes
        },
        backgroundColor: apt.status === 'CANCELLED' ? '#fca5a5' : colors.bg,
        borderColor: apt.status === 'CANCELLED' ? '#ef4444' : colors.border,
        textColor: apt.status === 'CANCELLED' ? '#7f1d1d' : colors.text,
        classNames: [
          `status-${apt.status.toLowerCase().replace('_', '-')}`,
          `type-${apt.type.toLowerCase().replace('_', '-')}`
        ]
      }
    })

    // CALCULATE SUMMARY STATS
    const stats = {
      total: appointments.length,
      byStatus: {},
      byType: {},
      byDoctor: {}
    }

    appointments.forEach(apt => {
      // By status
      stats.byStatus[apt.status] = (stats.byStatus[apt.status] || 0) + 1
      
      // By type
      stats.byType[apt.type] = (stats.byType[apt.type] || 0) + 1
      
      // By doctor
      const doctorName = `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`
      stats.byDoctor[doctorName] = (stats.byDoctor[doctorName] || 0) + 1
    })

    // RETURN CALENDAR DATA
    return NextResponse.json({
      success: true,
      dateRange: {
        start: startDateStr,
        end: endDateStr
      },
      totalEvents: events.length,
      events,
      stats,
      colorScheme: colorBy,
      doctors: doctors.map(d => ({
        id: d.id,
        name: `Dr. ${d.user.firstName} ${d.user.lastName}`,
        specialization: d.specialization
      }))
    })

  } catch (error) {
    console.error('Get calendar data error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch calendar data',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * USAGE EXAMPLES:
 * 
 * GET MONTH VIEW DATA:
 * fetch('/api/calendar?startDate=2024-01-01&endDate=2024-01-31')
 *   .then(res => res.json())
 *   .then(data => console.log(data.events))
 * 
 * GET WEEK VIEW DATA:
 * fetch('/api/calendar?startDate=2024-01-15&endDate=2024-01-21')
 *   .then(res => res.json())
 *   .then(data => console.log(data.events))
 * 
 * FILTER BY DOCTOR:
 * fetch('/api/calendar?startDate=2024-01-01&endDate=2024-01-31&doctorId=xxx')
 *   .then(res => res.json())
 *   .then(data => console.log(data.events))
 * 
 * COLOR BY DOCTOR:
 * fetch('/api/calendar?startDate=2024-01-01&endDate=2024-01-31&colorBy=doctor')
 *   .then(res => res.json())
 *   .then(data => console.log(data.events))
 * 
 * 
 * CALENDAR EVENT FORMAT:
 * {
 *   id: "appointment-uuid",
 *   title: "John Doe",
 *   start: "2024-01-15T09:00:00.000Z",
 *   end: "2024-01-15T09:30:00.000Z",
 *   backgroundColor: "#dbeafe",
 *   borderColor: "#3b82f6",
 *   textColor: "#1e40af",
 *   extendedProps: {
 *     patientId: "...",
 *     patientName: "John Doe",
 *     patientPhone: "+1234567890",
 *     doctorId: "...",
 *     doctorName: "Dr. Jane Smith",
 *     appointmentType: "CHECKUP",
 *     status: "CONFIRMED",
 *     duration: 30,
 *     reason: "Regular checkup"
 *   }
 * }
 */
