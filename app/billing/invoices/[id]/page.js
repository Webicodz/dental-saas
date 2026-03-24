'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  DollarSign,
  CreditCard,
  Calendar,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Plus,
  Trash2,
  Edit,
  Printer,
  Download,
} from 'lucide-react';
import PaymentModal from '@/components/billing/PaymentModal';

export default function InvoiceDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${id}`);
      if (response.ok) {
        const data = await response.json();
        setInvoice(data);
      } else if (response.status === 404) {
        setError('Invoice not found');
      } else {
        setError('Failed to load invoice');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      setError('Failed to load invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelInvoice = async () => {
    if (!confirm('Are you sure you want to cancel this invoice?')) return;
    
    try {
      const response = await fetch(`/api/invoices/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        fetchInvoice();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to cancel invoice');
      }
    } catch (error) {
      console.error('Error cancelling invoice:', error);
      alert('Failed to cancel invoice');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      PARTIALLY_PAID: 'bg-blue-100 text-blue-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Clock className="w-4 h-4" />,
      PAID: <CheckCircle className="w-4 h-4" />,
      PARTIALLY_PAID: <Clock className="w-4 h-4" />,
      OVERDUE: <AlertCircle className="w-4 h-4" />,
      CANCELLED: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      CASH: <DollarSign className="w-4 h-4" />,
      CARD: <CreditCard className="w-4 h-4" />,
      INSURANCE: <FileText className="w-4 h-4" />,
      CHECK: <FileText className="w-4 h-4" />,
    };
    return icons[method] || <DollarSign className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">{error}</h2>
          <Link href="/billing/invoices" className="text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Back to Invoices
          </Link>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  const canAddPayment = ['PENDING', 'PARTIALLY_PAID', 'OVERDUE'].includes(invoice.status);
  const canCancel = !['PAID', 'CANCELLED'].includes(invoice.status);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                href="/billing/invoices"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{invoice.invoiceNumber}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)} flex items-center gap-1`}>
                    {getStatusIcon(invoice.status)}
                    {invoice.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-gray-500 mt-1">Created {formatDate(invoice.createdAt)}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Printer className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                <Download className="w-5 h-5 text-gray-600" />
              </button>
              {canAddPayment && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Record Payment
                </button>
              )}
              {canCancel && (
                <button
                  onClick={handleCancelInvoice}
                  className="inline-flex items-center px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Invoice
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Invoice Details Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Invoice Details</h2>
              </div>
              <div className="p-6">
                {/* Dates */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Issue Date</p>
                    <p className="font-medium text-gray-900">{formatDate(invoice.issueDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium text-gray-900">
                      {invoice.dueDate ? formatDate(invoice.dueDate) : 'No due date'}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Unit Price</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoice.items?.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(item.quantity * item.unitPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium text-gray-900">{formatCurrency(invoice.subtotal)}</span>
                  </div>
                  {invoice.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium text-gray-900">{formatCurrency(invoice.tax)}</span>
                    </div>
                  )}
                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Discount</span>
                      <span className="font-medium text-green-600">-{formatCurrency(invoice.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-900">Total</span>
                    <span className="font-bold text-lg text-gray-900">{formatCurrency(invoice.total)}</span>
                  </div>
                </div>

                {/* Notes */}
                {invoice.notes && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-1">Notes</p>
                    <p className="text-sm text-gray-600">{invoice.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Payment History</h2>
              </div>
              <div className="p-6">
                {invoice.payments && invoice.payments.length > 0 ? (
                  <div className="space-y-4">
                    {invoice.payments.map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-green-100 rounded-lg text-green-600">
                            {getPaymentMethodIcon(payment.method)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                            <p className="text-sm text-gray-500">
                              {payment.method} {payment.referenceNumber && `• ${payment.referenceNumber}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">{formatDateTime(payment.createdAt)}</p>
                          <p className={`text-xs font-medium ${payment.status === 'COMPLETED' ? 'text-green-600' : 'text-gray-500'}`}>
                            {payment.status}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">
                      <DollarSign className="mx-auto h-8 w-8" />
                    </div>
                    <p className="text-gray-500">No payments recorded yet</p>
                    {canAddPayment && (
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        Record First Payment
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Summary</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Amount</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid</span>
                  <span className="font-semibold text-green-600">{formatCurrency(invoice.paidAmount)}</span>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-900">Balance Due</span>
                    <span className={`font-bold text-lg ${invoice.balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(invoice.balanceDue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Progress */}
              {invoice.total > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${Math.min((invoice.paidAmount / invoice.total) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {((invoice.paidAmount / invoice.total) * 100).toFixed(1)}% paid
                  </p>
                </div>
              )}
            </div>

            {/* Patient Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {invoice.patient?.firstName} {invoice.patient?.lastName}
                  </p>
                  {invoice.patient?.email && (
                    <p className="text-sm text-gray-500">{invoice.patient.email}</p>
                  )}
                  {invoice.patient?.phone && (
                    <p className="text-sm text-gray-500">{invoice.patient.phone}</p>
                  )}
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <Link
                  href={`/patients/${invoice.patientId}`}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View Patient Profile
                </Link>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Printer className="w-4 h-4" />
                  <span className="text-sm">Print Invoice</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  <span className="text-sm">Download PDF</span>
                </button>
                <button className="w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">Send via Email</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          invoice={invoice}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => {
            setShowPaymentModal(false);
            fetchInvoice();
          }}
        />
      )}
    </div>
  );
}
