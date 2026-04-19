import MainLayout from '@/components/layout/MainLayout';

export const metadata = {
  title: 'Billing | DentalCare',
  description: 'Manage billing, invoices, and payments',
};

export default function BillingLayout({ children }) {
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}
