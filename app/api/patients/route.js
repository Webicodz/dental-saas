/**
 * GET ALL PATIENTS API
 *
 * URL: GET /api/patients
 * Query params: ?search=john&status=active
 *
 * IN CODEIGNITER:
 * class Patients extends CI_Controller {
 *   public function index() {
 *     $search = $this->input->get('search');
 *     $patients = $this->patient_model->get_all($search);
 *     echo json_encode($patients);
 *   }
 * }
 *
 * WHAT IT DOES:
 * 1. Authenticate request via JWT
 * 2. Get search query from URL
 * 3. Query database for patients (CLINIC ISOLATED)
 * 4. Filter by search term (name, email, phone)
 * 5. Return JSON list of patients
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, addClinicFilter } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export async function GET(request) {
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
          error: 'Access denied. You do not have permission to view patients.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // GET SEARCH PARAMS FROM URL
    // Example: /api/patients?search=john&status=active
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''

    // BUILD QUERY CONDITIONS
    // This is like building WHERE clauses in SQL
    // ADD CLINIC ISOLATION - Critical for multi-tenant security
    const where = addClinicFilter({}, user.clinicId)

    // SEARCH FILTER
    // Search in firstName, lastName, email, or phone
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } }
      ]
    }

    // STATUS FILTER
    if (status) {
      where.status = status
    }

    // QUERY DATABASE
    // CODEIGNITER EQUIVALENT:
    // $this->db->where('clinic_id', $clinic_id)
    //          ->like('first_name', $search)
    //          ->or_like('last_name', $search)
    //          ->where('status', $status)
    //          ->get('patients')
    //          ->result()

    const patients = await prisma.patient.findMany({
      where,
      include: {
        // JOIN with related tables
        // Like: SELECT patients.*, clinics.name FROM patients JOIN clinics
        clinic: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Newest first
      }
    })

    // RETURN PATIENTS
    return NextResponse.json({
      success: true,
      count: patients.length,
      patients: patients
    })

  } catch (error) {
    console.error('Get patients error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch patients',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * CREATE NEW PATIENT API
 *
 * URL: POST /api/patients
 * Body: { firstName, lastName, email, phone, etc. }
 *
 * CODEIGNITER EQUIVALENT:
 * public function create() {
 *   $data = $this->input->post();
 *   $this->patient_model->insert($data);
 *   echo json_encode(['success' => true]);
 * }
 */

export async function POST(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError('Authentication required')
    }

    // CHECK PERMISSION
    if (!hasPermission(user.role, PERMISSIONS.PATIENTS.CREATE)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. You do not have permission to create patients.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    // GET DATA FROM REQUEST BODY
    const body = await request.json()
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      email,
      phone,
      address,
      city,
      state,
      zipCode,
      emergencyContactName,
      emergencyContactPhone,
      bloodType,
      allergies,
      medicalHistory,
      insuranceProvider,
      insurancePolicyNumber
    } = body

    // VALIDATE REQUIRED FIELDS
    if (!firstName || !lastName || !phone) {
      return NextResponse.json(
        { error: 'First name, last name, and phone are required' },
        { status: 400 }
      )
    }

    // CHECK IF EMAIL ALREADY EXISTS (if provided)
    // MUST CHECK IN SAME CLINIC for multi-tenant isolation
    if (email) {
      const existing = await prisma.patient.findFirst({
        where: { 
          email,
          clinicId: user.clinicId // Only check in user's clinic
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Email already registered in your clinic' },
          { status: 409 }
        )
      }
    }

    // CREATE PATIENT IN DATABASE
    // CLINIC ID IS SET FROM AUTHENTICATED USER - NEVER FROM REQUEST BODY
    // CODEIGNITER EQUIVALENT:
    // $data['clinic_id'] = $this->session->userdata('clinic_id');
    // $this->db->insert('patients', $data)

    const newPatient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        email: email || null,
        phone,
        address: address || null,
        city: city || null,
        state: state || null,
        zipCode: zipCode || null,
        emergencyContactName: emergencyContactName || null,
        emergencyContactPhone: emergencyContactPhone || null,
        bloodType: bloodType || null,
        allergies: allergies || null,
        medicalHistory: medicalHistory || null,
        insuranceProvider: insuranceProvider || null,
        insurancePolicyNumber: insurancePolicyNumber || null,
        status: 'ACTIVE',
        clinicId: user.clinicId // Set from authenticated user, NOT from request
      },
      include: {
        clinic: true
      }
    })

    // RETURN SUCCESS
    return NextResponse.json({
      success: true,
      message: 'Patient created successfully',
      patient: newPatient
    }, { status: 201 })

  } catch (error) {
    console.error('Create patient error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create patient',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * HOW TO USE THESE APIs:
 *
 * GET ALL PATIENTS:
 * fetch('/api/patients')
 *   .then(res => res.json())
 *   .then(data => console.log(data.patients))
 *
 * SEARCH PATIENTS:
 * fetch('/api/patients?search=john')
 *   .then(res => res.json())
 *   .then(data => console.log(data.patients))
 *
 * CREATE PATIENT:
 * fetch('/api/patients', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     firstName: 'John',
 *     lastName: 'Doe',
 *     phone: '+1234567890',
 *     email: 'john@example.com'
 *   })
 * })
 */
