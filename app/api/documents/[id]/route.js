/**
 * SINGLE DOCUMENT API
 *
 * GET    /api/documents/[id] - Get document details
 * DELETE /api/documents/[id] - Delete document
 *
 * CODEIGNITER EQUIVALENT:
 * class Document extends CI_Controller {
 *   public function view($id) { }
 *   public function delete($id) { }
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
 * GET DOCUMENT DETAILS
 * URL: GET /api/documents/123
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
          error: 'Access denied. You do not have permission to view documents.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const { id } = params

    // FIND DOCUMENT BY ID WITH CLINIC FILTER
    // CODEIGNITER: $this->db->where('id', $id)->where('clinic_id', $clinic_id)->get('documents')->row()
    const document = await prisma.document.findFirst({
      where: addClinicFilter({ id }, user.clinicId),
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        description: document.description,
        type: document.type,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        fileSizeFormatted: formatFileSize(document.fileSize),
        mimeType: document.mimeType,
        uploadDate: document.uploadDate,
        patient: {
          id: document.patient.id,
          name: `${document.patient.firstName} ${document.patient.lastName}`,
          phone: document.patient.phone
        }
      }
    })

  } catch (error) {
    console.error('Get document error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    )
  }
}

/**
 * DELETE DOCUMENT
 * URL: DELETE /api/documents/123
 * NOTE: Only ADMIN and DOCTOR roles can delete documents
 */
export async function DELETE(request, { params }) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError('Authentication required')
    }

    // CHECK PERMISSION
    if (!hasPermission(user.role, PERMISSIONS.PATIENTS.DELETE)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied. You do not have permission to delete documents.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const { id } = params

    // FIND DOCUMENT BY ID WITH CLINIC FILTER
    // CODEIGNITER: $this->db->where('id', $id)->where('clinic_id', $clinic_id)->get('documents')->row()
    const document = await prisma.document.findFirst({
      where: addClinicFilter({ id }, user.clinicId),
      select: {
        id: true,
        title: true,
        fileName: true,
        fileUrl: true
      }
    })

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // DELETE DOCUMENT
    // CODEIGNITER: $this->db->where('id', $id)->where('clinic_id', $clinic_id)->delete('documents')
    await prisma.document.delete({
      where: { id }
    })

    // Note: You may want to also delete the actual file from storage
    // This would typically be done via a cloud storage SDK or file system operation
    // await deleteFileFromStorage(document.fileUrl)

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
      deletedDocument: {
        id: document.id,
        title: document.title,
        fileName: document.fileName
      }
    })

  } catch (error) {
    console.error('Delete document error:', error)
    return NextResponse.json(
      { error: 'Failed to delete document' },
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
 * GET DOCUMENT DETAILS:
 * fetch('/api/documents/123')
 *   .then(res => res.json())
 *   .then(data => console.log(data.document))
 *
 * DELETE DOCUMENT:
 * fetch('/api/documents/123', {
 *   method: 'DELETE'
 * })
 */
