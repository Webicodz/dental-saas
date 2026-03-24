/**
 * PATIENT TREATMENTS API
 *
 * GET    /api/patients/[id]/treatments - Get all treatments for a patient
 *
 * CODEIGNITER EQUIVALENT:
 * class Patient_treatments extends CI_Controller {
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
 * GET PATIENT TREATMENTS
 * URL: GET /api/patients/123/treatments
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
          error: 'Access denied. You do not have permission to view patient treatments.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Filter by treatment status
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

    // GET TREATMENTS WITH PAGINATION
    // CODEIGNITER: $this->db->where($whereClause)->order_by('created_at', 'DESC')->paginate($per_page)
    const [treatments, total] = await Promise.all([
      prisma.treatment.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
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
          appointment: {
            select: {
              id: true,
              appointmentDate: true,
              startTime: true,
              endTime: true
            }
          }
        }
      }),
      prisma.treatment.count({ where: whereClause })
    ])

    // Calculate treatment statistics
    const stats = {
      total: total,
      planned: 0,
      inProgress: 0,
      completed: 0,
      totalCost: 0,
      totalEstimatedCost: 0
    }

    // Get all treatments for stats (separate query for accuracy)
    const allTreatments = await prisma.treatment.findMany({
      where: addClinicFilter({ patientId: id }, user.clinicId),
      select: {
        status: true,
        estimatedCost: true,
        actualCost: true
      }
    })

    allTreatments.forEach(t => {
      if (t.status === 'PLANNED') stats.planned++
      else if (t.status === 'IN_PROGRESS') stats.inProgress++
      else if (t.status === 'COMPLETED') stats.completed++
      
      if (t.estimatedCost) stats.totalEstimatedCost += t.estimatedCost
      if (t.actualCost) stats.totalCost += t.actualCost
    })

    // Group treatments by status for easier display
    const treatmentsByStatus = treatments.reduce((acc, treatment) => {
      if (!acc[treatment.status]) {
        acc[treatment.status] = []
      }
      acc[treatment.status].push(treatment)
      return acc
    }, {})

    // Group treatments by tooth for dental chart
    const treatmentsByTooth = treatments.reduce((acc, treatment) => {
      const tooth = treatment.tooth || 'UNSPECIFIED'
      if (!acc[tooth]) {
        acc[tooth] = []
      }
      acc[tooth].push(treatment)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`
      },
      treatments: treatments.map(t => ({
        id: t.id,
        treatmentName: t.treatmentName,
        tooth: t.tooth,
        procedure: t.procedure,
        status: t.status,
        startDate: t.startDate,
        completedDate: t.completedDate,
        estimatedCost: t.estimatedCost,
        actualCost: t.actualCost,
        notes: t.notes,
        prescriptions: t.prescriptions,
        createdAt: t.createdAt,
        doctor: t.doctor ? {
          id: t.doctor.id,
          name: `${t.doctor.user.firstName} ${t.doctor.user.lastName}`,
          specialization: t.doctor.specialization
        } : null,
        appointment: t.appointment ? {
          id: t.appointment.id,
          date: t.appointment.appointmentDate,
          time: `${t.appointment.startTime} - ${t.appointment.endTime}`
        } : null
      })),
      treatmentsByStatus,
      treatmentsByTooth,
      stats: {
        ...stats,
        totalEstimatedCostFormatted: formatCurrency(stats.totalEstimatedCost),
        totalCostFormatted: formatCurrency(stats.totalCost)
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get patient treatments error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient treatments' },
      { status: 500 }
    )
  }
}

/**
 * Format currency
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount || 0)
}

/**
 * HOW TO USE:
 *
 * GET ALL TREATMENTS FOR PATIENT:
 * fetch('/api/patients/123/treatments')
 *   .then(res => res.json())
 *   .then(data => console.log(data.treatments))
 *
 * GET TREATMENTS FILTERED BY STATUS:
 * fetch('/api/patients/123/treatments?status=completed')
 *   .then(res => res.json())
 *   .then(data => console.log(data.treatments))
 *
 * PAGINATED TREATMENTS:
 * fetch('/api/patients/123/treatments?page=1&limit=10')
 *   .then(res => res.json())
 *   .then(data => console.log(data.pagination))
 *
 * GET TREATMENT STATS:
 * fetch('/api/patients/123/treatments')
 *   .then(res => res.json())
 *   .then(data => console.log(data.stats))
 */
