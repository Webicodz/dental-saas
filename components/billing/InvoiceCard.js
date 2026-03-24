'use client';

import Link from 'next/link';
import { Calendar, User, DollarSign, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function InvoiceCard({ invoice }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusConfig = (status) => {
    const configs = {
      PENDING: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        icon: Clock,
        label: 'Pending',
      },
      PAID: {
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: 'text-green-800',
        icon: CheckCircle,
        label: 'Paid',
      },
      PARTIALLY_PAID: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        icon: DollarSign,
        label: 'Partially Paid',
      },
      OVERDUE: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        icon: AlertCircle,
        label: 'Overdue',
      },
      CANCELLED: {
        bg: 'bg-gray-50',
        border: 'border-gray-200',
        text: 'text-gray-600',
        icon: XCircle,
        label: 'Cancelled',
      },
    };
    return configs[status] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(invoice.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Link href={`/billing/invoices/${invoice.id}`} className="block group">
      <div className={`bg-white rounded-xl border ${statusConfig.border} overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:border-gray-300`}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                {invoice.invoiceNumber}
              </h3>
              <div className="flex items-center gap-1 mt-1 text-sm text-gray-500">
                <Calendar className="w-3.5 h-3.5" />
                {formatDate(invoice.issueDate)}
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text} flex items-center gap-1`}>
              <StatusIcon className="w-3 h-3" />
              {statusConfig.label}
            </span>
          </div>
        </div>

        {/* Patient */}
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <User className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {invoice.patient?.firstName} {invoice.patient?.lastName}
              </p>
              {invoice.patient?.email && (
                <p className="text-xs text-gray-500 truncate">{invoice.patient.email}</p>
              )}
            </div>
          </div>

          {/* Amount Summary */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
            <div className="text-center">
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.total)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Paid</p>
              <p className="text-sm font-semibold text-green-600">{formatCurrency(invoice.paidAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Balance</p>
              <p className={`text-sm font-semibold ${invoice.balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                {formatCurrency(invoice.balanceDue)}
              </p>
            </div>
          </div>

          {/* Payment Progress */}
          {invoice.total > 0 && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all ${
                    invoice.status === 'PAID' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((invoice.paidAmount / invoice.total) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {invoice.dueDate && invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
            <p className={`text-xs flex items-center gap-1 ${
              invoice.status === 'OVERDUE' ? 'text-red-600' : 'text-gray-500'
            }`}>
              <Calendar className="w-3 h-3" />
              Due: {formatDate(invoice.dueDate)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}

// Compact version for lists/grids
export function InvoiceCardCompact({ invoice }) {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
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

  return (
    <Link href={`/billing/invoices/${invoice.id}`} className="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 group-hover:text-blue-600">{invoice.invoiceNumber}</span>
          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getStatusColor(invoice.status)}`}>
            {invoice.status.replace('_', ' ')}
          </span>
        </div>
        <p className="text-sm text-gray-500 mt-0.5">
          {invoice.patient?.firstName} {invoice.patient?.lastName} • {formatDate(invoice.issueDate)}
        </p>
      </div>
      <div className="text-right">
        <p className="font-semibold text-gray-900">{formatCurrency(invoice.total)}</p>
        <p className={`text-sm ${invoice.balanceDue > 0 ? 'text-orange-600' : 'text-green-600'}`}>
          {invoice.balanceDue > 0 ? `Due: ${formatCurrency(invoice.balanceDue)}` : 'Paid'}
        </p>
      </div>
    </Link>
  );
}
