'use client';

import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Appointments | DentalCare',
  description: 'Manage appointments and scheduling',
};

export default function AppointmentsLayout({ children }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
