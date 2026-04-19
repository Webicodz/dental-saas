import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate, authError } from '@/lib/middleware';

// GET /api/invoices/stats - Get financial statistics
export async function GET(request) {
  try {
    const user = authenticate(request);
    
    if (!user || !user.clinicId) {
      return authError();
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month'; // 'week', 'month', 'quarter', 'year'
    
    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.setMonth(now.getMonth() - 1));
        break;
      case 'quarter':
        startDate = new Date(now.setMonth(now.getMonth() - 3));
        break;
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1));
        break;
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1));
    }

    const clinicId = user.clinicId;

    // Get all invoices for this clinic
    const allInvoices = await prisma.invoice.findMany({
      where: { clinicId },
      select: {
        id: true,
        total: true,
        paidAmount: true,
        balanceDue: true,
        status: true,
        issueDate: true,
        createdAt: true,
        payments: {
          select: {
            amount: true,
            createdAt: true,
          },
        },
      },
    });

    // Calculate stats
    const stats = {
      totalRevenue: 0,
      outstandingAmount: 0,
      overdueAmount: 0,
      pendingAmount: 0,
      paidInvoicesCount: 0,
      pendingInvoicesCount: 0,
      partiallyPaidCount: 0,
      overdueCount: 0,
      cancelledCount: 0,
      totalInvoices: allInvoices.length,
    };

    // Period revenue (payments received in period)
    let periodRevenue = 0;

    // Current month stats for comparison
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    let thisMonthRevenue = 0;
    let lastMonthRevenue = 0;

    allInvoices.forEach((invoice) => {
      // Overall stats
      if (invoice.status === 'PAID') {
        stats.totalRevenue += invoice.paidAmount;
        stats.paidInvoicesCount++;
      } else if (invoice.status === 'PARTIALLY_PAID') {
        stats.totalRevenue += invoice.paidAmount;
        stats.outstandingAmount += invoice.balanceDue;
        stats.partiallyPaidCount++;
      } else if (invoice.status === 'PENDING') {
        stats.pendingAmount += invoice.total;
        stats.pendingInvoicesCount++;
      } else if (invoice.status === 'OVERDUE') {
        stats.outstandingAmount += invoice.balanceDue;
        stats.overdueAmount += invoice.balanceDue;
        stats.overdueCount++;
      } else if (invoice.status === 'CANCELLED') {
        stats.cancelledCount++;
      }

      // Period revenue (from payments)
      invoice.payments.forEach((payment) => {
        const paymentDate = new Date(payment.createdAt);
        if (paymentDate >= startDate) {
          periodRevenue += payment.amount;
        }
        
        // Month comparison
        if (paymentDate >= thisMonth) {
          thisMonthRevenue += payment.amount;
        } else {
          lastMonthRevenue += payment.amount;
        }
      });
    });

    // Get recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      where: { clinicId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Calculate average invoice value
    const completedInvoices = allInvoices.filter(
      (inv) => inv.status === 'PAID' || inv.status === 'PARTIALLY_PAID'
    );
    const averageInvoiceValue = completedInvoices.length > 0
      ? stats.totalRevenue / completedInvoices.length
      : 0;

    // Calculate collection rate
    const totalBilled = allInvoices.reduce(
      (sum, inv) => sum + inv.total, 0
    );
    const collectionRate = totalBilled > 0
      ? (stats.totalRevenue / totalBilled) * 100
      : 0;

    // Month over month revenue change
    const revenueChange = lastMonthRevenue > 0
      ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100
      : thisMonthRevenue > 0 ? 100 : 0;

    // Get top patients by revenue
    const patientRevenue = {};
    for (const invoice of allInvoices) {
      if (invoice.paidAmount > 0) {
        const patientKey = invoice.patientId;
        if (!patientRevenue[patientKey]) {
          patientRevenue[patientKey] = 0;
        }
        patientRevenue[patientKey] += invoice.paidAmount;
      }
    }

    // Get top 5 patients
    const topPatientIds = Object.entries(patientRevenue)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id]) => id);

    const topPatients = await prisma.patient.findMany({
      where: {
        id: { in: topPatientIds },
        clinicId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
    });

    // Map revenue to patients
    const topPatientsWithRevenue = topPatients.map((patient) => ({
      ...patient,
      totalRevenue: patientRevenue[patient.id] || 0,
    })).sort((a, b) => b.totalRevenue - a.totalRevenue);

    return NextResponse.json({
      stats,
      periodRevenue,
      averageInvoiceValue: Math.round(averageInvoiceValue * 100) / 100,
      collectionRate: Math.round(collectionRate * 100) / 100,
      revenueChange: Math.round(revenueChange * 100) / 100,
      thisMonthRevenue,
      lastMonthRevenue,
      recentInvoices,
      topPatients: topPatientsWithRevenue,
    });
  } catch (error) {
    console.error('Error fetching invoice stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice statistics' },
      { status: 500 }
    );
  }
}
