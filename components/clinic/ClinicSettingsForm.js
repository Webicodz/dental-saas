/**
 * CLINIC SETTINGS FORM COMPONENT
 * 
 * Form component for editing clinic settings.
 * Includes business info, branding, preferences, and business hours.
 * 
 * IN CODEIGNITER:
 * Like: application/views/forms/clinic_settings.php
 */

'use client'

import { useState, useEffect } from 'react'

// Configuration options
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Toronto', label: 'Toronto (ET)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Asia/Dubai', label: 'Dubai (GST)' },
  { value: 'Asia/Karachi', label: 'Karachi (PKT)' },
  { value: 'Asia/Kolkata', label: 'Mumbai/Delhi (IST)' },
  { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
  { value: 'Australia/Sydney', label: 'Sydney (AEST)' }
]

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

export default function ClinicSettingsForm({ initialData, onSave, loading = false }) {
  const [settings, setSettings] = useState({
    // Basic
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    // Branding
    logoUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#7c3aed',
    // Preferences
    timezone: 'America/New_York',
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    // Business hours
    businessHours: {}
  })
  const [activeTab, setActiveTab] = useState('general')
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize with data
  useEffect(() => {
    if (initialData) {
      setSettings({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
        city: initialData.city || '',
        state: initialData.state || '',
        zipCode: initialData.zipCode || '',
        country: initialData.country || 'US',
        logoUrl: initialData.logoUrl || '',
        primaryColor: initialData.primaryColor || '#2563eb',
        secondaryColor: initialData.secondaryColor || '#7c3aed',
        timezone: initialData.timezone || 'America/New_York',
        currency: initialData.currency || 'USD',
        dateFormat: initialData.dateFormat || 'MM/DD/YYYY',
        timeFormat: initialData.timeFormat || '12h',
        businessHours: initialData.businessHours || {}
      })
    }
  }, [initialData])

  // Track changes
  useEffect(() => {
    setHasChanges(true)
  }, [settings])

  // Handle setting change
  const updateSetting = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  // Handle business hours change
  const updateBusinessHours = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: {
          ...prev.businessHours[day],
          [field]: value
        }
      }
    }))
  }

  // Handle save
  const handleSave = () => {
    if (onSave) {
      onSave(settings)
    }
  }

  // Tab configuration
  const tabs = [
    { id: 'general', label: 'General', icon: '🏢' },
    { id: 'branding', label: 'Branding', icon: '🎨' },
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'hours', label: 'Hours', icon: '🕐' }
  ]

  return (
    <div style={styles.container}>
      {/* Tabs */}
      <div style={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            style={{
              ...styles.tab,
              ...(activeTab === tab.id ? styles.tabActive : {})
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            <span style={styles.tabIcon}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={styles.tabContent}>
        {/* General Tab */}
        {activeTab === 'general' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Business Information</h3>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Clinic Name</label>
                <input
                  type="text"
                  value={settings.name}
                  onChange={(e) => updateSetting('name', e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => updateSetting('email', e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>Phone</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => updateSetting('phone', e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={{ ...styles.field, gridColumn: 'span 2' }}>
                <label style={styles.label}>Address</label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => updateSetting('address', e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>City</label>
                <input
                  type="text"
                  value={settings.city}
                  onChange={(e) => updateSetting('city', e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>State/Province</label>
                <input
                  type="text"
                  value={settings.state}
                  onChange={(e) => updateSetting('state', e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>ZIP/Postal Code</label>
                <input
                  type="text"
                  value={settings.zipCode}
                  onChange={(e) => updateSetting('zipCode', e.target.value)}
                  style={styles.input}
                />
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>Country</label>
                <input
                  type="text"
                  value={settings.country}
                  onChange={(e) => updateSetting('country', e.target.value)}
                  style={styles.input}
                />
              </div>
            </div>
          </div>
        )}

        {/* Branding Tab */}
        {activeTab === 'branding' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Branding & Appearance</h3>
            <div style={styles.grid}>
              <div style={{ ...styles.field, gridColumn: 'span 2' }}>
                <label style={styles.label}>Logo URL</label>
                <input
                  type="url"
                  value={settings.logoUrl}
                  onChange={(e) => updateSetting('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  style={styles.input}
                />
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>Primary Color</label>
                <div style={styles.colorRow}>
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    style={styles.colorPicker}
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => updateSetting('primaryColor', e.target.value)}
                    style={styles.colorInput}
                  />
                </div>
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>Secondary Color</label>
                <div style={styles.colorRow}>
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                    style={styles.colorPicker}
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => updateSetting('secondaryColor', e.target.value)}
                    style={styles.colorInput}
                  />
                </div>
              </div>
              
              <div style={styles.field}>
                <div 
                  style={{...styles.colorPreview, backgroundColor: settings.primaryColor}}
                ></div>
                <span style={styles.colorLabel}>Primary Preview</span>
              </div>
              
              <div style={styles.field}>
                <div 
                  style={{...styles.colorPreview, backgroundColor: settings.secondaryColor}}
                ></div>
                <span style={styles.colorLabel}>Secondary Preview</span>
              </div>
            </div>
          </div>
        )}

        {/* Preferences Tab */}
        {activeTab === 'preferences' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Regional & Display Preferences</h3>
            <div style={styles.grid}>
              <div style={styles.field}>
                <label style={styles.label}>Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => updateSetting('timezone', e.target.value)}
                  style={styles.select}
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                  ))}
                </select>
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => updateSetting('currency', e.target.value)}
                  style={styles.select}
                >
                  {CURRENCIES.map(curr => (
                    <option key={curr.value} value={curr.value}>{curr.label}</option>
                  ))}
                </select>
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>Date Format</label>
                <select
                  value={settings.dateFormat}
                  onChange={(e) => updateSetting('dateFormat', e.target.value)}
                  style={styles.select}
                >
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                </select>
              </div>
              
              <div style={styles.field}>
                <label style={styles.label}>Time Format</label>
                <select
                  value={settings.timeFormat}
                  onChange={(e) => updateSetting('timeFormat', e.target.value)}
                  style={styles.select}
                >
                  <option value="12h">12-hour (AM/PM)</option>
                  <option value="24h">24-hour</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Hours Tab */}
        {activeTab === 'hours' && (
          <div style={styles.section}>
            <h3 style={styles.sectionTitle}>Business Hours</h3>
            <p style={styles.sectionDesc}>
              Set your clinic's operating hours for each day.
            </p>
            
            <div style={styles.hoursList}>
              {DAYS.map(day => {
                const hours = settings.businessHours?.[day] || { 
                  start: '09:00', 
                  end: '17:00', 
                  closed: false 
                }
                
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
                          onChange={(e) => updateBusinessHours(day, 'closed', e.target.checked)}
                          style={styles.checkbox}
                        />
                        Closed
                      </label>
                      {!hours.closed && (
                        <div style={styles.timeInputs}>
                          <input
                            type="time"
                            value={hours.start}
                            onChange={(e) => updateBusinessHours(day, 'start', e.target.value)}
                            style={styles.timeInput}
                          />
                          <span style={styles.timeSeparator}>to</span>
                          <input
                            type="time"
                            value={hours.end}
                            onChange={(e) => updateBusinessHours(day, 'end', e.target.value)}
                            style={styles.timeInput}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div style={styles.footer}>
        <button 
          style={styles.saveBtn}
          onClick={handleSave}
          disabled={loading || !hasChanges}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

// Styles
const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  tabs: {
    display: 'flex',
    backgroundColor: '#f3f4f6',
    padding: '4px'
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: '8px',
    transition: 'all 0.2s'
  },
  tabActive: {
    backgroundColor: 'white',
    color: '#1f2937',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tabIcon: {
    fontSize: '16px'
  },
  tabContent: {
    padding: '24px'
  },
  section: {
    marginBottom: '24px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '20px'
  },
  sectionDesc: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '20px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px'
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151'
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
  colorRow: {
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
  colorInput: {
    flex: 1,
    padding: '10px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    fontFamily: 'monospace'
  },
  colorPreview: {
    width: '100%',
    height: '40px',
    borderRadius: '6px',
    marginTop: '4px'
  },
  colorLabel: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '4px'
  },
  hoursList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
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
  footer: {
    padding: '16px 24px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end'
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
  }
}
