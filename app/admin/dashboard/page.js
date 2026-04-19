'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      const result = await res.json()
      
      if (result.success) {
        setData(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#111827', color: 'white' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#9ca3af' }}>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '1.5rem', backgroundColor: '#7f1d1d', borderRadius: '0.5rem', color: '#fecaca', textAlign: 'center' }}>
        <p>{error}</p>
        <button 
          onClick={fetchDashboardData}
          style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#dc2626', color: 'white', borderRadius: '0.5rem' }}
        >
          Retry
        </button>
      </div>
    )
  }

  const { overview } = data || { overview: {} }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff' }}>Admin Dashboard</h1>
        <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.25rem' }}>Overview of all clinics and system metrics</p>
      </div>

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Total Clinics</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', marginTop: '0.25rem' }}>{overview.totalClinics || 0}</p>
          <p style={{ color: '#22c55e', fontSize: '0.625rem', marginTop: '0.25rem' }}>{overview.activeClinics || 0} active</p>
        </div>

        <div style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Total Users</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', marginTop: '0.25rem' }}>{overview.totalUsers || 0}</p>
          <p style={{ color: '#22c55e', fontSize: '0.625rem', marginTop: '0.25rem' }}>{overview.activeUsers || 0} active</p>
        </div>

        <div style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Total Patients</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', marginTop: '0.25rem' }}>{overview.totalPatients || 0}</p>
          <p style={{ color: '#9ca3af', fontSize: '0.625rem', marginTop: '0.25rem' }}>registered</p>
        </div>

        <div style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '0.5rem' }}>
          <p style={{ color: '#9ca3af', fontSize: '0.75rem' }}>Appointments</p>
          <p style={{ fontSize: '1.5rem', fontWeight: '600', color: '#fff', marginTop: '0.25rem' }}>{overview.totalAppointments || 0}</p>
          <p style={{ color: '#9ca3af', fontSize: '0.625rem', marginTop: '0.25rem' }}>booked</p>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{ backgroundColor: '#374151', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#fff', marginBottom: '0.75rem' }}>Quick Actions</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Link
            href="/admin/clinics"
            style={{ padding: '0.375rem 0.75rem', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', textDecoration: 'none' }}
          >
            View Clinics
          </Link>
          <Link
            href="/admin/users"
            style={{ padding: '0.375rem 0.75rem', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', textDecoration: 'none' }}
          >
            Manage Users
          </Link>
          <Link
            href="/admin/license"
            style={{ padding: '0.375rem 0.75rem', backgroundColor: '#4f46e5', color: '#fff', borderRadius: '0.375rem', fontSize: '0.75rem', fontWeight: '500', textDecoration: 'none' }}
          >
            Licenses
          </Link>
        </div>
      </div>

      {/* Info Box */}
      <div style={{ padding: '0.75rem', backgroundColor: '#1e3a5f', borderRadius: '0.375rem' }}>
        <p style={{ color: '#93c5fd', fontSize: '0.75rem' }}>
          <strong>Welcome!</strong> Manage all clinics, users, and licenses from this dashboard.
        </p>
      </div>
    </div>
  )
}
