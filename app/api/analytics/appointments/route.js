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

    // Get appointments grouped by date
    const appointmentsByDate = await prisma.appointment.groupBy({
      by: ['appointmentDate'],
      where: {
        clinicId,
        appointmentDate: { gte: startDate },
      },
      _count: true,
    });

    // Get appointments by status
    const appointmentsByStatus = await prisma.appointment.groupBy({
      by: ['status'],
      where: {
        clinicId,
        appointmentDate: { gte: startDate },
      },
      _count: true,
    });

    // Get appointments by type
    const appointmentsByType = await prisma.appointment.groupBy({
      by: ['type'],
      where: {
        clinicId,
        appointmentDate: { gte: startDate },
      },
      _count: true,
    });

    // Generate date range labels and data
    const labels = [];
    const data = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= now) {
      labels.push(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      const dateStr = currentDate.toISOString().split('T')[0];
      const count = appointmentsByDate.find(a => 
        a.appointmentDate.toISOString().split('T')[0] === dateStr
      )?._count || 0;
      data.push(count);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Status breakdown
    const statusLabels = appointmentsByStatus.map(s => s.status);
    const statusData = appointmentsByStatus.map(s => s._count);

    // Type breakdown
    const typeLabels = appointmentsByType.map(t => t.type);
    const typeData = appointmentsByType.map(t => t._count);

    // Appointment duration stats
    const durationStats = await prisma.appointment.findMany({
      where: {
        clinicId,
        appointmentDate: { gte: startDate },
        duration: { not: null },
      },
      select: { duration: true },
    });

    const avgDuration = durationStats.length > 0
      ? Math.round(durationStats.reduce((sum, a) => sum + (a.duration || 30), 0) / durationStats.length)
      : 30;

    // Get peak hours
    const appointments = await prisma.appointment.findMany({
      where: {
        clinicId,
        appointmentDate: { gte: startDate },
        startTime: { not: null },
      },
      select: { startTime: true },
    });

    const hourCounts = {};
    appointments.forEach(apt => {
      if (apt.startTime) {
        const hour = parseInt(apt.startTime.split(':')[0]);
        hourCounts[hour] = (hourCounts[hour] || 0) + 1;
      }
    });

    const peakHours = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    // Weekly comparison
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyData = weekDays.map(day => {
      return appointments.filter(apt => {
        if (!apt.time) return false;
        const dayOfWeek = new Date(apt.date).getDay();
        return weekDays[dayOfWeek] === day;
      }).length;
    });

    return NextResponse.json({
      trend: {
        labels,
        datasets: [{
          label: 'Appointments',
          data,
          color: '#3B82F6',
        }],
      },
      statusBreakdown: {
        labels: statusLabels,
        datasets: [{
          label: 'By Status',
          data: statusData,
          color: '#10B981',
        }],
      },
      typeBreakdown: {
        labels: typeLabels,
        datasets: [{
          label: 'By Type',
          data: typeData,
          color: '#8B5CF6',
        }],
      },
      weeklyDistribution: {
        labels: weekDays,
        datasets: [{
          label: 'Weekly Distribution',
          data: weeklyData,
          color: '#F59E0B',
        }],
      },
      stats: {
        total: data.reduce((sum, count) => sum + count, 0),
        average: Math.round(data.reduce((sum, count) => sum + count, 0) / Math.max(data.length, 1)),
        peak: Math.max(...data, 0),
        lowest: Math.min(...data.filter(d => d > 0), 0) || 0,
        avgDuration,
        peakHours,
      },
      period,
    });
  } catch (error) {
    console.error('Analytics appointments error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
