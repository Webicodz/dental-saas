/**
 * SUPER ADMIN - Dashboard Analytics API
 * 
 * Platform-wide analytics and statistics.
 * Super Admin only - bypasses clinic isolation.
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError, forbiddenError } from '@/lib/middleware'

// ============================================================================
// SUPER ADMIN CHECK
// ============================================================================

/**
 * Verify user is a Super Admin
 */
function requireSuperAdmin(request) {
  const user = authenticate(request)
  
  if (!user) {
    return { authorized: false, error: 'Authentication required', user: null }
  }

  if (user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
    return { 
      authorized: false, 
      error: 'Super Admin access required',
      user 
    }
  }

  return { authorized: true, user }
}

// ============================================================================
// GET /api/admin/dashboard - Platform analytics
// ============================================================================

export async function GET(request) {
  try {
    const { authorized, user, error } = requireSuperAdmin(request)
    
    if (!authorized) {
      return user ? forbiddenError(error) : authError(error)
    }

    // Time ranges
    const now = new Date()
    const sevenDaysAgo = new Date(now)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Run all queries in parallel
    const [
      // Clinic stats
      totalClinics,
      activeClinics,
      expiredClinics,
      suspendedClinics,
      trialClinics,
      
      // User stats
      totalUsers,
      newUsersThisWeek,
      newUsersThisMonth,
      
      // Patient stats
      totalPatients,
      newPatientsThisWeek,
      newPatientsThisMonth,
      
      // Appointment stats
      totalAppointments,
      appointmentsThisWeek,
      appointmentsThisMonth,
      
      // Revenue stats
      revenueThisMonth,
      revenueLastMonth,
      pendingPayments,
      
      // Recent activity
      recentSignups,
      recentAppointments,
      recentClinics,
      
      // License breakdown
      licenseBreakdown,
      
      // Daily signup trend (last 30 days)
      dailySignups,
      
      // System health
      dbStatus,
      apiHealth
    ] = await Promise.all([
      // Clinic counts
      prisma.clinic.count(),
      prisma.clinic.count({ where: { licenseStatus: 'ACTIVE' } }),
      prisma.clinic.count({ where: { licenseStatus: 'EXPIRED' } }),
      prisma.clinic.count({ where: { licenseStatus: 'SUSPENDED' } }),
      prisma.clinic.count({
        where: {
          licenseExpiry: { gte: now },
          activationDate: { gte: thirtyDaysAgo }
        }
      }),
      
      // User counts
      prisma.user.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonth } } }),
      
      // Patient counts
      prisma.patient.count({ where: { status: 'ACTIVE' } }),
      prisma.patient.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.patient.count({ where: { createdAt: { gte: thisMonth } } }),
      
      // Appointment counts
      prisma.appointment.count(),
      prisma.appointment.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      prisma.appointment.count({ where: { createdAt: { gte: thisMonth } } }),
      
      // Revenue (from paid invoices)
      prisma.invoice.aggregate({
        where: { status: 'PAID', paymentDate: { gte: thisMonth } },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { 
          status: 'PAID', 
          paymentDate: { gte: lastMonth, lte: lastMonthEnd }
        },
        _sum: { total: true }
      }),
      prisma.invoice.aggregate({
        where: { status: 'PENDING' },
        _sum: { total: true }
      }),
      
      // Recent signups (last 7 days)
      prisma.clinic.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          email: true,
          licenseType: true,
          licenseStatus: true,
          createdAt: true,
          _count: { select: { users: true, patients: true } }
        }
      }),
      
      // Recent appointments
      prisma.appointment.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          clinic: { select: { id: true, name: true } },
          patient: { select: { firstName: true, lastName: true } }
        }
      }),
      
      // Recent clinics
      prisma.clinic.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          licenseType: true,
          licenseStatus: true,
          createdAt: true
        }
      }),
      
      // License type breakdown
      prisma.clinic.groupBy({
        by: ['licenseType'],
        _count: true
      }),
      
      // Daily signup trend
      getDailySignups(prisma, thirtyDaysAgo, now),
      
      // Database health check
      checkDatabaseHealth(),
      
      // API health check
      checkApiHealth()
    ])

    // Calculate growth rates
    const revenueGrowth = revenueLastMonth._sum.total 
      ? ((revenueThisMonth._sum.total - revenueLastMonth._sum.total) / revenueLastMonth._sum.total * 100).toFixed(1)
      : 0

    // Format response
    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalClinics,
          activeClinics,
          expiredClinics,
          suspendedClinics,
          trialClinics,
          activeRate: totalClinics ? ((activeClinics / totalClinics) * 100).toFixed(1) : 0
        },
        users: {
          total: totalUsers,
          newThisWeek: newUsersThisWeek,
          newThisMonth: newUsersThisMonth
        },
        patients: {
          total: totalPatients,
          newThisWeek: newPatientsThisWeek,
          newThisMonth: newPatientsThisMonth
        },
        appointments: {
          total: totalAppointments,
          thisWeek: appointmentsThisWeek,
          thisMonth: appointmentsThisMonth
        },
        revenue: {
          thisMonth: revenueThisMonth._sum.total || 0,
          lastMonth: revenueLastMonth._sum.total || 0,
          pending: pendingPayments._sum.total || 0,
          growthRate: parseFloat(revenueGrowth)
        },
        recentSignups: recentSignups.map(clinic => ({
          id: clinic.id,
          name: clinic.name,
          email: clinic.email,
          licenseType: clinic.licenseType,
          createdAt: clinic.createdAt,
          users: clinic._count.users,
          patients: clinic._count.patients
        })),
        recentAppointments: recentAppointments.map(apt => ({
          id: apt.id,
          clinic: apt.clinic,
          patient: `${apt.patient.firstName} ${apt.patient.lastName}`,
          type: apt.type,
          status: apt.status,
          date: apt.appointmentDate,
          createdAt: apt.createdAt
        })),
        topClinics: recentClinics,
        licenseBreakdown: licenseBreakdown.reduce((acc, item) => {
          acc[item.licenseType] = item._count
          return acc
        }, {}),
        dailyTrend: dailySignups,
        systemHealth: {
          database: dbStatus,
          api: apiHealth,
          timestamp: now.toISOString()
        }
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get daily signup counts for trend chart
 */
async function getDailySignups(prisma, startDate, endDate) {
  const clinics = await prisma.clinic.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate }
    },
    select: { createdAt: true }
  })

  // Group by date
  const dailyCounts = {}
  const currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    const dateKey = currentDate.toISOString().split('T')[0]
    dailyCounts[dateKey] = 0
    currentDate.setDate(currentDate.getDate() + 1)
  }
  
  clinics.forEach(clinic => {
    const dateKey = clinic.createdAt.toISOString().split('T')[0]
    if (dailyCounts[dateKey] !== undefined) {
      dailyCounts[dateKey]++
    }
  })

  return Object.entries(dailyCounts).map(([date, count]) => ({ date, count }))
}

/**
 * Check database health
 */
async function checkDatabaseHealth() {
  try {
    const start = Date.now()
    await prisma.$queryRaw`SELECT 1`
    const latency = Date.now() - start
    
    return {
      status: 'healthy',
      latency,
      message: 'Database connection active'
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
      message: 'Database connection failed'
    }
  }
}

/**
 * Check API health
 */
function checkApiHealth() {
  return {
    status: 'healthy',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    message: 'API is running'
  }
}
