'use client';

import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Patients | DentalCare',
  description: 'Manage patient records, history, and appointments',
};

export default function PatientsLayout({ children }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
