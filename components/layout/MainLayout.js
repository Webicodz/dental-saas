'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Header from './Header';
import styles from './MainLayout.module.css';

// Loading component
function LoadingSpinner() {
  return (
    <div className={styles.loadingContainer}>
      <div className={styles.spinner}>
        <div className={styles.spinnerCircle}></div>
      </div>
      <p className={styles.loadingText}>Loading...</p>
    </div>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Layout Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}>⚠️</div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
          <button onClick={() => window.location.reload()}>
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';

export default function MainLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Check if we're on a public route
  const isPublicRoute = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          if (!isPublicRoute) {
            router.push('/login');
          }
          setLoading(false);
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
        } else {
          localStorage.removeItem('token');
          if (!isPublicRoute) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        if (!isPublicRoute) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchUser();
    }
  }, [mounted, isPublicRoute, router]);

  // Handle sidebar collapse state persistence
  useEffect(() => {
    if (mounted) {
      const savedState = localStorage.getItem('sidebarCollapsed');
      if (savedState !== null) {
        setSidebarCollapsed(savedState === 'true');
      }
    }
  }, [mounted]);

  // Save sidebar collapse state
  const handleSidebarToggle = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', String(newState));
  };

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  // Show loading state during initial load
  if (loading || !mounted) {
    return (
      <div className={styles.layoutWrapper}>
        <LoadingSpinner />
      </div>
    );
  }

  // Don't show layout for public routes
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // If no user and not a public route, show loading (will redirect)
  if (!user) {
    return (
      <div className={styles.layoutWrapper}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className={styles.layoutWrapper}>
        <Sidebar 
          user={user}
          collapsed={sidebarCollapsed}
          onToggle={handleSidebarToggle}
          mobileOpen={mobileMenuOpen}
          onMobileClose={handleMobileMenuClose}
        />
        
        <div className={`${styles.mainArea} ${sidebarCollapsed ? styles.collapsed : ''}`}>
          <Header 
            user={user}
            onMobileMenuToggle={handleMobileMenuToggle}
            sidebarCollapsed={sidebarCollapsed}
          />
          
          <main className={styles.content}>
            <div className={styles.contentInner}>
              {children}
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}
