import './globals.css';

/**
 * Root Layout Component
 * Wraps all pages with global providers and styles
 */
export const metadata = {
  title: 'Dental Practice Management System',
  description: 'AI-powered dental practice management software',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {/* 
          Notification System Integration
          
          The NotificationBell component is designed to be placed in the
          navigation/header area of authenticated pages. It displays:
          - A bell icon with unread count badge
          - A dropdown with recent notifications
          - Quick actions to mark as read/delete
          
          Usage in your navigation:
          import NotificationBell from '@/components/notifications/NotificationBell';
          
          <NotificationBell />
          
          For full notification settings page:
          import NotificationSettings from '@/components/notifications/NotificationSettings';
          
          Components available:
          - NotificationBell: Bell icon with badge (for header/nav)
          - NotificationDropdown: Dropdown notification list
          - NotificationItem: Individual notification display
          - NotificationSettings: User preference settings form
        */}
        {children}
      </body>
    </html>
  );
}
