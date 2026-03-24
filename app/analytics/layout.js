'use client';

import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Analytics | DentalCare',
  description: 'View analytics and reports for your dental practice',
};

export default function AnalyticsLayout({ children }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
