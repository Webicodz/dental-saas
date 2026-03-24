'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function PatientAppointments({ patientId, patientName }) {
  const [appointments, setAppointments] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')

  useEffect(() => {
    fetchAppointments()
  }, [patientId, filterStatus])

  const fetchAppointments = async () => {
    try {
      setLoading(true)
      const url = filterStatus === 'ALL' 
        ? `/api/patients/${patientId}/appointments`
        : `/api/patients/${patientId}/appointments?status=${filterStatus}`
      
      const response = await fetch(url)
      
      if (!response.ok) throw new Error('Failed to fetch appointments')

      const data = await response.json()
      setAppointments(data.appointments || [])
      setStats(data.stats || null)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    const styles = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-orange-100 text-orange-800'
    }
    return `px-2 py-1 text-xs font-medium rounded ${styles[status] || styles.SCHEDULED}`
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SCHEDULED': return '📅'
      case 'CONFIRMED': return '✅'
      case 'IN_PROGRESS': return '🔄'
      case 'COMPLETED': return '✔️'
      case 'CANCELLED': return '❌'
      case 'NO_SHOW': return '⚠️'
      default: return '📅'
    }
  }

  const statusFilters = [
    { value: 'ALL', label: 'All' },
    { value: 'SCHEDULED', label: 'Scheduled' },
    { value: 'CONFIRMED', label: 'Confirmed' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ]

  const appointmentTypes = {
    CONSULTATION: 'Consultation',
    CLEANING: 'Cleaning',
    FILLING: 'Filling',
    ROOT_CANAL: 'Root Canal',
    EXTRACTION: 'Extraction',
    CROWN: 'Crown',
    BRIDGE: 'Bridge',
    IMPLANT: 'Implant',
    ORTHODONTICS: 'Orthodontics',
    WHITENING: 'Whitening',
    EMERGENCY: 'Emergency',
    FOLLOWUP: 'Follow-up',
    OTHER: 'Other'
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Total</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Upcoming</p>
            <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Scheduled</p>
            <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">Cancelled</p>
            <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-500">No Show</p>
            <p className="text-2xl font-bold text-orange-600">{stats.noShow}</p>
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
          href={`/appointments/new?patientId=${patientId}`}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Appointment
        </Link>
      </div>

      {/* Appointments List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
          <p className="mt-1 text-sm text-gray-500">No appointments found for this patient.</p>
          <div className="mt-6">
            <Link
              href={`/appointments/new?patientId=${patientId}`}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Schedule Appointment
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="text-2xl">{getStatusIcon(appointment.status)}</div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {appointmentTypes[appointment.type] || appointment.type}
                      </h3>
                      <span className={getStatusBadge(appointment.status)}>
                        {appointment.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="mt-1 text-sm text-gray-500">
                      <span className="font-medium">{formatDate(appointment.appointmentDate)}</span>
                      <span className="mx-2">•</span>
                      <span>{appointment.startTime} - {appointment.endTime}</span>
                      <span className="mx-2">•</span>
                      <span>{appointment.duration} min</span>
                    </div>
                    {appointment.reason && (
                      <p className="mt-2 text-sm text-gray-600">{appointment.reason}</p>
                    )}
                    {appointment.doctor && (
                      <p className="mt-1 text-sm text-gray-500">
                        <span className="font-medium">Doctor:</span> {appointment.doctor.name}
                        <span className="mx-1">•</span>
                        {appointment.doctor.specialization}
                      </p>
                    )}
                    {appointment.treatments && appointment.treatments.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {appointment.treatments.map((treatment) => (
                          <span key={treatment.id} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 rounded">
                            {treatment.treatmentName}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/appointments/${appointment.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View
                  </Link>
                </div>
              </div>
              {appointment.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {appointment.notes}
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
