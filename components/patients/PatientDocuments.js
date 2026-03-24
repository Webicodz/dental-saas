'use client'

import { useState, useEffect } from 'react'
import DocumentUpload from './DocumentUpload'

export default function PatientDocuments({ patientId, patientName, onUpload, onDelete }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [filterType, setFilterType] = useState('ALL')
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'

  useEffect(() => {
    fetchDocuments()
  }, [patientId, filterType])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const url = filterType === 'ALL' 
        ? `/api/patients/${patientId}/documents`
        : `/api/patients/${patientId}/documents?type=${filterType}`
      
      const response = await fetch(url)
      
      if (!response.ok) throw new Error('Failed to fetch documents')

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (uploadData) => {
    const result = await onUpload(uploadData)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Document uploaded successfully!' })
      setShowUploadModal(false)
      fetchDocuments()
      return { success: true }
    } else {
      setMessage({ type: 'error', text: result.error })
      return result
    }
  }

  const handleDelete = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return

    const result = await onDelete(documentId)
    
    if (result.success) {
      setMessage({ type: 'success', text: 'Document deleted successfully!' })
      fetchDocuments()
    } else {
      setMessage({ type: 'error', text: result.error })
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'XRAY': return '📷'
      case 'REPORT': return '📋'
      case 'PRESCRIPTION': return '💊'
      case 'CONSENT_FORM': return '✍️'
      default: return '📄'
    }
  }

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'XRAY': return 'bg-purple-100 text-purple-800'
      case 'REPORT': return 'bg-blue-100 text-blue-800'
      case 'PRESCRIPTION': return 'bg-green-100 text-green-800'
      case 'CONSENT_FORM': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const documentTypes = [
    { value: 'ALL', label: 'All Documents' },
    { value: 'XRAY', label: 'X-Rays' },
    { value: 'REPORT', label: 'Reports' },
    { value: 'PRESCRIPTION', label: 'Prescriptions' },
    { value: 'CONSENT_FORM', label: 'Consent Forms' },
    { value: 'OTHER', label: 'Other' }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Patient Documents</h2>
          <p className="mt-1 text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''} for {patientName}
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Document
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-md ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {documentTypes.map(type => (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                filterType === type.value
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-md ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Upload Document</h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <DocumentUpload
                patientId={patientId}
                onUpload={handleUpload}
                onClose={() => setShowUploadModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Documents Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No documents</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by uploading a new document.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload Document
            </button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getTypeIcon(doc.type)}</span>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 line-clamp-1">{doc.title}</h3>
                      <p className="text-xs text-gray-500">{formatDate(doc.uploadDate)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded ${getTypeBadgeColor(doc.type)}`}>
                    {doc.type}
                  </span>
                </div>
                {doc.description && (
                  <p className="mt-2 text-sm text-gray-500 line-clamp-2">{doc.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    {formatFileSize(doc.fileSize)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <span className="text-xl mr-3">{getTypeIcon(doc.type)}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{doc.title}</div>
                        {doc.description && (
                          <div className="text-xs text-gray-500 line-clamp-1">{doc.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded ${getTypeBadgeColor(doc.type)}`}>
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatFileSize(doc.fileSize)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(doc.uploadDate)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 mr-4"
                    >
                      View
                    </a>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
