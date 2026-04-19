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
    let startDate, previousStartDate;
    
    switch (period) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Get total patients
    const totalPatients = await prisma.patient.count({
      where: { clinicId },
    });

    // Get new patients in current period
    const newPatients = await prisma.patient.count({
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
    });

    // Get new patients in previous period for comparison
    const previousNewPatients = await prisma.patient.count({
      where: {
        clinicId,
        createdAt: { gte: previousStartDate, lt: startDate },
      },
    });

    // Get appointments in current period
    const totalAppointments = await prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: { gte: startDate },
      },
    });

    // Get appointments in previous period
    const previousAppointments = await prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: { gte: previousStartDate, lt: startDate },
      },
    });

    // Get revenue in current period
    const revenueData = await prisma.invoice.aggregate({
      where: {
        clinicId,
        createdAt: { gte: startDate },
      },
      _sum: { total: true, paid: true },
    });

    // Get revenue in previous period
    const previousRevenueData = await prisma.invoice.aggregate({
      where: {
        clinicId,
        createdAt: { gte: previousStartDate, lt: startDate },
      },
      _sum: { total: true, paid: true },
    });

    const revenue = revenueData._sum.total || 0;
    const paidAmount = revenueData._sum.paid || 0;
    const previousRevenue = previousRevenueData._sum.total || 0;
    const previousPaidAmount = previousRevenueData._sum.paid || 0;

    // Calculate collection rate
    const collectionRate = revenue > 0 ? Math.round((paidAmount / revenue) * 100) : 0;
    const previousCollectionRate = previousRevenue > 0 ? Math.round((previousPaidAmount / previousRevenue) * 100) : 0;

    // Calculate trends (percentage change)
    const calculateTrend = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    // Get completed appointments
    const completedAppointments = await prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: { gte: startDate },
        status: 'COMPLETED',
      },
    });

    // Get cancelled appointments
    const cancelledAppointments = await prisma.appointment.count({
      where: {
        clinicId,
        appointmentDate: { gte: startDate },
        status: 'CANCELLED',
      },
    });

    // Get average revenue per patient
    const avgRevenuePerPatient = totalPatients > 0 ? Math.round(revenue / totalPatients) : 0;

    return NextResponse.json({
      kpis: {
        totalPatients: {
          value: totalPatients,
          trend: calculateTrend(newPatients, previousNewPatients),
          label: 'Total Patients',
          icon: 'users',
        },
        newPatients: {
          value: newPatients,
          trend: calculateTrend(newPatients, previousNewPatients),
          label: 'New Patients',
          icon: 'user-plus',
        },
        appointments: {
          value: totalAppointments,
          trend: calculateTrend(totalAppointments, previousAppointments),
          label: 'Appointments',
          icon: 'calendar',
        },
        revenue: {
          value: revenue,
          trend: calculateTrend(revenue, previousRevenue),
          label: 'Revenue',
          icon: 'dollar',
          format: 'currency',
        },
        collectionRate: {
          value: collectionRate,
          trend: calculateTrend(collectionRate, previousCollectionRate),
          label: 'Collection Rate',
          icon: 'percentage',
          format: 'percentage',
        },
        completedAppointments: {
          value: completedAppointments,
          trend: calculateTrend(completedAppointments, previousAppointments),
          label: 'Completed',
          icon: 'check',
        },
        cancelledAppointments: {
          value: cancelledAppointments,
          trend: 0,
          label: 'Cancelled',
          icon: 'x',
        },
        avgRevenuePerPatient: {
          value: avgRevenuePerPatient,
          trend: 0,
          label: 'Avg Revenue/Patient',
          icon: 'chart',
          format: 'currency',
        },
      },
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
