import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Settings | DentalCare',
  description: 'Manage your account settings and preferences',
};

export default function SettingsLayout({ children }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
