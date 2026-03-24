/**
 * APPOINTMENT MODAL COMPONENT
 * 
 * A reusable modal for creating and editing appointments.
 * Includes patient selector, doctor selector, date/time pickers,
 * type selector, and slot availability checking.
 * 
 * USAGE:
 * <AppointmentModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSuccess={() => {
 *     setShowModal(false)
 *     refreshAppointments()
 *   }}
 *   appointment={existingAppointment} // Optional for edit mode
 * />
 */

'use client'

import { useState, useEffect } from 'react'

// Appointment types
const APPOINTMENT_TYPES = [
  { value: 'CONSULTATION', label: 'Consultation', duration: 30 },
  { value: 'CLEANING', label: 'Cleaning', duration: 45 },
  { value: 'FILLING', label: 'Filling', duration: 60 },
  { value: 'ROOT_CANAL', label: 'Root Canal', duration: 90 },
  { value: 'CROWN', label: 'Crown', duration: 60 },
  { value: 'BRIDGE', label: 'Bridge', duration: 90 },
  { value: 'EXTRACTION', label: 'Extraction', duration: 45 },
  { value: 'CHECKUP', label: 'Checkup', duration: 30 },
  { value: 'EMERGENCY', label: 'Emergency', duration: 30 },
  { value: 'FOLLOW_UP', label: 'Follow-up', duration: 15 }
]

