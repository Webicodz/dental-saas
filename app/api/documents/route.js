/**
 * DOCUMENTS API
 *
 * POST   /api/documents - Upload/create a new document
 * GET    /api/documents - List all documents (optional)
 *
 * CODEIGNITER EQUIVALENT:
 * class Documents extends CI_Controller {
 *   public function upload() { }
 *   public function index() { }
 * }
 * 
 * SECURITY: All operations enforce:
 * 1. JWT Authentication
 * 2. Role-Based Permissions
 * 3. Clinic Isolation (can only access own clinic's documents)
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, addClinicFilter } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

/**
 * UPLOAD/CREATE DOCUMENT
 * URL: POST /api/documents
 * 
 * Document types: XRAY, REPORT, PRESCRIPTION, CONSENT_FORM, OTHER
 */
export async function POST(request) {
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
          error: 'Access denied. You do not have permission to upload documents.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Validate required fields
    const { patientId, title, fileName, fileUrl, fileSize, mimeType, type, description } = body

    if (!patientId || !title || !fileName || !fileUrl || !fileSize || !mimeType || !type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: patientId, title, fileName, fileUrl, fileSize, mimeType, type'
        },
        { status: 400 }
      )
    }

    // Validate document type
    const validTypes = ['XRAY', 'REPORT', 'PRESCRIPTION', 'CONSENT_FORM', 'OTHER']
    const documentType = type.toUpperCase()
    if (!validTypes.includes(documentType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid document type. Valid types: ${validTypes.join(', ')}`
        },
        { status: 400 }
      )
    }

    // VERIFY PATIENT EXISTS AND BELONGS TO USER'S CLINIC
    // CODEIGNITER: $this->db->where('id', $patient_id)->where('clinic_id', $clinic_id)->get('patients')->row()
    const patient = await prisma.patient.findFirst({
      where: addClinicFilter({ id: patientId }, user.clinicId),
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

    // CREATE DOCUMENT
    // CODEIGNITER: $this->db->insert('documents', $data)
    const document = await prisma.document.create({
      data: {
        clinicId: user.clinicId,
        patientId,
        title,
        description: description || null,
        type: documentType,
        fileName,
        fileUrl,
        fileSize: parseInt(fileSize),
        mimeType,
        uploadedBy: user.id,
        uploadDate: new Date()
      },
      include: {
        // Patient basic info
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      document: {
        id: document.id,
        title: document.title,
        type: document.type,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        fileSizeFormatted: formatFileSize(document.fileSize),
        mimeType: document.mimeType,
        uploadDate: document.uploadDate,
        patient: {
          id: document.patient.id,
          name: `${document.patient.firstName} ${document.patient.lastName}`
        }
      }
    })

  } catch (error) {
    console.error('Upload document error:', error)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}

/**
 * LIST ALL DOCUMENTS (Optional - for admin/billing)
 * URL: GET /api/documents
 */
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
          error: 'Access denied. You do not have permission to view documents.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')

    // BUILD WHERE CLAUSE
    const whereClause = addClinicFilter({}, user.clinicId)

    if (patientId) {
      whereClause.patientId = patientId
    }

    if (type) {
      whereClause.type = type.toUpperCase()
    }

    // GET DOCUMENTS
    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where: whereClause,
        orderBy: { uploadDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }),
      prisma.document.count({ where: whereClause })
    ])

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        id: doc.id,
        title: doc.title,
        description: doc.description,
        type: doc.type,
        fileName: doc.fileName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        fileSizeFormatted: formatFileSize(doc.fileSize),
        mimeType: doc.mimeType,
        uploadDate: doc.uploadDate,
        patient: {
          id: doc.patient.id,
          name: `${doc.patient.firstName} ${doc.patient.lastName}`
        }
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('List documents error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
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
 * UPLOAD DOCUMENT:
 * fetch('/api/documents', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     patientId: '123',
 *     title: 'Panoramic X-Ray',
 *     description: 'Full mouth X-Ray taken during initial consultation',
 *     type: 'XRAY',
 *     fileName: 'panoramic_xray_2024.jpg',
 *     fileUrl: '/uploads/documents/panoramic_xray_2024.jpg',
 *     fileSize: 245000,
 *     mimeType: 'image/jpeg'
 *   })
 * })
 *
 * LIST ALL DOCUMENTS:
 * fetch('/api/documents?page=1&limit=20')
 *   .then(res => res.json())
 *   .then(data => console.log(data.documents))
 *
 * LIST DOCUMENTS BY PATIENT:
 * fetch('/api/documents?patientId=123')
 *   .then(res => res.json())
 *   .then(data => console.log(data.documents))
 */
