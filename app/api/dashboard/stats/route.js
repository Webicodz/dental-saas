/**
 * DASHBOARD STATISTICS API
 * 
 * GET /api/dashboard/stats
 * 
 * Returns role-specific dashboard statistics and widgets.
 * Different roles see different data based on their permissions.
 * 
 * IN CODEIGNITER:
 * Like: application/controllers/api/Dashboard_stats.php
 * 
 * ROLES:
 * - ADMIN: Clinic overview, staff, revenue, pending tasks
 * - DOCTOR: Today's schedule, patients, treatments, upcoming appointments
 * - RECEPTIONIST: Today's appointments, check-in queue, quick actions
 */

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { authenticate, authError } from '@/lib/middleware'
import { hasPermission, PERMISSIONS } from '@/lib/permissions'

export async function GET(request) {
  try {
    // AUTHENTICATE REQUEST
    const user = authenticate(request)
    
    if (!user) {
      return authError()
    }

    const clinicId = user.clinicId
    const role = user.role

    // GET DATE RANGES
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfDay = new Date(today)
    endOfDay.setHours(23, 59, 59, 999)

    // BASE STATS (all roles see these)
    const baseStats = await getBaseStats(clinicId, today, tomorrow, startOfMonth, user.userId, role)

    // ROLE-SPECIFIC STATS
    let roleStats = {}

    if (role === 'ADMIN') {
      roleStats = await getAdminStats(clinicId, startOfMonth)
    } else if (role === 'DOCTOR') {
      roleStats = await getDoctorStats(clinicId, today, tomorrow, user.userId)
    } else if (role === 'RECEPTIONIST') {
      roleStats = await getReceptionistStats(clinicId, today, tomorrow)
    }

    // COMBINE AND RETURN
    return NextResponse.json({
      success: true,
      role,
      baseStats,
      roleStats,
      timestamps: {
        today: today.toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }
    })

  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch dashboard statistics',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// BASE STATS - Available to all authenticated users
async function getBaseStats(clinicId, today, tomorrow, startOfMonth, userId, role) {
  const [patientCount, todayAppointments, pendingTasks] = await Promise.all([
    prisma.patient.count({
      where: { clinicId }
    }),
    prisma.appointment.count({
      where: {
        clinicId,
        date: { gte: today, lt: tomorrow }
      }
    }),
    // Pending tasks = pending invoices + pending treatments
    Promise.all([
      prisma.invoice.count({
        where: {
          clinicId,
          status: { in: ['PENDING', 'PARTIAL'] }
        }
      }),
      prisma.treatment.count({
        where: {
          clinicId,
          status: 'SCHEDULED'
        }
      })
    ]).then(([invoices, treatments]) => invoices + treatments)
  ])

  return {
    totalPatients: patientCount,
    todayAppointments,
    pendingTasks
  }
}

// ADMIN STATS - Full clinic overview
async function getAdminStats(clinicId, startOfMonth) {
  // Parallel queries for admin-specific stats
  const [
    staffCount,
    monthlyRevenue,
    newPatientsThisMonth,
    recentSignups,
    pendingApprovals,
    appointmentsByStatus,
    topDoctors
  ] = await Promise.all([
    // Staff count
    prisma.user.count({
      where: { clinicId, status: 'ACTIVE' }
    }),

    // Monthly revenue
    prisma.invoice.aggregate({
      where: {
        clinicId,
        status: 'PAID',
        paidDate: { gte: startOfMonth }
      },
      _sum: { total: true }
    }),

    // New patients this month
    prisma.patient.count({
      where: {
        clinicId,
        createdAt: { gte: startOfMonth }
      }
    }),

    // Recent signups (last 7 days)
    prisma.user.findMany({
      where: {
        clinicId,
        createdAt: { 
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),

    // Pending approvals (new users, pending invoices, etc.)
    Promise.all([
      prisma.user.count({ where: { clinicId, status: 'PENDING' } }),
      prisma.invoice.count({ 
        where: { clinicId, status: { in: ['PENDING', 'PARTIAL'] } } 
      })
    ]).then(([pendingUsers, pendingInvoices]) => ({
      users: pendingUsers,
      invoices: pendingInvoices
    })),

    // Appointments by status
    prisma.appointment.groupBy({
      by: ['status'],
      where: {
        clinicId,
        date: { gte: startOfMonth }
      },
      _count: true
    }),

    // Top performing doctors (by appointments this month)
    prisma.appointment.groupBy({
      by: ['doctorId'],
      where: {
        clinicId,
        date: { gte: startOfMonth },
        status: 'COMPLETED'
      },
      _count: true,
      orderBy: { _count: { doctorId: 'desc' } },
      take: 5
    })
  ])

  // Get doctor names for top doctors
  let topDoctorsWithNames = []
  if (topDoctors.length > 0) {
    const doctorIds = topDoctors.map(d => d.doctorId)
    const doctors = await prisma.doctor.findMany({
      where: { id: { in: doctorIds } },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    })

    topDoctorsWithNames = topDoctors.map(stat => {
      const doctor = doctors.find(d => d.id === stat.doctorId)
      return {
        doctorId: stat.doctorId,
        name: doctor 
          ? `Dr. ${doctor.user.firstName} ${doctor.user.lastName}` 
          : 'Unknown',
        completedAppointments: stat._count
      }
    })
  }

  // Format appointments by status
  const appointmentsByStatusFormatted = appointmentsByStatus.reduce((acc, item) => {
    acc[item.status] = item._count
    return acc
  }, {})

  return {
    staffCount,
    monthlyRevenue: monthlyRevenue._sum.total || 0,
    newPatientsThisMonth,
    recentSignups: recentSignups.map(u => ({
      ...u,
      name: `${u.firstName} ${u.lastName}`
    })),
    pendingApprovals,
    appointmentsByStatus: appointmentsByStatusFormatted,
    topDoctors: topDoctorsWithNames,
    quickLinks: [
      { label: 'Manage Users', href: '/clinic/users', icon: '👥' },
      { label: 'Clinic Settings', href: '/clinic/settings', icon: '⚙️' },
      { label: 'View Reports', href: '/reports', icon: '📊' },
      { label: 'Manage Doctors', href: '/doctors', icon: '👨‍⚕️' }
    ]
  }
}

// DOCTOR STATS - Personal dashboard
async function getDoctorStats(clinicId, today, tomorrow, userId) {
  // Get doctor profile
  const doctor = await prisma.doctor.findUnique({
    where: { userId }
  })

  if (!doctor) {
    return {
      doctorProfile: null,
      myPatients: 0,
      myAppointmentsToday: 0,
      pendingTreatments: 0,
      upcomingAppointments: []
    }
  }

  const [
    myPatients,
    todayAppointments,
    upcomingAppointments,
    pendingTreatments,
    recentPatients
  ] = await Promise.all([
    // Count unique patients for this doctor
    prisma.appointment.groupBy({
      by: ['patientId'],
      where: { doctorId: doctor.id, clinicId }
    }).then(r => r.length),

    // Today's appointments for this doctor
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        clinicId,
        date: { gte: today, lt: tomorrow }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { time: 'asc' }
    }),

    // Upcoming appointments (next 7 days)
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        clinicId,
        date: { gt: tomorrow },
        status: { in: ['SCHEDULED', 'CONFIRMED'] }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          }
        }
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }],
      take: 10
    }),

    // Pending treatments
    prisma.treatment.count({
      where: {
        clinicId,
        status: { in: ['SCHEDULED', 'IN_PROGRESS'] }
      }
    }),

    // Recent patients seen
    prisma.appointment.findMany({
      where: {
        doctorId: doctor.id,
        clinicId,
        status: 'COMPLETED'
      },
      select: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        completedAt: true
      },
      distinct: ['patientId'],
      orderBy: { completedAt: 'desc' },
      take: 5
    })
  ])

  return {
    doctorProfile: {
      id: doctor.id,
      specialization: doctor.specialization,
      isActive: doctor.isActive
    },
    myPatients,
    myAppointmentsToday: todayAppointments.length,
    todaySchedule: todayAppointments.map(apt => ({
      id: apt.id,
      time: apt.time,
      type: apt.type,
      status: apt.status,
      patient: {
        id: apt.patient.id,
        name: `${apt.patient.firstName} ${apt.patient.lastName}`,
        phone: apt.patient.phone
      },
      notes: apt.notes
    })),
    pendingTreatments,
    upcomingAppointments: upcomingAppointments.map(apt => ({
      id: apt.id,
      date: apt.date,
      time: apt.time,
      type: apt.type,
      status: apt.status,
      patient: {
        id: apt.patient.id,
        name: `${apt.patient.firstName} ${apt.patient.lastName}`,
        phone: apt.patient.phone
      }
    })),
    recentPatients: recentPatients.map(p => ({
      id: p.patient.id,
      name: `${p.patient.firstName} ${p.patient.lastName}`,
      lastVisit: p.completedAt
    })),
    quickActions: [
      { label: 'View My Schedule', href: '/appointments/calendar', icon: '📅' },
      { label: 'My Patients', href: '/patients', icon: '👥' },
      { label: 'Pending Treatments', href: '/treatments?status=pending', icon: '💊' }
    ]
  }
}

