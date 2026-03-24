'use client';

import { useState } from 'react';
import styles from './NotificationItem.module.css';

/**
 * NotificationItem Component
 * Displays a single notification item
 */
export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
}) {
  const [showActions, setShowActions] = useState(false);
  
  const isUnread = !notification.readAt;
  const createdAt = new Date(notification.createdAt);
  const timeAgo = formatTimeAgo(createdAt);

  // Get icon based on notification type
  const icon = getNotificationIcon(notification.type);

  // Get priority color
  const priorityColor = getPriorityColor(notification.priority);

  const handleClick = () => {
    if (isUnread) {
      onMarkAsRead?.(notification.id);
    }
    onClick?.(notification);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete?.(notification.id);
  };

  return (
    <div
      className={`${styles.item} ${isUnread ? styles.unread : ''}`}
      onClick={handleClick}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {isUnread && (
        <span 
          className={styles.unreadDot}
          style={{ backgroundColor: priorityColor }}
        />
      )}
      
      <div className={styles.iconContainer} style={{ backgroundColor: `${priorityColor}20` }}>
        {icon}
      </div>
      
      <div className={styles.content}>
        <h4 className={styles.title}>{notification.title}</h4>
        <p className={styles.message}>{notification.message}</p>
        <span className={styles.time}>{timeAgo}</span>
      </div>

      {showActions && (
        <div className={styles.actions}>
          <button
            className={styles.actionBtn}
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead?.(notification.id);
            }}
            title="Mark as read"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </button>
          <button
            className={styles.actionBtn}
            onClick={handleDelete}
            title="Delete"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

function getNotificationIcon(type) {
  const icons = {
    appointment_reminder: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
    appointment_confirmed: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
    appointment_cancelled: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
    invoice_generated: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    ),
    payment_received: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    document_uploaded: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
      </svg>
    ),
    system_announcement: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="16" x2="12" y2="12" />
        <line x1="12" y1="8" x2="12.01" y2="8" />
      </svg>
    ),
    welcome: (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  };

  return icons[type] || icons.system_announcement;
}

function getPriorityColor(priority) {
  const colors = {
    urgent: '#dc3545',
    high: '#fd7e14',
    medium: '#007bff',
    low: '#6c757d',
  };
  return colors[priority] || colors.medium;
}

function formatTimeAgo(date) {
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) {
    return 'Just now';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}
