/**
 * PATIENT INVOICES API
 *
 * GET    /api/patients/[id]/invoices - Get all invoices for a patient
 *
 * CODEIGNITER EQUIVALENT:
 * class Patient_invoices extends CI_Controller {
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
 * GET PATIENT INVOICES
 * URL: GET /api/patients/123/invoices
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
          error: 'Access denied. You do not have permission to view patient invoices.',
          code: 'FORBIDDEN'
        },
        { status: 403 }
      )
    }

    const { id } = params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // Filter by invoice status
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
        lastName: true,
        email: true,
        phone: true
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
      whereClause.issueDate = {
        ...whereClause.issueDate,
        gte: new Date(fromDate)
      }
    }

    if (toDate) {
      whereClause.issueDate = {
        ...whereClause.issueDate,
        lte: new Date(toDate)
      }
    }

    // GET INVOICES WITH PAGINATION
    // CODEIGNITER: $this->db->where($whereClause)->order_by('issue_date', 'DESC')->paginate($per_page)
    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where: whereClause,
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          payments: {
            select: {
              id: true,
              amount: true,
              method: true,
              status: true,
              createdAt: true
            }
          }
        }
      }),
      prisma.invoice.count({ where: whereClause })
    ])

    // Calculate invoice/billing statistics
    const stats = {
      totalInvoices: total,
      pending: 0,
      paid: 0,
      partiallyPaid: 0,
      overdue: 0,
      cancelled: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalOutstanding: 0,
      totalOverdue: 0
    }

    // Get all invoices for stats (separate query for accuracy)
    const allInvoices = await prisma.invoice.findMany({
      where: addClinicFilter({ patientId: id }, user.clinicId),
      select: {
        status: true,
        total: true,
        paidAmount: true,
        balanceDue: true,
        dueDate: true
      }
    })

    const now = new Date()
    allInvoices.forEach(inv => {
      if (inv.status === 'PENDING') stats.pending++
      else if (inv.status === 'PAID') stats.paid++
      else if (inv.status === 'PARTIALLY_PAID') stats.partiallyPaid++
      else if (inv.status === 'OVERDUE') stats.overdue++
      else if (inv.status === 'CANCELLED') stats.cancelled++
      
      stats.totalAmount += inv.total
      stats.totalPaid += inv.paidAmount
      stats.totalOutstanding += inv.balanceDue
      
      // Check if overdue
      if (inv.dueDate && new Date(inv.dueDate) < now && inv.status !== 'PAID') {
        stats.totalOverdue += inv.balanceDue
      }
    })

    // Group invoices by status for easier display
    const invoicesByStatus = invoices.reduce((acc, inv) => {
      if (!acc[inv.status]) {
        acc[inv.status] = []
      }
      acc[inv.status].push(inv)
      return acc
    }, {})

    // Group invoices by month/year
    const invoicesByMonth = invoices.reduce((acc, inv) => {
      const date = new Date(inv.issueDate)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(inv)
      return acc
    }, {})

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        name: `${patient.firstName} ${patient.lastName}`,
        email: patient.email,
        phone: patient.phone
      },
      invoices: invoices.map(inv => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        items: inv.items,
        subtotal: inv.subtotal,
        tax: inv.tax,
        discount: inv.discount,
        total: inv.total,
        paidAmount: inv.paidAmount,
        balanceDue: inv.balanceDue,
        status: inv.status,
        paymentMethod: inv.paymentMethod,
        paymentDate: inv.paymentDate,
        issueDate: inv.issueDate,
        dueDate: inv.dueDate,
        notes: inv.notes,
        payments: inv.payments,
        paymentCount: inv.payments.length,
        createdAt: inv.createdAt
      })),
      invoicesByStatus,
      invoicesByMonth,
      stats: {
        ...stats,
        totalAmountFormatted: formatCurrency(stats.totalAmount),
        totalPaidFormatted: formatCurrency(stats.totalPaid),
        totalOutstandingFormatted: formatCurrency(stats.totalOutstanding),
        totalOverdueFormatted: formatCurrency(stats.totalOverdue),
        averageInvoiceAmount: total > 0 ? stats.totalAmount / total : 0,
        averageInvoiceAmountFormatted: formatCurrency(total > 0 ? stats.totalAmount / total : 0)
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Get patient invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch patient invoices' },
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
 * GET ALL INVOICES FOR PATIENT:
 * fetch('/api/patients/123/invoices')
 *   .then(res => res.json())
 *   .then(data => console.log(data.invoices))
 *
 * GET OUTSTANDING INVOICES:
 * fetch('/api/patients/123/invoices?status=pending')
 *   .then(res => res.json())
 *   .then(data => console.log(data.invoices))
 *
 * GET INVOICES BY DATE RANGE:
 * fetch('/api/patients/123/invoices?from=2024-01-01&to=2024-12-31')
 *   .then(res => res.json())
 *   .then(data => console.log(data.invoices))
 *
 * GET BILLING STATS:
 * fetch('/api/patients/123/invoices')
 *   .then(res => res.json())
 *   .then(data => console.log(data.stats))
 *
 * PAGINATED INVOICES:
 * fetch('/api/patients/123/invoices?page=1&limit=10')
 *   .then(res => res.json())
 *   .then(data => console.log(data.pagination))
 */
