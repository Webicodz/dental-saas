/**
 * Password Reset Email Template
 */

export function passwordResetTemplate(data) {
  const {
    userName = 'User',
    resetToken,
    resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/auth/reset-password?token=${resetToken}`,
    expiresIn = '1 hour',
    clinicName = 'Dental App',
    clinicPhone,
    supportEmail = 'support@dentalapp.com',
  } = data;

  const subject = `Reset Your ${clinicName} Password`;

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
      background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 26px;
      font-weight: 600;
    }
    .header p {
      margin: 10px 0 0 0;
      opacity: 0.9;
      font-size: 16px;
    }
    .icon {
      font-size: 48px;
      margin-bottom: 15px;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      margin: 0 0 20px 0;
      color: #555;
    }
    .alert-box {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .alert-box.warning {
      background-color: #fff3cd;
      border-color: #ffc107;
    }
    .alert-box h3 {
      margin: 0 0 10px 0;
      color: #856404;
      font-size: 16px;
    }
    .alert-box p {
      margin: 0;
      color: #856404;
      font-size: 14px;
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
      background-color: #e74c3c;
      color: white;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 16px;
      transition: background-color 0.3s;
    }
    .btn:hover {
      background-color: #c0392b;
    }
    .link-box {
      background-color: #f8f9fa;
      border: 1px dashed #ccc;
      border-radius: 6px;
      padding: 15px;
      margin: 20px 0;
      word-break: break-all;
      font-size: 13px;
      color: #666;
    }
    .link-box a {
      color: #007bff;
      text-decoration: none;
    }
    .security-info {
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 20px;
      margin: 25px 0;
    }
    .security-info h4 {
      margin: 0 0 10px 0;
      color: #333;
      font-size: 14px;
    }
    .security-info ul {
      margin: 0;
      padding-left: 20px;
      color: #666;
      font-size: 14px;
    }
    .security-info li {
      margin: 5px 0;
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
    @media only screen and (max-width: 480px) {
      body {
        padding: 10px;
      }
      .header, .content {
        padding: 25px 20px;
      }
      .link-box {
        font-size: 11px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="icon">🔐</div>
      <h1>Password Reset Request</h1>
      <p>Someone requested a password reset for your account</p>
    </div>
    
    <div class="content">
      <p>Hello <strong>${userName}</strong>,</p>
      
      <p>
        We received a request to reset the password for your <strong>${clinicName}</strong> account. 
        If you made this request, click the button below to reset your password.
      </p>
      
      <div class="alert-box warning">
        <h3>⚠️ Important Security Notice</h3>
        <p>
          This link will expire in <strong>${expiresIn}</strong>. If you didn't request a password reset, 
          please ignore this email or contact support if you have concerns.
        </p>
      </div>
      
      <div class="cta-section">
        <h3>Reset Your Password</h3>
        <p style="color: #666; margin-bottom: 20px;">
          Click the button below to create a new password for your account.
        </p>
        <a href="${resetUrl}" class="btn">Reset Password</a>
      </div>
      
      <p style="font-size: 14px; color: #666;">
        If the button doesn't work, copy and paste this link into your browser:
      </p>
      <div class="link-box">
        <a href="${resetUrl}">${resetUrl}</a>
      </div>
      
      <div class="security-info">
        <h4>🔒 Security Tips</h4>
        <ul>
          <li>Never share your password with anyone</li>
          <li>Use a strong, unique password</li>
          <li>Don't use the same password across multiple sites</li>
          <li>Log out when using shared devices</li>
        </ul>
      </div>
      
      <p style="margin-top: 30px;">
        If you didn't request this password reset, please contact us immediately at 
        <a href="mailto:${supportEmail}">${supportEmail}</a>.
      </p>
      
      <p style="margin-top: 20px;">
        Best regards,<br>
        <strong>The ${clinicName} Security Team</strong>
      </p>
    </div>
    
    <div class="footer">
      <p>
        <strong>${clinicName}</strong><br>
        ${clinicPhone ? `Support: ${clinicPhone}` : ''}<br>
        Email: ${supportEmail}
      </p>
      <p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}">Visit Website</a> | 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/privacy">Privacy Policy</a> | 
        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://dentalapp.com'}/terms">Terms of Service</a>
      </p>
      <p>© ${new Date().getFullYear()} ${clinicName}. All rights reserved.</p>
      <p style="margin-top: 10px; color: #999;">
        This is an automated security message. Please do not reply to this email.
      </p>
    </div>
  </div>
</body>
</html>
`;

  const text = `
PASSWORD RESET REQUEST

Hello ${userName},

We received a request to reset the password for your ${clinicName} account.

If you made this request, visit this link to reset your password:
${resetUrl}

IMPORTANT:
- This link will expire in ${expiresIn}
- If you didn't request a password reset, please ignore this email

SECURITY TIPS:
- Never share your password with anyone
- Use a strong, unique password
- Don't use the same password across multiple sites
- Log out when using shared devices

If you didn't request this password reset, please contact us immediately at ${supportEmail}.

Best regards,
The ${clinicName} Security Team

${clinicName}
${clinicPhone ? `Support: ${clinicPhone}` : ''}
Email: ${supportEmail}

© ${new Date().getFullYear()} ${clinicName}. All rights reserved.

This is an automated security message. Please do not reply to this email.
`;

  return { subject, html, text };
}
