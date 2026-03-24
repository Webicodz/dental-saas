/**
 * APPOINTMENT CARD COMPONENT
 * 
 * A reusable card component for displaying appointment information
 * in list views. Shows patient info, doctor, time, status, and quick actions.
 * 
 * USAGE:
 * <AppointmentCard
 *   appointment={appointmentData}
 *   onStatusChange={(newStatus) => handleStatusChange(newStatus)}
 *   onCancel={() => handleCancel()}
 *   onClick={() => handleClick()}
 * />
 */

'use client'

import { useState } from 'react'

// Status configuration
const STATUS_CONFIG = {
  SCHEDULED: {
    label: 'Scheduled',
    color: '#3b82f6',
    bg: '#dbeafe',
    icon: '📅',
    actions: ['Confirm', 'Cancel']
  },
  CONFIRMED: {
    label: 'Confirmed',
    color: '#10b981',
    bg: '#d1fae5',
    icon: '✓',
    actions: ['Start', 'Cancel']
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#f59e0b',
    bg: '#fef3c7',
    icon: '⏳',
    actions: ['Complete', 'Cancel']
  },
  COMPLETED: {
    label: 'Completed',
    color: '#6b7280',
    bg: '#e5e7eb',
    icon: '✅',
    actions: []
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#ef4444',
    bg: '#fee2e2',
    icon: '✕',
    actions: []
  },
  NO_SHOW: {
    label: 'No Show',
    color: '#ec4899',
    bg: '#fce7f3',
    icon: '⚠',
    actions: ['Reschedule']
  }
}

// Type configuration
const TYPE_CONFIG = {
  CONSULTATION: { label: 'Consultation', icon: '💬', color: '#4338ca' },
  CLEANING: { label: 'Cleaning', icon: '✨', color: '#047857' },
  FILLING: { label: 'Filling', icon: '🛠️', color: '#b45309' },
  ROOT_CANAL: { label: 'Root Canal', icon: '🦷', color: '#b91c1c' },
  CROWN: { label: 'Crown', icon: '👑', color: '#be185d' },
  BRIDGE: { label: 'Bridge', icon: '🌉', color: '#7c3aed' },
  EXTRACTION: { label: 'Extraction', icon: '🔧', color: '#c2410c' },
  CHECKUP: { label: 'Checkup', icon: '🔍', color: '#0369a1' },
  EMERGENCY: { label: 'Emergency', icon: '🚨', color: '#dc2626' },
  FOLLOW_UP: { label: 'Follow-up', icon: '📝', color: '#475569' }
}

