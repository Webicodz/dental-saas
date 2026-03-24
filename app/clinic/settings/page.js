/**
 * CLINIC SETTINGS PAGE
 * 
 * Page for clinic administrators to manage clinic settings.
 * Includes business info, branding, preferences, and business hours.
 * 
 * IN CODEIGNITER:
 * Like: application/views/admin/settings.php
 * 
 * PERMISSIONS:
 * - ADMIN: Full access to settings
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProtectedRoute from '@/components/ProtectedRoute'

// Timezone options
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Toronto', label: 'Toronto (ET)' },
  { value: 'America/Vancouver', label: 'Vancouver (PT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Europe/Berlin', label: 'Berlin (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Karachi', label: 'Karachi (PKT)' },
  { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (IST)' },
  { value: 'Asia/Manila', label: 'Manila (PHT)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' },
  { value: 'Pacific/Auckland', label: 'Auckland (NZST)' }
]

// Currency options
const CURRENCIES = [
  { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { value: 'GBP', label: 'British Pound (GBP)', symbol: '£' },
  { value: 'CAD', label: 'Canadian Dollar (CAD)', symbol: 'C$' },
  { value: 'AUD', label: 'Australian Dollar (AUD)', symbol: 'A$' },
  { value: 'INR', label: 'Indian Rupee (INR)', symbol: '₹' },
  { value: 'PKR', label: 'Pakistani Rupee (PKR)', symbol: '₨' },
  { value: 'PHP', label: 'Philippine Peso (PHP)', symbol: '₱' },
  { value: 'MYR', label: 'Malaysian Ringgit (MYR)', symbol: 'RM' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)', symbol: 'S$' }
]

// Days of week
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
}

export default function ClinicSettingsPage() {
  const [user, setUser] = useState(null)
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [activeTab, setActiveTab] = useState('general')

  const router = useRouter()

  // Check admin access
  useEffect(() => {
    const checkAccess = async () => {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        const data = await res.json()
        
        if (!data.success || data.user.role !== 'ADMIN') {
          router.push('/dashboard')
          return
        }
        
        setUser(data.user)
        fetchSettings()
      } catch (err) {
        console.error('Auth check error:', err)
        router.push('/login')
      }
    }

    checkAccess()
  }, [router])

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      
      const res = await fetch('/api/clinic/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      
      if (data.success) {
        setSettings(data.settings)
      } else {
        setError(data.error)
      }
    } catch (err) {
      console.error('Fetch settings error:', err)
      setError('Failed to fetch settings')
    } finally {
      setLoading(false)
    }
  }

  // Save settings
  const saveSettings = async (updates) => {
    try {
      setSaving(true)
      setError(null)
      setSuccess(null)
      
      const token = localStorage.getItem('token')
      
      const res = await fetch('/api/clinic/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      })
      
      const data = await res.json()
      
      if (data.success) {
        setSettings({ ...settings, ...data.settings })
        setSuccess('Settings saved successfully!')
        setTimeout(() => setSuccess(null), 3000)
      } else {
        setError(data.error || data.details?.join(', ') || 'Failed to save')
      }
    } catch (err) {
      console.error('Save settings error:', err)
      setError('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  // Update local state
  const updateSetting = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading settings...</p>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Clinic Settings</h1>
            <p style={styles.subtitle}>Manage your clinic's configuration and preferences</p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div style={styles.successAlert}>
            ✓ {success}
          </div>
        )}
        {error && (
          <div style={styles.errorAlert}>
            ✗ {error}
          </div>
        )}

        {/* Tabs */}
        <div style={styles.tabs}>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'general' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('general')}
          >
            🏢 General
          </button>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'branding' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('branding')}
          >
            🎨 Branding
          </button>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'preferences' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('preferences')}
          >
            ⚙️ Preferences
          </button>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'hours' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('hours')}
          >
            🕐 Business Hours
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === 'general' && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Business Information</h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Clinic Name *</label>
                  <input
                    type="text"
                    value={settings?.name || ''}
                    onChange={(e) => updateSetting('name', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Email *</label>
                  <input
                    type="email"
                    value={settings?.email || ''}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Phone</label>
                  <input
                    type="tel"
                    value={settings?.phone || ''}
                    onChange={(e) => updateSetting('phone', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Address</label>
                  <input
                    type="text"
                    value={settings?.address || ''}
                    onChange={(e) => updateSetting('address', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>City</label>
                  <input
                    type="text"
                    value={settings?.city || ''}
                    onChange={(e) => updateSetting('city', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>State/Province</label>
                  <input
                    type="text"
                    value={settings?.state || ''}
                    onChange={(e) => updateSetting('state', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>ZIP/Postal Code</label>
                  <input
                    type="text"
                    value={settings?.zipCode || ''}
                    onChange={(e) => updateSetting('zipCode', e.target.value)}
                    style={styles.input}
                  />
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Country</label>
                  <input
                    type="text"
                    value={settings?.country || ''}
                    onChange={(e) => updateSetting('country', e.target.value)}
                    style={styles.input}
                  />
                </div>
              </div>
              
              <button 
                style={styles.saveBtn}
                onClick={() => saveSettings({
                  name: settings.name,
                  email: settings.email,
                  phone: settings.phone,
                  address: settings.address,
                  city: settings.city,
                  state: settings.state,
                  zipCode: settings.zipCode,
                  country: settings.country
                })}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'branding' && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Branding & Appearance</h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Logo URL</label>
                  <input
                    type="url"
                    value={settings?.logoUrl || ''}
                    onChange={(e) => updateSetting('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.png"
                    style={styles.input}
                  />
                  <small style={styles.hint}>Enter the URL of your clinic's logo image</small>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Primary Color</label>
                  <div style={styles.colorInput}>
                    <input
                      type="color"
                      value={settings?.primaryColor || '#2563eb'}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      style={styles.colorPicker}
                    />
                    <input
                      type="text"
                      value={settings?.primaryColor || '#2563eb'}
                      onChange={(e) => updateSetting('primaryColor', e.target.value)}
                      style={styles.colorText}
                    />
                  </div>
                  <div 
                    style={{...styles.colorPreview, backgroundColor: settings?.primaryColor || '#2563eb'}}
                  ></div>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Secondary Color</label>
                  <div style={styles.colorInput}>
                    <input
                      type="color"
                      value={settings?.secondaryColor || '#7c3aed'}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      style={styles.colorPicker}
                    />
                    <input
                      type="text"
                      value={settings?.secondaryColor || '#7c3aed'}
                      onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                      style={styles.colorText}
                    />
                  </div>
                  <div 
                    style={{...styles.colorPreview, backgroundColor: settings?.secondaryColor || '#7c3aed'}}
                  ></div>
                </div>
              </div>
              
              <button 
                style={styles.saveBtn}
                onClick={() => saveSettings({
                  logoUrl: settings.logoUrl,
                  primaryColor: settings.primaryColor,
                  secondaryColor: settings.secondaryColor
                })}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Regional & Display Preferences</h3>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Timezone</label>
                  <select
                    value={settings?.timezone || 'America/New_York'}
                    onChange={(e) => updateSetting('timezone', e.target.value)}
                    style={styles.select}
                  >
                    {TIMEZONES.map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Currency</label>
                  <select
                    value={settings?.currency || 'USD'}
                    onChange={(e) => updateSetting('currency', e.target.value)}
                    style={styles.select}
                  >
                    {CURRENCIES.map(curr => (
                      <option key={curr.value} value={curr.value}>{curr.label}</option>
                    ))}
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Date Format</label>
                  <select
                    value={settings?.dateFormat || 'MM/DD/YYYY'}
                    onChange={(e) => updateSetting('dateFormat', e.target.value)}
                    style={styles.select}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </select>
                </div>
                
                <div style={styles.formGroup}>
                  <label style={styles.label}>Time Format</label>
                  <select
                    value={settings?.timeFormat || '12h'}
                    onChange={(e) => updateSetting('timeFormat', e.target.value)}
                    style={styles.select}
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>
              </div>
              
              <button 
                style={styles.saveBtn}
                onClick={() => saveSettings({
                  timezone: settings.timezone,
                  currency: settings.currency,
                  dateFormat: settings.dateFormat,
                  timeFormat: settings.timeFormat
                })}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}

          {activeTab === 'hours' && (
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Business Hours</h3>
              <p style={styles.sectionDesc}>
                Set your clinic's operating hours for each day of the week.
              </p>
              
              <div style={styles.hoursGrid}>
                {DAYS.map(day => {
                  const hours = settings?.businessHours?.[day] || { start: '09:00', end: '17:00', closed: false }
                  return (
                    <div key={day} style={styles.dayRow}>
                      <div style={styles.dayLabel}>
                        <span style={styles.dayName}>{DAY_LABELS[day]}</span>
                      </div>
                      <div style={styles.dayControls}>
                        <label style={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={hours.closed}
                            onChange={(e) => {
                              const newHours = { ...settings.businessHours }
                              newHours[day] = { ...hours, closed: e.target.checked }
                              updateSetting('businessHours', newHours)
                            }}
                            style={styles.checkbox}
                          />
                          Closed
                        </label>
                        {!hours.closed && (
                          <div style={styles.timeInputs}>
                            <input
                              type="time"
                              value={hours.start}
                              onChange={(e) => {
                                const newHours = { ...settings.businessHours }
                                newHours[day] = { ...hours, start: e.target.value }
                                updateSetting('businessHours', newHours)
                              }}
                              style={styles.timeInput}
                            />
                            <span style={styles.timeSeparator}>to</span>
                            <input
                              type="time"
                              value={hours.end}
                              onChange={(e) => {
                                const newHours = { ...settings.businessHours }
                                newHours[day] = { ...hours, end: e.target.value }
                                updateSetting('businessHours', newHours)
                              }}
                              style={styles.timeInput}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <button 
                style={styles.saveBtn}
                onClick={() => saveSettings({
                  businessHours: settings.businessHours
                })}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          )}
        </div>

        {/* License Info */}
        {settings?.license && (
          <div style={styles.licenseInfo}>
            <h3 style={styles.licenseTitle}>License Information</h3>
            <div style={styles.licenseGrid}>
              <div>
                <span style={styles.licenseLabel}>License Type</span>
                <span style={styles.licenseValue}>{settings.license.type}</span>
              </div>
              <div>
                <span style={styles.licenseLabel}>Status</span>
                <span style={{
                  ...styles.licenseValue,
                  color: settings.license.status === 'ACTIVE' ? '#059669' : '#dc2626'
                }}>
                  {settings.license.status}
                </span>
              </div>
              <div>
                <span style={styles.licenseLabel}>Expiry</span>
                <span style={styles.licenseValue}>
                  {settings.license.expiry 
                    ? new Date(settings.license.expiry).toLocaleDateString()
                    : 'Lifetime'
                  }
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

// Styles
const styles = {
  container: {
    padding: '24px',
    maxWidth: '900px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '24px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0 0'
  },
  successAlert: {
    backgroundColor: '#d1fae5',
    color: '#059669',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  errorAlert: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  },
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '24px',
    backgroundColor: '#f3f4f6',
    padding: '4px',
    borderRadius: '12px'
  },
  tab: {
    flex: 1,
    padding: '12px 16px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '14px',
    fontWeight: '500',
    color: '#6b7280',
    cursor: 'pointer',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  tabActive: {
    backgroundColor: 'white',
    color: '#1f2937',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tabContent: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px'
  },
  sectionDesc: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
    marginBottom: '24px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  formGroupFull: {
    gridColumn: 'span 2',
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  },
  select: {
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  hint: {
    fontSize: '12px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  colorInput: {
    display: 'flex',
    gap: '8px'
  },
  colorPicker: {
    width: '50px',
    height: '40px',
    padding: 0,
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  colorText: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'monospace'
  },
  colorPreview: {
    width: '100%',
    height: '30px',
    borderRadius: '6px',
    marginTop: '8px'
  },
  hoursGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px'
  },
  dayRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  dayLabel: {
    flex: '0 0 120px'
  },
  dayName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937'
  },
  dayControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '13px',
    color: '#6b7280',
    cursor: 'pointer'
  },
  checkbox: {
    width: '16px',
    height: '16px'
  },
  timeInputs: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  timeInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  },
  timeSeparator: {
    fontSize: '13px',
    color: '#6b7280'
  },
  saveBtn: {
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  licenseInfo: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb'
  },
  licenseTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px'
  },
  licenseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px'
  },
  licenseLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px'
  },
  licenseValue: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937'
  },
  loadingContainer: {
    padding: '60px',
    textAlign: 'center',
    color: '#6b7280'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #e5e7eb',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px'
  }
}
