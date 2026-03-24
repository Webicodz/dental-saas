'use client'

import { useState, useEffect } from 'react'

export default function DentalHistoryForm({ patientId, patientName, onSave }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [history, setHistory] = useState({
    previousTreatments: [],
    dentalIssues: [],
    currentSymptoms: [],
    oralHygiene: {
      brushingFrequency: '',
      flossingFrequency: '',
      mouthwash: false
    },
    lastDentalVisit: '',
    notes: ''
  })

  // New item inputs
  const [newTreatment, setNewTreatment] = useState('')
  const [newIssue, setNewIssue] = useState('')
  const [newSymptom, setNewSymptom] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [patientId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${patientId}/history`)
      
      if (!response.ok) throw new Error('Failed to fetch history')

      const data = await response.json()
      if (data.history && data.history.dentalHistory) {
        setHistory(prev => ({
          ...prev,
          ...data.history.dentalHistory,
          oralHygiene: {
            ...prev.oralHygiene,
            ...(data.history.dentalHistory.oralHygiene || {})
          }
        }))
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field, value) => {
    setHistory(prev => ({ ...prev, [field]: value }))
  }

  const handleHygieneChange = (field, value) => {
    setHistory(prev => ({
      ...prev,
      oralHygiene: {
        ...prev.oralHygiene,
        [field]: value
      }
    }))
  }

  const addItem = (field, value, setValue) => {
    if (!value.trim()) return
    setHistory(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), value.trim()]
    }))
    setValue('')
  }

  const removeItem = (field, index) => {
    setHistory(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    const result = await onSave({ dentalHistory: history })

    if (result.success) {
      setMessage({ type: 'success', text: 'Dental history saved successfully!' })
    } else {
      setMessage({ type: 'error', text: result.error })
    }

    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Dental History</h2>
          <p className="mt-1 text-sm text-gray-500">Patient: {patientName}</p>
        </div>

        {message && (
          <div className={`mx-6 mt-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Last Dental Visit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Last Dental Visit</label>
            <input
              type="date"
              value={history.lastDentalVisit || ''}
              onChange={(e) => handleChange('lastDentalVisit', e.target.value)}
              className="block w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Oral Hygiene */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Oral Hygiene Habits</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brushing Frequency</label>
                <select
                  value={history.oralHygiene?.brushingFrequency || ''}
                  onChange={(e) => handleHygieneChange('brushingFrequency', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="ONCE">Once daily</option>
                  <option value="TWICE">Twice daily</option>
                  <option value="THRICE">Three times daily</option>
                  <option value="MORE">More than three times</option>
                  <option value="RARELY">Rarely</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Flossing Frequency</label>
                <select
                  value={history.oralHygiene?.flossingFrequency || ''}
                  onChange={(e) => handleHygieneChange('flossingFrequency', e.target.value)}
                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select</option>
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">A few times a week</option>
                  <option value="OCCASIONALLY">Occasionally</option>
                  <option value="NEVER">Never</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Uses Mouthwash</label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={history.oralHygiene?.mouthwash || false}
                      onChange={(e) => handleHygieneChange('mouthwash', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Yes</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Previous Dental Treatments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Previous Dental Treatments</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newTreatment}
                onChange={(e) => setNewTreatment(e.target.value)}
                placeholder="Add treatment (e.g., Root Canal - Upper Right Molar, 2023)"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('previousTreatments', newTreatment, setNewTreatment))}
              />
              <button
                type="button"
                onClick={() => addItem('previousTreatments', newTreatment, setNewTreatment)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {(history.previousTreatments || []).map((treatment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-md"
                >
                  <span className="text-sm text-gray-700">{treatment}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('previousTreatments', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {(!history.previousTreatments || history.previousTreatments.length === 0) && (
                <p className="text-sm text-gray-500">No previous treatments recorded</p>
              )}
            </div>
          </div>

          {/* Previous Dental Issues */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Previous Dental Issues</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newIssue}
                onChange={(e) => setNewIssue(e.target.value)}
                placeholder="Add issue (e.g., Gum recession, Teeth grinding)"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('dentalIssues', newIssue, setNewIssue))}
              />
              <button
                type="button"
                onClick={() => addItem('dentalIssues', newIssue, setNewIssue)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(history.dentalIssues || []).map((issue, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                >
                  {issue}
                  <button
                    type="button"
                    onClick={() => removeItem('dentalIssues', index)}
                    className="ml-2 text-orange-600 hover:text-orange-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {(!history.dentalIssues || history.dentalIssues.length === 0) && (
                <p className="text-sm text-gray-500">No previous issues recorded</p>
              )}
            </div>
          </div>

          {/* Current Symptoms */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Symptoms / Concerns</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                placeholder="Add symptom (e.g., Sensitivity to cold, Jaw pain)"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('currentSymptoms', newSymptom, setNewSymptom))}
              />
              <button
                type="button"
                onClick={() => addItem('currentSymptoms', newSymptom, setNewSymptom)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {(history.currentSymptoms || []).map((symptom, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-red-50 rounded-md"
                >
                  <span className="text-sm text-gray-700">{symptom}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('currentSymptoms', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {(!history.currentSymptoms || history.currentSymptoms.length === 0) && (
                <p className="text-sm text-gray-500">No current symptoms recorded</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Additional Notes</label>
            <textarea
              value={history.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={4}
              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Any additional dental information, fears, preferences..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Dental History'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
