/**
 * TODAY'S SCHEDULE COMPONENT
 * 
 * Displays today's appointments in a compact widget format.
 * Shows appointment time, patient, type, and status.
 * 
 * IN CODEIGNITER:
 * Like: application/views/widgets/todays_schedule.php
 */

'use client'

import { useState } from 'react'

// Status configuration
const STATUS_CONFIG = {
  SCHEDULED: { label: 'Scheduled', color: '#3b82f6', bg: '#dbeafe' },
  CONFIRMED: { label: 'Confirmed', color: '#10b981', bg: '#d1fae5' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: '#fef3c7' },
  COMPLETED: { label: 'Completed', color: '#6b7280', bg: '#e5e7eb' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
  NO_SHOW: { label: 'No Show', color: '#ec4899', bg: '#fce7f3' }
}

// Type icons
const TYPE_ICONS = {
  CONSULTATION: '💬',
  CLEANING: '✨',
  FILLING: '🛠️',
  ROOT_CANAL: '🦷',
  CROWN: '👑',
  BRIDGE: '🌉',
  EXTRACTION: '🔧',
  CHECKUP: '🔍',
  EMERGENCY: '🚨',
  FOLLOW_UP: '📝',
  DEFAULT: '📅'
}

export default function TodaySchedule({ appointments = [], viewAllLink, showCheckIn = false }) {
  const [expanded, setExpanded] = useState(false)
  
  // Sort appointments by time
  const sortedAppointments = [...appointments].sort((a, b) => {
    if (!a.time || !b.time) return 0
    return a.time.localeCompare(b.time)
  })
  
  // Show max 5 appointments initially
  const displayedAppointments = expanded 
    ? sortedAppointments 
    : sortedAppointments.slice(0, 5)
  
  const getTypeIcon = (type) => TYPE_ICONS[type] || TYPE_ICONS.DEFAULT

  if (appointments.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.header}>
          <h3 style={styles.title}>📅 Today's Schedule</h3>
        </div>
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>📭</span>
          <p style={styles.emptyText}>No appointments scheduled for today</p>
          {viewAllLink && (
            <a href={viewAllLink} style={styles.viewAllLink}>
              View Calendar →
            </a>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          📅 Today's Schedule
          <span style={styles.count}>({appointments.length})</span>
        </h3>
        {viewAllLink && (
          <a href={viewAllLink} style={styles.viewAllLink}>
            View All →
          </a>
        )}
      </div>
      
      <div style={styles.appointmentList}>
        {displayedAppointments.map((apt, index) => (
          <div 
            key={apt.id || index} 
            style={styles.appointmentCard}
            className={apt.status === 'IN_PROGRESS' ? 'pulse-animation' : ''}
          >
            <div style={styles.timeColumn}>
              <span style={styles.time}>{apt.time || 'TBD'}</span>
              <span style={styles.statusDot} data-status={apt.status}></span>
            </div>
            
            <div style={styles.contentColumn}>
              <div style={styles.patientRow}>
                <span style={styles.typeIcon}>{getTypeIcon(apt.type)}</span>
                <span style={styles.patientName}>{apt.patient?.name || 'Unknown Patient'}</span>
                {apt.patient?.phone && (
                  <span style={styles.patientPhone}>{apt.patient.phone}</span>
                )}
              </div>
              
              <div style={styles.detailsRow}>
                <span style={styles.appointmentType}>{apt.type?.replace('_', ' ')}</span>
                {apt.notes && (
                  <span style={styles.notes}>{apt.notes}</span>
                )}
              </div>
            </div>
            
            <div style={styles.actionColumn}>
              <span 
                style={{
                  ...styles.statusBadge,
                  backgroundColor: STATUS_CONFIG[apt.status]?.bg || '#f3f4f6',
                  color: STATUS_CONFIG[apt.status]?.color || '#6b7280'
                }}
              >
                {STATUS_CONFIG[apt.status]?.label || apt.status}
              </span>
              
              {showCheckIn && apt.status === 'CONFIRMED' && (
                <button style={styles.checkInBtn}>
                  ✓ Check In
                </button>
              )}
              
              {showCheckIn && apt.status === 'SCHEDULED' && (
                <button style={styles.confirmBtn}>
                  Confirm
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {sortedAppointments.length > 5 && (
        <button 
          style={styles.expandBtn}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show Less' : `Show All ${sortedAppointments.length} Appointments`}
        </button>
      )}
    </div>
  )
}

// Styles
const styles = {
  container: {
    height: '100%'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  title: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  count: {
    fontSize: '12px',
    fontWeight: '400',
    color: '#6b7280'
  },
  viewAllLink: {
    fontSize: '12px',
    color: '#2563eb',
    textDecoration: 'none'
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
    margin: '0 0 12px 0'
  },
  appointmentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  appointmentCard: {
    display: 'flex',
    gap: '16px',
    padding: '12px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    borderLeft: '3px solid #2563eb'
  },
  timeColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    minWidth: '60px'
  },
  time: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    marginTop: '4px',
    backgroundColor: '#10b981'
  },
  contentColumn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  patientRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  typeIcon: {
    fontSize: '14px'
  },
  patientName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937'
  },
  patientPhone: {
    fontSize: '12px',
    color: '#6b7280'
  },
  detailsRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  appointmentType: {
    fontSize: '12px',
    color: '#6b7280'
  },
  notes: {
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
    maxWidth: '150px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  actionColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
    fontWeight: '500'
  },
  checkInBtn: {
    padding: '4px 10px',
    backgroundColor: '#059669',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  confirmBtn: {
    padding: '4px 10px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  expandBtn: {
    width: '100%',
    padding: '10px',
    marginTop: '12px',
    backgroundColor: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#6b7280',
    cursor: 'pointer'
  }
}
