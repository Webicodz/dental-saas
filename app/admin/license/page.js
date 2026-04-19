'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LicenseManagementPage() {
  const router = useRouter()
  const [clinics, setClinics] = useState([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [generatedLicenses, setGeneratedLicenses] = useState([])
  const [formData, setFormData] = useState({
    licenseType: 'STANDARD',
    durationMonths: 12,
    clinicId: ''
  })

  useEffect(() => {
    fetchClinics()
  }, [])

  const fetchClinics = async () => {
    try {
      const res = await fetch('/api/admin/clinics')
      const data = await res.json()
      if (data.success) {
        setClinics(data.data.clinics)
      }
    } catch (err) {
      console.error('Failed to fetch clinics:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerate = async (e) => {
    e.preventDefault()
    setGenerating(true)
    
    try {
      const res = await fetch('/api/admin/license/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setGeneratedLicenses(data.data.licenses)
        fetchClinics() // Refresh to show updated license status
      } else {
        alert(data.error || 'Failed to generate license')
      }
    } catch (err) {
      alert('Failed to generate license')
    } finally {
      setGenerating(false)
    }
  }

  const getLicenseTypeColor = (type) => {
    const colors = {
      STANDARD: 'bg-blue-100 text-blue-800',
      PROFESSIONAL: 'bg-purple-100 text-purple-800',
      ENTERPRISE: 'bg-yellow-100 text-yellow-800'
    }
    return colors[type] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (status) => {
    return status === 'ACTIVE' 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">License Management</h1>
          <p className="text-gray-400 mt-1">Generate and manage clinic licenses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          + Generate License
        </button>
      </div>

      {/* License Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-3xl font-bold text-white">{clinics.length}</div>
          <div className="text-gray-400">Total Clinics</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-3xl font-bold text-green-500">
            {clinics.filter(c => c.licenseStatus === 'ACTIVE').length}
          </div>
          <div className="text-gray-400">Active Licenses</div>
        </div>
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="text-3xl font-bold text-yellow-500">
            {clinics.filter(c => c.licenseStatus === 'EXPIRED').length}
          </div>
          <div className="text-gray-400">Expired Licenses</div>
        </div>
      </div>

      {/* Clinics Table */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">Clinic Licenses</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Clinic</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">License Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Max Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">License Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {clinics.map((clinic) => (
                <tr key={clinic.id} className="hover:bg-gray-750">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-white">{clinic.name}</div>
                    <div className="text-sm text-gray-400">{clinic.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getLicenseTypeColor(clinic.licenseType)}`}>
                      {clinic.licenseType || 'NONE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(clinic.licenseStatus)}`}>
                      {clinic.licenseStatus || 'INACTIVE'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {formatDate(clinic.licenseExpiry)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {clinic.maxUsers || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                    {clinic.licenseKey || 'Not assigned'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {clinics.length === 0 && (
          <div className="p-8 text-center text-gray-400">
            No clinics found. Create a clinic first.
          </div>
        )}
      </div>

      {/* Generate License Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white mb-4">Generate New License</h2>
            
            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">License Type</label>
                <select
                  value={formData.licenseType}
                  onChange={(e) => setFormData({...formData, licenseType: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="STANDARD">Standard - {formatPrice(7999)}/year</option>
                  <option value="PROFESSIONAL">Professional - {formatPrice(12999)}/year</option>
                  <option value="ENTERPRISE">Enterprise - {formatPrice(19999)}/year</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Duration (Months)</label>
                <select
                  value={formData.durationMonths}
                  onChange={(e) => setFormData({...formData, durationMonths: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={6}>6 Months</option>
                  <option value={12}>12 Months</option>
                  <option value={24}>24 Months</option>
                  <option value={36}>36 Months</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Assign to Clinic (Optional)</label>
                <select
                  value={formData.clinicId}
                  onChange={(e) => setFormData({...formData, clinicId: e.target.value})}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Generate unused license key</option>
                  {clinics.map((clinic) => (
                    <option key={clinic.id} value={clinic.id}>{clinic.name}</option>
                  ))}
                </select>
              </div>

              {/* License Features Preview */}
              <div className="p-4 bg-gray-700 rounded-lg">
                <h3 className="text-sm font-medium text-white mb-2">Features Included:</h3>
                <ul className="text-xs text-gray-300 space-y-1">
                  <li>✓ SMS & Email Reminders</li>
                  <li>✓ Patient Portal</li>
                  {formData.licenseType !== 'STANDARD' && <li>✓ AI Chatbot</li>}
                  {formData.licenseType === 'ENTERPRISE' && <li>✓ Voice Agent</li>}
                  {formData.licenseType !== 'STANDARD' && <li>✓ Analytics</li>}
                  {formData.licenseType === 'ENTERPRISE' && <li>✓ Multi-Location</li>}
                </ul>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setGeneratedLicenses([])
                  }}
                  className="flex-1 px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate License'}
                </button>
              </div>
            </form>

            {/* Generated License Display */}
            {generatedLicenses.length > 0 && (
              <div className="mt-6 p-4 bg-green-500/10 border border-green-500 rounded-lg">
                <h3 className="text-sm font-medium text-green-400 mb-2">License Generated Successfully!</h3>
                <div className="space-y-2">
                  {generatedLicenses.map((license, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="text-gray-400">License Key:</div>
                      <div className="font-mono text-white">{license.licenseKey}</div>
                      <div className="text-gray-400 mt-1">Activation Code:</div>
                      <div className="font-mono text-white">{license.activationCode}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
