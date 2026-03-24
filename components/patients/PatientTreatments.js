'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PatientTreatments({ patientId, patientName }) {
  const [treatments, setTreatments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    fetchTreatments()
  }, [patientId, filterStatus])

  const fetchTreatments = async () => {
    try {
      setLoading(true)
      const url = filterStatus === 'ALL' 
        ? `/api/patients/${patientId}/treatments`
        : `/api/patients/${patientId}/treatments?status=${filterStatus}`
      
      const response = await fetch(url)
      
      if (!response.ok) throw new Error('Failed to fetch treatments')

      const data = await response.json()
      setTreatments(data.treatments || [])
      setStats(data.stats || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0)
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      PLANNED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-green-100 text-green-800'
    }
    return `px-2 py-1 text-xs font-medium rounded ${styles[status] || styles.PLANNED}`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PLANNED': return '📋'
      case 'IN_PROGRESS': return '🔄'
      case 'COMPLETED': return '✔️'
      default: return '📋'
    }
  }

  const statusFilters = [
    { value: 'ALL', label: 'All' },
    { value: 'PLANNED', label: 'Planned' },
    { value: 'IN_PROGRESS', label: 'In Progress' },
    { value: 'COMPLETED', label: 'Completed' }
  ]

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total Treatments</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Planned</p>
            <p className="text-2xl font-bold text-blue-600">{stats.planned}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">In Progress</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
        </div>
      )}

      {/* Cost Summary */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow p-4 text-white">
            <p className="text-sm opacity-80">Estimated Cost</p>
            <p className="text-2xl font-bold">{stats.totalEstimatedCostFormatted}</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow p-4 text-white">
            <p className="text-sm opacity-80">Actual Cost</p>
            <p className="text-2xl font-bold">{stats.totalCostFormatted}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {statusFilters.map(filter => (
            <button
              key={filter.value}
              onClick={() => setFilterStatus(filter.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                filterStatus === filter.value
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <Link
          href={`/treatments/new?patientId=${patientId}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Treatment
        </Link>
      </div>

      {/* Treatments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : treatments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No treatments</h3>
          <p className="mt-1 text-sm text-gray-500">No treatments found for this patient.</p>
          <div className="mt-6">
            <Link
              href={`/treatments/new?patientId=${patientId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Create Treatment Plan
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {treatments.map((treatment) => (
            <div key={treatment.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">{getStatusIcon(treatment.status)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {treatment.treatmentName}
                      </h3>
                      <span className={getStatusBadge(treatment.status)}>
                        {treatment.status.replace('_', ' ')}
                      </span>
                      {treatment.tooth && (
                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                          Tooth: {treatment.tooth}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{treatment.procedure}</p>
                    
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                      {treatment.startDate && (
                        <span>
                          <span className="font-medium">Started:</span> {formatDate(treatment.startDate)}
                        </span>
                      )}
                      {treatment.completedDate && (
                        <span>
                          <span className="font-medium">Completed:</span> {formatDate(treatment.completedDate)}
                        </span>
                      )}
                      {(treatment.estimatedCost || treatment.actualCost) && (
                        <span>
                          <span className="font-medium">Cost:</span> {formatCurrency(treatment.actualCost || treatment.estimatedCost)}
                        </span>
                      )}
                    </div>

                    {treatment.doctor && (
                      <p className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Doctor:</span> {treatment.doctor.name}
                        <span className="mx-1">•</span>
                        {treatment.doctor.specialization}
                      </p>
                    )}

                    {treatment.prescriptions && treatment.prescriptions.length > 0 && (
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Prescriptions:</span>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {treatment.prescriptions.map((rx, idx) => (
                            <span key={idx} className="px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded">
                              {typeof rx === 'string' ? rx : rx.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <Link
                  href={`/treatments/${treatment.id}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View
                </Link>
              </div>
              {treatment.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {treatment.notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
