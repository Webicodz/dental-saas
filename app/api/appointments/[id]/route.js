/**
 * APPOINTMENT DETAIL API
 * 
 * URL: GET /api/appointments/[id] - Get single appointment
 * URL: PUT /api/appointments/[id] - Update appointment
 * URL: DELETE /api/appointments/[id] - Cancel appointment (soft delete)
 * 
 * IN CODEIGNITER:
 * class Appointments extends CI_Controller {
 *   public function view($id) { }
 *   public function update($id) { }
 *   public function delete($id) { }  // Soft delete
 * }
 * 
 * KEY FEATURES:
 * - Soft delete: Only marks as cancelled, never hard deletes
 * - Status workflow: SCHEDULED → CONFIRMED → IN_PROGRESS → COMPLETED
 * - Conflict detection when rescheduling
 * - Clinic isolation: Ensures appointment belongs to user's clinic
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, addClinicFilter } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

// Appointment status constants for workflow validation
export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'NO_SHOW'
]

// Valid status transitions
export const STATUS_TRANSITIONS = {
  SCHEDULED: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['IN_PROGRESS', 'CANCELLED', 'NO_SHOW'],
  IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
  COMPLETED: [], // Terminal state
  CANCELLED: [], // Terminal state
  NO_SHOW: ['SCHEDULED'] // Can reschedule no-shows
}

/**
 * GET SINGLE APPOINTMENT
 * 
 * URL: GET /api/appointments/[id]
 */
