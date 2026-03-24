/**
 * PATIENT DOCUMENTS API
 *
 * GET    /api/patients/[id]/documents - Get all documents for a patient
 *
 * CODEIGNITER EQUIVALENT:
 * class Patient_documents extends CI_Controller {
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
 * GET PATIENT DOCUMENTS
 * URL: GET /api/patients/123/documents
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
          error: 'Access denied. You do not have permission to view patient documents.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // Filter by document type
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

    // Add type filter if provided
    if (type) {
      whereClause.type = type.toUpperCase()
    }

    // GET DOCUMENTS WITH PAGINATION
    // CODEIGNITER: $this->db->where($whereClause)->order_by('upload_date', 'DESC')->paginate($per_page)
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        orderBy: { uploadDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          // Include uploader info
        }
      }),
      prisma.document.count({ where: whereClause })
    ])

    // Group documents by type for easier display
    const documentsByType = documents.reduce((acc, doc) => {
      if (!acc[doc.type]) {
        acc[doc.type] = []
      }
      acc[doc.type].push(doc)
      return acc
    }, {})

    // Calculate total file size
    const totalSize = documents.reduce((sum, doc) => sum + doc.fileSize, 0)

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`
      },
      documents,
      documentsByType,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      summary: {
        totalDocuments: total,
        totalSize,
        totalSizeFormatted: formatFileSize(totalSize),
        byType: Object.keys(documentsByType).reduce((acc, type) => {
          acc[type] = documentsByType[type].length
          return acc
        }, {})
      }
    })

  } catch (error) {
    console.error('Get patient documents error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient documents' },
      { status: 500 }
    )
  }
}

/**
 * Format file size to human readable format
 */
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * HOW TO USE:
 *
 * GET ALL DOCUMENTS FOR PATIENT:
 * fetch('/api/patients/123/documents')
 *   .then(res => res.json())
 *   .then(data => console.log(data.documents))
 *
 * GET DOCUMENTS FILTERED BY TYPE:
 * fetch('/api/patients/123/documents?type=xray')
 *   .then(res => res.json())
 *   .then(data => console.log(data.documents))
 *
 * PAGINATED DOCUMENTS:
 * fetch('/api/patients/123/documents?page=2&limit=10')
 *   .then(res => res.json())
 *   .then(data => console.log(data.pagination))
 */
