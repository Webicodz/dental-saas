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

    // Get treatments grouped by type
    const treatmentsByType = await prisma.treatment.groupBy({
      by: ['type'],
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
      _count: true,
      _sum: { cost: true },
    });

    // Get treatments by status
    const treatmentsByStatus = await prisma.treatment.groupBy({
      by: ['status'],
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Get all treatments for analysis
    const treatments = await prisma.treatment.findMany({
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
      select: {
        type: true,
        cost: true,
        status: true,
        tooth: true,
      },
    });

    // Top treatments by count
    const treatmentCounts = {};
    treatments.forEach(t => {
      const type = t.type || 'Unknown';
      treatmentCounts[type] = (treatmentCounts[type] || 0) + 1;
    });

    const topTreatments = Object.entries(treatmentCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Top treatments by revenue
    const treatmentRevenue = {};
    treatments.forEach(t => {
      const type = t.type || 'Unknown';
      if (!treatmentRevenue[type]) {
        treatmentRevenue[type] = 0;
      }
      treatmentRevenue[type] += t.cost || 0;
    });

    const topRevenueTreatments = Object.entries(treatmentRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, revenue]) => ({ name, revenue }));

    // Treatment frequency by tooth
    const toothFrequency = {};
    treatments.forEach(t => {
      if (t.tooth) {
        toothFrequency[t.tooth] = (toothFrequency[t.tooth] || 0) + 1;
      }
    });

    const teethOrder = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const upperTeeth = teethOrder.map(t => `UR${t}`);
    const lowerTeeth = teethOrder.map(t => `LR${t}`);

    const toothChartData = [
      ...upperTeeth.map(t => toothFrequency[t] || 0),
      ...lowerTeeth.map(t => toothFrequency[t] || 0),
    ];

    // Treatment trends over time
    const treatmentsByDate = await prisma.treatment.groupBy({
      by: ['createdAt'],
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    const trendLabels = [];
    const trendData = [];
    const currentDate = new Date(startDate);

    while (currentDate <= now) {
      trendLabels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const dayTreatments = treatmentsByDate.filter(t => 
        t.createdAt.toISOString().split('T')[0] === dateStr
      ).length;

      trendData.push(dayTreatments);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Calculate averages
    const totalCost = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);
    const avgTreatmentCost = treatments.length > 0 ? Math.round(totalCost / treatments.length) : 0;

    // Treatment completion rate
    const completedTreatments = treatments.filter(t => t.status === 'COMPLETED').length;
    const completionRate = treatments.length > 0 
      ? Math.round((completedTreatments / treatments.length) * 100) 
      : 0;

    return NextResponse.json({
      trends: {
        labels: trendLabels,
        datasets: [{
          label: 'Treatments',
          data: trendData,
          color: '#8B5CF6',
        }],
      },
      topTreatments: {
        labels: topTreatments.map(t => t.name),
        datasets: [{
          label: 'Count',
          data: topTreatments.map(t => t.count),
          color: '#3B82F6',
        }],
      },
      topRevenue: {
        labels: topRevenueTreatments.map(t => t.name),
        datasets: [{
          label: 'Revenue',
          data: topRevenueTreatments.map(t => t.revenue),
          color: '#10B981',
        }],
      },
      toothChart: {
        labels: [...upperTeeth, ...lowerTeeth],
        datasets: [{
          label: 'Treatment Frequency',
          data: toothChartData,
          color: '#F59E0B',
        }],
      },
      statusBreakdown: {
        labels: treatmentsByStatus.map(s => s.status),
        datasets: [{
          label: 'By Status',
          data: treatmentsByStatus.map(s => s._count),
          color: '#EC4899',
        }],
      },
      summary: {
        totalTreatments: treatments.length,
        avgCost: avgTreatmentCost,
        completedCount: completedTreatments,
        completionRate,
        uniqueTypes: treatmentsByType.length,
        totalRevenue: totalCost,
      },
      period,
    });
  } catch (error) {
    console.error('Analytics treatments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
