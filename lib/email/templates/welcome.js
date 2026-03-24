/**
 * Welcome Email Template
 */

export function welcomeTemplate(data) {
  const {
    userName = 'New User',
    email = '',
    clinicName = 'Dental Clinic',
    clinicPhone,
    clinicAddress,
    dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/dashboard`,
  } = data;

  const subject = `Welcome to ${clinicName}!`;

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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .content {
      padding: 40px 30px;
    }
    .content h2 {
      color: #333;
      margin: 0 0 20px 0;
      font-size: 20px;
    }
    .content p {
      margin: 0 0 15px 0;
      color: #555;
    }
    .feature-list {
      margin: 25px 0;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      margin: 15px 0;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 8px;
    }
    .feature-icon {
      width: 40px;
      height: 40px;
      background-color: #007bff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-size: 20px;
    }
    .feature-text h3 {
      margin: 0 0 5px 0;
      font-size: 16px;
      color: #333;
    }
    .feature-text p {
      margin: 0;
      font-size: 14px;
      color: #666;
    }
    .cta-section {
      text-align: center;
      margin: 35px 0;
      padding: 30px;
      background: linear-gradient(135deg, #f5f7fa 0%, #e4e8eb 100%);
      border-radius: 8px;
    }
    .cta-section h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 18px;
    }
    .btn {
      display: inline-block;
      padding: 14px 35px;
      background-color: #007bff;
      color: white;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .btn:hover {
      background-color: #0056b3;
    }
    .help-section {
      margin-top: 30px;
      padding: 20px;
      background-color: #fff3cd;
      border-radius: 8px;
      border-left: 4px solid #ffc107;
    }
    .help-section h4 {
      margin: 0 0 10px 0;
      color: #856404;
    }
    .help-section p {
      margin: 0;
      color: #856404;
      font-size: 14px;
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
    .social-links {
      margin: 15px 0;
    }
    .social-links a {
      display: inline-block;
      width: 32px;
      height: 32px;
      background-color: #6c757d;
      border-radius: 50%;
      margin: 0 5px;
      line-height: 32px;
      color: white;
      text-decoration: none;
    }
    @media only screen and (max-width: 480px) {
      body {
        padding: 10px;
      }
      .header, .content {
        padding: 25px 20px;
      }
      .feature-item {
        flex-direction: column;
      }
      .feature-icon {
        margin-bottom: 10px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to ${clinicName}!</h1>
      <p>Your dental health journey starts here</p>
    </div>
    
    <div class="content">
      <h2>Hello ${userName},</h2>
      
      <p>
        Thank you for joining <strong>${clinicName}</strong>! We're thrilled to have you as part of our dental family. 
        With your new account, you now have access to a comprehensive suite of tools designed to make managing your dental health easier than ever.
      </p>
      
      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-icon">📅</div>
          <div class="feature-text">
            <h3>Easy Appointment Scheduling</h3>
            <p>Book, reschedule, or cancel appointments with just a few clicks. Choose your preferred time slots and doctors.</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">📋</div>
          <div class="feature-text">
            <h3>Complete Health Records</h3>
            <p>Access your dental history, treatment plans, and medical records all in one secure place.</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">💳</div>
          <div class="feature-text">
            <h3>Billing & Payments</h3>
            <p>View invoices, payment history, and manage your billing information securely.</p>
          </div>
        </div>
        
        <div class="feature-item">
          <div class="feature-icon">🔔</div>
          <div class="feature-text">
            <h3>Smart Reminders</h3>
            <p>Never miss an appointment with automatic reminders via email and SMS.</p>
          </div>
        </div>
      </div>
      
      <div class="cta-section">
        <h3>🚀 Get Started Today</h3>
        <p style="color: #666; margin-bottom: 20px;">
          Your account is ready! Take a tour of your dashboard to explore all available features.
        </p>
        <a href="${dashboardUrl}" class="btn">Go to Dashboard</a>
      </div>
      
      <div class="help-section">
        <h4>💡 Need Help?</h4>
        <p>
          If you have any questions or need assistance getting started, our support team is here to help.
          ${clinicPhone ? `Contact us at ${clinicPhone}` : 'Reach out to our support team'}.
        </p>
      </div>
      
      <p style="margin-top: 30px;">
        Once again, welcome to ${clinicName}. We look forward to serving you!<br><br>
        Warm regards,<br>
        <strong>The ${clinicName} Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>
        ${clinicName}<br>
        ${clinicAddress || 'Your Trusted Dental Care Provider'}<br>
        ${clinicPhone ? `Phone: ${clinicPhone}` : ''}
      </p>
      
      <div class="social-links">
        <a href="#">f</a>
        <a href="#">t</a>
        <a href="#">in</a>
      </div>
      
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}">Website</a> | 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/privacy">Privacy Policy</a> | 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/terms">Terms of Service</a>
      </p>
      <p>© ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
      <p style="margin-top: 10px;">
        You received this email because you signed up for ${clinicName}.
      </p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
WELCOME TO ${clinicName.toUpperCase()}!

Hello ${userName},

Thank you for joining ${clinicName}! We're thrilled to have you as part of our dental family.

WHAT YOU CAN DO:

📅 Easy Appointment Scheduling
   Book, reschedule, or cancel appointments with just a few clicks.

📋 Complete Health Records
   Access your dental history, treatment plans, and medical records.

💳 Billing & Payments
   View invoices, payment history, and manage billing information.

🔔 Smart Reminders
   Never miss an appointment with automatic reminders.

GET STARTED:
Visit your dashboard: ${dashboardUrl}

${clinicPhone ? `Need help? Contact us at ${clinicPhone}` : 'Need help? Reach out to our support team.'}

Once again, welcome to ${clinicName}. We look forward to serving you!

Warm regards,
The ${clinicName} Team

${clinicName}
${clinicAddress || ''}
${clinicPhone ? `Phone: ${clinicPhone}` : ''}

© ${new Date().getFullYear()} ${clinicName}. All rights reserved.
`;

  return { subject, html, text };
}
