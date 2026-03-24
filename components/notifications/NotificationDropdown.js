'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NotificationItem from './NotificationItem';
import styles from './NotificationDropdown.module.css';

/**
 * NotificationDropdown Component
 * Displays list of notifications in a dropdown
 */
export default function NotificationDropdown({
  unreadCount,
  onMarkAllRead,
  onNotificationClick,
  onClose,
}) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (pageNum = 1) => {
    try {
      const response = await fetch(
        `/api/notifications?page=${pageNum}&limit=10`
      );
      if (response.ok) {
        const data = await response.json();
        if (pageNum === 1) {
          setNotifications(data.notifications || []);
        } else {
          setNotifications((prev) => [...prev, ...data.notifications]);
        }
        setHasMore(data.pagination?.page < data.pagination?.pages);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, readAt: new Date() } : n
          )
        );
        // Update unread count
        if (onMarkAllRead) {
          // This is a workaround - ideally we'd decrement the count
        }
      }
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notificationId)
        );
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      fetchNotifications(page + 1);
    }
  };

  const handleViewAll = () => {
    router.push('/notifications');
    onClose();
  };

  return (
    <div className={styles.dropdown}>
      <div className={styles.header}>
        <h3 className={styles.title}>Notifications</h3>
        <div className={styles.headerActions}>
          {unreadCount > 0 && (
            <button
              className={styles.markAllRead}
              onClick={() => {
                onMarkAllRead?.();
                setNotifications((prev) =>
                  prev.map((n) => ({ ...n, readAt: new Date() }))
                );
              }}
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      <div className={styles.notificationList}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className={styles.empty}>
            <svg
              className={styles.emptyIcon}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <p>No notifications yet</p>
            <span>You'll see updates here when they arrive</span>
          </div>
        ) : (
          <>
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
                onDelete={handleDelete}
                onClick={onNotificationClick}
              />
            ))}
            
            {hasMore && (
              <button
                className={styles.loadMore}
                onClick={handleLoadMore}
              >
                Load more
              </button>
            )}
          </>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.viewAll} onClick={handleViewAll}>
          View all notifications
        </button>
      </div>
    </div>
  );
}
