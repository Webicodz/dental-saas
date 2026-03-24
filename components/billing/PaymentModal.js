'use client';

import { useState } from 'react';
import { X, DollarSign, CreditCard, FileText, AlertCircle, CheckCircle } from 'lucide-react';

export default function PaymentModal({ invoice, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    amount: invoice?.balanceDue || '',
    method: '',
    referenceNumber: '',
    notes: '',
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      setError('Please enter a valid payment amount');
      return;
    }

    if (!formData.method) {
      setError('Please select a payment method');
      return;
    }

    if (amount > invoice.balanceDue) {
      setError(`Payment amount cannot exceed balance due (${formatCurrency(invoice.balanceDue)})`);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/invoices/${invoice.id}/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to record payment');
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      setError('Failed to record payment');
    } finally {
      setLoading(false);
    }
  };

  const paymentMethods = [
    { value: 'CASH', label: 'Cash', icon: DollarSign },
    { value: 'CARD', label: 'Credit/Debit Card', icon: CreditCard },
    { value: 'INSURANCE', label: 'Insurance', icon: FileText },
    { value: 'CHECK', label: 'Check', icon: FileText },
  ];

  if (success) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50"></div>
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment Recorded!</h2>
            <p className="text-gray-500">The payment has been successfully recorded.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

        {/* Modal */}
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Record Payment</h2>
              <p className="text-sm text-gray-500 mt-1">{invoice?.invoiceNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Invoice Summary */}
          <div className="p-6 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Total Amount</p>
                <p className="font-semibold text-gray-900">{formatCurrency(invoice?.total)}</p>
              </div>
              <div>
                <p className="text-gray-500">Already Paid</p>
                <p className="font-semibold text-green-600">{formatCurrency(invoice?.paidAmount)}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-500 text-sm">Balance Due</p>
              <p className="text-2xl font-bold text-orange-600">{formatCurrency(invoice?.balanceDue)}</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Amount *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  max={invoice?.balanceDue}
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Maximum: {formatCurrency(invoice?.balanceDue)}
              </p>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleChange('amount', invoice?.balanceDue?.toString())}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Pay Full
              </button>
              <button
                type="button"
                onClick={() => handleChange('amount', (invoice?.balanceDue / 2)?.toFixed(2))}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Half
              </button>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((method) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => handleChange('method', method.value)}
                      className={`flex flex-col items-center gap-2 p-4 border rounded-lg transition-all ${
                        formData.method === method.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400 text-gray-600'
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-sm font-medium">{method.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number
              </label>
              <input
                type="text"
                value={formData.referenceNumber}
                onChange={(e) => handleChange('referenceNumber', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={formData.method === 'CHECK' ? 'Check number' : 'Transaction ID'}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                placeholder="Add any notes..."
              ></textarea>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
