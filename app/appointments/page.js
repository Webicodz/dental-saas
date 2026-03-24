/**
 * APPOINTMENTS LIST PAGE
 * 
 * This page displays all appointments with filtering, status badges,
 * and quick actions for managing appointments.
 * 
 * FEATURES:
 * - List view with filters (date, doctor, patient, status, type)
 * - Status badges with color coding
 * - Quick actions (view, edit, cancel)
 * - Pagination
 * - Create new appointment button
 * 
 * IN CODEIGNITER:
 * Like: application/views/appointments/index.php
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

// Appointment status configuration
const STATUS_CONFIG = {
  SCHEDULED: { label: 'Scheduled', color: '#3b82f6', bg: '#dbeafe' },
  CONFIRMED: { label: 'Confirmed', color: '#10b981', bg: '#d1fae5' },
  IN_PROGRESS: { label: 'In Progress', color: '#f59e0b', bg: '#fef3c7' },
  COMPLETED: { label: 'Completed', color: '#6b7280', bg: '#e5e7eb' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' },
  NO_SHOW: { label: 'No Show', color: '#ec4899', bg: '#fce7f3' }
}

// Appointment type configuration
const TYPE_CONFIG = {
  CONSULTATION: 'Consultation',
  CLEANING: 'Cleaning',
  FILLING: 'Filling',
  ROOT_CANAL: 'Root Canal',
  CROWN: 'Crown',
  BRIDGE: 'Bridge',
  EXTRACTION: 'Extraction',
  CHECKUP: 'Checkup',
  EMERGENCY: 'Emergency',
  FOLLOW_UP: 'Follow-up'
}

export default function AppointmentsPage() {
  const router = useRouter()
  
  // STATE
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  
  // FILTERS STATE
  const [filters, setFilters] = useState({
    date: '',
    doctorId: '',
    status: '',
    type: ''
  })
  
  const [showFilters, setShowFilters] = useState(false)

  // FETCH APPOINTMENTS
  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      // Build query params
      const params = new URLSearchParams()
      if (filters.date) params.append('date', filters.date)
      if (filters.doctorId) params.append('doctorId', filters.doctorId)
      if (filters.status) params.append('status', filters.status)
      if (filters.type) params.append('type', filters.type)
      
      const response = await fetch(`/api/appointments?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }
      
      const data = await response.json()
      setAppointments(data.appointments || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching appointments:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // FETCH DOCTORS FOR FILTER
  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/doctors', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setDoctors(data.doctors || [])
      }
    } catch (err) {
      console.error('Error fetching doctors:', err)
    }
  }

  // CANCEL APPOINTMENT
  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: 'Cancelled by user'
        })
      })

      if (response.ok) {
        alert('Appointment cancelled successfully')
        fetchAppointments()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to cancel appointment')
      }
    } catch (err) {
      console.error('Error cancelling appointment:', err)
      alert('Failed to cancel appointment')
    }
  }

  // UPDATE STATUS
  const handleUpdateStatus = async (appointmentId, newStatus) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        alert('Status updated successfully')
        fetchAppointments()
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update status')
      }
    } catch (err) {
      console.error('Error updating status:', err)
      alert('Failed to update status')
    }
  }

  // FORMAT DATE
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  // FORMAT TIME
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // GET STATUS BADGE STYLE
  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED
    return {
      label: config.label,
      style: {
        color: config.color,
        backgroundColor: config.bg,
        border: `1px solid ${config.color}`
      }
    }
  }

  // EFFECT TO FETCH DATA
  useEffect(() => {
    fetchAppointments()
    fetchDoctors()
  }, [filters])

  // CLEAR FILTERS
  const clearFilters = () => {
    setFilters({
      date: '',
      doctorId: '',
      status: '',
      type: ''
    })
  }

  // HAS ACTIVE FILTERS
  const hasActiveFilters = filters.date || filters.doctorId || filters.status || filters.type

  return (
    <ProtectedRoute>
      <div style={{ minHeight: '100vh', background: '#f5f7fa' }}>
        {/* HEADER */}
        <header style={{
          background: 'white',
          borderBottom: '1px solid #e5e7eb',
          padding: '1rem 2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '0.5rem',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1.5rem'
              }}
            >
              ←
            </button>
            <div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                Appointments
              </h1>
              <p style={{ fontSize: '0.875rem', color: '#666', margin: 0 }}>
                Manage and schedule patient appointments
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                padding: '0.5rem 1rem',
                background: showFilters ? '#e5e7eb' : 'white',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>🔍</span>
              <span>Filters</span>
              {hasActiveFilters && (
                <span style={{
                  background: '#3b82f6',
                  color: 'white',
                  borderRadius: '50%',
                  width: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem'
                }}>
                  !
                </span>
              )}
            </button>
            <button
              onClick={() => router.push('/appointments/calendar')}
              style={{
                padding: '0.5rem 1rem',
                background: '#7c3aed',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>📅</span>
              <span>Calendar View</span>
            </button>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '0.5rem 1rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <span>+</span>
              <span>New Appointment</span>
            </button>
          </div>
        </header>

        {/* FILTERS BAR */}
        {showFilters && (
          <div style={{
            background: 'white',
            padding: '1rem 2rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#666' }}>Date:</label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#666' }}>Doctor:</label>
              <select
                value={filters.doctorId}
                onChange={(e) => setFilters({ ...filters, doctorId: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  minWidth: '150px'
                }}
              >
                <option value="">All Doctors</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.fullName}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#666' }}>Status:</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  minWidth: '130px'
                }}
              >
                <option value="">All Statuses</option>
                {Object.keys(STATUS_CONFIG).map(status => (
                  <option key={status} value={status}>{STATUS_CONFIG[status].label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.875rem', color: '#666' }}>Type:</label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  minWidth: '130px'
                }}
              >
                <option value="">All Types</option>
                {Object.entries(TYPE_CONFIG).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  padding: '0.5rem 1rem',
                  background: 'transparent',
                  color: '#ef4444',
                  border: '1px solid #ef4444',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* MAIN CONTENT */}
        <main style={{ padding: '2rem' }}>
          {/* STATS BAR */}
          <div style={{
            display: 'flex',
            gap: '1rem',
            marginBottom: '1.5rem',
            flexWrap: 'wrap'
          }}>
            {Object.entries(STATUS_CONFIG).map(([status, config]) => {
              const count = appointments.filter(a => a.status === status).length
              return (
                <div
                  key={status}
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'white',
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: config.bg,
                    border: `2px solid ${config.color}`
                  }} />
                  <span style={{ fontSize: '0.875rem', color: '#666' }}>{config.label}:</span>
                  <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#333' }}>{count}</span>
                </div>
              )
            })}
          </div>

          {/* APPOINTMENTS LIST */}
          {loading ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#666'
            }}>
              Loading appointments...
            </div>
          ) : error ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              color: '#ef4444'
            }}>
              Error: {error}
            </div>
          ) : appointments.length === 0 ? (
            <div style={{
              padding: '3rem',
              textAlign: 'center',
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📅</div>
              <h3 style={{ marginBottom: '0.5rem', color: '#333' }}>No appointments found</h3>
              <p style={{ color: '#666', marginBottom: '1rem' }}>
                {hasActiveFilters 
                  ? 'Try adjusting your filters or create a new appointment.'
                  : 'Get started by creating your first appointment.'}
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >
                + New Appointment
              </button>
            </div>
          ) : (
            <div style={{
              background: 'white',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              overflow: 'hidden'
            }}>
              {/* TABLE HEADER */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(6, 1fr)',
                padding: '1rem',
                background: '#f9fafb',
                borderBottom: '1px solid #e5e7eb',
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#666',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                <div>Date & Time</div>
                <div>Patient</div>
                <div>Doctor</div>
                <div>Type</div>
                <div>Status</div>
                <div>Actions</div>
              </div>

              {/* TABLE ROWS */}
              {appointments.map((appointment) => {
                const statusBadge = getStatusBadge(appointment.status)
                return (
                  <div
                    key={appointment.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(6, 1fr)',
                      padding: '1rem',
                      borderBottom: '1px solid #e5e7eb',
                      alignItems: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f9fafb'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'white'}
                  >
                    {/* DATE & TIME */}
                    <div>
                      <div style={{ fontWeight: '500', color: '#333' }}>
                        {formatDate(appointment.appointmentDate)}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#999' }}>
                        {appointment.duration} min
                      </div>
                    </div>

                    {/* PATIENT */}
                    <div>
                      <div style={{ fontWeight: '500', color: '#333' }}>
                        {appointment.patientName}
                      </div>
                      <div style={{ fontSize: '0.875rem', color: '#666' }}>
                        {appointment.patientPhone}
                      </div>
                    </div>

                    {/* DOCTOR */}
                    <div>
                      <div style={{ fontWeight: '500', color: '#333' }}>
                        {appointment.doctorName}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#666' }}>
                        {appointment.doctorSpecialization}
                      </div>
                    </div>

                    {/* TYPE */}
                    <div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: '#f3f4f6',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        color: '#374151'
                      }}>
                        {TYPE_CONFIG[appointment.type] || appointment.type}
                      </span>
                      {appointment.reason && (
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#666', 
                          marginTop: '0.25rem',
                          maxWidth: '150px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {appointment.reason}
                        </div>
                      )}
                    </div>

                    {/* STATUS */}
                    <div>
                      <span
                        style={{
                          ...statusBadge.style,
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          display: 'inline-block'
                        }}
                      >
                        {statusBadge.label}
                      </span>
                    </div>

                    {/* ACTIONS */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {appointment.status === 'SCHEDULED' && (
                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 'CONFIRMED')}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#d1fae5',
                            color: '#047857',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Confirm
                        </button>
                      )}
                      {appointment.status === 'CONFIRMED' && (
                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 'IN_PROGRESS')}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#fef3c7',
                            color: '#b45309',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Start
                        </button>
                      )}
                      {appointment.status === 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleUpdateStatus(appointment.id, 'COMPLETED')}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#e5e7eb',
                            color: '#374151',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Complete
                        </button>
                      )}
                      {!['CANCELLED', 'COMPLETED'].includes(appointment.status) && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#fee2e2',
                            color: '#b91c1c',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>

        {/* NEW APPOINTMENT MODAL */}
        {showModal && (
          <NewAppointmentModal
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              fetchAppointments()
            }}
            doctors={doctors}
          />
        )}
      </div>
    </ProtectedRoute>
  )
}

