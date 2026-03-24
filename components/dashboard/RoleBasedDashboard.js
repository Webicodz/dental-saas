/**
 * ROLE-BASED DASHBOARD COMPONENT
 * 
 * Renders role-specific dashboard widgets and content.
 * Automatically displays appropriate sections based on user role.
 * 
 * IN CODEIGNITER:
 * Like: application/views/dashboard/widgets.php (with role checks)
 */

'use client'

import { useState, useEffect } from 'react'
import TodaySchedule from './TodaySchedule'
import QuickStats from './QuickStats'
import RecentActivity from './RecentActivity'

// Admin Dashboard Widgets
function AdminDashboard({ user, stats }) {
  return (
    <div style={styles.adminGrid}>
      {/* Revenue Overview */}
      <div style={styles.wideCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>💰 Revenue Overview</h3>
        </div>
        <div style={styles.revenueContent}>
          <div style={styles.revenueMain}>
            <span style={styles.revenueAmount}>
              ${(stats?.roleStats?.monthlyRevenue || 0).toLocaleString()}
            </span>
            <span style={styles.revenueLabel}>This Month</span>
            {stats?.roleStats?.monthlyRevenue > 0 && (
              <span style={styles.revenueGrowth}>
                {stats.roleStats.revenueGrowth > 0 ? '↑' : '↓'}{' '}
                {Math.abs(stats.roleStats.revenueGrowth)}% from last month
              </span>
            )}
          </div>
          <div style={styles.revenueStats}>
            <div style={styles.revenueStat}>
              <span style={styles.revenueStatLabel}>Last Month</span>
              <span style={styles.revenueStatValue}>
                ${(stats?.roleStats?.lastMonthRevenue || 0).toLocaleString()}
              </span>
            </div>
            <div style={styles.revenueStat}>
              <span style={styles.revenueStatLabel}>Pending</span>
              <span style={styles.revenueStatValueHighlight}>
                ${(stats?.roleStats?.pendingRevenue || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Overview */}
      <div style={styles.quickCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>👥 Staff</h3>
          <a href="/clinic/users" style={styles.cardLink}>Manage →</a>
        </div>
        <div style={styles.staffStats}>
          <div style={styles.staffItem}>
            <span style={styles.staffIcon}>👨‍💼</span>
            <span style={styles.staffCount}>{stats?.roleStats?.staffCount || 0}</span>
            <span style={styles.staffLabel}>Total</span>
          </div>
          <div style={styles.staffBreakdown}>
            <span>👨‍⚕️ {stats?.roleStats?.doctors || 0} Doctors</span>
            <span>👩‍💻 {stats?.roleStats?.receptionists || 0} Staff</span>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div style={styles.quickCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>⚠️ Pending</h3>
        </div>
        <div style={styles.pendingContent}>
          <div style={styles.pendingItem}>
            <span style={styles.pendingCount}>
              {stats?.roleStats?.pendingApprovals?.users || 0}
            </span>
            <span style={styles.pendingLabel}>User Approvals</span>
          </div>
          <div style={styles.pendingItem}>
            <span style={styles.pendingCountHighlight}>
              {stats?.roleStats?.pendingApprovals?.invoices || 0}
            </span>
            <span style={styles.pendingLabel}>Pending Payments</span>
          </div>
        </div>
      </div>

      {/* Recent Signups */}
      <div style={styles.quickCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>🎉 New Staff</h3>
        </div>
        <div style={styles.signupsList}>
          {stats?.roleStats?.recentSignups?.length > 0 ? (
            stats.roleStats.recentSignups.slice(0, 3).map((signup, i) => (
              <div key={i} style={styles.signupItem}>
                <div style={styles.signupAvatar}>
                  {signup.firstName?.[0]}{signup.lastName?.[0]}
                </div>
                <div style={styles.signupInfo}>
                  <span style={styles.signupName}>{signup.name}</span>
                  <span style={styles.signupRole}>{signup.role}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>No recent signups</p>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div style={styles.wideCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>⚡ Quick Actions</h3>
        </div>
        <div style={styles.quickLinks}>
          {stats?.roleStats?.quickLinks?.map((link, i) => (
            <a key={i} href={link.href} style={styles.quickLink}>
              <span style={styles.quickLinkIcon}>{link.icon}</span>
              <span style={styles.quickLinkText}>{link.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// Doctor Dashboard Widgets
function DoctorDashboard({ user, stats }) {
  return (
    <div style={styles.doctorGrid}>
      {/* My Schedule Today */}
      <div style={styles.wideCard}>
        <TodaySchedule 
          appointments={stats?.roleStats?.todaySchedule || []}
          viewAllLink="/appointments/calendar"
        />
      </div>

      {/* My Patients */}
      <div style={styles.quickCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>👥 My Patients</h3>
        </div>
        <div style={styles.patientStats}>
          <div style={styles.patientMain}>
            <span style={styles.patientCount}>{stats?.roleStats?.myPatients || 0}</span>
            <span style={styles.patientLabel}>Total Patients</span>
          </div>
          <div style={styles.recentPatients}>
            <span style={styles.recentLabel}>Recently Seen:</span>
            {stats?.roleStats?.recentPatients?.slice(0, 3).map((p, i) => (
              <div key={i} style={styles.recentPatient}>
                <span style={styles.recentPatientName}>{p.name}</span>
              </div>
            )) || <span style={styles.emptyText}>No recent patients</span>}
          </div>
        </div>
      </div>

      {/* Pending Treatments */}
      <div style={styles.quickCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>💊 Pending Treatments</h3>
        </div>
        <div style={styles.treatmentStats}>
          <span style={styles.treatmentCount}>
            {stats?.roleStats?.pendingTreatments || 0}
          </span>
          <span style={styles.treatmentLabel}>treatments awaiting action</span>
        </div>
      </div>

      {/* Upcoming Appointments */}
      <div style={styles.wideCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>📅 Upcoming This Week</h3>
        </div>
        <div style={styles.upcomingList}>
          {stats?.roleStats?.upcomingAppointments?.length > 0 ? (
            stats.roleStats.upcomingAppointments.slice(0, 5).map((apt, i) => (
              <div key={i} style={styles.upcomingItem}>
                <div style={styles.upcomingDate}>
                  {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div style={styles.upcomingInfo}>
                  <span style={styles.upcomingPatient}>{apt.patient?.name}</span>
                  <span style={styles.upcomingType}>{apt.type}</span>
                </div>
                <div style={styles.upcomingTime}>{apt.time}</div>
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>No upcoming appointments</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.wideCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>⚡ Quick Actions</h3>
        </div>
        <div style={styles.quickLinks}>
          {stats?.roleStats?.quickActions?.map((action, i) => (
            <a key={i} href={action.href} style={styles.quickLink}>
              <span style={styles.quickLinkIcon}>{action.icon}</span>
              <span style={styles.quickLinkText}>{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// Receptionist Dashboard Widgets
function ReceptionistDashboard({ user, stats }) {
  return (
    <div style={styles.receptionistGrid}>
      {/* Today's Appointments */}
      <div style={styles.wideCard}>
        <TodaySchedule 
          appointments={stats?.roleStats?.appointmentsByStatus?.CONFIRMED || 
                         stats?.roleStats?.appointmentsByStatus?.SCHEDULED || []}
          viewAllLink="/appointments/calendar"
          showCheckIn={true}
        />
      </div>

      {/* Check-in Queue */}
      <div style={styles.quickCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>✅ Check-in Queue</h3>
        </div>
        <div style={styles.queueStats}>
          <span style={styles.queueCount}>
            {stats?.roleStats?.checkInQueue || 0}
          </span>
          <span style={styles.queueLabel}>patients waiting</span>
        </div>
      </div>

      {/* Recent Registrations */}
      <div style={styles.quickCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>🆕 New Patients</h3>
        </div>
        <div style={styles.registrationsList}>
          {stats?.roleStats?.recentRegistrations?.length > 0 ? (
            stats.roleStats.recentRegistrations.slice(0, 3).map((p, i) => (
              <div key={i} style={styles.registrationItem}>
                <div style={styles.registrationAvatar}>
                  {p.firstName?.[0]}{p.lastName?.[0]}
                </div>
                <div style={styles.registrationInfo}>
                  <span style={styles.registrationName}>{p.name}</span>
                  <span style={styles.registrationTime}>
                    {new Date(p.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>No new registrations today</p>
          )}
        </div>
      </div>

      {/* Available Doctors */}
      <div style={styles.quickCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>👨‍⚕️ Available Doctors</h3>
        </div>
        <div style={styles.doctorsList}>
          {stats?.roleStats?.availableDoctors?.length > 0 ? (
            stats.roleStats.availableDoctors.map((doc, i) => (
              <div key={i} style={styles.doctorItem}>
                <span style={styles.doctorIcon}>👨‍⚕️</span>
                <div style={styles.doctorInfo}>
                  <span style={styles.doctorName}>{doc.name}</span>
                  <span style={styles.doctorSpec}>{doc.specialization}</span>
                </div>
              </div>
            ))
          ) : (
            <p style={styles.emptyText}>No doctors available</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={styles.wideCard}>
        <div style={styles.cardHeader}>
          <h3 style={styles.cardTitle}>⚡ Quick Actions</h3>
        </div>
        <div style={styles.quickLinks}>
          {stats?.roleStats?.quickActions?.map((action, i) => (
            <a key={i} href={action.href} style={styles.quickLink}>
              <span style={styles.quickLinkIcon}>{action.icon}</span>
              <span style={styles.quickLinkText}>{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

// Main RoleBasedDashboard Component
export default function RoleBasedDashboard({ user, stats }) {
  if (!user || !stats) {
    return (
      <div style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  const role = user.role

  return (
    <div style={styles.container}>
      {/* Welcome Header */}
      <div style={styles.welcomeSection}>
        <h2 style={styles.welcomeTitle}>
          Welcome back, {user.firstName}! 👋
        </h2>
        <p style={styles.welcomeSubtitle}>
          Here's what's happening at your {user.clinic?.name || 'clinic'} today
        </p>
      </div>

      {/* Quick Stats */}
      <QuickStats stats={stats} role={role} />

      {/* Role-specific Content */}
      {role === 'ADMIN' && <AdminDashboard user={user} stats={stats} />}
      {role === 'DOCTOR' && <DoctorDashboard user={user} stats={stats} />}
      {role === 'RECEPTIONIST' && <ReceptionistDashboard user={user} stats={stats} />}

      {/* Recent Activity (All Roles) */}
      <RecentActivity 
        activities={stats?.recentActivity} 
        role={role}
      />
    </div>
  )
}

// Styles
const styles = {
  container: {
    padding: '24px'
  },
  loading: {
    padding: '60px',
    textAlign: 'center',
    color: '#6b7280'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  },
  welcomeSection: {
    marginBottom: '24px'
  },
  welcomeTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  welcomeSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0'
  },
  adminGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  doctorGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  receptionistGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  wideCard: {
    gridColumn: 'span 2',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  quickCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  cardTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  cardLink: {
    fontSize: '12px',
    color: '#2563eb',
    textDecoration: 'none'
  },
  // Admin specific
  revenueContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  revenueMain: {
    display: 'flex',
    flexDirection: 'column'
  },
  revenueAmount: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#059669'
  },
  revenueLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  revenueGrowth: {
    fontSize: '12px',
    color: '#059669',
    marginTop: '4px'
  },
  revenueStats: {
    textAlign: 'right'
  },
  revenueStat: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '8px'
  },
  revenueStatLabel: {
    fontSize: '12px',
    color: '#6b7280'
  },
  revenueStatValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937'
  },
  revenueStatValueHighlight: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#d97706'
  },
  staffStats: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  staffItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '12px'
  },
  staffIcon: {
    fontSize: '24px'
  },
  staffCount: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937'
  },
  staffLabel: {
    fontSize: '14px',
    color: '#6b7280'
  },
  staffBreakdown: {
    display: 'flex',
    gap: '16px',
    fontSize: '12px',
    color: '#6b7280'
  },
  pendingContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  pendingItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  pendingCount: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#d97706'
  },
  pendingCountHighlight: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#dc2626'
  },
  pendingLabel: {
    fontSize: '12px',
    color: '#6b7280'
  },
  signupsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  signupItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  signupAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600'
  },
  signupInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  signupName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937'
  },
  signupRole: {
    fontSize: '11px',
    color: '#6b7280'
  },
  // Quick Links
  quickLinks: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px'
  },
  quickLink: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    textDecoration: 'none',
    transition: 'background 0.2s'
  },
  quickLinkIcon: {
    fontSize: '24px'
  },
  quickLinkText: {
    fontSize: '12px',
    color: '#374151',
    textAlign: 'center'
  },
  // Doctor specific
  patientStats: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  patientMain: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '16px'
  },
  patientCount: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2563eb'
  },
  patientLabel: {
    fontSize: '12px',
    color: '#6b7280'
  },
  recentPatients: {
    width: '100%'
  },
  recentLabel: {
    fontSize: '11px',
    color: '#6b7280',
    display: 'block',
    marginBottom: '8px'
  },
  recentPatient: {
    padding: '4px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  recentPatientName: {
    fontSize: '12px',
    color: '#374151'
  },
  treatmentStats: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  treatmentCount: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#7c3aed'
  },
  treatmentLabel: {
    fontSize: '12px',
    color: '#6b7280'
  },
  upcomingList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  upcomingItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  upcomingDate: {
    fontSize: '12px',
    fontWeight: '500',
    color: '#374151',
    minWidth: '80px'
  },
  upcomingInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  upcomingPatient: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937'
  },
  upcomingType: {
    fontSize: '11px',
    color: '#6b7280'
  },
  upcomingTime: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#2563eb'
  },
  // Receptionist specific
  queueStats: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  queueCount: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#059669'
  },
  queueLabel: {
    fontSize: '12px',
    color: '#6b7280'
  },
  registrationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  registrationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  registrationAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#059669',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600'
  },
  registrationInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  registrationName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937'
  },
  registrationTime: {
    fontSize: '11px',
    color: '#6b7280'
  },
  doctorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  doctorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  doctorIcon: {
    fontSize: '20px'
  },
  doctorInfo: {
    display: 'flex',
    flexDirection: 'column'
  },
  doctorName: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#1f2937'
  },
  doctorSpec: {
    fontSize: '11px',
    color: '#6b7280'
  },
  // Common
  emptyText: {
    fontSize: '13px',
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic'
  }
}