export default function AppointmentCard({
  appointment,
  onStatusChange,
  onCancel,
  onClick,
  compact = false
}) {
  const [showActions, setShowActions] = useState(false)

  const statusConfig = STATUS_CONFIG[appointment.status] || STATUS_CONFIG.SCHEDULED
  const typeConfig = TYPE_CONFIG[appointment.type] || TYPE_CONFIG.CHECKUP

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format time
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Get next status action
  const getNextStatus = () => {
    if (appointment.status === 'SCHEDULED') return 'CONFIRMED'
    if (appointment.status === 'CONFIRMED') return 'IN_PROGRESS'
    if (appointment.status === 'IN_PROGRESS') return 'COMPLETED'
    return null
  }

  const nextStatus = getNextStatus()
  const canModify = !['CANCELLED', 'COMPLETED'].includes(appointment.status)

  // Compact mode styles
  if (compact) {
    return (
      <div style={compactStyles.card} onClick={onClick}>
        <div style={compactStyles.timeColumn}>
          <div style={compactStyles.time}>
            {formatTime(appointment.startTime)}
          </div>
          <div style={compactStyles.duration}>
            {appointment.duration}m
          </div>
        </div>
        
        <div style={compactStyles.content}>
          <div style={compactStyles.header}>
            <span style={compactStyles.patientName}>
              {appointment.patientName}
            </span>
            <span style={{
              ...compactStyles.status,
              background: statusConfig.bg,
              color: statusConfig.color
            }}>
              {statusConfig.icon} {statusConfig.label}
            </span>
          </div>
          
          <div style={compactStyles.details}>
            <span style={compactStyles.detail}>
              {typeConfig.icon} {typeConfig.label}
            </span>
            <span style={compactStyles.detail}>
              👨‍⚕️ {appointment.doctorName}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Full mode styles
  return (
    <div style={styles.card} onClick={onClick}>
      {/* Left Status Bar */}
      <div style={{
        ...styles.statusBar,
        background: statusConfig.color
      }} />

      {/* Main Content */}
      <div style={styles.content}>
        {/* Header Row */}
        <div style={styles.header}>
          {/* Patient Info */}
          <div style={styles.patientInfo}>
            <div style={styles.avatar}>
              {appointment.patientName?.charAt(0) || '?'}
            </div>
            <div>
              <div style={styles.patientName}>
                {appointment.patientName}
              </div>
              <div style={styles.patientPhone}>
                {appointment.patientPhone || appointment.patientEmail}
              </div>
            </div>
          </div>

          {/* Status Badge */}
          <span style={{
            ...styles.statusBadge,
            background: statusConfig.bg,
            color: statusConfig.color
          }}>
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>

        {/* Details Row */}
        <div style={styles.details}>
          {/* Date & Time */}
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>📅</span>
            <span style={styles.detailText}>
              {formatDate(appointment.appointmentDate)}
            </span>
          </div>
          
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>🕐</span>
            <span style={styles.detailText}>
              {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
            </span>
          </div>

          {/* Duration */}
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>⏱️</span>
            <span style={styles.detailText}>
              {appointment.duration} min
            </span>
          </div>
        </div>

        {/* Second Row */}
        <div style={styles.details}>
          {/* Type */}
          <div style={{
            ...styles.typeBadge,
            background: `${typeConfig.color}15`,
            color: typeConfig.color
          }}>
            {typeConfig.icon} {typeConfig.label}
          </div>

          {/* Doctor */}
          <div style={styles.detailItem}>
            <span style={styles.detailIcon}>👨‍⚕️</span>
            <span style={styles.detailText}>
              {appointment.doctorName}
            </span>
          </div>
        </div>

        {/* Reason (if present) */}
        {appointment.reason && (
          <div style={styles.reason}>
            <span style={styles.reasonLabel}>Reason:</span>
            <span style={styles.reasonText}>{appointment.reason}</span>
          </div>
        )}

        {/* Actions Row */}
        <div style={styles.actions}>
          {canModify && (
            <>
              {nextStatus && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange?.(nextStatus)
                  }}
                  style={{
                    ...styles.actionButton,
                    ...styles.primaryAction,
                    background: STATUS_CONFIG[nextStatus].bg,
                    color: STATUS_CONFIG[nextStatus].color
                  }}
                >
                  {nextStatus === 'CONFIRMED' && '✓ '}
                  {nextStatus === 'IN_PROGRESS' && '▶ '}
                  {nextStatus === 'COMPLETED' && '✓ '}
                  {STATUS_CONFIG[nextStatus].label}
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel?.()
                }}
                style={{
                  ...styles.actionButton,
                  ...styles.cancelAction
                }}
              >
                ✕ Cancel
              </button>
            </>
          )}
          
          {appointment.status === 'NO_SHOW' && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onStatusChange?.('SCHEDULED')
              }}
              style={{
                ...styles.actionButton,
                ...styles.primaryAction,
                background: '#dbeafe',
                color: '#3b82f6'
              }}
            >
              🔄 Reschedule
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowActions(!showActions)
            }}
            style={styles.moreButton}
          >
            ⋮
          </button>
        </div>
      </div>
    </div>
  )
}

// Compact styles
const compactStyles = {
  card: {
    display: 'flex',
    gap: '0.75rem',
    padding: '0.75rem',
    background: 'white',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  timeColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '60px',
    padding: '0.5rem',
    background: '#f9fafb',
    borderRadius: '6px'
  },
  time: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: '#111827'
  },
  duration: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  patientName: {
    fontWeight: '600',
    fontSize: '0.875rem',
    color: '#111827'
  },
  status: {
    padding: '0.125rem 0.5rem',
    borderRadius: '9999px',
    fontSize: '0.625rem',
    fontWeight: '500'
  },
  details: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap'
  },
  detail: {
    fontSize: '0.75rem',
    color: '#6b7280'
  }
}

// Full styles
const styles = {
  card: {
    display: 'flex',
    background: 'white',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
  },
  statusBar: {
    width: '4px'
  },
  content: {
    flex: 1,
    padding: '1rem'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '0.75rem'
  },
  patientInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  patientName: {
    fontWeight: '600',
    fontSize: '1rem',
    color: '#111827'
  },
  patientPhone: {
    fontSize: '0.875rem',
    color: '#6b7280'
  },
  statusBadge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  details: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    marginBottom: '0.5rem'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.375rem'
  },
  detailIcon: {
    fontSize: '0.875rem'
  },
  detailText: {
    fontSize: '0.875rem',
    color: '#374151'
  },
  typeBadge: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.25rem'
  },
  reason: {
    fontSize: '0.875rem',
    color: '#6b7280',
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: '#f9fafb',
    borderRadius: '4px'
  },
  reasonLabel: {
    fontWeight: '500',
    color: '#374151'
  },
  reasonText: {
    marginLeft: '0.5rem'
  },
  actions: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
    paddingTop: '0.75rem',
    borderTop: '1px solid #e5e7eb'
  },
  actionButton: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    fontSize: '0.75rem',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  primaryAction: {},
  cancelAction: {
    background: '#fee2e2',
    color: '#b91c1c'
  },
  moreButton: {
    marginLeft: 'auto',
    padding: '0.5rem 0.75rem',
    background: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'pointer'
  }
}