// Status options
const STATUS_OPTIONS = [
  { value: 'SCHEDULED', label: 'Scheduled', color: '#3b82f6' },
  { value: 'CONFIRMED', label: 'Confirmed', color: '#10b981' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#f59e0b' },
  { value: 'COMPLETED', label: 'Completed', color: '#6b7280' },
  { value: 'CANCELLED', label: 'Cancelled', color: '#ef4444' },
  { value: 'NO_SHOW', label: 'No Show', color: '#ec4899' }
]

export default function AppointmentModal({
  isOpen,
  onClose,
  onSuccess,
  appointment = null, // If provided, modal is in edit mode
  doctors = [],
  patients = []
}) {
  const isEditMode = !!appointment

  // Form state
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    appointmentDate: '',
    startTime: '',
    type: 'CHECKUP',
    status: 'SCHEDULED',
    reason: '',
    notes: ''
  })

  // UI state
  const [availableSlots, setAvailableSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredPatients, setFilteredPatients] = useState(patients)

  // Filter patients based on search
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      setFilteredPatients(patients.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.phone?.includes(query) ||
        p.email?.toLowerCase().includes(query)
      ))
    } else {
      setFilteredPatients(patients)
    }
  }, [searchQuery, patients])

  // Initialize form data for edit mode
  useEffect(() => {
    if (appointment && isEditMode) {
      setFormData({
        patientId: appointment.patientId || '',
        doctorId: appointment.doctorId || '',
        appointmentDate: new Date(appointment.appointmentDate).toISOString().split('T')[0],
        startTime: appointment.startTime || '',
        type: appointment.type || 'CHECKUP',
        status: appointment.status || 'SCHEDULED',
        reason: appointment.reason || '',
        notes: appointment.notes || ''
      })
    } else {
      // Reset form for create mode
      setFormData({
        patientId: '',
        doctorId: doctors[0]?.id || '',
        appointmentDate: new Date().toISOString().split('T')[0],
        startTime: '',
        type: 'CHECKUP',
        status: 'SCHEDULED',
        reason: '',
        notes: ''
      })
    }
  }, [appointment, isEditMode, doctors])

  // Fetch available slots when doctor and date change
  useEffect(() => {
    if (formData.doctorId && formData.appointmentDate && !isEditMode) {
      fetchAvailableSlots()
    }
  }, [formData.doctorId, formData.appointmentDate, isEditMode])

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
      const url = isEditMode 
        ? `/api/appointments/${appointment.id}` 
        : '/api/appointments'
      
      const method = isEditMode ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      } else {
        const data = await response.json()
        setError(data.error || `Failed to ${isEditMode ? 'update' : 'create'} appointment`)
      }
    } catch (err) {
      setError(`Failed to ${isEditMode ? 'update' : 'create'} appointment`)
    } finally {
      setSaving(false)
    }
  }

  const handlePatientSelect = (patient) => {
    setFormData({
      ...formData,
      patientId: patient.id
    })
    setSearchQuery(`${patient.firstName} ${patient.lastName}`)
  }

  const getSelectedTypeDuration = () => {
    const type = APPOINTMENT_TYPES.find(t => t.value === formData.type)
    return type?.duration || 30
  }

  if (!isOpen) return null

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <h2 style={styles.title}>
            {isEditMode ? 'Edit Appointment' : 'New Appointment'}
          </h2>
          <button onClick={onClose} style={styles.closeButton}>
            ×
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Patient Selection */}
          {!isEditMode && (
            <div style={styles.field}>
              <label style={styles.label}>
                Patient <span style={styles.required}>*</span>
              </label>
              <div style={styles.patientSearchContainer}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patient by name or phone..."
                  style={styles.input}
                />
                {searchQuery && filteredPatients.length > 0 && (
                  <div style={styles.patientDropdown}>
                    {filteredPatients.slice(0, 5).map(patient => (
                      <div
                        key={patient.id}
                        onClick={() => handlePatientSelect(patient)}
                        style={styles.patientOption}
                      >
                        <div style={styles.patientName}>
                          {patient.firstName} {patient.lastName}
                        </div>
                        <div style={styles.patientDetails}>
                          {patient.phone}
                          {patient.email && ` • ${patient.email}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {searchQuery && filteredPatients.length === 0 && (
                  <div style={styles.patientDropdown}>
                    <div style={styles.noPatients}>No patients found</div>
                  </div>
                )}
              </div>
              {formData.patientId && (
                <div style={styles.selectedPatient}>
                  ✓ Selected: {patients.find(p => p.id === formData.patientId)?.firstName} {' '}
                  {patients.find(p => p.id === formData.patientId)?.lastName}
                </div>
              )}
            </div>
          )}

          {/* Doctor Selection */}
          <div style={styles.field}>
            <label style={styles.label}>
              Doctor <span style={styles.required}>*</span>
            </label>
            <select
              value={formData.doctorId}
              onChange={(e) => setFormData({ ...formData, doctorId: e.target.value, startTime: '' })}
              required
              style={styles.select}
            >
              <option value="">Select a doctor</option>
              {doctors.map(doctor => (
                <option key={doctor.id} value={doctor.id}>
                  {doctor.fullName} - {doctor.specialization}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selection */}
          <div style={styles.field}>
            <label style={styles.label}>
              Date <span style={styles.required}>*</span>
            </label>
            <input
              type="date"
              value={formData.appointmentDate}
              onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value, startTime: '' })}
              required
              min={new Date().toISOString().split('T')[0]}
              style={styles.input}
            />
          </div>

          {/* Available Slots */}
          {formData.doctorId && formData.appointmentDate && (
            <div style={styles.field}>
              <label style={styles.label}>
                Available Time
                {loadingSlots && <span style={styles.loading}> (Loading...)</span>}
                <span style={styles.duration}> • {getSelectedTypeDuration()} min</span>
              </label>
              {availableSlots.length === 0 && !loadingSlots ? (
                <div style={styles.noSlots}>
                  No available slots on this date. Please select another date.
                </div>
              ) : (
                <div style={styles.slotsGrid}>
                  {availableSlots.map((slot, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setFormData({ ...formData, startTime: slot.start })}
                      style={{
                        ...styles.slotButton,
                        ...(formData.startTime === slot.start ? styles.slotButtonSelected : {})
                      }}
                    >
                      {slot.start}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Appointment Type */}
          <div style={styles.field}>
            <label style={styles.label}>
              Appointment Type <span style={styles.required}>*</span>
            </label>
            <div style={styles.typeGrid}>
              {APPOINTMENT_TYPES.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: type.value })}
                  style={{
                    ...styles.typeButton,
                    ...(formData.type === type.value ? styles.typeButtonSelected : {})
                  }}
                >
                  <div style={styles.typeLabel}>{type.label}</div>
                  <div style={styles.typeDuration}>{type.duration} min</div>
                </button>
              ))}
            </div>
          </div>

          {/* Status (Edit Mode Only) */}
          {isEditMode && (
            <div style={styles.field}>
              <label style={styles.label}>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                style={styles.select}
              >
                {STATUS_OPTIONS.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Reason */}
          <div style={styles.field}>
            <label style={styles.label}>Reason for Visit</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Brief description of the visit reason..."
              rows={2}
              style={styles.textarea}
            />
          </div>

          {/* Notes */}
          <div style={styles.field}>
            <label style={styles.label}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
              rows={2}
              style={styles.textarea}
            />
          </div>

          {/* Actions */}
          <div style={styles.actions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (!isEditMode && (!formData.patientId || !formData.startTime))}
              style={{
                ...styles.submitButton,
                opacity: saving || (!isEditMode && (!formData.patientId || !formData.startTime)) ? 0.6 : 1
              }}
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Appointment' : 'Create Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Styles
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '550px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.5rem',
    borderBottom: '1px solid #e5e7eb'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 'bold',
    color: '#111827'
  },
  closeButton: {
    background: 'transparent',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '0',
    lineHeight: 1
  },
  error: {
    margin: '1rem 1.5rem 0',
    padding: '0.75rem',
    background: '#fee2e2',
    color: '#b91c1c',
    borderRadius: '6px',
    fontSize: '0.875rem'
  },
  form: {
    padding: '1.5rem'
  },
  field: {
    marginBottom: '1.25rem'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  required: {
    color: '#ef4444'
  },
  loading: {
    color: '#6b7280',
    fontWeight: 'normal'
  },
  duration: {
    color: '#6b7280',
    fontWeight: 'normal',
    fontSize: '0.75rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    background: 'white',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '0.875rem',
    resize: 'vertical',
    fontFamily: 'inherit',
    boxSizing: 'border-box'
  },
  patientSearchContainer: {
    position: 'relative'
  },
  patientDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
    maxHeight: '200px',
    overflow: 'auto'
  },
  patientOption: {
    padding: '0.75rem',
    cursor: 'pointer',
    borderBottom: '1px solid #e5e7eb'
  },
  patientName: {
    fontWeight: '500',
    color: '#111827'
  },
  patientDetails: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  noPatients: {
    padding: '0.75rem',
    color: '#6b7280',
    fontSize: '0.875rem'
  },
  selectedPatient: {
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: '#d1fae5',
    color: '#047857',
    borderRadius: '4px',
    fontSize: '0.75rem'
  },
  noSlots: {
    padding: '1rem',
    background: '#fef3c7',
    color: '#b45309',
    borderRadius: '6px',
    fontSize: '0.875rem'
  },
  slotsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '0.5rem',
    maxHeight: '150px',
    overflow: 'auto',
    padding: '0.25rem'
  },
  slotButton: {
    padding: '0.5rem',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    color: '#374151',
    transition: 'all 0.2s'
  },
  slotButtonSelected: {
    background: '#3b82f6',
    border: '2px solid #3b82f6',
    color: 'white'
  },
  typeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem'
  },
  typeButton: {
    padding: '0.75rem',
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s'
  },
  typeButtonSelected: {
    background: '#dbeafe',
    border: '2px solid #3b82f6'
  },
  typeLabel: {
    fontWeight: '500',
    color: '#111827',
    fontSize: '0.875rem'
  },
  typeDuration: {
    fontSize: '0.75rem',
    color: '#6b7280'
  },
  actions: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'flex-end',
    marginTop: '1.5rem',
    paddingTop: '1rem',
    borderTop: '1px solid #e5e7eb'
  },
  cancelButton: {
    padding: '0.75rem 1.5rem',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500'
  },
  submitButton: {
    padding: '0.75rem 1.5rem',
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500'
  }
}
