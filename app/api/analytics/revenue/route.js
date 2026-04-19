import { NextResponse } from 'next/server';
import { authenticate, authError } from '@/lib/middleware';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const user = authenticate(request);
    if (!user) {
      return authError();
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const clinicId = user.clinicId;

    // Calculate date range based on period
    const now = new Date();
    let startDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get revenue by date
    const invoicesByDate = await prisma.invoice.findMany({
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        total: true,
        paid: true,
        status: true,
      },
    });

    // Generate daily revenue data
    const labels = [];
    const revenueData = [];
    const collectionData = [];
    const pendingData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= now) {
      labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayInvoices = invoicesByDate.filter(inv => 
        inv.createdAt.toISOString().split('T')[0] === dateStr
      );

      const dayRevenue = dayInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const dayPaid = dayInvoices.reduce((sum, inv) => sum + (inv.paid || 0), 0);
      
      revenueData.push(dayRevenue);
      collectionData.push(dayPaid);
      pendingData.push(dayRevenue - dayPaid);
      
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Revenue by payment status
    const statusBreakdown = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
      _sum: { total: true },
      _count: true,
    });

    // Monthly comparison (if period allows)
    const monthlyComparison = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        clinicId,
        createdAt: { 
          gte: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
          lt: startDate,
        },
      },
      _sum: { total: true, paid: true },
    });

    // Revenue by treatment type (via invoice items if available)
    const totalRevenue = revenueData.reduce((sum, val) => sum + val, 0);
    const totalCollected = collectionData.reduce((sum, val) => sum + val, 0);
    const totalPending = pendingData.reduce((sum, val) => sum + val, 0);

    // Calculate projections
    const daysElapsed = Math.max(1, Math.ceil((now - startDate) / (24 * 60 * 60 * 1000)));
    const dailyAvgRevenue = totalRevenue / daysElapsed;
    const monthlyProjection = dailyAvgRevenue * 30;
    const yearlyProjection = dailyAvgRevenue * 365;

    // Growth rate calculation
    const previousPeriodStart = new Date(startDate.getTime() - (now - startDate));
    const previousInvoices = await prisma.invoice.findMany({
      where: {
        clinicId,
        createdAt: { gte: previousPeriodStart, lt: startDate },
      },
      select: { total: true },
    });
    const previousRevenue = previousInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const growthRate = previousRevenue > 0 
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 100) 
      : 0;

    // Revenue by day of week
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueByDay = weekDays.map(day => {
      return invoicesByDate
        .filter(inv => {
          const dayOfWeek = new Date(inv.createdAt).getDay();
          return weekDays[dayOfWeek] === day;
        })
        .reduce((sum, inv) => sum + (inv.total || 0), 0);
    });

    return NextResponse.json({
      trend: {
        labels,
        datasets: [
          {
            label: 'Total Revenue',
            data: revenueData,
            color: '#10B981',
          },
          {
            label: 'Collected',
            data: collectionData,
            color: '#3B82F6',
          },
          {
            label: 'Pending',
            data: pendingData,
            color: '#F59E0B',
          },
        ],
      },
      statusBreakdown: {
        labels: statusBreakdown.map(s => s.status),
        datasets: [{
          label: 'Revenue by Status',
          data: statusBreakdown.map(s => s._sum.total || 0),
          color: '#8B5CF6',
        }],
      },
      weeklyRevenue: {
        labels: weekDays,
        datasets: [{
          label: 'Revenue by Day',
          data: revenueByDay,
          color: '#EC4899',
        }],
      },
      summary: {
        totalRevenue,
        totalCollected,
        totalPending,
        collectionRate: totalRevenue > 0 ? Math.round((totalCollected / totalRevenue) * 100) : 0,
        dailyAverage: Math.round(dailyAvgRevenue),
        monthlyProjection: Math.round(monthlyProjection),
        yearlyProjection: Math.round(yearlyProjection),
        growthRate,
        invoiceCount: invoicesByDate.length,
      },
      period,
    });
  } catch (error) {
    console.error('Analytics revenue error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
