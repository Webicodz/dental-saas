/**
 * DOCTOR PROFILE PAGE
 * 
 * Displays detailed information about a specific doctor.
 * Includes their schedule, statistics, and contact information.
 * 
 * IN CODEIGNITER:
 * Like: application/views/doctors/profile.php
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

// Specialization colors
const SPECIALIZATION_COLORS = {
  'General Dentistry': { bg: '#dbeafe', color: '#2563eb' },
  'Orthodontics': { bg: '#fce7f3', color: '#db2777' },
  'Endodontics': { bg: '#fef3c7', color: '#d97706' },
  'Periodontics': { bg: '#d1fae5', color: '#059669' },
  'Prosthodontics': { bg: '#ede9fe', color: '#7c3aed' },
  'Oral Surgery': { bg: '#fee2e2', color: '#dc2626' },
  'Pediatric Dentistry': { bg: '#e0e7ff', color: '#4f46e5' },
  'Cosmetic Dentistry': { bg: '#fdf2f8', color: '#ec4899' }
}

export default function DoctorProfilePage() {
  const params = useParams()
  const doctorId = params.id
  
  const [user, setUser] = useState(null)
  const [doctor, setDoctor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isOwnProfile, setIsOwnProfile] = useState(false)
  const [editMode, setEditMode] = useState(false)
  
  // Edit form state
  const [formData, setFormData] = useState({})
  const [saving, setSaving] = useState(false)

  const router = useRouter()

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        
        if (!data.success) {
          router.push('/login')
          return
        }
        
        setUser(data.user)
        setIsOwnProfile(data.user.role === 'DOCTOR' && data.user.doctor?.id === doctorId)
        fetchDoctor()
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router, doctorId])

  // Fetch doctor profile
  const fetchDoctor = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const res = await fetch(`/api/doctors/${doctorId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.success) {
        setDoctor(data.doctor)
        setFormData({
          firstName: data.doctor.firstName,
          lastName: data.doctor.lastName,
          phone: data.doctor.phone,
          specialization: data.doctor.specialization,
          licenseNumber: data.doctor.licenseNumber,
          qualification: data.doctor.qualification,
          experience: data.doctor.experience,
          consultationFee: data.doctor.consultationFee,
          bio: data.doctor.bio,
          workingDays: data.doctor.workingDays?.raw || [],
          workingHours: data.doctor.workingHours || { start: '09:00', end: '17:00' }
        })
      } else {
        setError(data.error)
      }
    } catch (err) {
      console.error('Fetch doctor error:', err)
      setError('Failed to fetch doctor profile')
    } finally {
      setLoading(false)
    }
  }

  // Save profile changes
  const saveProfile = async () => {
    try {
      setSaving(true)
      const token = localStorage.getItem('token')
      
      const res = await fetch(`/api/doctors/${doctorId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setDoctor({ ...doctor, ...data.doctor })
        setEditMode(false)
      } else {
        alert(data.error || 'Failed to save')
      }
    } catch (err) {
      console.error('Save profile error:', err)
      alert('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  // Handle form changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  // Toggle working day
  const toggleWorkingDay = (day) => {
    const days = formData.workingDays || []
    if (days.includes(day)) {
      handleChange('workingDays', days.filter(d => d !== day))
    } else {
      handleChange('workingDays', [...days, day])
    }
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading doctor profile...</p>
        </div>
      </ProtectedRoute>
    )
  }

  if (error || !doctor) {
    return (
      <ProtectedRoute>
        <div style={styles.errorContainer}>
          <h2>Doctor Not Found</h2>
          <p>{error || 'The requested doctor profile could not be found.'}</p>
          <button style={styles.backBtn} onClick={() => router.push('/doctors')}>
            ← Back to Doctors
          </button>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div style={styles.container}>
        {/* Back Button */}
        <button style={styles.backLink} onClick={() => router.push('/doctors')}>
          ← Back to Doctors
        </button>

        {/* Profile Header */}
        <div style={styles.profileHeader}>
          <div style={styles.headerLeft}>
            <div style={styles.avatar}>
              {doctor.firstName?.[0]}{doctor.lastName?.[0]}
            </div>
            <div style={styles.headerInfo}>
              <h1 style={styles.name}>{doctor.fullName}</h1>
              <span style={{
                ...styles.specializationBadge,
                backgroundColor: SPECIALIZATION_COLORS[doctor.specialization]?.bg || '#f3f4f6',
                color: SPECIALIZATION_COLORS[doctor.specialization]?.color || '#6b7280'
              }}>
                {doctor.specialization}
              </span>
              <div style={styles.statusRow}>
                <span style={{
                  ...styles.statusDot,
                  backgroundColor: doctor.isActive ? '#059669' : '#6b7280'
                }}></span>
                <span style={styles.statusText}>
                  {doctor.isActive ? 'Accepting Patients' : 'Not Available'}
                </span>
              </div>
            </div>
          </div>
          
          {(isOwnProfile || user?.role === 'ADMIN') && !editMode && (
            <button style={styles.editBtn} onClick={() => setEditMode(true)}>
              ✏️ Edit Profile
            </button>
          )}
        </div>

        <div style={styles.content}>
          {/* Left Column - Profile Details */}
          <div style={styles.mainColumn}>
            {/* Bio Section */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>About</h2>
              {editMode ? (
                <div style={styles.editForm}>
                  <textarea
                    value={formData.bio || ''}
                    onChange={(e) => handleChange('bio', e.target.value)}
                    placeholder="Write a brief bio about yourself..."
                    style={styles.textarea}
                    rows={4}
                  />
                </div>
              ) : (
                <p style={styles.bio}>
                  {doctor.bio || 'No bio available.'}
                </p>
              )}
            </div>

            {/* Professional Details */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Professional Details</h2>
              {editMode ? (
                <div style={styles.editGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Qualification</label>
                    <input
                      type="text"
                      value={formData.qualification || ''}
                      onChange={(e) => handleChange('qualification', e.target.value)}
                      placeholder="e.g., DDS, DMD"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>License Number</label>
                    <input
                      type="text"
                      value={formData.licenseNumber || ''}
                      onChange={(e) => handleChange('licenseNumber', e.target.value)}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Years of Experience</label>
                    <input
                      type="number"
                      value={formData.experience || ''}
                      onChange={(e) => handleChange('experience', e.target.value)}
                      min="0"
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Consultation Fee ($)</label>
                    <input
                      type="number"
                      value={formData.consultationFee || ''}
                      onChange={(e) => handleChange('consultationFee', e.target.value)}
                      min="0"
                      step="0.01"
                      style={styles.input}
                    />
                  </div>
                </div>
              ) : (
                <div style={styles.detailsGrid}>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Qualification</span>
                    <span style={styles.detailValue}>
                      {doctor.qualification || 'Not specified'}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>License Number</span>
                    <span style={styles.detailValue}>
                      {doctor.licenseNumber || 'Not specified'}
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Experience</span>
                    <span style={styles.detailValue}>
                      {doctor.experience 
                        ? `${doctor.experience} years` 
                        : 'Not specified'
                      }
                    </span>
                  </div>
                  <div style={styles.detailItem}>
                    <span style={styles.detailLabel}>Consultation Fee</span>
                    <span style={styles.detailValueHighlight}>
                      {doctor.consultationFee 
                        ? `$${doctor.consultationFee}` 
                        : 'Not set'
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Schedule Section */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Weekly Schedule</h2>
              {editMode ? (
                <div style={styles.scheduleEditor}>
                  <div style={styles.daysGrid}>
                    {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
                      <button
                        key={day}
                        style={{
                          ...styles.dayBtn,
                          ...(formData.workingDays?.includes(day) ? styles.dayBtnActive : {})
                        }}
                        onClick={() => toggleWorkingDay(day)}
                      >
                        {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                      </button>
                    ))}
                  </div>
                  <div style={styles.timeInputs}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Start Time</label>
                      <input
                        type="time"
                        value={formData.workingHours?.start || '09:00'}
                        onChange={(e) => handleChange('workingHours', { 
                          ...formData.workingHours, 
                          start: e.target.value 
                        })}
                        style={styles.input}
                      />
                    </div>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>End Time</label>
                      <input
                        type="time"
                        value={formData.workingHours?.end || '17:00'}
                        onChange={(e) => handleChange('workingHours', { 
                          ...formData.workingHours, 
                          end: e.target.value 
                        })}
                        style={styles.input}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div style={styles.scheduleDisplay}>
                  <div style={styles.workingDays}>
                    {doctor.workingDays?.full?.map((day, i) => (
                      <span key={day} style={styles.dayChip}>
                        {doctor.workingDays?.abbreviations?.[i] || day}
                      </span>
                    )) || 'Mon - Fri'}
                  </div>
                  <div style={styles.workingHours}>
                    {doctor.workingHours?.start || '09:00'} - {doctor.workingHours?.end || '17:00'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats & Contact */}
          <div style={styles.sideColumn}>
            {/* Contact Info */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Contact Information</h2>
              {editMode ? (
                <div style={styles.editForm}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Phone</label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleChange('phone', e.target.value)}
                      style={styles.input}
                    />
                  </div>
                </div>
              ) : (
                <div style={styles.contactList}>
                  <div style={styles.contactItem}>
                    <span style={styles.contactIcon}>📧</span>
                    <span style={styles.contactText}>{doctor.email}</span>
                  </div>
                  {doctor.phone && (
                    <div style={styles.contactItem}>
                      <span style={styles.contactIcon}>📞</span>
                      <span style={styles.contactText}>{doctor.phone}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Statistics */}
            <div style={styles.card}>
              <h2 style={styles.cardTitle}>Statistics</h2>
              <div style={styles.statsGrid}>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{doctor.statistics?.totalPatients || 0}</span>
                  <span style={styles.statLabel}>Total Patients</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{doctor.statistics?.totalAppointments || 0}</span>
                  <span style={styles.statLabel}>Appointments</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{doctor.statistics?.monthlyAppointments || 0}</span>
                  <span style={styles.statLabel}>This Month</span>
                </div>
                <div style={styles.statItem}>
                  <span style={styles.statNumber}>{doctor.statistics?.todayAppointments || 0}</span>
                  <span style={styles.statLabel}>Today</span>
                </div>
              </div>
            </div>

            {/* Clinic Info */}
            {doctor.clinic && (
              <div style={styles.card}>
                <h2 style={styles.cardTitle}>Clinic</h2>
                <div style={styles.clinicInfo}>
                  <span style={styles.clinicName}>{doctor.clinic.name}</span>
                  <span style={styles.clinicTimezone}>{doctor.clinic.timezone}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Edit Mode Actions */}
        {editMode && (
          <div style={styles.editActions}>
            <button 
              style={styles.cancelBtn}
              onClick={() => {
                setEditMode(false)
                // Reset form
                fetchDoctor()
              }}
            >
              Cancel
            </button>
            <button 
              style={styles.saveBtn}
              onClick={saveProfile}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

// Styles
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1100px',
    margin: '0 auto'
  },
  backLink: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '14px',
    cursor: 'pointer',
    marginBottom: '24px',
    padding: 0
  },
  profileHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '32px',
    padding: '24px',
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  headerLeft: {
    display: 'flex',
    gap: '24px',
    alignItems: 'flex-start'
  },
  avatar: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: '600'
  },
  headerInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  name: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  specializationBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '13px',
    fontWeight: '500',
    width: 'fit-content'
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginTop: '4px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%'
  },
  statusText: {
    fontSize: '13px',
    color: '#6b7280'
  },
  editBtn: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 350px',
    gap: '24px'
  },
  mainColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  sideColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px'
  },
  bio: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: 1.6,
    margin: 0
  },
  editForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  editGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  detailItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  detailLabel: {
    fontSize: '12px',
    color: '#6b7280'
  },
  detailValue: {
    fontSize: '14px',
    color: '#1f2937'
  },
  detailValueHighlight: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#059669'
  },
  scheduleEditor: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  daysGrid: {
    display: 'flex',
    gap: '8px'
  },
  dayBtn: {
    width: '44px',
    height: '44px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6b7280'
  },
  dayBtnActive: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    color: 'white'
  },
  timeInputs: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  scheduleDisplay: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  workingDays: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  dayChip: {
    padding: '4px 12px',
    backgroundColor: '#f3f4f6',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151'
  },
  workingHours: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#1f2937'
  },
  contactList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  contactItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  contactIcon: {
    fontSize: '16px'
  },
  contactText: {
    fontSize: '14px',
    color: '#374151'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  statItem: {
    textAlign: 'center',
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  statNumber: {
    display: 'block',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937'
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  clinicInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  clinicName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937'
  },
  clinicTimezone: {
    fontSize: '13px',
    color: '#6b7280'
  },
  editActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
    padding: '16px 24px',
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cancelBtn: {
    padding: '12px 24px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  saveBtn: {
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  loadingContainer: {
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
  errorContainer: {
    padding: '60px',
    textAlign: 'center',
    color: '#6b7280'
  },
  backBtn: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    marginTop: '16px'
  }
}
