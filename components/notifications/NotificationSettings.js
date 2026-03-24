'use client';

import { useState, useEffect } from 'react';
import styles from './NotificationSettings.module.css';

/**
 * NotificationSettings Component
 * Allows users to manage their notification preferences
 */
export default function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailEnabled: true,
    smsEnabled: true,
    inAppEnabled: true,
    appointmentReminders: true,
    invoiceNotifications: true,
    marketingEmails: false,
    reminderHoursBefore: 24,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/notifications/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleHoursChange = (e) => {
    const value = parseInt(e.target.value) || 1;
    setSettings((prev) => ({
      ...prev,
      reminderHoursBefore: Math.min(168, Math.max(1, value)),
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Settings saved successfully!' });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading settings...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Notification Preferences</h2>
        <p className={styles.subtitle}>
          Choose how you'd like to receive notifications
        </p>
      </div>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notification Channels</h3>
        <p className={styles.sectionDesc}>
          Enable or disable notification delivery methods
        </p>
        
        <div className={styles.settingsList}>
          <SettingToggle
            label="In-App Notifications"
            description="Show notifications within the application"
            checked={settings.inAppEnabled}
            onChange={() => handleToggle('inAppEnabled')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            }
          />
          
          <SettingToggle
            label="Email Notifications"
            description="Receive notifications via email"
            checked={settings.emailEnabled}
            onChange={() => handleToggle('emailEnabled')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            }
          />
          
          <SettingToggle
            label="SMS Notifications"
            description="Receive text message alerts"
            checked={settings.smsEnabled}
            onChange={() => handleToggle('smsEnabled')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            }
          />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Notification Types</h3>
        <p className={styles.sectionDesc}>
          Choose which types of notifications you want to receive
        </p>
        
        <div className={styles.settingsList}>
          <SettingToggle
            label="Appointment Reminders"
            description="Get reminded about upcoming appointments"
            checked={settings.appointmentReminders}
            onChange={() => handleToggle('appointmentReminders')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            }
          />
          
          <SettingToggle
            label="Invoice Notifications"
            description="Receive updates about invoices and payments"
            checked={settings.invoiceNotifications}
            onChange={() => handleToggle('invoiceNotifications')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
            }
          />
          
          <SettingToggle
            label="Marketing Emails"
            description="Receive promotional content and newsletters"
            checked={settings.marketingEmails}
            onChange={() => handleToggle('marketingEmails')}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            }
          />
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Reminder Timing</h3>
        <p className={styles.sectionDesc}>
          When should we send appointment reminders?
        </p>
        
        <div className={styles.hoursInput}>
          <label className={styles.hoursLabel}>
            <span>Send reminder</span>
            <input
              type="number"
              min="1"
              max="168"
              value={settings.reminderHoursBefore}
              onChange={handleHoursChange}
              className={styles.input}
            />
            <span>hours before appointment</span>
          </label>
          <p className={styles.hoursHint}>
            Recommended: 24 hours (1 day) before your appointment
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <button
          className={styles.saveButton}
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className={styles.spinner}></span>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>
    </div>
  );
}

/**
 * SettingToggle Sub-component
 */
function SettingToggle({ label, description, checked, onChange, icon }) {
  return (
    <div className={styles.settingItem}>
      <div className={styles.settingIcon}>{icon}</div>
      <div className={styles.settingInfo}>
        <span className={styles.settingLabel}>{label}</span>
        <span className={styles.settingDesc}>{description}</span>
      </div>
      <label className={styles.toggle}>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
        />
        <span className={styles.slider}></span>
      </label>
    </div>
  );
}