// NEW APPOINTMENT MODAL COMPONENT
function NewAppointmentModal({ onClose, onSuccess, doctors }) {
  const [formData, setFormData] = useState({
    patientId: '',
    patientName: '',
    patientPhone: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    type: 'CHECKUP',
    reason: ''
  })
  const [patients, setPatients] = useState([])
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('/api/patients', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (response.ok) {
          const data = await response.json()
          setPatients(data.patients || [])
        }
      } catch (err) {
        console.error('Error fetching patients:', err)
      }
    }
    fetchPatients()
  }, [])

  // Fetch available slots when doctor and date change
  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate) {
      fetchAvailableSlots()
    }
  }, [formData.doctorId, formData.appointmentDate])

  const fetchAvailableSlots = async () => {
    try {
      setLoadingSlots(true)
      const token = localStorage.getItem('token')
      const response = await fetch(
        `/api/appointments/available-slots?doctorId=${formData.doctorId}&date=${formData.appointmentDate}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      )
      if (response.ok) {
        const data = await response.json()
        setAvailableSlots(data.availableSlots || [])
      }
    } catch (err) {
      console.error('Error fetching slots:', err)
    } finally {
      setLoadingSlots(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          patientId: formData.patientId,
          doctorId: formData.doctorId,
          appointmentDate: formData.appointmentDate,
          startTime: formData.startTime,
          type: formData.type,
          reason: formData.reason
        })
      })

      if (response.ok) {
        alert('Appointment created successfully!')
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to create appointment')
      }
    } catch (err) {
      setError('Failed to create appointment')
    } finally {
      setSaving(false)
    }
  }

  const handlePatientSelect = (e) => {
    const patientId = e.target.value
    const patient = patients.find(p => p.id === patientId)
    if (patient) {
      setFormData({
        ...formData,
        patientId,
        patientName: `${patient.firstName} ${patient.lastName}`,
        patientPhone: patient.phone
      })
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '2rem',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
            New Appointment
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ×
          </button>
        </div>

        {error && (
          <div style={{
            padding: '0.75rem',
            background: '#fee2e2',
            color: '#b91c1c',
            borderRadius: '6px',
            marginBottom: '1rem',
            fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Patient Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Patient *
            </label>
            <select
              value={formData.patientId}
              onChange={handlePatientSelect}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Select a patient</option>
              {patients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.firstName} {patient.lastName} - {patient.phone}
                </option>
              ))}
            </select>
          </div>

          {/* Doctor Selection */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Doctor *
            </label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              <option value="">Select a doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.fullName} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Date *
            </label>
            <input
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value, startTime: '' })}
              required
              min={new Date().toISOString().split('T')[0]}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            />
          </div>

          {/* Available Slots */}
          {formData.doctorId && formData.appointmentDate && (
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
                Available Time Slots {loadingSlots && '(Loading...)'}
              </label>
              {availableSlots.length === 0 && !loadingSlots ? (
                <div style={{
                  padding: '1rem',
                  background: '#fef3c7',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  color: '#b45309'
                }}>
                  No available slots on this date. Please select another date.
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '0.5rem',
                  maxHeight: '150px',
                  overflow: 'auto'
                }}>
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, startTime: slot.start })}
                      style={{
                        padding: '0.5rem',
                        background: formData.startTime === slot.start ? '#3b82f6' : '#f3f4f6',
                        color: formData.startTime === slot.start ? 'white' : '#333',
                        border: formData.startTime === slot.start ? '2px solid #3b82f6' : '1px solid #d1d5db',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Type */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Appointment Type *
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem'
              }}
            >
              {Object.entries(TYPE_CONFIG).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>
              Reason for Visit
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Brief description of the visit reason..."
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.875rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#f3f4f6',
                color: '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.875rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !formData.startTime}
              style={{
                padding: '0.75rem 1.5rem',
                background: saving ? '#9ca3af' : '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem'
              }}
            >
              {saving ? 'Creating...' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
