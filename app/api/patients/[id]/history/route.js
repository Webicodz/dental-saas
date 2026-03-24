/**
 * PATIENT HISTORY API
 *
 * GET    /api/patients/[id]/history - Get medical & dental history
 * PUT    /api/patients/[id]/history - Update medical & dental history
 *
 * CODEIGNITER EQUIVALENT:
 * class Patient_history extends CI_Controller {
 *   public function index($id) { }
 *   public function update($id) { }
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
 * GET PATIENT HISTORY
 * URL: GET /api/patients/123/history
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
          error: 'Access denied. You do not have permission to view patient history.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const { id } = params

    // FIND PATIENT BY ID WITH CLINIC FILTER
    // CODEIGNITER: $this->db->where('id', $id)->where('clinic_id', $clinic_id)->get('patients')->row()
    const patient = await prisma.patient.findFirst({
      where: addClinicFilter({ id }, user.clinicId),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        medicalHistory: true,
        dentalHistory: true
      }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Return structured history data
    const history = {
      medicalHistory: patient.medicalHistory || {
        allergies: [],
        medications: [],
        conditions: [],
        surgeries: [],
        familyHistory: [],
        bloodType: null,
        notes: ''
      },
      dentalHistory: patient.dentalHistory || {
        previousTreatments: [],
        dentalIssues: [],
        currentSymptoms: [],
        oralHygiene: {
          brushingFrequency: '',
          flossingFrequency: '',
          mouthwash: false
        },
        lastDentalVisit: null,
        notes: ''
      }
    }

    return NextResponse.json({
      success: true,
      patientId: patient.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      history
    })

  } catch (error) {
    console.error('Get patient history error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient history' },
      { status: 500 }
    )
  }
}

/**
 * UPDATE PATIENT HISTORY
 * URL: PUT /api/patients/123/history
 */
export async function PUT(request, { params }) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError('Authentication required')
    }

    // CHECK PERMISSION
    if (!hasPermission(user.role, PERMISSIONS.PATIENTS.UPDATE)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. You do not have permission to update patient history.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const { id } = params
    const body = await request.json()

    // CHECK IF PATIENT EXISTS AND BELONGS TO USER'S CLINIC
    // CODEIGNITER: $this->db->where('id', $id)->where('clinic_id', $clinic_id)->get('patients')->row()
    const existing = await prisma.patient.findFirst({
      where: addClinicFilter({ id }, user.clinicId)
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // Prepare update data - merge with existing history
    const updateData = {}

    if (body.medicalHistory) {
      updateData.medicalHistory = {
        ...(existing.medicalHistory || {}),
        ...body.medicalHistory
      }
    }

    if (body.dentalHistory) {
      updateData.dentalHistory = {
        ...(existing.dentalHistory || {}),
        ...body.dentalHistory
      }
    }

    // UPDATE PATIENT HISTORY
    // CODEIGNITER: $this->db->where('id', $id)->where('clinic_id', $clinic_id)->update('patients', $data)
    const updated = await prisma.patient.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        medicalHistory: true,
        dentalHistory: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Patient history updated successfully',
      patient: {
        id: updated.id,
        name: `${updated.firstName} ${updated.lastName}`,
        medicalHistory: updated.medicalHistory,
        dentalHistory: updated.dentalHistory
      }
    })

  } catch (error) {
    console.error('Update patient history error:', error)
    return NextResponse.json(
      { error: 'Failed to update patient history' },
      { status: 500 }
    )
  }
}

/**
 * HOW TO USE:
 *
 * GET PATIENT HISTORY:
 * fetch('/api/patients/123/history')
 *   .then(res => res.json())
 *   .then(data => console.log(data.history))
 *
 * UPDATE PATIENT HISTORY:
 * fetch('/api/patients/123/history', {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     medicalHistory: {
 *       allergies: ['Penicillin'],
 *       medications: ['Aspirin'],
 *       conditions: ['Hypertension'],
 *       bloodType: 'O+'
 *     },
 *     dentalHistory: {
 *       previousTreatments: ['Root Canal', 'Filling'],
 *       dentalIssues: ['Sensitivity'],
 *       lastDentalVisit: '2024-01-15'
 *     }
 *   })
 * })
 */
