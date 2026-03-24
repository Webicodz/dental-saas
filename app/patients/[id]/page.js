'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import PatientTabs from '@/components/patients/PatientTabs'
import PatientOverview from '@/components/patients/PatientOverview'
import MedicalHistoryForm from '@/components/patients/MedicalHistoryForm'
import DentalHistoryForm from '@/components/patients/DentalHistoryForm'
import PatientDocuments from '@/components/patients/PatientDocuments'
import PatientAppointments from '@/components/patients/PatientAppointments'
import PatientTreatments from '@/components/patients/PatientTreatments'
import PatientBilling from '@/components/patients/PatientBilling'
import PatientTimeline from '@/components/patients/PatientTimeline'

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id

  const [patient, setPatient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')

  // Fetch patient data
  useEffect(() => {
    fetchPatient()
  }, [patientId])

  const fetchPatient = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${patientId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Patient not found')
        } else {
          throw new Error('Failed to fetch patient')
        }
        return
      }

      const data = await response.json()
      setPatient(data.patient)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Handle patient update
  const handlePatientUpdate = async (updatedData) => {
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      })

      if (!response.ok) throw new Error('Failed to update patient')

      const data = await response.json()
      setPatient(data.patient)
      return { success: true, message: 'Patient updated successfully' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Handle history update
  const handleHistoryUpdate = async (historyData) => {
    try {
      const response = await fetch(`/api/patients/${patientId}/history`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(historyData)
      })

      if (!response.ok) throw new Error('Failed to update history')

      const data = await response.json()
      return { success: true, message: 'History updated successfully', data: data.patient }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Handle document upload
  const handleDocumentUpload = async (documentData) => {
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...documentData,
          patientId
        })
      })

      if (!response.ok) throw new Error('Failed to upload document')

      const data = await response.json()
      return { success: true, message: 'Document uploaded successfully', document: data.document }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Handle document delete
  const handleDocumentDelete = async (documentId) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete document')

      return { success: true, message: 'Document deleted successfully' }
    } catch (err) {
      return { success: false, error: err.message }
    }
  }

  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading patient details...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
          <Link 
            href="/patients" 
            className="mt-4 inline-block text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Patients
          </Link>
        </div>
      </div>
    )
  }

  if (!patient) return null

  // Prepare tabs data
  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📋' },
    { id: 'medical', label: 'Medical History', icon: '🏥' },
    { id: 'dental', label: 'Dental History', icon: '🦷' },
    { id: 'appointments', label: 'Appointments', icon: '📅' },
    { id: 'treatments', label: 'Treatments', icon: '💊' },
    { id: 'documents', label: 'Documents', icon: '📁' },
    { id: 'billing', label: 'Billing', icon: '💳' },
    { id: 'timeline', label: 'Timeline', icon: '📊' }
  ]

  // Render active tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <PatientOverview 
            patient={patient} 
            onUpdate={handlePatientUpdate}
          />
        )
      case 'medical':
        return (
          <MedicalHistoryForm 
            patientId={patientId}
            patientName={`${patient.firstName} ${patient.lastName}`}
            onSave={handleHistoryUpdate}
          />
        )
      case 'dental':
        return (
          <DentalHistoryForm 
            patientId={patientId}
            patientName={`${patient.firstName} ${patient.lastName}`}
            onSave={handleHistoryUpdate}
          />
        )
      case 'appointments':
        return (
          <PatientAppointments 
            patientId={patientId}
            patientName={`${patient.firstName} ${patient.lastName}`}
          />
        )
      case 'treatments':
        return (
          <PatientTreatments 
            patientId={patientId}
            patientName={`${patient.firstName} ${patient.lastName}`}
          />
        )
      case 'documents':
        return (
          <PatientDocuments 
            patientId={patientId}
            patientName={`${patient.firstName} ${patient.lastName}`}
            onUpload={handleDocumentUpload}
            onDelete={handleDocumentDelete}
          />
        )
      case 'billing':
        return (
          <PatientBilling 
            patientId={patientId}
            patientName={`${patient.firstName} ${patient.lastName}`}
          />
        )
      case 'timeline':
        return (
          <PatientTimeline 
            patientId={patientId}
            patientName={`${patient.firstName} ${patient.lastName}`}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link 
                href="/patients" 
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {patient.firstName} {patient.lastName}
                </h1>
                <div className="flex items-center space-x-4 mt-1">
                  <span className="text-sm text-gray-500">
                    {patient.email || 'No email'}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className="text-sm text-gray-500">
                    {patient.phone}
                  </span>
                  <span className="text-gray-300">|</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    patient.status === 'ACTIVE' 
                      ? 'bg-green-100 text-green-800' 
                      : patient.status === 'INACTIVE'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {patient.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link
                href={`/appointments/new?patientId=${patientId}`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Appointment
              </Link>
              <button
                onClick={() => router.push(`/patients/${patientId}/edit`)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Patient
              </button>
            </div>
          </div>
        </div>

        {/* Tabs Navigation */}
        <PatientTabs 
          tabs={tabs} 
          activeTab={activeTab} 
          onTabChange={handleTabChange}
        />
      </div>

      {/* Tab Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderTabContent()}
      </div>
    </div>
  )
}
