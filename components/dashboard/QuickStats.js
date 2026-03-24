/**
 * QUICK STATS COMPONENT
 * 
 * Displays key statistics in a row of compact cards.
 * Shows role-specific metrics at a glance.
 * 
 * IN CODEIGNITER:
 * Like: application/views/widgets/quick_stats.php
 */

'use client'

export default function QuickStats({ stats, role = 'ADMIN' }) {
  const baseStats = stats?.baseStats || {}
  
  // Role-specific stat configurations
  const statConfigs = {
    ADMIN: [
      {
        key: 'todayAppointments',
        icon: '📅',
        label: 'Today\'s Appointments',
        color: '#2563eb',
        bgColor: '#dbeafe',
        link: '/appointments'
      },
      {
        key: 'totalPatients',
        icon: '👥',
        label: 'Total Patients',
        color: '#059669',
        bgColor: '#d1fae5',
        link: '/patients'
      },
      {
        key: 'pendingTasks',
        icon: '⚠️',
        label: 'Pending Tasks',
        color: '#d97706',
        bgColor: '#fef3c7',
        link: '/billing?status=pending'
      },
      {
        key: 'staffCount',
        icon: '👨‍💼',
        label: 'Staff Members',
        color: '#7c3aed',
        bgColor: '#ede9fe',
        link: '/clinic/users'
      }
    ],
    DOCTOR: [
      {
        key: 'myAppointmentsToday',
        icon: '📅',
        label: 'My Appointments Today',
        color: '#2563eb',
        bgColor: '#dbeafe',
        link: '/appointments/calendar'
      },
      {
        key: 'myPatients',
        icon: '👥',
        label: 'My Patients',
        color: '#059669',
        bgColor: '#d1fae5',
        link: '/patients'
      },
      {
        key: 'pendingTreatments',
        icon: '💊',
        label: 'Pending Treatments',
        color: '#7c3aed',
        bgColor: '#ede9fe',
        link: '/treatments?status=pending'
      },
      {
        key: 'upcomingAppointments',
        icon: '⏰',
        label: 'Upcoming',
        color: '#d97706',
        bgColor: '#fef3c7',
        link: '/appointments/calendar'
      }
    ],
    RECEPTIONIST: [
      {
        key: 'todayAppointments',
        icon: '📅',
        label: 'Today\'s Appointments',
        color: '#2563eb',
        bgColor: '#dbeafe',
        link: '/appointments'
      },
      {
        key: 'checkInQueue',
        icon: '✅',
        label: 'Check-in Queue',
        color: '#059669',
        bgColor: '#d1fae5',
        link: '/appointments?action=checkin'
      },
      {
        key: 'totalPatients',
        icon: '👥',
        label: 'Total Patients',
        color: '#7c3aed',
        bgColor: '#ede9fe',
        link: '/patients'
      },
      {
        key: 'pendingRegistrations',
        icon: '🆕',
        label: 'New Registrations',
        color: '#d97706',
        bgColor: '#fef3c7',
        link: '/patients?action=new'
      }
    ]
  }

  const config = statConfigs[role] || statConfigs.ADMIN
  
  // Get value from nested or flat structure
  const getValue = (key) => {
    // Check baseStats
    if (baseStats[key] !== undefined) {
      return baseStats[key]
    }
    // Check roleStats
    if (stats?.roleStats?.[key] !== undefined) {
      return stats.roleStats[key]
    }
    // Check nested statistics
    if (stats?.roleStats?.statistics?.[key] !== undefined) {
      return stats.roleStats.statistics[key]
    }
    return 0
  }

  return (
    <div style={styles.container}>
      {config.map((stat, index) => {
        const value = getValue(stat.key)
        
        return (
          <a 
            key={index} 
            href={stat.link}
            style={styles.statCard}
          >
            <div style={{
              ...styles.iconWrapper,
              backgroundColor: stat.bgColor
            }}>
              <span style={styles.icon}>{stat.icon}</span>
            </div>
            <div style={styles.statContent}>
              <span style={styles.statValue}>{value}</span>
              <span style={styles.statLabel}>{stat.label}</span>
            </div>
          </a>
        )
      })}
    </div>
  )
}

// Styles
const styles = {
  container: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer'
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  icon: {
    fontSize: '24px'
  },
  statContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 1
  },
  statLabel: {
    fontSize: '12px',
    color: '#6b7280',
    whiteSpace: 'nowrap'
  }
}
