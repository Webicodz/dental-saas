/**
 * PATIENTS LIST PAGE
 *
 * URL: /patients
 *
 * SHOWS:
 * - List of all patients in table
 * - Search bar
 * - Add new patient button
 * - Edit/Delete actions
 *
 * CODEIGNITER EQUIVALENT:
 * application/views/patients/index.php
 * But with built-in logic and state
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

export default function PatientsPage() {
  // STATE
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  const router = useRouter()

  // LOAD PATIENTS WHEN PAGE LOADS
  useEffect(() => {
    fetchPatients()
  }, [])

  // FETCH PATIENTS FROM API
  const fetchPatients = async (searchTerm = '') => {
    try {
      setLoading(true)

      const url = searchTerm
        ? `/api/patients?search=${encodeURIComponent(searchTerm)}`
        : '/api/patients'

      const response = await fetch(url)
      const data = await response.json()

      if (data.success) {
        setPatients(data.patients)
      } else {
        setError('Failed to load patients')
      }
    } catch (err) {
      setError('Error loading patients')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // SEARCH HANDLER
  const handleSearch = (e) => {
    e.preventDefault()
    fetchPatients(search)
  }

  // DELETE PATIENT
  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) {
      return
    }

    try {
      const response = await fetch(`/api/patients/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        // Reload patients
        fetchPatients(search)
        alert('Patient deleted successfully')
      } else {
        alert('Failed to delete patient')
      }
    } catch (err) {
      alert('Error deleting patient')
      console.error(err)
    }
  }

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
                padding: '0.5rem 1rem',
                background: '#f3f4f6',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              ← Back
            </button>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>
              👥 Patient Management
            </h1>
          </div>

          <button
            onClick={() => router.push('/patients/new')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600'
            }}
          >
            + Add New Patient
          </button>
        </header>

        {/* MAIN CONTENT */}
        <main style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
          {/* SEARCH BAR */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or phone..."
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '1rem'
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.75rem 2rem',
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600'
                }}
              >
                Search
              </button>
              {search && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    fetchPatients('')
                  }}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#f3f4f6',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              )}
            </form>
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div style={{
              background: '#fee',
              border: '1px solid #fcc',
              color: '#c33',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* LOADING */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
              <div>Loading patients...</div>
            </div>
          ) : (
            /* PATIENTS TABLE */
            <div style={{
              background: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                    <th style={tableHeaderStyle}>Name</th>
                    <th style={tableHeaderStyle}>Email</th>
                    <th style={tableHeaderStyle}>Phone</th>
                    <th style={tableHeaderStyle}>Status</th>
                    <th style={tableHeaderStyle}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {patients.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{
                        textAlign: 'center',
                        padding: '3rem',
                        color: '#666'
                      }}>
                        {search ? 'No patients found' : 'No patients yet. Add your first patient!'}
                      </td>
                    </tr>
                  ) : (
                    patients.map((patient) => (
                      <tr key={patient.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={tableCellStyle}>
                          <div style={{ fontWeight: '600', color: '#333' }}>
                            {patient.firstName} {patient.lastName}
                          </div>
                          <div style={{ fontSize: '0.85rem', color: '#666' }}>
                            ID: {patient.id.slice(0, 8)}...
                          </div>
                        </td>
                        <td style={tableCellStyle}>
                          {patient.email || <span style={{ color: '#999' }}>—</span>}
                        </td>
                        <td style={tableCellStyle}>{patient.phone}</td>
                        <td style={tableCellStyle}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: patient.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2',
                            color: patient.status === 'ACTIVE' ? '#065f46' : '#991b1b'
                          }}>
                            {patient.status}
                          </span>
                        </td>
                        <td style={tableCellStyle}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => router.push(`/patients/${patient.id}`)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                              }}
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleDelete(patient.id, `${patient.firstName} ${patient.lastName}`)}
                              style={{
                                padding: '0.5rem 1rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.85rem'
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* PAGINATION (PLACEHOLDER) */}
              {patients.length > 0 && (
                <div style={{
                  padding: '1rem',
                  borderTop: '1px solid #e5e7eb',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div style={{ color: '#666' }}>
                    Showing {patients.length} patient{patients.length !== 1 ? 's' : ''}
                  </div>
                  <div style={{ color: '#999', fontSize: '0.9rem' }}>
                    Pagination coming soon!
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  )
}

// TABLE STYLES
const tableHeaderStyle = {
  padding: '1rem',
  textAlign: 'left',
  fontWeight: '600',
  color: '#374151',
  fontSize: '0.875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const tableCellStyle = {
  padding: '1rem',
  color: '#4b5563'
}
