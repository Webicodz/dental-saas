/**
 * SINGLE PATIENT API
 *
 * GET    /api/patients/[id] - Get one patient
 * PUT    /api/patients/[id] - Update patient
 * DELETE /api/patients/[id] - Delete patient
 *
 * CODEIGNITER EQUIVALENT:
 * class Patients extends CI_Controller {
 *   public function view($id) { }
 *   public function update($id) { }
 *   public function delete($id) { }
 * }
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

/**
 * GET SINGLE PATIENT
 * URL: GET /api/patients/123
 */
export async function GET(request, { params }) {
  try {
    const { id } = params

    // FIND PATIENT BY ID
    // CODEIGNITER: $this->db->where('id', $id)->get('patients')->row()
    const patient = await prisma.patient.findUnique({
      where: { id },
      include: {
        clinic: true,
        appointments: {
          take: 5, // Last 5 appointments
          orderBy: { appointmentDate: 'desc' }
        },
        documents: true
      }
    })

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      patient
    })

  } catch (error) {
    console.error('Get patient error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient' },
      { status: 500 }
    )
  }
}

/**
 * UPDATE PATIENT
 * URL: PUT /api/patients/123
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()

    // CHECK IF PATIENT EXISTS
    const existing = await prisma.patient.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // UPDATE PATIENT
    // CODEIGNITER: $this->db->where('id', $id)->update('patients', $data)
    const updated = await prisma.patient.update({
      where: { id },
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : existing.dateOfBirth,
        gender: body.gender || existing.gender,
        email: body.email || existing.email,
        phone: body.phone,
        address: body.address || existing.address,
        city: body.city || existing.city,
        state: body.state || existing.state,
        zipCode: body.zipCode || existing.zipCode,
        emergencyContactName: body.emergencyContactName || existing.emergencyContactName,
        emergencyContactPhone: body.emergencyContactPhone || existing.emergencyContactPhone,
        bloodType: body.bloodType || existing.bloodType,
        allergies: body.allergies || existing.allergies,
        medicalHistory: body.medicalHistory || existing.medicalHistory,
        insuranceProvider: body.insuranceProvider || existing.insuranceProvider,
        insurancePolicyNumber: body.insurancePolicyNumber || existing.insurancePolicyNumber,
        status: body.status || existing.status
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Patient updated successfully',
      patient: updated
    })

  } catch (error) {
    console.error('Update patient error:', error)
    return NextResponse.json(
      { error: 'Failed to update patient' },
      { status: 500 }
    )
  }
}

/**
 * DELETE PATIENT
 * URL: DELETE /api/patients/123
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    // CHECK IF PATIENT EXISTS
    const existing = await prisma.patient.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      )
    }

    // DELETE PATIENT
    // CODEIGNITER: $this->db->where('id', $id)->delete('patients')
    await prisma.patient.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully'
    })

  } catch (error) {
    console.error('Delete patient error:', error)
    return NextResponse.json(
      { error: 'Failed to delete patient' },
      { status: 500 }
    )
  }
}

/**
 * HOW TO USE:
 *
 * GET ONE PATIENT:
 * fetch('/api/patients/123')
 *   .then(res => res.json())
 *   .then(data => console.log(data.patient))
 *
 * UPDATE PATIENT:
 * fetch('/api/patients/123', {
 *   method: 'PUT',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     firstName: 'Jane',
 *     lastName: 'Doe',
 *     phone: '+9876543210'
 *   })
 * })
 *
 * DELETE PATIENT:
 * fetch('/api/patients/123', {
 *   method: 'DELETE'
 * })
 */
