/**
 * CLINIC USERS MANAGEMENT PAGE
 * 
 * Page for clinic administrators to manage staff members.
 * Allows viewing, creating, editing, and deactivating users.
 * 
 * IN CODEIGNITER:
 * Like: application/views/admin/users.php
 * 
 * PERMISSIONS:
 * - ADMIN: Full access to user management
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

// Role configuration
const ROLE_CONFIG = {
  ADMIN: { label: 'Administrator', color: '#7c3aed', bg: '#ede9fe' },
  DOCTOR: { label: 'Doctor', color: '#2563eb', bg: '#dbeafe' },
  RECEPTIONIST: { label: 'Receptionist', color: '#059669', bg: '#d1fae5' }
}

// Status configuration
const STATUS_CONFIG = {
  ACTIVE: { label: 'Active', color: '#059669', bg: '#d1fae5' },
  INACTIVE: { label: 'Inactive', color: '#6b7280', bg: '#f3f4f6' },
  PENDING: { label: 'Pending', color: '#d97706', bg: '#fef3c7' },
  SUSPENDED: { label: 'Suspended', color: '#dc2626', bg: '#fee2e2' }
}

export default function ClinicUsersPage() {
  const [user, setUser] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [counts, setCounts] = useState({ total: 0, admins: 0, doctors: 0, receptionists: 0 })
  
  // Filters
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)
  
  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null)

  const router = useRouter()

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
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
        
        if (!data.success || data.user.role !== 'ADMIN') {
          router.push('/dashboard')
          return
        }
        
        setUser(data.user)
        fetchUsers()
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/login')
      }
    }

    checkAccess()
  }, [router])

  // Fetch users
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      let url = '/api/clinic/users?'
      if (roleFilter !== 'all') url += `role=${roleFilter}&`
      if (statusFilter !== 'all') url += `status=${statusFilter}&`
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}&`
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.success) {
        setUsers(data.users)
        setCounts(data.counts)
      } else {
        setError(data.error)
      }
    } catch (err) {
      console.error('Fetch users error:', err)
      setError('Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) fetchUsers()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, roleFilter, statusFilter, user])

  // Handle filter changes
  const handleFilterChange = (type, value) => {
    if (type === 'role') setRoleFilter(value)
    if (type === 'status') setStatusFilter(value)
  }

  // Open create modal
  const handleCreateUser = () => {
    setEditingUser(null)
    setShowModal(true)
  }

  // Open edit modal
  const handleEditUser = (userData) => {
    setEditingUser(userData)
    setShowModal(true)
  }

  // Handle delete
  const handleDeleteUser = async (userData) => {
    setDeletingUser(userData)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/clinic/users/${deletingUser.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.success) {
        fetchUsers()
        setShowDeleteConfirm(false)
        setDeletingUser(null)
      } else {
        alert(data.error || 'Failed to delete user')
      }
    } catch (err) {
      console.error('Delete user error:', err)
      alert('Failed to delete user')
    }
  }

  // Toggle user status
  const toggleUserStatus = async (userData) => {
    const newStatus = userData.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`/api/clinic/users/${userData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      })
      const data = await res.json()
      
      if (data.success) {
        fetchUsers()
      } else {
        alert(data.error || 'Failed to update status')
      }
    } catch (err) {
      console.error('Toggle status error:', err)
      alert('Failed to update status')
    }
  }

  return (
    <ProtectedRoute>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Staff Management</h1>
            <p style={styles.subtitle}>Manage your clinic's team members</p>
          </div>
          <button style={styles.primaryButton} onClick={handleCreateUser}>
            + Add Staff Member
          </button>
        </div>

        {/* Stats Cards */}
        <div style={styles.statsRow}>
          <div style={styles.statCard}>
            <span style={styles.statNumber}>{counts.total}</span>
            <span style={styles.statLabel}>Total Staff</span>
          </div>
          <div style={{ ...styles.statCard, ...styles.statCardAdmin }}>
            <span style={styles.statNumber}>{counts.admins}</span>
            <span style={styles.statLabel}>Administrators</span>
          </div>
          <div style={{ ...styles.statCard, ...styles.statCardDoctor }}>
            <span style={styles.statNumber}>{counts.doctors}</span>
            <span style={styles.statLabel}>Doctors</span>
          </div>
          <div style={{ ...styles.statCard, ...styles.statCardReceptionist }}>
            <span style={styles.statNumber}>{counts.receptionists}</span>
            <span style={styles.statLabel}>Receptionists</span>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.filterGroup}>
            <select 
              value={roleFilter} 
              onChange={(e) => handleFilterChange('role', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Roles</option>
              <option value="ADMIN">Administrator</option>
              <option value="DOCTOR">Doctor</option>
              <option value="RECEPTIONIST">Receptionist</option>
            </select>
            
            <select 
              value={statusFilter} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div style={styles.tableContainer}>
          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner}></div>
              <p>Loading staff members...</p>
            </div>
          ) : users.length === 0 ? (
            <div style={styles.emptyState}>
              <span style={styles.emptyIcon}>👥</span>
              <h3>No staff members found</h3>
              <p>Try adjusting your filters or add a new staff member.</p>
            </div>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>Staff Member</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Last Login</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <div style={styles.userInfo}>
                        <div style={styles.avatar}>
                          {u.firstName?.[0]}{u.lastName?.[0]}
                        </div>
                        <div>
                          <div style={styles.userName}>{u.name}</div>
                          <div style={styles.userEmail}>{u.email}</div>
                          {u.phone && <div style={styles.userPhone}>{u.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.roleBadge,
                        backgroundColor: ROLE_CONFIG[u.role]?.bg || '#f3f4f6',
                        color: ROLE_CONFIG[u.role]?.color || '#6b7280'
                      }}>
                        {ROLE_CONFIG[u.role]?.label || u.role}
                      </span>
                      {u.doctor && (
                        <div style={styles.specialization}>
                          {u.doctor.specialization}
                        </div>
                      )}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: STATUS_CONFIG[u.status]?.bg || '#f3f4f6',
                        color: STATUS_CONFIG[u.status]?.color || '#6b7280'
                      }}>
                        {STATUS_CONFIG[u.status]?.label || u.status}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {u.lastLogin 
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : <span style={styles.neverLogin}>Never</span>
                      }
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actions}>
                        <button 
                          style={styles.actionBtn}
                          onClick={() => handleEditUser(u)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        {u.id !== user?.id && (
                          <>
                            <button 
                              style={styles.actionBtn}
                              onClick={() => toggleUserStatus(u)}
                              title={u.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                            >
                              {u.status === 'ACTIVE' ? '🚫' : '✅'}
                            </button>
                            <button 
                              style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                              onClick={() => handleDeleteUser(u)}
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* User Modal */}
        {showModal && (
          <UserModal
            user={editingUser}
            onClose={() => setShowModal(false)}
            onSuccess={() => {
              setShowModal(false)
              fetchUsers()
            }}
          />
        )}

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div style={styles.modalOverlay}>
            <div style={styles.confirmModal}>
              <h3 style={styles.confirmTitle}>Delete Staff Member?</h3>
              <p style={styles.confirmText}>
                Are you sure you want to delete <strong>{deletingUser?.name}</strong>? 
                This action cannot be undone.
              </p>
              <div style={styles.confirmActions}>
                <button 
                  style={styles.cancelBtn}
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setDeletingUser(null)
                  }}
                >
                  Cancel
                </button>
                <button 
                  style={styles.deleteConfirmBtn}
                  onClick={confirmDelete}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .users-table { font-size: 12px; }
          .stats-row { flex-wrap: wrap; }
        }
      `}</style>
    </ProtectedRoute>
  )
}

// User Modal Component
function UserModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    role: user?.role || 'RECEPTIONIST',
    password: '',
    // Doctor fields
    specialization: user?.doctor?.specialization || 'General Dentistry',
    licenseNumber: user?.doctor?.licenseNumber || '',
    qualification: user?.doctor?.qualification || '',
    experience: user?.doctor?.experience || '',
    consultationFee: user?.doctor?.consultationFee || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('token')
      const url = user 
        ? `/api/clinic/users/${user.id}` 
        : '/api/clinic/users'
      
      const res = await fetch(url, {
        method: user ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (data.success) {
        onSuccess()
      } else {
        setError(data.error || data.details?.join(', ') || 'Failed to save')
      }
    } catch (err) {
      console.error('Save user error:', err)
      setError('Failed to save user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.modalOverlay}>
      <div style={styles.modal}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>
            {user ? 'Edit Staff Member' : 'Add Staff Member'}
          </h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.errorAlert}>{error}</div>
          )}

          <div style={styles.formSection}>
            <h4 style={styles.sectionTitle}>Basic Information</h4>
            
            <div style={styles.formRow}>
              <div style={styles.formGroup}>
                <label style={styles.label}>First Name *</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleChange('firstName', e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Last Name *</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleChange('lastName', e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                disabled={!!user}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Phone</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Role *</label>
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
              <div style={styles.formGroup}>
                <label style={styles.label}>
                  Password * {user && '(leave empty to keep current)'}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleChange('password', e.target.value)}
                  required={!user}
                  minLength={6}
                  style={styles.input}
                />
              </div>
            )}
          </div>

          {formData.role === 'DOCTOR' && (
            <div style={styles.formSection}>
              <h4 style={styles.sectionTitle}>Professional Details</h4>
              
              <div style={styles.formGroup}>
                <label style={styles.label}>Specialization *</label>
                <select
                  value={formData.specialization}
                  onChange={(e) => handleChange('specialization', e.target.value)}
                  style={styles.select}
                >
                  <option value="General Dentistry">General Dentistry</option>
                  <option value="Orthodontics">Orthodontics</option>
                  <option value="Endodontics">Endodontics</option>
                  <option value="Periodontics">Periodontics</option>
                  <option value="Prosthodontics">Prosthodontics</option>
                  <option value="Oral Surgery">Oral Surgery</option>
                  <option value="Pediatric Dentistry">Pediatric Dentistry</option>
                  <option value="Cosmetic Dentistry">Cosmetic Dentistry</option>
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>License Number</label>
                  <input
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(e) => handleChange('licenseNumber', e.target.value)}
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Qualification</label>
                  <input
                    type="text"
                    value={formData.qualification}
                    onChange={(e) => handleChange('qualification', e.target.value)}
                    placeholder="e.g., DDS, DMD"
                    style={styles.input}
                  />
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Years of Experience</label>
                  <input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => handleChange('experience', e.target.value)}
                    min="0"
                    style={styles.input}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Consultation Fee</label>
                  <input
                    type="number"
                    value={formData.consultationFee}
                    onChange={(e) => handleChange('consultationFee', e.target.value)}
                    min="0"
                    step="0.01"
                    style={styles.input}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={styles.formActions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.submitBtn} disabled={loading}>
              {loading ? 'Saving...' : (user ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Styles
const styles = {
  container: {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0'
  },
  primaryButton: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  statsRow: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  statCard: {
    flex: 1,
    minWidth: '150px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    textAlign: 'center'
  },
  statCardAdmin: {
    borderLeft: '4px solid #7c3aed'
  },
  statCardDoctor: {
    borderLeft: '4px solid #2563eb'
  },
  statCardReceptionist: {
    borderLeft: '4px solid #059669'
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937'
  },
  statLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  filters: {
    display: 'flex',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  searchBox: {
    flex: 1,
    minWidth: '250px',
    position: 'relative'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)'
  },
  searchInput: {
    width: '100%',
    padding: '12px 12px 12px 40px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px'
  },
  filterGroup: {
    display: 'flex',
    gap: '12px'
  },
  filterSelect: {
    padding: '12px 16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '14px',
    backgroundColor: 'white',
    cursor: 'pointer'
  },
  tableContainer: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden'
  },
  loadingState: {
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
  emptyState: {
    padding: '60px',
    textAlign: 'center',
    color: '#6b7280'
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    backgroundColor: '#f9fafb',
    borderBottom: '1px solid #e5e7eb'
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6'
  },
  td: {
    padding: '16px',
    verticalAlign: 'middle'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    backgroundColor: '#e5e7eb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#4b5563'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937'
  },
  userEmail: {
    fontSize: '12px',
    color: '#6b7280'
  },
  userPhone: {
    fontSize: '12px',
    color: '#9ca3af'
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  specialization: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  statusBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500'
  },
  neverLogin: {
    color: '#9ca3af',
    fontStyle: 'italic'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    padding: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    borderRadius: '4px',
    transition: 'background 0.2s'
  },
  deleteBtn: {
    color: '#dc2626'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '500px',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalTitle: {
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
  formSection: {
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
  formRow: {
    display: 'flex',
    gap: '16px'
  },
  formGroup: {
    flex: 1,
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  },
  select: {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  formActions: {
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
  },
  confirmModal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '400px',
    textAlign: 'center'
  },
  confirmTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px'
  },
  confirmText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '24px'
  },
  confirmActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  deleteConfirmBtn: {
    padding: '10px 20px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
}