// RECEPTIONIST STATS - Front desk operations
async function getReceptionistStats(clinicId, today, tomorrow) {
  const [
    todayAppointments,
    checkInQueue,
    pendingRegistrations,
    doctors,
    recentPatients
  ] = await Promise.all([
    // Today's appointments
    prisma.appointment.findMany({
      where: {
        clinicId,
        date: { gte: today, lt: tomorrow }
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true
          }
        },
        doctor: {
          include: {
            user: { select: { firstName: true, lastName: true } }
          }
        }
      },
      orderBy: [{ date: 'asc' }, { time: 'asc' }]
    }),

    // Check-in queue (appointments ready for check-in)
    prisma.appointment.count({
      where: {
        clinicId,
        date: { gte: today, lt: tomorrow },
        status: { in: ['CONFIRMED', 'SCHEDULED'] }
      }
    }),

    // Recent patient registrations
    prisma.patient.findMany({
      where: {
        clinicId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        email: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }),

    // Active doctors for scheduling
    prisma.doctor.findMany({
      where: { clinicId, isActive: true },
      include: {
        user: { select: { firstName: true, lastName: true } }
      }
    }),

    // Total patients for reference
    prisma.patient.count({ where: { clinicId } })
  ])

  // Categorize appointments by status
  const appointmentsByStatus = todayAppointments.reduce((acc, apt) => {
    if (!acc[apt.status]) acc[apt.status] = []
    acc[apt.status].push({
      id: apt.id,
      time: apt.time,
      type: apt.type,
      patient: {
        id: apt.patient.id,
        name: `${apt.patient.firstName} ${apt.patient.lastName}`,
        phone: apt.patient.phone
      },
      doctor: apt.doctor ? {
        id: apt.doctor.id,
        name: `Dr. ${apt.doctor.user.firstName} ${apt.doctor.user.lastName}`
      } : null
    })
    return acc
  }, {})

  return {
    todayAppointments: todayAppointments.length,
    appointmentsByStatus,
    checkInQueue,
    pendingRegistrations: pendingRegistrations.length,
    availableDoctors: doctors.map(d => ({
      id: d.id,
      name: `Dr. ${d.user.firstName} ${d.user.lastName}`,
      specialization: d.specialization
    })),
    recentRegistrations: recentPatients.map(p => ({
      ...p,
      name: `${p.firstName} ${p.lastName}`
    })),
    totalPatients,
    quickActions: [
      { label: 'Book Appointment', href: '/appointments?action=new', icon: '📅' },
      { label: 'Register Patient', href: '/patients?action=new', icon: '➕' },
      { label: 'Check In', href: '/appointments?action=checkin', icon: '✅' },
      { label: 'View Calendar', href: '/appointments/calendar', icon: '📆' }
    ]
  }
}
