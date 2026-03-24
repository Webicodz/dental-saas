'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Lock, 
  Bell, 
  Shield, 
  Palette, 
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
  X
} from 'lucide-react';
import styles from './settings.module.css';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'preferences', label: 'Preferences', icon: Palette },
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    specialty: '',
    licenseNumber: '',
    bio: '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailAppointments: true,
    emailReminders: true,
    emailInvoices: true,
    smsAppointments: true,
    smsReminders: false,
    pushNotifications: true,
    marketingEmails: false,
  });

  // Preferences
  const [preferences, setPreferences] = useState({
    language: 'en',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    theme: 'light',
    startOfWeek: 'sunday',
  });

  // Avatar preview
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          router.push('/login');
          return;
        }

        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setProfileForm({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || '',
            dateOfBirth: data.user.dateOfBirth || '',
            address: data.user.address || '',
            city: data.user.city || '',
            state: data.user.state || '',
            zipCode: data.user.zipCode || '',
            country: data.user.country || '',
            specialty: data.user.specialty || '',
            licenseNumber: data.user.licenseNumber || '',
            bio: data.user.bio || '',
          });

          // Load notification settings if available
          if (data.user.notificationSettings) {
            setNotificationSettings(data.user.notificationSettings);
          }

          // Load preferences if available
          if (data.user.preferences) {
            setPreferences(data.user.preferences);
          }
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  // Handle profile form change
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle password form change
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle notification toggle
  const handleNotificationToggle = (key) => {
    setNotificationSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Handle preference change
  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  // Handle avatar upload
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove avatar
  const removeAvatar = () => {
    setAvatarPreview(null);
  };

  // Save profile
  const saveProfile = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(profileForm)
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        setMessage('Profile updated successfully');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to update profile');
      }
    } catch (error) {
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async () => {
    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });

      if (response.ok) {
        setMessage('Password changed successfully');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to change password');
      }
    } catch (error) {
      setError('An error occurred while changing password');
    } finally {
      setSaving(false);
    }
  };

  // Save notification settings
  const saveNotifications = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(notificationSettings)
      });

      if (response.ok) {
        setMessage('Notification settings saved');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to save settings');
      }
    } catch (error) {
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  // Save preferences
  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(preferences)
      });

      if (response.ok) {
        setMessage('Preferences saved');
      } else {
        const data = await response.json();
        setError(data.message || 'Failed to save preferences');
      }
    } catch (error) {
      setError('An error occurred while saving');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Loader2 className={styles.spinner} size={40} />
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.settingsPage}>
      <div className={styles.header}>
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      {/* Messages */}
      {message && (
        <div className={styles.successMessage}>
          <CheckCircle size={20} />
          <span>{message}</span>
          <button onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError(null)}><X size={16} /></button>
        </div>
      )}

      <div className={styles.settingsContainer}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className={styles.tabContent}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Profile Information</h2>
                <p>Update your personal information and contact details</p>
              </div>

              {/* Avatar */}
              <div className={styles.avatarSection}>
                <div className={styles.avatarPreview}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar preview" />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </div>
                <div className={styles.avatarActions}>
                  <label className={styles.uploadBtn}>
                    <Upload size={18} />
                    <span>Upload Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      hidden
                    />
                  </label>
                  {avatarPreview && (
                    <button 
                      className={styles.removeBtn}
                      onClick={removeAvatar}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {/* Form Grid */}
              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    placeholder="John Doe"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    placeholder="john@example.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="dateOfBirth">Date of Birth</label>
                  <input
                    type="date"
                    id="dateOfBirth"
                    name="dateOfBirth"
                    value={profileForm.dateOfBirth}
                    onChange={handleProfileChange}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={profileForm.address}
                    onChange={handleProfileChange}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="city">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={profileForm.city}
                    onChange={handleProfileChange}
                    placeholder="New York"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={profileForm.state}
                    onChange={handleProfileChange}
                    placeholder="NY"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="zipCode">ZIP Code</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={profileForm.zipCode}
                    onChange={handleProfileChange}
                    placeholder="10001"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="country">Country</label>
                  <input
                    type="text"
                    id="country"
                    name="country"
                    value={profileForm.country}
                    onChange={handleProfileChange}
                    placeholder="United States"
                  />
                </div>

                {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && (
                  <>
                    <div className={styles.formGroup}>
                      <label htmlFor="specialty">Specialty</label>
                      <input
                        type="text"
                        id="specialty"
                        name="specialty"
                        value={profileForm.specialty}
                        onChange={handleProfileChange}
                        placeholder="Orthodontics"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="licenseNumber">License Number</label>
                      <input
                        type="text"
                        id="licenseNumber"
                        name="licenseNumber"
                        value={profileForm.licenseNumber}
                        onChange={handleProfileChange}
                        placeholder="12345"
                      />
                    </div>
                  </>
                )}

                <div className={styles.formGroupFull}>
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>
              </div>

              <button 
                className={styles.saveBtn}
                onClick={saveProfile}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className={styles.spinning} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Change Password</h2>
                <p>Update your password to keep your account secure</p>
              </div>

              <div className={styles.passwordForm}>
                <div className={styles.formGroup}>
                  <label htmlFor="currentPassword">Current Password</label>
                  <div className={styles.passwordInput}>
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className={styles.togglePassword}
                    >
                      {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="newPassword">New Password</label>
                  <div className={styles.passwordInput}>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      id="newPassword"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className={styles.togglePassword}
                    >
                      {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <div className={styles.passwordInput}>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className={styles.togglePassword}
                    >
                      {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.passwordRequirements}>
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li className={passwordForm.newPassword.length >= 8 ? styles.met : ''}>
                      At least 8 characters
                    </li>
                    <li className={/[A-Z]/.test(passwordForm.newPassword) ? styles.met : ''}>
                      One uppercase letter
                    </li>
                    <li className={/[a-z]/.test(passwordForm.newPassword) ? styles.met : ''}>
                      One lowercase letter
                    </li>
                    <li className={/[0-9]/.test(passwordForm.newPassword) ? styles.met : ''}>
                      One number
                    </li>
                    <li className={passwordForm.newPassword === passwordForm.confirmPassword && passwordForm.newPassword ? styles.met : ''}>
                      Passwords match
                    </li>
                  </ul>
                </div>

                <button 
                  className={styles.saveBtn}
                  onClick={changePassword}
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className={styles.spinning} />
                      Changing...
                    </>
                  ) : (
                    <>
                      <Lock size={18} />
                      Change Password
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Notification Settings</h2>
                <p>Choose how you want to receive notifications</p>
              </div>

              <div className={styles.notificationGroups}>
                <div className={styles.notificationGroup}>
                  <h3>Email Notifications</h3>
                  <div className={styles.toggleItem}>
                    <div>
                      <span className={styles.toggleLabel}>Appointment Confirmations</span>
                      <span className={styles.toggleDesc}>Receive email when appointments are confirmed</span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailAppointments}
                        onChange={() => handleNotificationToggle('emailAppointments')}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div className={styles.toggleItem}>
                    <div>
                      <span className={styles.toggleLabel}>Reminders</span>
                      <span className={styles.toggleDesc}>Receive email reminders for upcoming appointments</span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailReminders}
                        onChange={() => handleNotificationToggle('emailReminders')}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div className={styles.toggleItem}>
                    <div>
                      <span className={styles.toggleLabel}>Invoice Updates</span>
                      <span className={styles.toggleDesc}>Receive email when invoices are created or updated</span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.emailInvoices}
                        onChange={() => handleNotificationToggle('emailInvoices')}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>

                <div className={styles.notificationGroup}>
                  <h3>SMS Notifications</h3>
                  <div className={styles.toggleItem}>
                    <div>
                      <span className={styles.toggleLabel}>Appointment SMS</span>
                      <span className={styles.toggleDesc}>Receive SMS for appointment confirmations</span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsAppointments}
                        onChange={() => handleNotificationToggle('smsAppointments')}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div className={styles.toggleItem}>
                    <div>
                      <span className={styles.toggleLabel}>SMS Reminders</span>
                      <span className={styles.toggleDesc}>Receive SMS reminders for appointments</span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.smsReminders}
                        onChange={() => handleNotificationToggle('smsReminders')}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>

                <div className={styles.notificationGroup}>
                  <h3>Other</h3>
                  <div className={styles.toggleItem}>
                    <div>
                      <span className={styles.toggleLabel}>Push Notifications</span>
                      <span className={styles.toggleDesc}>Receive push notifications in your browser</span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.pushNotifications}
                        onChange={() => handleNotificationToggle('pushNotifications')}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                  <div className={styles.toggleItem}>
                    <div>
                      <span className={styles.toggleLabel}>Marketing Emails</span>
                      <span className={styles.toggleDesc}>Receive news and promotional emails</span>
                    </div>
                    <label className={styles.toggle}>
                      <input
                        type="checkbox"
                        checked={notificationSettings.marketingEmails}
                        onChange={() => handleNotificationToggle('marketingEmails')}
                      />
                      <span className={styles.toggleSlider}></span>
                    </label>
                  </div>
                </div>
              </div>

              <button 
                className={styles.saveBtn}
                onClick={saveNotifications}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className={styles.spinning} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Settings
                  </>
                )}
              </button>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Security Settings</h2>
                <p>Manage your account security options</p>
              </div>

              <div className={styles.securityItems}>
                <div className={styles.securityItem}>
                  <div className={styles.securityInfo}>
                    <h3>Two-Factor Authentication</h3>
                    <p>Add an extra layer of security to your account</p>
                  </div>
                  <button className={styles.enableBtn}>Enable</button>
                </div>

                <div className={styles.securityItem}>
                  <div className={styles.securityInfo}>
                    <h3>Active Sessions</h3>
                    <p>Manage devices where you're currently logged in</p>
                  </div>
                  <button className={styles.viewBtn}>View All</button>
                </div>

                <div className={styles.securityItem}>
                  <div className={styles.securityInfo}>
                    <h3>Login History</h3>
                    <p>View recent login activity on your account</p>
                  </div>
                  <button className={styles.viewBtn}>View History</button>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Preferences</h2>
                <p>Customize your experience</p>
              </div>

              <div className={styles.preferencesGrid}>
                <div className={styles.preferenceItem}>
                  <label htmlFor="language">
                    <Globe size={20} />
                    Language
                  </label>
                  <select
                    id="language"
                    value={preferences.language}
                    onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="pt">Português</option>
                  </select>
                </div>

                <div className={styles.preferenceItem}>
                  <label htmlFor="timezone">
                    <Globe size={20} />
                    Timezone
                  </label>
                  <select
                    id="timezone"
                    value={preferences.timezone}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  >
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                  </select>
                </div>

                <div className={styles.preferenceItem}>
                  <label htmlFor="dateFormat">
                    <Calendar size={20} />
                    Date Format
                  </label>
                  <select
                    id="dateFormat"
                    value={preferences.dateFormat}
                    onChange={(e) => handlePreferenceChange('dateFormat', e.target.value)}
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className={styles.preferenceItem}>
                  <label htmlFor="timeFormat">
                    <Calendar size={20} />
                    Time Format
                  </label>
                  <select
                    id="timeFormat"
                    value={preferences.timeFormat}
                    onChange={(e) => handlePreferenceChange('timeFormat', e.target.value)}
                  >
                    <option value="12h">12-hour (AM/PM)</option>
                    <option value="24h">24-hour</option>
                  </select>
                </div>

                <div className={styles.preferenceItem}>
                  <label htmlFor="theme">
                    <Palette size={20} />
                    Theme
                  </label>
                  <select
                    id="theme"
                    value={preferences.theme}
                    onChange={(e) => handlePreferenceChange('theme', e.target.value)}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="system">System</option>
                  </select>
                </div>

                <div className={styles.preferenceItem}>
                  <label htmlFor="startOfWeek">
                    <Calendar size={20} />
                    Week Starts On
                  </label>
                  <select
                    id="startOfWeek"
                    value={preferences.startOfWeek}
                    onChange={(e) => handlePreferenceChange('startOfWeek', e.target.value)}
                  >
                    <option value="sunday">Sunday</option>
                    <option value="monday">Monday</option>
                  </select>
                </div>
              </div>

              <button 
                className={styles.saveBtn}
                onClick={savePreferences}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className={styles.spinning} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
