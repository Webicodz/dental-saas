/**
 * Appointment Reminder Email Template
 */

export function appointmentReminderTemplate(data) {
  const {
    userName = 'Patient',
    doctorName = 'Your Dentist',
    clinicName = 'Dental Clinic',
    appointmentDate,
    appointmentTime,
    appointmentEndTime,
    treatmentType,
    clinicAddress,
    clinicPhone,
  } = data;

  const formattedDate = appointmentDate 
    ? new Date(appointmentDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : new Date(appointmentTime).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

  const formattedTime = new Date(appointmentTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const formattedEndTime = appointmentEndTime 
    ? new Date(appointmentEndTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      })
    : null;

  const subject = `Appointment Reminder - ${formattedDate}`;

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
      max-width: 600px;
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
      background-color: #007bff;
      color: white;
      padding: 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 30px;
    }
    .appointment-card {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
      border-left: 4px solid #007bff;
    }
    .appointment-card h2 {
      margin: 0 0 15px 0;
      color: #007bff;
      font-size: 18px;
    }
    .detail-row {
      display: flex;
      margin: 10px 0;
      align-items: center;
    }
    .detail-icon {
      width: 24px;
      margin-right: 10px;
      color: #6c757d;
    }
    .detail-text {
      flex: 1;
    }
    .detail-label {
      font-size: 12px;
      color: #6c757d;
      text-transform: uppercase;
    }
    .detail-value {
      font-weight: 500;
    }
    .actions {
      text-align: center;
      margin: 30px 0;
    }
    .btn {
      display: inline-block;
      padding: 12px 30px;
      margin: 5px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 500;
      font-size: 14px;
    }
    .btn-primary {
      background-color: #007bff;
      color: white;
    }
    .btn-secondary {
      background-color: #6c757d;
      color: white;
    }
    .footer {
      background-color: #f8f9fa;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #6c757d;
    }
    .footer a {
      color: #007bff;
      text-decoration: none;
    }
    @media only screen and (max-width: 480px) {
      body {
        padding: 10px;
      }
      .header {
        padding: 20px;
      }
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗓️ Appointment Reminder</h1>
    </div>
    
    <div class="content">
      <p>Hello ${userName},</p>
      
      <p>This is a friendly reminder about your upcoming dental appointment:</p>
      
      <div class="appointment-card">
        <h2>📅 ${treatmentType || 'Dental Appointment'}</h2>
        
        <div class="detail-row">
          <span class="detail-icon">👨‍⚕️</span>
          <span class="detail-text">
            <span class="detail-label">Doctor</span>
            <span class="detail-value">Dr. ${doctorName}</span>
          </span>
        </div>
        
        <div class="detail-row">
          <span class="detail-icon">🏥</span>
          <span class="detail-text">
            <span class="detail-label">Location</span>
            <span class="detail-value">${clinicName}</span>
          </span>
        </div>
        
        ${clinicAddress ? `
        <div class="detail-row">
          <span class="detail-icon">📍</span>
          <span class="detail-text">
            <span class="detail-label">Address</span>
            <span class="detail-value">${clinicAddress}</span>
          </span>
        </div>
        ` : ''}
        
        <div class="detail-row">
          <span class="detail-icon">📆</span>
          <span class="detail-text">
            <span class="detail-label">Date</span>
            <span class="detail-value">${formattedDate}</span>
          </span>
        </div>
        
        <div class="detail-row">
          <span class="detail-icon">🕐</span>
          <span class="detail-text">
            <span class="detail-label">Time</span>
            <span class="detail-value">${formattedTime}${formattedEndTime ? ` - ${formattedEndTime}` : ''}</span>
          </span>
        </div>
      </div>
      
      <div class="actions">
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/appointments" class="btn btn-primary">
          View Appointment
        </a>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/appointments" class="btn btn-secondary">
          Reschedule
        </a>
      </div>
      
      <p style="color: #6c757d; font-size: 14px;">
        <strong>Need to reschedule?</strong><br>
        If you need to reschedule or cancel your appointment, please do so at least 24 hours in advance by contacting us at ${clinicPhone || 'your clinic'}.
      </p>
      
      <p style="color: #6c757d; font-size: 14px;">
        <strong>What to bring:</strong><br>
        • Valid ID<br>
        • Insurance card (if applicable)<br>
        • List of current medications<br>
        • Previous dental records (if new patient)
      </p>
    </div>
    
    <div class="footer">
      <p>
        ${clinicName}<br>
        ${clinicAddress || ''}<br>
        ${clinicPhone ? `Phone: ${clinicPhone}` : ''}
      </p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}">Visit Website</a> | 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/settings">Notification Settings</a>
      </p>
      <p>© ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
APPOINTMENT REMINDER

Hello ${userName},

This is a friendly reminder about your upcoming dental appointment:

DOCTOR: Dr. ${doctorName}
LOCATION: ${clinicName}
${clinicAddress ? `ADDRESS: ${clinicAddress}` : ''}
DATE: ${formattedDate}
TIME: ${formattedTime}${formattedEndTime ? ` - ${formattedEndTime}` : ''}
${treatmentType ? `TREATMENT: ${treatmentType}` : ''}

Need to reschedule?
If you need to reschedule or cancel your appointment, please do so at least 24 hours in advance.

What to bring:
• Valid ID
• Insurance card (if applicable)
• List of current medications
• Previous dental records (if new patient)

${clinicName}
${clinicAddress || ''}
${clinicPhone ? `Phone: ${clinicPhone}` : ''}

Visit your dashboard: ${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/appointments

© ${new Date().getFullYear()} ${clinicName}
`;

  return { subject, html, text };
}
