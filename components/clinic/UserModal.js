/**
 * USER MODAL COMPONENT
 * 
 * Modal form for creating and editing clinic users.
 * Includes role selection and doctor-specific fields.
 * 
 * IN CODEIGNITER:
 * Like: application/views/modals/user_form.php
 */

'use client'

import { useState, useEffect } from 'react'

// Specialization options
const SPECIALIZATIONS = [
  'General Dentistry',
  'Orthodontics',
  'Endodontics',
  'Periodontics',
  'Prosthodontics',
  'Oral Surgery',
  'Pediatric Dentistry',
  'Cosmetic Dentistry'
]

export default function UserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'RECEPTIONIST',
    password: '',
    // Doctor fields
    specialization: 'General Dentistry',
    licenseNumber: '',
    qualification: '',
    experience: '',
    consultationFee: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState({})

  // Initialize form with user data if editing
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'RECEPTIONIST',
        password: '',
        specialization: user.doctor?.specialization || 'General Dentistry',
        licenseNumber: user.doctor?.licenseNumber || '',
        qualification: user.doctor?.qualification || '',
        experience: user.doctor?.experience || '',
        consultationFee: user.doctor?.consultationFee || ''
      })
    }
  }, [user])

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear validation error when field changes
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // Validate form
  const validate = () => {
    const errors = {}
    
    if (!formData.firstName?.trim()) {
      errors.firstName = 'First name is required'
    }
    
    if (!formData.lastName?.trim()) {
      errors.lastName = 'Last name is required'
    }
    
    if (!formData.email?.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }
    
    if (!user && !formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters'
    }
    
    if (!['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(formData.role)) {
      errors.role = 'Invalid role'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const url = user 
        ? `/api/clinic/users/${user.id}` 
        : '/api/clinic/users'
      
      // Prepare payload
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        role: formData.role,
        password: formData.password || undefined
      }

      // Add doctor-specific fields
      if (formData.role === 'DOCTOR') {
        payload.specialization = formData.specialization
        payload.licenseNumber = formData.licenseNumber || null
        payload.qualification = formData.qualification || null
        payload.experience = formData.experience ? parseInt(formData.experience) : null
        payload.consultationFee = formData.consultationFee ? parseFloat(formData.consultationFee) : null
      }

      const res = await fetch(url, {
        method: user ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      const data = await res.json()

      if (data.success) {
        onSuccess()
      } else {
        if (data.details && Array.isArray(data.details)) {
          setError(data.details.join(', '))
        } else {
          setError(data.error || 'Failed to save user')
        }
      }
    } catch (err) {
      console.error('Save user error:', err)
      setError('Failed to save user. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>
            {user ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorAlert}>{error}</div>
          )}

          {/* Basic Information */}
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Basic Information</h3>
            
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>
                  First Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  style={{
                    ...styles.input,
                    borderColor: validationErrors.firstName ? '#dc2626' : '#d1d5db'
                  }}
                  placeholder="John"
                />
                {validationErrors.firstName && (
                  <span style={styles.fieldError}>{validationErrors.firstName}</span>
                )}
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>
                  Last Name <span style={styles.required}>*</span>
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  style={{
                    ...styles.input,
                    borderColor: validationErrors.lastName ? '#dc2626' : '#d1d5db'
                  }}
                  placeholder="Smith"
                />
                {validationErrors.lastName && (
                  <span style={styles.fieldError}>{validationErrors.lastName}</span>
                )}
              </div>
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Email <span style={styles.required}>*</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                disabled={!!user}
                style={{
                  ...styles.input,
                  ...(user ? styles.inputDisabled : {}),
                  borderColor: validationErrors.email ? '#dc2626' : '#d1d5db'
                }}
                placeholder="john.smith@clinic.com"
              />
              {validationErrors.email && (
                <span style={styles.fieldError}>{validationErrors.email}</span>
              )}
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={styles.input}
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>
                Role <span style={styles.required}>*</span>
              </label>
              <select
                value={formData.role}
                onChange={(e) => handleChange('role', e.target.value)}
                style={styles.select}
              >
                <option value="ADMIN">Administrator</option>
                <option value="DOCTOR">Doctor</option>
                <option value="RECEPTIONIST">Receptionist</option>
              </select>
            </div>

            {!user && (
              <div style={styles.field}>
                <label style={styles.label}>
                  Password <span style={styles.required}>*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  style={{
                    ...styles.input,
                    borderColor: validationErrors.password ? '#dc2626' : '#d1d5db'
                  }}
                  placeholder="Minimum 6 characters"
                />
                {validationErrors.password && (
                  <span style={styles.fieldError}>{validationErrors.password}</span>
                )}
              </div>
            )}
          </div>

          {/* Doctor-specific Fields */}
          {formData.role === 'DOCTOR' && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Professional Details</h3>
              
              <div style={styles.field}>
                <label style={styles.label}>Specialization</label>
                <select
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  style={styles.select}
                >
                  {SPECIALIZATIONS.map(spec => (
                    <option key={spec} value={spec}>{spec}</option>
                  ))}
                </select>
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>License Number</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    style={styles.input}
                    placeholder="DDS-12345"
                  />
                </div>
                
                <div style={styles.field}>
                  <label style={styles.label}>Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => handleChange('qualification', e.target.value)}
                    style={styles.input}
                    placeholder="DDS, DMD"
                  />
                </div>
              </div>

              <div style={styles.row}>
                <div style={styles.field}>
                  <label style={styles.label}>Years of Experience</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    min="0"
                    style={styles.input}
                    placeholder="5"
                  />
                </div>
                
                <div style={styles.field}>
                  <label style={styles.label}>Consultation Fee ($)</label>
                  <input
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => handleChange('consultationFee', e.target.value)}
                    min="0"
                    step="0.01"
                    style={styles.input}
                    placeholder="150.00"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  title: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#6b7280',
    padding: 0,
    lineHeight: 1
  },
  form: {
    padding: '24px'
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '16px',
    paddingBottom: '8px',
    borderBottom: '1px solid #e5e7eb'
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  field: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  required: {
    color: '#dc2626'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  inputDisabled: {
    backgroundColor: '#f9fafb',
    cursor: 'not-allowed'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    boxSizing: 'border-box'
  },
  fieldError: {
    display: 'block',
    fontSize: '12px',
    color: '#dc2626',
    marginTop: '4px'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '16px',
    borderTop: '1px solid #e5e7eb'
  },
  cancelBtn: {
    padding: '10px 20px',
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  submitBtn: {
    padding: '10px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
}
