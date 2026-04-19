/**
 * CLINIC STATISTICS API
 * 
 * GET /api/clinic/stats
 * 
 * Returns comprehensive statistics for the current clinic.
 * Used by the clinic admin dashboard to display metrics.
 * 
 * IN CODEIGNITER:
 * Like: application/controllers/api/Clinic_stats.php
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError } from '@/lib/middleware'

export async function GET(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    const clinicId = user.clinicId

    // GET DATE RANGES
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)

    // PARALLEL DATABASE QUERIES FOR PERFORMANCE
    const [
      // User counts by role
      userCounts,
      
      // Patient stats
      totalPatients,
      newPatientsThisMonth,
      newPatientsLastMonth,
      
      // Appointment stats
      totalAppointments,
      todayAppointments,
      upcomingAppointments,
      completedAppointmentsThisMonth,
      cancelledAppointments,
      
      // Revenue stats
      monthlyRevenue,
      lastMonthRevenue,
      pendingPayments,
      
      // Treatment stats
      totalTreatments,
      pendingTreatments,
      
      // Recent activity
      recentAppointments,
      recentPatients
    ] = await Promise.all([
      // Users by role
      prisma.user.groupBy({
        by: ['role'],
        where: { clinicId },
        _count: true
      }),
      
      // Total patients
      prisma.patient.count({
        where: { clinicId }
      }),
      
      // New patients this month
      prisma.patient.count({
        where: {
          clinicId,
          createdAt: { gte: startOfMonth }
        }
      }),
      
      // New patients last month
      prisma.patient.count({
        where: {
          clinicId,
          createdAt: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        }
      }),
      
      // Total appointments
      prisma.appointment.count({
        where: { clinicId }
      }),
      
      // Today's appointments
      prisma.appointment.count({
        where: {
          clinicId,
          appointmentDate: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      
      // Upcoming appointments (future, not completed)
      prisma.appointment.count({
        where: {
          clinicId,
          appointmentDate: { gte: tomorrow },
          status: { not: 'CANCELLED' }
        }
      }),
      
      // Completed appointments this month
      prisma.appointment.count({
        where: {
          clinicId,
          appointmentDate: { gte: startOfMonth },
          status: 'COMPLETED'
        }
      }),
      
      // Cancelled appointments
      prisma.appointment.count({
        where: {
          clinicId,
          status: 'CANCELLED'
        }
      }),
      
      // Monthly revenue (sum of paid invoices this month)
      prisma.invoice.aggregate({
        where: {
          clinicId,
          status: 'PAID',
          issuedDate: { gte: startOfMonth }
        },
        _sum: { total: true }
      }),
      
      // Last month revenue
      prisma.invoice.aggregate({
        where: {
          clinicId,
          status: 'PAID',
          issuedDate: {
            gte: startOfLastMonth,
            lte: endOfLastMonth
          }
        },
        _sum: { total: true }
      }),
      
      // Pending payments (unpaid/partial invoices)
      prisma.invoice.aggregate({
        where: {
          clinicId,
          status: { in: ['PENDING', 'PARTIAL'] }
        },
        _sum: { total: true },
        _count: true
      }),
      
      // Total treatments
      prisma.treatment.count({
        where: { clinicId }
      }),
      
      // Pending treatments
      prisma.treatment.count({
        where: {
          clinicId,
          status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
        }
      }),
      
      // Recent appointments (last 5)
      prisma.appointment.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          patient: {
            select: { firstName: true, lastName: true, phone: true }
          },
          doctor: {
            include: {
              user: { select: { firstName: true, lastName: true } }
            }
          }
        }
      }),
      
      // Recent patients (last 5)
      prisma.patient.findMany({
        where: { clinicId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          createdAt: true
        }
      })
    ])

    // CALCULATE TRENDS
    const patientGrowth = newPatientsLastMonth > 0
      ? ((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth * 100).toFixed(1)
      : newPatientsThisMonth > 0 ? 100 : 0

    const revenueGrowth = lastMonthRevenue._sum.total
      ? ((monthlyRevenue._sum.total - lastMonthRevenue._sum.total) / lastMonthRevenue._sum.total * 100).toFixed(1)
      : monthlyRevenue._sum.total > 0 ? 100 : 0

    // FORMAT USER COUNTS
    const staffByRole = userCounts.reduce((acc, item) => {
      acc[item.role] = item._count
      return acc
    }, { ADMIN: 0, DOCTOR: 0, RECEPTIONIST: 0 })

    // BUILD RESPONSE
    const stats = {
      // Staff counts
      staff: {
        total: Object.values(staffByRole).reduce((a, b) => a + b, 0),
        admins: staffByRole.ADMIN || 0,
        doctors: staffByRole.DOCTOR || 0,
        receptionists: staffByRole.RECEPTIONIST || 0
      },
      
      // Patient stats
      patients: {
        total: totalPatients,
        newThisMonth: newPatientsThisMonth,
        growth: parseFloat(patientGrowth)
      },
      
      // Appointment stats
      appointments: {
        total: totalAppointments,
        today: todayAppointments,
        upcoming: upcomingAppointments,
        completedThisMonth: completedAppointmentsThisMonth,
        cancelled: cancelledAppointments
      },
      
      // Revenue stats
      revenue: {
        thisMonth: monthlyRevenue._sum.total || 0,
        lastMonth: lastMonthRevenue._sum.total || 0,
        growth: parseFloat(revenueGrowth),
        pending: pendingPayments._sum.total || 0,
        pendingCount: pendingPayments._count || 0
      },
      
      // Treatment stats
      treatments: {
        total: totalTreatments,
        pending: pendingTreatments
      },
      
      // Recent activity
      recentActivity: {
        appointments: recentAppointments.map(apt => ({
          id: apt.id,
          patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
          doctor: apt.doctor?.user 
            ? `${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`
            : 'Unassigned',
          date: apt.date,
          time: apt.time,
          status: apt.status,
          type: apt.type
        })),
        patients: recentPatients
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      period: {
        from: startOfMonth.toISOString(),
        to: today.toISOString()
      }
    })

  } catch (error) {
    console.error('Clinic stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch clinic statistics',
        details: error.message
      },
      { status: 500 }
    )
  }
}
