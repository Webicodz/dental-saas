/**
 * PATIENT APPOINTMENTS API
 *
 * GET    /api/patients/[id]/appointments - Get all appointments for a patient
 *
 * CODEIGNITER EQUIVALENT:
 * class Patient_appointments extends CI_Controller {
 *   public function index($id) { }
 * }
 * 
 * SECURITY: All operations enforce:
 * 1. JWT Authentication
 * 2. Role-Based Permissions
 * 3. Clinic Isolation (can only access own clinic's patients)
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, addClinicFilter } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

/**
 * GET PATIENT APPOINTMENTS
 * URL: GET /api/patients/123/appointments
 */
export async function GET(request, { params }) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError('Authentication required')
    }

    // CHECK PERMISSION
    if (!hasPermission(user.role, PERMISSIONS.PATIENTS.VIEW)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. You do not have permission to view patient appointments.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Filter by appointment status
    const fromDate = searchParams.get('from') // Filter from date
    const toDate = searchParams.get('to') // Filter to date
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // VERIFY PATIENT EXISTS AND BELONGS TO USER'S CLINIC
    // CODEIGNITER: $this->db->where('id', $id)->where('clinic_id', $clinic_id)->get('patients')->row()
    const patient = await prisma.patient.findFirst({
      where: addClinicFilter({ id }, user.clinicId),
      select: {
        id: true,
        firstName: true,
        lastName: true
      }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // BUILD WHERE CLAUSE
    // CODEIGNITER: $this->db->where('patient_id', $id)->where('clinic_id', $clinic_id)
    const whereClause = {
      ...addClinicFilter({ patientId: id }, user.clinicId)
    }

    // Add status filter if provided
    if (status) {
      whereClause.status = status.toUpperCase()
    }

    // Add date range filter if provided
    if (fromDate) {
      whereClause.appointmentDate = {
        ...whereClause.appointmentDate,
        gte: new Date(fromDate)
      }
    }

    if (toDate) {
      whereClause.appointmentDate = {
        ...whereClause.appointmentDate,
        lte: new Date(toDate)
      }
    }

    // GET APPOINTMENTS WITH PAGINATION
    // CODEIGNITER: $this->db->where($whereClause)->order_by('appointment_date', 'DESC')->paginate($per_page)
    const [appointments, total] = await Promise.all([
      prisma.appointment.findMany({
        where: whereClause,
        orderBy: { appointmentDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          doctor: {
            select: {
              id: true,
              specialization: true,
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
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
      }),
      prisma.appointment.count({ where: whereClause })
    ])

    // Calculate appointment statistics
    const stats = {
      total: total,
      scheduled: 0,
      confirmed: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0,
      upcoming: 0,
      past: 0
    }

    // Get all appointments for stats (separate query for accuracy)
    const allAppointments = await prisma.appointment.findMany({
      where: addClinicFilter({ patientId: id }, user.clinicId),
      select: {
        status: true,
        appointmentDate: true
      }
    })

    const now = new Date()
    allAppointments.forEach(apt => {
      if (apt.status === 'SCHEDULED') stats.scheduled++
      else if (apt.status === 'CONFIRMED') stats.confirmed++
      else if (apt.status === 'IN_PROGRESS') stats.inProgress++
      else if (apt.status === 'COMPLETED') stats.completed++
      else if (apt.status === 'CANCELLED') stats.cancelled++
      else if (apt.status === 'NO_SHOW') stats.noShow++
      
      if (new Date(apt.appointmentDate) > now) {
        stats.upcoming++
      } else {
        stats.past++
      }
    })

    // Group appointments by status for easier display
    const appointmentsByStatus = appointments.reduce((acc, apt) => {
      if (!acc[apt.status]) {
        acc[apt.status] = []
      }
      acc[apt.status].push(apt)
      return acc
    }, {})

    // Group appointments by month/year for calendar view
    const appointmentsByMonth = appointments.reduce((acc, apt) => {
      const date = new Date(apt.appointmentDate)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(apt)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`
      },
      appointments: appointments.map(apt => ({
        id: apt.id,
        appointmentDate: apt.appointmentDate,
        startTime: apt.startTime,
        endTime: apt.endTime,
        duration: apt.duration,
        type: apt.type,
        reason: apt.reason,
        notes: apt.notes,
        status: apt.status,
        cancelledAt: apt.cancelledAt,
        cancelReason: apt.cancelReason,
        reminderSent: apt.reminderSent,
        confirmationSent: apt.confirmationSent,
        createdAt: apt.createdAt,
        doctor: apt.doctor ? {
          id: apt.doctor.id,
          name: `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`,
          specialization: apt.doctor.specialization
        } : null,
        treatments: apt.treatments
      })),
      appointmentsByStatus,
      appointmentsByMonth,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get patient appointments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient appointments' },
      { status: 500 }
    )
  }
}

/**
 * HOW TO USE:
 *
 * GET ALL APPOINTMENTS FOR PATIENT:
 * fetch('/api/patients/123/appointments')
 *   .then(res => res.json())
 *   .then(data => console.log(data.appointments))
 *
 * GET UPCOMING APPOINTMENTS:
 * fetch('/api/patients/123/appointments?status=scheduled')
 *   .then(res => res.json())
 *   .then(data => console.log(data.appointments))
 *
 * GET APPOINTMENTS BY DATE RANGE:
 * fetch('/api/patients/123/appointments?from=2024-01-01&to=2024-12-31')
 *   .then(res => res.json())
 *   .then(data => console.log(data.appointments))
 *
 * GET APPOINTMENT STATS:
 * fetch('/api/patients/123/appointments')
 *   .then(res => res.json())
 *   .then(data => console.log(data.stats))
 *
 * PAGINATED APPOINTMENTS:
 * fetch('/api/patients/123/appointments?page=1&limit=10')
 *   .then(res => res.json())
 *   .then(data => console.log(data.pagination))
 */
