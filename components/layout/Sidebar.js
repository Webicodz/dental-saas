'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  CreditCard, 
  BarChart3, 
  Settings, 
  Building2,
  UserCog,
  Stethoscope,
  FileText,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import styles from './Sidebar.module.css';

// Menu items configuration with role-based access
const menuItems = {
  all: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { id: 'patients', label: 'Patients', icon: Users, href: '/patients' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, href: '/appointments' },
    { id: 'billing', label: 'Billing', icon: CreditCard, href: '/billing' },
  ],
  super_admin: [
    { id: 'admin-dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, href: '/admin/dashboard' },
    { id: 'admin-clinics', label: 'Manage Clinics', icon: Building2, href: '/admin/clinics' },
    { id: 'admin-users', label: 'Manage Users', icon: UserCog, href: '/admin/users' },
    { id: 'admin-licenses', label: 'License Management', icon: Settings, href: '/admin/license' },
  ],
  admin: [
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, href: '/doctors' },
    { id: 'staff', label: 'Staff', icon: Users, href: '/clinic/users' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, href: '/analytics' },
    { id: 'clinic-settings', label: 'Settings', icon: Settings, href: '/clinic/settings' },
  ],
  doctor: [
    { id: 'doctors', label: 'Doctors', icon: Stethoscope, href: '/doctors' },
    { id: 'my-schedule', label: 'My Schedule', icon: Calendar, href: '/doctors/my-schedule' },
  ],
  receptionist: [
    { id: 'documents', label: 'Documents', icon: FileText, href: '/documents' },
  ],
};

export default function Sidebar({ user, collapsed = false, onToggle, mobileOpen = false, onMobileClose }) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState({});

  // Get menu items based on user role
  const getMenuItems = () => {
    const role = user?.role || 'RECEPTIONIST';
    const roleKey = role.toLowerCase();
    
    let items = [];
    
    // SUPER_ADMIN gets their own dedicated menu (full system access)
    if (role === 'SUPER_ADMIN') {
      items = [...(menuItems.super_admin || [])];
    } else if (role === 'ADMIN') {
      // Clinic ADMIN gets base menu + admin-specific items
      items = [...(menuItems.all || []), ...(menuItems.admin || [])];
    } else {
      // Regular users (DOCTOR, RECEPTIONIST) get base menu + role-specific items
      items = [...(menuItems.all || [])];
      if (menuItems[roleKey]) {
        items = [...items, ...menuItems[roleKey]];
      }
    }
    
    return items;
  };

  const menuItemsList = getMenuItems();

  const isActive = (href) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className={styles.mobileOverlay} 
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}
      
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logo}>
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="8" fill="#0D9488" />
              <path d="M16 6C10.477 6 6 10.477 6 16C6 21.523 10.477 26 16 26C21.523 26 26 21.523 26 16C26 10.477 21.523 6 16 6Z" fill="white" />
              <path d="M16 8C11.582 8 8 11.582 8 16C8 20.418 11.582 24 16 24C20.418 24 24 20.418 24 16C24 11.582 20.418 8 16 8Z" fill="#0D9488" />
              <path d="M16 11C13.239 11 11 13.239 11 16C11 18.761 13.239 21 16 21C18.761 21 21 18.761 21 16C21 13.239 18.761 11 16 11Z" fill="white" />
            </svg>
            {!collapsed && <span className={styles.logoText}>DentalCare</span>}
          </div>
          <button 
            className={styles.collapseBtn}
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <button 
            className={styles.mobileCloseBtn}
            onClick={onMobileClose}
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className={styles.nav}>
          <ul className={styles.navList}>
            {menuItemsList.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={`${styles.navLink} ${active ? styles.active : ''}`}
                    title={collapsed ? item.label : undefined}
                    onClick={onMobileClose}
                  >
                    <Icon size={20} className={styles.navIcon} />
                    {!collapsed && <span className={styles.navLabel}>{item.label}</span>}
                    {active && <div className={styles.activeIndicator} />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Info Section */}
        {!collapsed && user && (
          <div className={styles.userSection}>
            <div className={styles.userAvatar}>
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className={styles.userInfo}>
              <div className={styles.userName}>{user.name || 'User'}</div>
              <div className={styles.userRole}>{user.role || 'Staff'}</div>
            </div>
          </div>
        )}

        {/* Collapse Button (Mobile) */}
        <div className={styles.mobileCollapse}>
          <button 
            className={styles.mobileToggle}
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            <Menu size={24} />
          </button>
        </div>
      </aside>
    </>
  );
}
