import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30d';
    const clinicId = session.user.clinicId;

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

    // Get all doctors
    const doctors = await prisma.user.findMany({
      where: {
        clinicId,
        role: 'DOCTOR',
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Get doctor performance metrics
    const doctorMetrics = await Promise.all(
      doctors.map(async (doctor) => {
        // Get appointments count
        const appointments = await prisma.appointment.count({
          where: {
            clinicId,
            doctorId: doctor.id,
            date: { gte: startDate },
          },
        });

        // Get completed appointments
        const completedAppointments = await prisma.appointment.count({
          where: {
            clinicId,
            doctorId: doctor.id,
            date: { gte: startDate },
            status: 'COMPLETED',
          },
        });

        // Get revenue (via treatments)
        const treatments = await prisma.treatment.findMany({
          where: {
            clinicId,
            doctorId: doctor.id,
            createdAt: { gte: startDate },
          },
          select: { cost: true, status: true },
        });

        const totalRevenue = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);
        const completedTreatments = treatments.filter(t => t.status === 'COMPLETED').length;

        // Get unique patients
        const patientCount = await prisma.appointment.groupBy({
          by: ['patientId'],
          where: {
            clinicId,
            doctorId: doctor.id,
            date: { gte: startDate },
          },
        });

        // Calculate cancellation rate
        const cancelledAppointments = await prisma.appointment.count({
          where: {
            clinicId,
            doctorId: doctor.id,
            date: { gte: startDate },
            status: 'CANCELLED',
          },
        });

        const cancellationRate = appointments > 0 
          ? Math.round((cancelledAppointments / appointments) * 100) 
          : 0;

        // Get average rating if reviews exist
        const completionRate = appointments > 0 
          ? Math.round((completedAppointments / appointments) * 100) 
          : 0;

        return {
          id: doctor.id,
          name: doctor.name || 'Unknown',
          email: doctor.email,
          appointments,
          completedAppointments,
          completionRate,
          cancellationRate,
          revenue: totalRevenue,
          treatments: treatments.length,
          completedTreatments,
          uniquePatients: patientCount.length,
          avgRevenuePerPatient: patientCount.length > 0 
            ? Math.round(totalRevenue / patientCount.length) 
            : 0,
        };
      })
    );

    // Sort by various metrics
    const byAppointments = [...doctorMetrics].sort((a, b) => b.appointments - a.appointments);
    const byRevenue = [...doctorMetrics].sort((a, b) => b.revenue - a.revenue);
    const byCompletion = [...doctorMetrics].sort((a, b) => b.completionRate - a.completionRate);

    // Generate performance chart data
    const performanceLabels = doctorMetrics.map(d => d.name);
    const performanceAppointments = doctorMetrics.map(d => d.appointments);
    const performanceRevenue = doctorMetrics.map(d => d.revenue);

    // Weekly performance for each doctor
    const weeklyData = await Promise.all(
      doctorMetrics.map(async (doctor) => {
        const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyCounts = weekDays.map(day => 0);

        const appointments = await prisma.appointment.findMany({
          where: {
            clinicId,
            doctorId: doctor.id,
            date: { gte: startDate },
          },
          select: { date: true },
        });

        appointments.forEach(apt => {
          const dayIndex = new Date(apt.date).getDay();
          dailyCounts[dayIndex]++;
        });

        return dailyCounts;
      })
    );

    return NextResponse.json({
      doctors: doctorMetrics,
      topPerformers: {
        byAppointments: byAppointments.slice(0, 5),
        byRevenue: byRevenue.slice(0, 5),
        byCompletion: byCompletion.slice(0, 5),
      },
      comparison: {
        labels: performanceLabels,
        datasets: [
          {
            label: 'Appointments',
            data: performanceAppointments,
            color: '#3B82F6',
          },
          {
            label: 'Revenue',
            data: performanceRevenue,
            color: '#10B981',
          },
        ],
      },
      weeklyComparison: {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        datasets: doctorMetrics.map((doctor, index) => ({
          label: doctor.name,
          data: weeklyData[index],
          color: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'][index % 5],
        })),
      },
      summary: {
        totalDoctors: doctorMetrics.length,
        totalAppointments: doctorMetrics.reduce((sum, d) => sum + d.appointments, 0),
        totalRevenue: doctorMetrics.reduce((sum, d) => sum + d.revenue, 0),
        avgCompletionRate: doctorMetrics.length > 0
          ? Math.round(doctorMetrics.reduce((sum, d) => sum + d.completionRate, 0) / doctorMetrics.length)
          : 0,
        avgCancellationRate: doctorMetrics.length > 0
          ? Math.round(doctorMetrics.reduce((sum, d) => sum + d.cancellationRate, 0) / doctorMetrics.length)
          : 0,
      },
      period,
    });
  } catch (error) {
    console.error('Analytics doctors error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
