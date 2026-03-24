'use client'

import { useState, useEffect } from 'react'

export default function MedicalHistoryForm({ patientId, patientName, onSave }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [history, setHistory] = useState({
    allergies: [],
    medications: [],
    conditions: [],
    surgeries: [],
    familyHistory: [],
    bloodType: '',
    notes: ''
  })

  // New item inputs
  const [newAllergy, setNewAllergy] = useState('')
  const [newMedication, setNewMedication] = useState('')
  const [newCondition, setNewCondition] = useState('')
  const [newSurgery, setNewSurgery] = useState('')
  const [newFamilyHistory, setNewFamilyHistory] = useState('')

  useEffect(() => {
    fetchHistory()
  }, [patientId])

  const fetchHistory = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/patients/${patientId}/history`)
      
      if (!response.ok) throw new Error('Failed to fetch history')

      const data = await response.json()
      if (data.history && data.history.medicalHistory) {
        setHistory(data.history.medicalHistory)
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

    const result = await onSave({ medicalHistory: history })

    if (result.success) {
      setMessage({ type: 'success', text: 'Medical history saved successfully!' })
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
          <h2 className="text-xl font-semibold text-gray-900">Medical History</h2>
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
          {/* Blood Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Blood Type</label>
            <select
              value={history.bloodType || ''}
              onChange={(e) => handleChange('bloodType', e.target.value)}
              className="block w-full max-w-xs border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="UNKNOWN">Unknown</option>
            </select>
          </div>

          {/* Allergies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Allergies</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Add allergy (e.g., Penicillin)"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('allergies', newAllergy, setNewAllergy))}
              />
              <button
                type="button"
                onClick={() => addItem('allergies', newAllergy, setNewAllergy)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(history.allergies || []).map((allergy, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-red-100 text-red-800"
                >
                  {allergy}
                  <button
                    type="button"
                    onClick={() => removeItem('allergies', index)}
                    className="ml-2 text-red-600 hover:text-red-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {(!history.allergies || history.allergies.length === 0) && (
                <p className="text-sm text-gray-500">No allergies recorded</p>
              )}
            </div>
          </div>

          {/* Current Medications */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Medications</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Add medication (e.g., Aspirin 81mg daily)"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('medications', newMedication, setNewMedication))}
              />
              <button
                type="button"
                onClick={() => addItem('medications', newMedication, setNewMedication)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {(history.medications || []).map((medication, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                >
                  <span className="text-sm text-gray-700">{medication}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('medications', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {(!history.medications || history.medications.length === 0) && (
                <p className="text-sm text-gray-500">No medications recorded</p>
              )}
            </div>
          </div>

          {/* Medical Conditions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Add condition (e.g., Hypertension)"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('conditions', newCondition, setNewCondition))}
              />
              <button
                type="button"
                onClick={() => addItem('conditions', newCondition, setNewCondition)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {(history.conditions || []).map((condition, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800"
                >
                  {condition}
                  <button
                    type="button"
                    onClick={() => removeItem('conditions', index)}
                    className="ml-2 text-yellow-600 hover:text-yellow-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {(!history.conditions || history.conditions.length === 0) && (
                <p className="text-sm text-gray-500">No conditions recorded</p>
              )}
            </div>
          </div>

          {/* Previous Surgeries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Previous Surgeries</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSurgery}
                onChange={(e) => setNewSurgery(e.target.value)}
                placeholder="Add surgery (e.g., Appendectomy 2015)"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('surgeries', newSurgery, setNewSurgery))}
              />
              <button
                type="button"
                onClick={() => addItem('surgeries', newSurgery, setNewSurgery)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {(history.surgeries || []).map((surgery, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                >
                  <span className="text-sm text-gray-700">{surgery}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('surgeries', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {(!history.surgeries || history.surgeries.length === 0) && (
                <p className="text-sm text-gray-500">No surgeries recorded</p>
              )}
            </div>
          </div>

          {/* Family History */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Family Medical History</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFamilyHistory}
                onChange={(e) => setNewFamilyHistory(e.target.value)}
                placeholder="Add family history (e.g., Father - Diabetes)"
                className="flex-1 border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addItem('familyHistory', newFamilyHistory, setNewFamilyHistory))}
              />
              <button
                type="button"
                onClick={() => addItem('familyHistory', newFamilyHistory, setNewFamilyHistory)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <div className="space-y-2">
              {(history.familyHistory || []).map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-md"
                >
                  <span className="text-sm text-gray-700">{item}</span>
                  <button
                    type="button"
                    onClick={() => removeItem('familyHistory', index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    &times;
                  </button>
                </div>
              ))}
              {(!history.familyHistory || history.familyHistory.length === 0) && (
                <p className="text-sm text-gray-500">No family history recorded</p>
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
              placeholder="Any additional medical information..."
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Medical History'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
