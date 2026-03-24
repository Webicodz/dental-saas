'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Bell, 
  Settings, 
  LogOut, 
  User, 
  ChevronDown,
  Menu,
  X,
  Check,
  AlertCircle,
  Info,
  Calendar,
  CreditCard,
  Users
} from 'lucide-react';
import styles from './Header.module.css';

export default function Header({ user, onMobileMenuToggle, sidebarCollapsed }) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const markAsRead = async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ read: true })
      });
      
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointment':
        return <Calendar size={16} />;
      case 'payment':
        return <CreditCard size={16} />;
      case 'patient':
        return <Users size={16} />;
      default:
        return <Info size={16} />;
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'appointment':
        return '#3b82f6';
      case 'payment':
        return '#10b981';
      case 'patient':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <header className={`${styles.header} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      {/* Mobile Menu Toggle */}
      <button 
        className={styles.mobileMenuBtn}
        onClick={onMobileMenuToggle}
        aria-label="Toggle menu"
      >
        <Menu size={24} />
      </button>

      {/* Search Bar */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <Search size={20} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search patients, appointments..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={styles.searchInput}
        />
        {searchQuery && (
          <button 
            type="button" 
            className={styles.clearSearch}
            onClick={() => setSearchQuery('')}
          >
            <X size={16} />
          </button>
        )}
      </form>

      {/* Right Section */}
      <div className={styles.rightSection}>
        {/* Notifications */}
        <div className={styles.notificationWrapper} ref={notificationRef}>
          <button 
            className={styles.iconBtn}
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </button>

          {showNotifications && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <h3>Notifications</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className={styles.markAllRead}>
                    Mark all as read
                  </button>
                )}
              </div>
              
              <div className={styles.notificationList}>
                {notifications.length === 0 ? (
                  <div className={styles.emptyNotifications}>
                    <Bell size={32} />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((notification) => (
                    <div 
                      key={notification.id}
                      className={`${styles.notificationItem} ${!notification.read ? styles.unread : ''}`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div 
                        className={styles.notificationIcon}
                        style={{ backgroundColor: getNotificationColor(notification.type) + '20', color: getNotificationColor(notification.type) }}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationText}>{notification.message}</p>
                        <span className={styles.notificationTime}>
                          {formatTimeAgo(notification.createdAt)}
                        </span>
                      </div>
                      {!notification.read && <div className={styles.unreadDot} />}
                    </div>
                  ))
                )}
              </div>

              <Link href="/notifications" className={styles.viewAllLink}>
                View all notifications
              </Link>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className={styles.userMenuWrapper} ref={userMenuRef}>
          <button 
            className={styles.userBtn}
            onClick={() => setShowUserMenu(!showUserMenu)}
          >
            <div className={styles.userAvatar}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={styles.userInfo}>
              <span className={styles.userName}>{user?.name || 'User'}</span>
              <span className={styles.userRole}>{user?.role || 'Staff'}</span>
            </div>
            <ChevronDown size={16} className={`${styles.chevron} ${showUserMenu ? styles.chevronUp : ''}`} />
          </button>

          {showUserMenu && (
            <div className={styles.dropdown}>
              <Link href="/settings" className={styles.dropdownItem}>
                <User size={18} />
                <span>Profile</span>
              </Link>
              <Link href="/settings" className={styles.dropdownItem}>
                <Settings size={18} />
                <span>Settings</span>
              </Link>
              <div className={styles.dropdownDivider} />
              <button onClick={handleLogout} className={`${styles.dropdownItem} ${styles.logoutItem}`}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
