/**
 * Invoice Email Template
 */

export function invoiceTemplate(data) {
  const {
    userName = 'Patient',
    invoiceNumber = 'INV-0000',
    invoiceDate,
    dueDate,
    items = [],
    subtotal = 0,
    tax = 0,
    discount = 0,
    total = 0,
    status = 'pending',
    clinicName = 'Dental Clinic',
    clinicAddress,
    clinicPhone,
    clinicEmail,
    paymentUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/billing/invoices`,
  } = data;

  const formattedInvoiceDate = invoiceDate 
    ? new Date(invoiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const formattedDueDate = dueDate 
    ? new Date(dueDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const statusColors = {
    pending: { bg: '#fff3cd', text: '#856404', label: 'Pending' },
    paid: { bg: '#d4edda', text: '#155724', label: 'Paid' },
    overdue: { bg: '#f8d7da', text: '#721c24', label: 'Overdue' },
    cancelled: { bg: '#e2e3e5', text: '#383d41', label: 'Cancelled' },
  };

  const statusStyle = statusColors[status] || statusColors.pending;

  const subject = `Invoice ${invoiceNumber} - ${status === 'paid' ? 'Payment Confirmed' : 'Payment Due'}`;

  const itemsHtml = items.map(item => `
    <tr>
      <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">${item.description || item.name}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: center;">${item.quantity || 1}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: right;">$${(item.unitPrice || item.price || 0).toFixed(2)}</td>
      <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: right;">$${(item.total || item.amount || 0).toFixed(2)}</td>
    </tr>
  `).join('');

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333333;
      max-width: 700px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      background-color: #ffffff;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #2c3e50;
      color: white;
      padding: 30px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }
    .clinic-info h1 {
      margin: 0;
      font-size: 24px;
    }
    .clinic-info p {
      margin: 5px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .invoice-title {
      text-align: right;
    }
    .invoice-title h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .invoice-title p {
      margin: 5px 0 0 0;
      font-size: 14px;
      opacity: 0.9;
    }
    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      margin-top: 10px;
    }
    .content {
      padding: 30px;
    }
    .invoice-meta {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 20px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    .meta-group {
      flex: 1;
    }
    .meta-group:last-child {
      text-align: right;
    }
    .meta-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .meta-value {
      font-size: 16px;
      font-weight: 500;
    }
    .bill-to {
      margin-bottom: 30px;
    }
    .bill-to h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #6c757d;
      text-transform: uppercase;
    }
    .bill-to p {
      margin: 0;
      font-size: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 30px;
    }
    thead th {
      background-color: #f8f9fa;
      padding: 12px;
      text-align: left;
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
      border-bottom: 2px solid #dee2e6;
    }
    thead th:nth-child(2),
    thead th:nth-child(3),
    thead th:nth-child(4) {
      text-align: right;
    }
    thead th:nth-child(2) {
      text-align: center;
    }
    .totals {
      margin-left: auto;
      width: 300px;
    }
    .total-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
    }
    .total-row.final {
      border-bottom: none;
      border-top: 2px solid #007bff;
      margin-top: 10px;
      padding-top: 15px;
      font-size: 20px;
      font-weight: 700;
      color: #007bff;
    }
    .actions {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      padding: 14px 35px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      margin: 5px;
    }
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    .notes {
      background-color: #fff3cd;
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
      font-size: 14px;
    }
    .notes strong {
      color: #856404;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 25px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
    .footer a {
      color: #007bff;
      text-decoration: none;
    }
    @media only screen and (max-width: 600px) {
      .header-top {
        flex-direction: column;
      }
      .invoice-title {
        text-align: left;
        margin-top: 20px;
      }
      .invoice-meta {
        flex-direction: column;
      }
      .meta-group:last-child {
        text-align: left;
        margin-top: 15px;
      }
      table {
        font-size: 12px;
      }
      .totals {
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="header-top">
        <div class="clinic-info">
          <h1>${clinicName}</h1>
          <p>${clinicAddress || 'Your Trusted Dental Care Provider'}</p>
          <p>${clinicPhone ? `Phone: ${clinicPhone}` : ''}</p>
          <p>${clinicEmail || ''}</p>
        </div>
        <div class="invoice-title">
          <h2>INVOICE</h2>
          <p>${invoiceNumber}</p>
          <span class="status-badge" style="background-color: ${statusStyle.bg}; color: ${statusStyle.text};">
            ${statusStyle.label}
          </span>
        </div>
      </div>
    </div>
    
    <div class="content">
      <div class="invoice-meta">
        <div class="meta-group">
          <div class="meta-label">Invoice Date</div>
          <div class="meta-value">${formattedInvoiceDate}</div>
        </div>
        ${formattedDueDate ? `
        <div class="meta-group">
          <div class="meta-label">Due Date</div>
          <div class="meta-value">${formattedDueDate}</div>
        </div>
        ` : ''}
        <div class="meta-group">
          <div class="meta-label">Amount Due</div>
          <div class="meta-value" style="font-size: 24px; color: #007bff;">$${total.toFixed(2)}</div>
        </div>
      </div>
      
      <div class="bill-to">
        <h3>Bill To</h3>
        <p><strong>${userName}</strong></p>
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th style="text-align: right;">Price</th>
            <th style="text-align: right;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
          ${items.length === 0 ? `
          <tr>
            <td colspan="4" style="padding: 20px; text-align: center; color: #6c757d;">
              Dental services as per treatment plan
            </td>
          </tr>
          ` : ''}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="total-row">
          <span>Subtotal</span>
          <span>$${subtotal.toFixed(2)}</span>
        </div>
        ${tax > 0 ? `
        <div class="total-row">
          <span>Tax</span>
          <span>$${tax.toFixed(2)}</span>
        </div>
        ` : ''}
        ${discount > 0 ? `
        <div class="total-row">
          <span>Discount</span>
          <span>-$${discount.toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="total-row final">
          <span>Total</span>
          <span>$${total.toFixed(2)}</span>
        </div>
      </div>
      
      ${status !== 'paid' ? `
      <div class="notes">
        <strong>💡 Payment Notice</strong><br>
        Please ensure payment is made by the due date to avoid any service interruptions.
      </div>
      
      <div class="actions">
        <a href="${paymentUrl}" class="btn btn-primary">Pay Now</a>
        <a href="${paymentUrl}" class="btn btn-secondary">View Invoice</a>
      </div>
      ` : `
      <div class="notes" style="background-color: #d4edda;">
        <strong>✅ Payment Confirmed</strong><br>
        Thank you for your payment. Your invoice has been settled.
      </div>
      `}
    </div>
    
    <div class="footer">
      <p>
        <strong>${clinicName}</strong><br>
        ${clinicAddress || ''}<br>
        ${clinicPhone ? `Phone: ${clinicPhone}` : ''}<br>
        ${clinicEmail || ''}
      </p>
      <p>
        <a href="${paymentUrl}">View All Invoices</a> | 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/billing">Billing Portal</a>
      </p>
      <p>© ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
INVOICE ${invoiceNumber}

${clinicName}
${clinicAddress || ''}
${clinicPhone ? `Phone: ${clinicPhone}` : ''}
${clinicEmail || ''}

-----------------------------------------
BILL TO: ${userName}
INVOICE DATE: ${formattedInvoiceDate}
${formattedDueDate ? `DUE DATE: ${formattedDueDate}` : ''}
STATUS: ${status.toUpperCase()}
-----------------------------------------

SERVICES:
${items.length > 0 ? items.map(item => `
  ${item.description || item.name}
  Qty: ${item.quantity || 1}  Price: $${(item.unitPrice || item.price || 0).toFixed(2)}  Total: $${(item.total || item.amount || 0).toFixed(2)}
`).join('') : '  Dental services as per treatment plan'}

-----------------------------------------
SUBTOTAL:   $${subtotal.toFixed(2)}
${tax > 0 ? `TAX:       $${tax.toFixed(2)}` : ''}
${discount > 0 ? `DISCOUNT:  -$${discount.toFixed(2)}` : ''}
-----------------------------------------
TOTAL:      $${total.toFixed(2)}
-----------------------------------------

${status !== 'paid' ? `
Please ensure payment is made by the due date.
Pay now: ${paymentUrl}
` : 'Thank you for your payment!'}

© ${new Date().getFullYear()} ${clinicName}
`;

  return { subject, html, text };
}
