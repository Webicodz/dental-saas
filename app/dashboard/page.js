/**
 * DASHBOARD PAGE
 * 
 * Role-based dashboard for the dental practice management system.
 * Displays different widgets and data based on user role:
 * - ADMIN: Clinic overview, staff, revenue
 * - DOCTOR: Today's schedule, patients, treatments
 * - RECEPTIONIST: Appointments, check-in queue, quick actions
 * 
 * IN CODEIGNITER:
 * Like: application/views/dashboard.php
 * 
 * FEATURES:
 * - Protected route (must be logged in)
 * - Role-specific dashboard widgets
 * - Real-time statistics
 * - Today's appointments
 * - Recent activity feed
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'
import RoleBasedDashboard from '@/components/dashboard/RoleBasedDashboard'

// Navigation items based on role
const NAV_ITEMS = {
  ADMIN: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/appointments', label: 'Appointments', icon: '📅' },
    { href: '/patients', label: 'Patients', icon: '👥' },
    { href: '/doctors', label: 'Doctors', icon: '👨‍⚕️' },
    { href: '/billing', label: 'Billing', icon: '💰' },
    { href: '/clinic/users', label: 'Staff', icon: '👨‍💼' },
    { href: '/clinic/settings', label: 'Settings', icon: '⚙️' }
  ],
  DOCTOR: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/appointments', label: 'Appointments', icon: '📅' },
    { href: '/appointments/calendar', label: 'Calendar', icon: '📆' },
    { href: '/patients', label: 'Patients', icon: '👥' },
    { href: '/treatments', label: 'Treatments', icon: '💊' }
  ],
  RECEPTIONIST: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/appointments', label: 'Appointments', icon: '📅' },
    { href: '/appointments/calendar', label: 'Calendar', icon: '📆' },
    { href: '/patients', label: 'Patients', icon: '👥' },
    { href: '/billing', label: 'Billing', icon: '💰' }
  ]
}

export default function DashboardPage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  
  const router = useRouter()

  // FETCH DASHBOARD STATS
  const fetchDashboardStats = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
    }
  }

  // LOAD USER DATA
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) {
          router.push('/login')
          return
        }

        const userRes = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (userRes.ok) {
          const userData = await userRes.json()
          if (userData.success) {
            setUser(userData.user)
            localStorage.setItem('user', JSON.stringify(userData.user))
            await fetchDashboardStats()
          }
        }
      } catch (err) {
        console.error('Error loading user data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [router])

  // LOGOUT
  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  // Get navigation items for current role
  const navItems = user ? NAV_ITEMS[user.role] || NAV_ITEMS.RECEPTIONIST : []

  return (
    <ProtectedRoute>
      <div style={{ padding: '24px' }}>
        <header style={{ marginBottom: '24px' }}>
          <h1 style={styles.pageTitle}>
            {user?.role === 'ADMIN' && 'Clinic Overview'}
            {user?.role === 'DOCTOR' && 'My Dashboard'}
            {user?.role === 'RECEPTIONIST' && 'Front Desk'}
          </h1>
          <p style={styles.clinicName}>{user?.clinic?.name || 'Loading...'}</p>
        </header>

        <div style={styles.content}>
          {loading ? (
            <div style={styles.loadingState}>
              <div style={styles.spinner}></div>
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <RoleBasedDashboard user={user} stats={stats} />
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Styles
const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f5f7fa'
  },
  sidebar: {
    position: 'fixed',
    left: 0,
    top: 0,
    height: '100vh',
    background: 'white',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s',
    zIndex: 100
  },
  logo: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid #e5e7eb'
  },
  logoIcon: {
    fontSize: '32px'
  },
  logoTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  logoSubtitle: {
    fontSize: '11px',
    color: '#6b7280',
    margin: 0
  },
  nav: {
    flex: 1,
    padding: '16px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#4b5563',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s'
  },
  navIcon: {
    fontSize: '18px'
  },
  navLabel: {
    whiteSpace: 'nowrap'
  },
  toggleBtn: {
    margin: '16px',
    padding: '10px',
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  main: {
    flex: 1,
    transition: 'margin-left 0.3s'
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '16px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {},
  pageTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  clinicName: {
    fontSize: '13px',
    color: '#6b7280',
    margin: '4px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  roleBadge: {
    padding: '4px 12px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '600',
    color: 'white',
    textTransform: 'uppercase'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600'
  },
  userName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937',
    margin: 0
  },
  userEmail: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0
  },
  logoutBtn: {
    padding: '10px 16px',
    background: '#fee2e2',
    color: '#dc2626',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  content: {
    padding: '24px'
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
  }
}