export async function GET(request, { params }) {
  try {
    const { id } = params

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

    // FETCH APPOINTMENT
    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        clinicId: user.clinicId // Clinic isolation
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            dateOfBirth: true
          }
        },
        doctor: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        },
        clinic: {
          select: {
            id: true,
            name: true,
            timezone: true
          }
        },
        creator: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        treatments: {
          select: {
            id: true,
            treatmentName: true,
            status: true
          }
        }
      }
    })

    if (!appointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment not found or does not belong to your clinic'
        },
        { status: 404 }
      )
    }

    // RETURN APPOINTMENT DETAILS
    return NextResponse.json({
      success: true,
      appointment: {
        id: appointment.id,
        patientId: appointment.patientId,
        patient: {
          id: appointment.patient.id,
          name: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
          phone: appointment.patient.phone,
          email: appointment.patient.email,
          dateOfBirth: appointment.patient.dateOfBirth
        },
        doctorId: appointment.doctorId,
        doctor: {
          id: appointment.doctor.id,
          name: `Dr. ${appointment.doctor.user.firstName} ${appointment.doctor.user.lastName}`,
          specialization: appointment.doctor.specialization,
          email: appointment.doctor.user.email
        },
        appointmentDate: appointment.appointmentDate,
        startTime: appointment.startTime,
        endTime: appointment.endTime,
        duration: appointment.duration,
        type: appointment.type,
        reason: appointment.reason,
        notes: appointment.notes,
        status: appointment.status,
        clinic: appointment.clinic,
        createdBy: `${appointment.creator.firstName} ${appointment.creator.lastName}`,
        createdAt: appointment.createdAt,
        updatedAt: appointment.updatedAt,
        cancelledAt: appointment.cancelledAt,
        cancelReason: appointment.cancelReason,
        reminderSent: appointment.reminderSent,
        confirmationSent: appointment.confirmationSent,
        treatments: appointment.treatments
      }
    })

  } catch (error) {
    console.error('Get appointment error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch appointment',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * UPDATE APPOINTMENT
 * 
 * URL: PUT /api/appointments/[id]
 * Body: {
 *   appointmentDate, startTime, endTime, duration, type,
 *   status, reason, notes
 * }
 * 
 * KEY FEATURES:
 * - Status workflow validation
 * - Conflict detection when rescheduling
 * - Only allows valid status transitions
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params

    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError('Authentication required')
    }

    // CHECK PERMISSION
    if (!hasPermission(user.role, PERMISSIONS.APPOINTMENTS.UPDATE)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. You do not have permission to update appointments.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // FETCH EXISTING APPOINTMENT
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        clinicId: user.clinicId // Clinic isolation
      }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment not found or does not belong to your clinic'
        },
        { status: 404 }
      )
    }

    // GET DATA FROM REQUEST BODY
    const body = await request.json()
    const {
      appointmentDate,
      startTime,
      endTime,
      duration,
      type,
      status,
      reason,
      notes
    } = body

    // VALIDATE STATUS TRANSITION (if status is being changed)
    if (status && status !== existingAppointment.status) {
      const allowedTransitions = STATUS_TRANSITIONS[existingAppointment.status] || []
      
      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid status transition`,
            details: `Cannot change status from ${existingAppointment.status} to ${status}. Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`
          },
          { status: 400 }
        )
      }
    }

    // CHECK FOR CONFLICTS IF RESCHEDULING
    if (appointmentDate || startTime || endTime) {
      const newDate = appointmentDate || existingAppointment.appointmentDate
      const newStartTime = startTime || existingAppointment.startTime
      const newEndTime = endTime || existingAppointment.endTime

      const appointmentDateObj = new Date(newDate)
      const startOfDay = new Date(appointmentDateObj)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(appointmentDateObj)
      endOfDay.setHours(23, 59, 59, 999)

      // Find existing appointments for this doctor on this date (excluding current)
      const conflictingAppointments = await prisma.appointment.findMany({
        where: {
          doctorId: existingAppointment.doctorId,
          id: { not: id }, // Exclude current appointment
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
      const hasConflict = conflictingAppointments.some(existing => {
        return timesOverlap(newStartTime, newEndTime, existing.startTime, existing.endTime)
      })

      if (hasConflict) {
        return NextResponse.json(
          {
            success: false,
            error: 'Time slot conflict detected',
            details: 'Doctor has an existing appointment during this time'
          },
          { status: 409 }
        )
      }
    }

    // PREPARE UPDATE DATA
    const updateData = {}
    
    if (appointmentDate !== undefined) {
      updateData.appointmentDate = new Date(appointmentDate)
    }
    if (startTime !== undefined) {
      updateData.startTime = startTime
    }
    if (endTime !== undefined) {
      updateData.endTime = endTime
    }
    if (duration !== undefined) {
      updateData.duration = duration
    }
    if (type !== undefined) {
      updateData.type = type
    }
    if (status !== undefined) {
      updateData.status = status
    }
    if (reason !== undefined) {
      updateData.reason = reason
    }
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // UPDATE APPOINTMENT
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: updateData,
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
        }
      }
    })

    // RETURN SUCCESS
    return NextResponse.json({
      success: true,
      message: 'Appointment updated successfully',
      appointment: {
        id: updatedAppointment.id,
        patientName: `${updatedAppointment.patient.firstName} ${updatedAppointment.patient.lastName}`,
        doctorName: `Dr. ${updatedAppointment.doctor.user.firstName} ${updatedAppointment.doctor.user.lastName}`,
        appointmentDate: updatedAppointment.appointmentDate,
        startTime: updatedAppointment.startTime,
        endTime: updatedAppointment.endTime,
        duration: updatedAppointment.duration,
        type: updatedAppointment.type,
        status: updatedAppointment.status,
        reason: updatedAppointment.reason,
        notes: updatedAppointment.notes
      }
    })

  } catch (error) {
    console.error('Update appointment error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update appointment',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * CANCEL APPOINTMENT (Soft Delete)
 * 
 * URL: DELETE /api/appointments/[id]
 * Body: { reason (optional) }
 * 
 * KEY FEATURES:
 * - Soft delete only: Sets status to CANCELLED
 * - Records cancellation reason
 * - Records cancellation timestamp
 * - Does NOT hard delete (never deletes from database)
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError('Authentication required')
    }

    // CHECK PERMISSION
    if (!hasPermission(user.role, PERMISSIONS.APPOINTMENTS.DELETE)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. You do not have permission to cancel appointments.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // GET CANCELLATION REASON FROM BODY
    let cancelReason = null
    try {
      const body = await request.json()
      cancelReason = body.reason || null
    } catch (e) {
      // No body provided, cancelReason remains null
    }

    // FETCH EXISTING APPOINTMENT
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id,
        clinicId: user.clinicId // Clinic isolation
      }
    })

    if (!existingAppointment) {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment not found or does not belong to your clinic'
        },
        { status: 404 }
      )
    }

    // CHECK IF ALREADY CANCELLED
    if (existingAppointment.status === 'CANCELLED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Appointment is already cancelled'
        },
        { status: 400 }
      )
    }

    // CHECK IF COMPLETED (cannot cancel completed appointments)
    if (existingAppointment.status === 'COMPLETED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot cancel a completed appointment. Completed appointments cannot be modified.'
        },
        { status: 400 }
      )
    }

    // SOFT DELETE: Update status to CANCELLED (NEVER HARD DELETE)
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelReason: cancelReason
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
        }
      }
    })

    // RETURN SUCCESS
    return NextResponse.json({
      success: true,
      message: 'Appointment cancelled successfully',
      appointment: {
        id: cancelledAppointment.id,
        patientName: `${cancelledAppointment.patient.firstName} ${cancelledAppointment.patient.lastName}`,
        doctorName: `Dr. ${cancelledAppointment.doctor.user.firstName} ${cancelledAppointment.doctor.user.lastName}`,
        appointmentDate: cancelledAppointment.appointmentDate,
        startTime: cancelledAppointment.startTime,
        endTime: cancelledAppointment.endTime,
        status: cancelledAppointment.status,
        cancelledAt: cancelledAppointment.cancelledAt,
        cancelReason: cancelledAppointment.cancelReason
      }
    })

  } catch (error) {
    console.error('Cancel appointment error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel appointment',
        details: error.message
      },
      { status: 500 }
    )
  }
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
 * GET APPOINTMENT:
 * fetch('/api/appointments/appointment-uuid')
 *   .then(res => res.json())
 *   .then(data => console.log(data.appointment))
 * 
 * UPDATE STATUS:
 * fetch('/api/appointments/appointment-uuid', {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ status: 'CONFIRMED' })
 * })
 * 
 * RESCHEDULE:
 * fetch('/api/appointments/appointment-uuid', {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     appointmentDate: '2024-01-20',
 *     startTime: '10:00'
 *   })
 * })
 * 
 * CANCEL:
 * fetch('/api/appointments/appointment-uuid', {
 *   method: 'DELETE',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({ reason: 'Patient requested cancellation' })
 * })
 */
