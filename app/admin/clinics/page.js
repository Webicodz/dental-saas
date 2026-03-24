'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function ClinicsPage() {
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 })
  
  // Filters
  const [search, setSearch] = useState('')
  const [licenseStatus, setLicenseStatus] = useState('')
  const [licenseType, setLicenseType] = useState('')
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedClinic, setSelectedClinic] = useState(null)
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Create form state
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    licenseType: 'STANDARD',
    adminEmail: '',
    adminPassword: ''
  })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    fetchClinics()
  }, [pagination.page, search, licenseStatus, licenseType])

  const fetchClinics = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit
      })
      if (search) params.append('search', search)
      if (licenseStatus) params.append('licenseStatus', licenseStatus)
      if (licenseType) params.append('licenseType', licenseType)

      const res = await fetch(`/api/admin/clinics?${params}`)
      const result = await res.json()
      
      if (result.success) {
        setClinics(result.data.clinics)
        setPagination(prev => ({
          ...prev,
          total: result.data.pagination.total,
          totalPages: result.data.pagination.totalPages
        }))
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError('Failed to load clinics')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateClinic = async (e) => {
    e.preventDefault()
    setCreating(true)
    
    try {
      const res = await fetch('/api/admin/clinics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })
      const result = await res.json()
      
      if (result.success) {
        setShowCreateModal(false)
        setCreateForm({
          name: '', email: '', phone: '', address: '', city: '', state: '',
          licenseType: 'STANDARD', adminEmail: '', adminPassword: ''
        })
        fetchClinics()
      } else {
        alert(result.error)
      }
    } catch (err) {
      alert('Failed to create clinic')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteClinic = async () => {
    if (!selectedClinic) return
    
    try {
      const res = await fetch(`/api/admin/clinics/${selectedClinic.id}?confirm=true`, {
        method: 'DELETE'
      })
      const result = await res.json()
      
      if (result.success) {
        setShowDeleteConfirm(false)
        setSelectedClinic(null)
        fetchClinics()
      } else {
        alert(result.error)
      }
    } catch (err) {
      alert('Failed to delete clinic')
    }
  }

  const viewClinicDetails = async (clinic) => {
    setSelectedClinic(clinic)
    setShowDetailsDrawer(true)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800'
      case 'EXPIRED': return 'bg-red-100 text-red-800'
      case 'SUSPENDED': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLicenseTypeColor = (type) => {
    switch (type) {
      case 'ENTERPRISE': return 'bg-purple-100 text-purple-800'
      case 'PROFESSIONAL': return 'bg-blue-100 text-blue-800'
      case 'STANDARD': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Clinic Management</h1>
          <p className="mt-1 text-sm text-gray-400">Manage all clinics on the platform</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create Clinic
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search clinics..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPagination(prev => ({ ...prev, page: 1 }))
              }}
              className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* License Status Filter */}
          <select
            value={licenseStatus}
            onChange={(e) => {
              setLicenseStatus(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="EXPIRED">Expired</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* License Type Filter */}
          <select
            value={licenseType}
            onChange={(e) => {
              setLicenseType(e.target.value)
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            <option value="STANDARD">Standard</option>
            <option value="PROFESSIONAL">Professional</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>

          {/* Reset Filters */}
          <button
            onClick={() => {
              setSearch('')
              setLicenseStatus('')
              setLicenseType('')
              setPagination(prev => ({ ...prev, page: 1 }))
            }}
            className="px-4 py-2 bg-gray-700 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : clinics.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-300">No clinics found</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Clinic
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      License
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Stats
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Created
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {clinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-gray-700/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-lg bg-indigo-600/30 flex items-center justify-center text-indigo-400 font-semibold">
                            {clinic.name[0]}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{clinic.name}</div>
                            <div className="text-xs text-gray-400">{clinic.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getLicenseTypeColor(clinic.licenseType)}`}>
                          {clinic.licenseType}
                        </span>
                        <div className="text-xs text-gray-500 mt-1 font-mono">{clinic.licenseKey}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(clinic.licenseStatus)}`}>
                          {clinic.licenseStatus}
                        </span>
                        {clinic.licenseExpiry && (
                          <div className="text-xs text-gray-500 mt-1">
                            Expires: {new Date(clinic.licenseExpiry).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white">{clinic.stats.userCount} Users</div>
                        <div className="text-xs text-gray-400">{clinic.stats.patientCount} Patients</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {new Date(clinic.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => viewClinicDetails(clinic)}
                            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                            title="View Details"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <Link
                            href={`/admin/clinics/${clinic.id}`}
                            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700 transition-colors"
                            title="Edit Clinic"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => {
                              setSelectedClinic(clinic)
                              setShowDeleteConfirm(true)
                            }}
                            className="p-2 text-red-400 hover:text-red-300 rounded-lg hover:bg-red-900/30 transition-colors"
                            title="Delete Clinic"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-700 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                    disabled={pagination.page === 1}
                    className="px-3 py-1 bg-gray-700 text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                    disabled={pagination.page === pagination.totalPages}
                    className="px-3 py-1 bg-gray-700 text-white text-sm rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Clinic Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={() => setShowCreateModal(false)} />
            
            <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleCreateClinic}>
                <div className="px-6 py-4 border-b border-gray-700">
                  <h3 className="text-lg font-medium text-white">Create New Clinic</h3>
                </div>
                
                <div className="px-6 py-4 max-h-96 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Clinic Name *</label>
                      <input
                        type="text"
                        required
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Phone *</label>
                      <input
                        type="tel"
                        required
                        value={createForm.phone}
                        onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Address *</label>
                      <input
                        type="text"
                        required
                        value={createForm.address}
                        onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">City</label>
                      <input
                        type="text"
                        value={createForm.city}
                        onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">State</label>
                      <input
                        type="text"
                        value={createForm.state}
                        onChange={(e) => setCreateForm({ ...createForm, state: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">License Type</label>
                      <select
                        value={createForm.licenseType}
                        onChange={(e) => setCreateForm({ ...createForm, licenseType: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="STANDARD">Standard</option>
                        <option value="PROFESSIONAL">Professional</option>
                        <option value="ENTERPRISE">Enterprise</option>
                      </select>
                    </div>
                    <div className="col-span-2 pt-4 border-t border-gray-700">
                      <h4 className="text-sm font-medium text-white mb-3">Admin User (Optional)</h4>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Admin Email</label>
                      <input
                        type="email"
                        value={createForm.adminEmail}
                        onChange={(e) => setCreateForm({ ...createForm, adminEmail: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Admin Password</label>
                      <input
                        type="password"
                        value={createForm.adminPassword}
                        onChange={(e) => setCreateForm({ ...createForm, adminPassword: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="px-6 py-4 bg-gray-700/50 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Clinic'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedClinic && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-gray-900/75 transition-opacity" onClick={() => setShowDeleteConfirm(false)} />
            
            <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:max-w-md sm:w-full">
              <div className="px-6 py-4">
                <div className="flex items-center mb-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-900/30">
                    <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-lg font-medium text-white text-center">Delete Clinic</h3>
                <p className="mt-2 text-sm text-gray-400 text-center">
                  Are you sure you want to delete <strong className="text-white">{selectedClinic.name}</strong>?
                  This will permanently delete all associated users, patients, appointments, and data.
                </p>
              </div>
              <div className="px-6 py-4 bg-gray-700/50 flex items-center justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false)
                    setSelectedClinic(null)
                  }}
                  className="px-4 py-2 text-gray-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteClinic}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  Delete Permanently
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
