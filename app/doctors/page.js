/**
 * DOCTORS DIRECTORY PAGE
 * 
 * Displays a list of all doctors in the clinic with their details.
 * Used for staff directory and appointment scheduling.
 * 
 * IN CODEIGNITER:
 * Like: application/views/doctors/index.php
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

// Specialization icons
const SPECIALIZATION_ICONS = {
  'General Dentistry': '🦷',
  'Orthodontics': '😁',
  'Endodontics': '🔬',
  'Periodontics': '💉',
  'Prosthodontics': '👑',
  'Oral Surgery': '🔧',
  'Pediatric Dentistry': '👶',
  'Cosmetic Dentistry': '✨'
}

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

export default function DoctorsPage() {
  const [user, setUser] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState('grid')

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
        fetchDoctors()
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/login')
      }
    }

    checkAuth()
  }, [router])

  // Fetch doctors
  const fetchDoctors = async (activeOnly = true) => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      let url = `/api/doctors?active=${activeOnly !== 'all'}`
      
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.success) {
        setDoctors(data.doctors)
      } else {
        setError(data.error)
      }
    } catch (err) {
      console.error('Fetch doctors error:', err)
      setError('Failed to fetch doctors')
    } finally {
      setLoading(false)
    }
  }

  // Filter and search
  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = !searchQuery || 
      doc.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' || doc.specialization === filter
    
    return matchesSearch && matchesFilter
  })

  // Get unique specializations
  const specializations = [...new Set(doctors.map(d => d.specialization))]

  // Navigate to doctor profile
  const viewProfile = (doctorId) => {
    router.push(`/doctors/${doctorId}`)
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading doctors...</p>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Our Doctors</h1>
            <p style={styles.subtitle}>
              Meet our team of experienced dental professionals
            </p>
          </div>
        </div>

        {/* Filters */}
        <div style={styles.filters}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.filterGroup}>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Specializations</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
            
            <div style={styles.viewToggle}>
              <button 
                style={{
                  ...styles.viewBtn,
                  ...(viewMode === 'grid' ? styles.viewBtnActive : {})
                }}
                onClick={() => setViewMode('grid')}
                title="Grid view"
              >
                ⊞
              </button>
              <button 
                style={{
                  ...styles.viewBtn,
                  ...(viewMode === 'list' ? styles.viewBtnActive : {})
                }}
                onClick={() => setViewMode('list')}
                title="List view"
              >
                ☰
              </button>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div style={styles.resultsCount}>
          {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} found
        </div>

        {/* Doctors Grid/List */}
        {filteredDoctors.length === 0 ? (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>👨‍⚕️</span>
            <h3>No doctors found</h3>
            <p>Try adjusting your search or filters.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div style={styles.doctorsGrid}>
            {filteredDoctors.map(doctor => (
              <div 
                key={doctor.id} 
                style={styles.doctorCard}
                onClick={() => viewProfile(doctor.id)}
              >
                <div style={styles.cardHeader}>
                  <div style={styles.avatarLarge}>
                    {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                  </div>
                  {!doctor.isActive && (
                    <span style={styles.inactiveBadge}>Inactive</span>
                  )}
                </div>
                
                <div style={styles.cardBody}>
                  <h3 style={styles.doctorName}>{doctor.fullName}</h3>
                  <span style={{
                    ...styles.specializationBadge,
                    backgroundColor: SPECIALIZATION_COLORS[doctor.specialization]?.bg || '#f3f4f6',
                    color: SPECIALIZATION_COLORS[doctor.specialization]?.color || '#6b7280'
                  }}>
                    {SPECIALIZATION_ICONS[doctor.specialization] || '🦷'} {doctor.specialization}
                  </span>
                  
                  {doctor.qualification && (
                    <p style={styles.qualification}>{doctor.qualification}</p>
                  )}
                  
                  {doctor.experience && (
                    <p style={styles.experience}>{doctor.experience} years experience</p>
                  )}
                  
                  <div style={styles.schedule}>
                    <span style={styles.scheduleLabel}>🕐</span>
                    <span style={styles.scheduleText}>
                      {doctor.workingDays?.short || 'Mon-Fri'} • {doctor.workingHours?.start || '09:00'} - {doctor.workingHours?.end || '17:00'}
                    </span>
                  </div>
                  
                  {doctor.consultationFee && (
                    <div style={styles.fee}>
                      <span style={styles.feeLabel}>Consultation:</span>
                      <span style={styles.feeValue}>${doctor.consultationFee}</span>
                    </div>
                  )}
                </div>
                
                <div style={styles.cardFooter}>
                  <button style={styles.profileBtn}>
                    View Profile →
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={styles.doctorsList}>
            {filteredDoctors.map(doctor => (
              <div 
                key={doctor.id} 
                style={styles.doctorRow}
                onClick={() => viewProfile(doctor.id)}
              >
                <div style={styles.rowAvatar}>
                  {doctor.firstName?.[0]}{doctor.lastName?.[0]}
                </div>
                <div style={styles.rowInfo}>
                  <div style={styles.rowHeader}>
                    <h3 style={styles.rowName}>{doctor.fullName}</h3>
                    <span style={{
                      ...styles.specializationBadgeSmall,
                      backgroundColor: SPECIALIZATION_COLORS[doctor.specialization]?.bg || '#f3f4f6',
                      color: SPECIALIZATION_COLORS[doctor.specialization]?.color || '#6b7280'
                    }}>
                      {doctor.specialization}
                    </span>
                  </div>
                  <div style={styles.rowDetails}>
                    {doctor.qualification && <span>{doctor.qualification}</span>}
                    {doctor.experience && <span>• {doctor.experience} years exp.</span>}
                    <span>• {doctor.workingDays?.short || 'Mon-Fri'}</span>
                    {doctor.consultationFee && <span>• ${doctor.consultationFee}</span>}
                  </div>
                </div>
                <div style={styles.rowAction}>
                  <button style={styles.viewBtn}>View →</button>
                </div>
              </div>
            ))}
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
    maxWidth: '1200px',
    margin: '0 auto'
  },
  header: {
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
    cursor: 'pointer',
    minWidth: '180px'
  },
  viewToggle: {
    display: 'flex',
    backgroundColor: '#f3f4f6',
    borderRadius: '8px',
    padding: '4px'
  },
  viewBtn: {
    padding: '8px 12px',
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    borderRadius: '6px',
    fontSize: '16px'
  },
  viewBtnActive: {
    backgroundColor: 'white',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
  },
  resultsCount: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '16px'
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
  emptyState: {
    padding: '60px',
    textAlign: 'center',
    color: '#6b7280',
    backgroundColor: 'white',
    borderRadius: '12px'
  },
  emptyIcon: {
    fontSize: '48px',
    display: 'block',
    marginBottom: '16px'
  },
  doctorsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '24px'
  },
  doctorCard: {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  cardHeader: {
    position: 'relative',
    padding: '24px',
    backgroundColor: '#f9fafb',
    display: 'flex',
    justifyContent: 'center'
  },
  avatarLarge: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: '600'
  },
  inactiveBadge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '500'
  },
  cardBody: {
    padding: '20px',
    textAlign: 'center'
  },
  doctorName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  specializationBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '12px',
    fontWeight: '500',
    marginBottom: '12px'
  },
  specializationBadgeSmall: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '500'
  },
  qualification: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '8px 0'
  },
  experience: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '0 0 12px 0'
  },
  schedule: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '12px'
  },
  scheduleLabel: {
    fontSize: '14px'
  },
  scheduleText: {
    color: '#374151'
  },
  fee: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb'
  },
  feeLabel: {
    fontSize: '13px',
    color: '#6b7280'
  },
  feeValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#059669'
  },
  cardFooter: {
    padding: '16px 20px',
    borderTop: '1px solid #e5e7eb',
    textAlign: 'center'
  },
  profileBtn: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  doctorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  doctorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '16px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    cursor: 'pointer'
  },
  rowAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    backgroundColor: '#2563eb',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '600',
    flexShrink: 0
  },
  rowInfo: {
    flex: 1
  },
  rowHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px'
  },
  rowName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  rowDetails: {
    fontSize: '13px',
    color: '#6b7280',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  rowAction: {
    flexShrink: 0
  }
}
