import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Dashboard | DentalCare',
  description: 'View your dental practice dashboard with key metrics and quick actions',
};

export default function DashboardLayout({ children }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
