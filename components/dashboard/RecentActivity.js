/**
 * RECENT ACTIVITY COMPONENT
 * 
 * Displays a feed of recent activities in the clinic.
 * Shows appointments, patient registrations, and other events.
 * 
 * IN CODEIGNITER:
 * Like: application/views/widgets/recent_activity.php
 */

'use client'

import { useState } from 'react'

// Activity type configurations
const ACTIVITY_TYPES = {
  APPOINTMENT: {
    icon: '📅',
    color: '#2563eb',
    getMessage: (data) => {
      if (data.status === 'COMPLETED') {
        return `${data.patient} completed ${data.type?.toLowerCase() || 'appointment'} with ${data.doctor}`
      }
      if (data.status === 'CANCELLED') {
        return `${data.patient}'s appointment with ${data.doctor} was cancelled`
      }
      return `${data.patient} has a ${data.type?.toLowerCase() || 'appointment'} with ${data.doctor}`
    }
  },
  PATIENT: {
    icon: '👤',
    color: '#059669',
    getMessage: (data) => `New patient registered: ${data.patient}`
  },
  TREATMENT: {
    icon: '💊',
    color: '#7c3aed',
    getMessage: (data) => `${data.patient} - ${data.treatment}`
  },
  PAYMENT: {
    icon: '💳',
    color: '#d97706',
    getMessage: (data) => `Payment received: $${data.amount} from ${data.patient}`
  },
  USER: {
    icon: '👨‍💼',
    color: '#ec4899',
    getMessage: (data) => `${data.user} joined as ${data.role}`
  }
}

// Format relative time
function getRelativeTime(dateString) {
  if (!dateString) return ''
  
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  
  return date.toLocaleDateString()
}

// Individual Activity Item
function ActivityItem({ activity, index }) {
  const typeConfig = ACTIVITY_TYPES[activity.type] || ACTIVITY_TYPES.APPOINTMENT
  const message = typeConfig.getMessage(activity.data || activity)
  
  return (
    <div style={styles.activityItem}>
      <div style={{
        ...styles.activityIcon,
        backgroundColor: `${typeConfig.color}15`
      }}>
        <span style={{ fontSize: '16px' }}>{typeConfig.icon}</span>
      </div>
      <div style={styles.activityContent}>
        <p style={styles.activityMessage}>{message}</p>
        <span style={styles.activityTime}>
          {getRelativeTime(activity.createdAt || activity.date)}
        </span>
      </div>
      <div style={styles.activityIndicator}>
        <span style={{ ...styles.dot, backgroundColor: typeConfig.color }}></span>
      </div>
    </div>
  )
}

export default function RecentActivity({ activities, role = 'ADMIN' }) {
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(false)
  
  // Build activities list from provided data
  const buildActivities = () => {
    const items = []
    
    // Add recent appointments
    if (activities?.appointments?.length > 0) {
      activities.appointments.forEach(apt => {
        items.push({
          type: 'APPOINTMENT',
          data: {
            patient: apt.patient,
            doctor: apt.doctor,
            type: apt.type,
            status: apt.status,
            date: apt.date
          },
          createdAt: apt.date
        })
      })
    }
    
    // Add recent patients
    if (activities?.patients?.length > 0) {
      activities.patients.forEach(p => {
        items.push({
          type: 'PATIENT',
          data: {
            patient: `${p.firstName} ${p.lastName}`
          },
          createdAt: p.createdAt
        })
      })
    }
    
    // Sort by date (most recent first)
    items.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0)
      const dateB = new Date(b.createdAt || 0)
      return dateB - dateA
    })
    
    return items
  }
  
  const allActivities = buildActivities()
  
  // Filter activities
  const filteredActivities = filter === 'all' 
    ? allActivities 
    : allActivities.filter(a => a.type === filter)
  
  const displayedActivities = expanded 
    ? filteredActivities 
    : filteredActivities.slice(0, 6)

  if (allActivities.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>📋 Recent Activity</h3>
        </div>
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p style={styles.emptyText}>No recent activity to show</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>📋 Recent Activity</h3>
        <div style={styles.filters}>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All</option>
            <option value="APPOINTMENT">Appointments</option>
            <option value="PATIENT">Patients</option>
            <option value="TREATMENT">Treatments</option>
            <option value="PAYMENT">Payments</option>
          </select>
        </div>
      </div>
      
      <div style={styles.activityList}>
        {displayedActivities.map((activity, index) => (
          <ActivityItem 
            key={index} 
            activity={activity}
            index={index}
          />
        ))}
      </div>
      
      {filteredActivities.length > 6 && (
        <button 
          style={styles.showMoreBtn}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded 
            ? 'Show Less' 
            : `Show ${filteredActivities.length - 6} More Activities`
          }
        </button>
      )}
    </div>
  )
}

// Styles
const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginTop: '24px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  filters: {
    display: 'flex',
    gap: '8px'
  },
  filterSelect: {
    padding: '6px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '12px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  activityItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  activityIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  activityContent: {
    flex: 1,
    minWidth: 0
  },
  activityMessage: {
    fontSize: '13px',
    color: '#374151',
    margin: 0,
    lineHeight: 1.4
  },
  activityTime: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '4px',
    display: 'block'
  },
  activityIndicator: {
    flexShrink: 0
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    display: 'block'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px 20px'
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '12px'
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  showMoreBtn: {
    width: '100%',
    padding: '10px',
    marginTop: '16px',
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#6b7280',
    cursor: 'pointer'
  }
}
