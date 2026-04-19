import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Doctors | DentalCare',
  description: 'Manage doctors and their schedules',
};

export default function DoctorsLayout({ children }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
