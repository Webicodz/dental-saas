'use client'

import { useState, useEffect } from 'react'

export default function PatientTimeline({ patientId, patientName }) {
  const [timeline, setTimeline] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTimeline()
  }, [patientId])

  const fetchTimeline = async () => {
    try {
      setLoading(true)
      
      // Fetch all patient data
      const [appointmentsRes, treatmentsRes, invoicesRes, documentsRes] = await Promise.all([
        fetch(`/api/patients/${patientId}/appointments?limit=100`),
        fetch(`/api/patients/${patientId}/treatments?limit=100`),
        fetch(`/api/patients/${patientId}/invoices?limit=100`),
        fetch(`/api/patients/${patientId}/documents`)
      ])

      const [appointments, treatments, invoices, documents] = await Promise.all([
        appointmentsRes.json(),
        treatmentsRes.json(),
        invoicesRes.json(),
        documentsRes.json()
      ])

      // Build timeline from all events
      const events = []

      // Add appointments to timeline
      ;(appointments.appointments || []).forEach(apt => {
        events.push({
          id: apt.id,
          type: 'appointment',
          title: `${apt.type.replace('_', ' ')} Appointment`,
          description: apt.reason || 'No reason specified',
          date: apt.appointmentDate,
          status: apt.status,
          data: apt
        })
      })

      // Add treatments to timeline
      ;(treatments.treatments || []).forEach(treatment => {
        events.push({
          id: treatment.id,
          type: 'treatment',
          title: treatment.treatmentName,
          description: treatment.procedure,
          date: treatment.completedDate || treatment.startDate || treatment.createdAt,
          status: treatment.status,
          data: treatment
        })
      })

      // Add invoices to timeline
      ;(invoices.invoices || []).forEach(invoice => {
        events.push({
          id: invoice.id,
          type: 'billing',
          title: `Invoice ${invoice.invoiceNumber}`,
          description: `Total: $${invoice.total.toFixed(2)} | Paid: $${invoice.paidAmount.toFixed(2)}`,
          date: invoice.issueDate,
          status: invoice.status,
          data: invoice
        })
      })

      // Add documents to timeline
      ;(documents.documents || []).forEach(doc => {
        events.push({
          id: doc.id,
          type: 'document',
          title: doc.title,
          description: `${doc.type} - ${doc.fileName}`,
          date: doc.uploadDate,
          status: 'uploaded',
          data: doc
        })
      })

      // Sort by date descending
      events.sort((a, b) => new Date(b.date) - new Date(a.date))

      setTimeline(events)
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

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getEventIcon = (type) => {
    switch (type) {
      case 'appointment': return '📅'
      case 'treatment': return '💊'
      case 'billing': return '💳'
      case 'document': return '📄'
      default: return '📌'
    }
  }

  const getEventColor = (type, status) => {
    switch (type) {
      case 'appointment':
        if (status === 'COMPLETED') return 'border-green-500 bg-green-50'
        if (status === 'CANCELLED') return 'border-red-500 bg-red-50'
        if (status === 'NO_SHOW') return 'border-orange-500 bg-orange-50'
        return 'border-blue-500 bg-blue-50'
      case 'treatment':
        if (status === 'COMPLETED') return 'border-green-500 bg-green-50'
        if (status === 'IN_PROGRESS') return 'border-yellow-500 bg-yellow-50'
        return 'border-purple-500 bg-purple-50'
      case 'billing':
        if (status === 'PAID') return 'border-green-500 bg-green-50'
        if (status === 'OVERDUE') return 'border-red-500 bg-red-50'
        if (status === 'PARTIALLY_PAID') return 'border-blue-500 bg-blue-50'
        return 'border-yellow-500 bg-yellow-50'
      case 'document':
        return 'border-gray-500 bg-gray-50'
      default:
        return 'border-gray-500 bg-gray-50'
    }
  }

  const getStatusBadge = (type, status) => {
    const statusStyles = {
      COMPLETED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
      NO_SHOW: 'bg-orange-100 text-orange-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      PENDING: 'bg-yellow-100 text-yellow-800',
      PARTIALLY_PAID: 'bg-blue-100 text-blue-800',
      SCHEDULED: 'bg-blue-100 text-blue-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      PLANNED: 'bg-purple-100 text-purple-800',
      uploaded: 'bg-gray-100 text-gray-800'
    }
    return `px-2 py-0.5 text-xs font-medium rounded ${statusStyles[status] || statusStyles.PENDING}`
  }

  // Group timeline by month/year
  const groupedTimeline = timeline.reduce((acc, event) => {
    const date = new Date(event.date)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    
    if (!acc[key]) {
      acc[key] = { label, events: [] }
    }
    acc[key].events.push(event)
    return acc
  }, {})

  const sortedGroups = Object.keys(groupedTimeline).sort((a, b) => b.localeCompare(a))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Activity Timeline</h2>
          <p className="mt-1 text-sm text-gray-500">
            Complete history for {patientName}
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {timeline.length} event{timeline.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center">
          <span className="w-4 h-4 rounded bg-blue-50 border-2 border-blue-500 mr-2"></span>
          <span>Appointment</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 rounded bg-purple-50 border-2 border-purple-500 mr-2"></span>
          <span>Treatment</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 rounded bg-yellow-50 border-2 border-yellow-500 mr-2"></span>
          <span>Billing</span>
        </div>
        <div className="flex items-center">
          <span className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-500 mr-2"></span>
          <span>Document</span>
        </div>
      </div>

      {timeline.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No activity</h3>
          <p className="mt-1 text-sm text-gray-500">No activity recorded for this patient yet.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedGroups.map((groupKey) => (
            <div key={groupKey}>
              <h3 className="text-lg font-medium text-gray-900 mb-4 sticky top-0 bg-gray-50 py-2 z-10">
                {groupedTimeline[groupKey].label}
              </h3>
              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                
                <div className="space-y-4">
                  {groupedTimeline[groupKey].events.map((event) => (
                    <div key={`${event.type}-${event.id}`} className="relative pl-14">
                      {/* Icon */}
                      <div className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center text-xl border-2 ${getEventColor(event.type, event.status)}`}>
                        {getEventIcon(event.type)}
                      </div>
                      
                      {/* Content */}
                      <div className={`rounded-lg border-l-4 p-4 ${getEventColor(event.type, event.status)}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">
                              {event.title}
                            </h4>
                            <p className="mt-1 text-sm text-gray-600">
                              {event.description}
                            </p>
                            <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                              <span>{formatDate(event.date)}</span>
                              {event.date && (
                                <span>{formatTime(event.date)}</span>
                              )}
                            </div>
                          </div>
                          <span className={getStatusBadge(event.type, event.status)}>
                            {event.status.replace('_', ' ')}
                          </span>
                        </div>
                        
                        {/* Type-specific details */}
                        {event.type === 'appointment' && event.data.doctor && (
                          <p className="mt-2 text-xs text-gray-500">
                            Doctor: {event.data.doctor.name}
                          </p>
                        )}
                        {event.type === 'treatment' && event.data.doctor && (
                          <p className="mt-2 text-xs text-gray-500">
                            Doctor: {event.data.doctor.name}
                            {event.data.tooth && ` | Tooth: ${event.data.tooth}`}
                          </p>
                        )}
                        {event.type === 'billing' && (
                          <div className="mt-2 flex items-center space-x-4 text-xs">
                            <span className="font-medium">
                              Total: ${event.data.total.toFixed(2)}
                            </span>
                            <span className="text-green-600">
                              Paid: ${event.data.paidAmount.toFixed(2)}
                            </span>
                            {event.data.balanceDue > 0 && (
                              <span className="text-red-600">
                                Due: ${event.data.balanceDue.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
