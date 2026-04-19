import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Clinic Settings | DentalCare',
  description: 'Manage clinic settings and user accounts',
};

export default function ClinicLayout({ children }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
