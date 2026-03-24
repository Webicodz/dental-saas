/**
 * Email Service - SMTP Email Sender
 * Handles sending emails using SMTP configuration
 */

import nodemailer from 'nodemailer';
import { appointmentReminderTemplate } from './templates/appointment-reminder';
import { welcomeTemplate } from './templates/welcome';
import { invoiceTemplate } from './templates/invoice';
import { passwordResetTemplate } from './templates/password-reset';

// Email templates registry
const TEMPLATES = {
  'appointment-reminder': appointmentReminderTemplate,
  'welcome': welcomeTemplate,
  'invoice': invoiceTemplate,
  'password-reset': passwordResetTemplate,
};

/**
 * Create SMTP transporter
 */
function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {string} options.from - Sender email
 * @param {Array} options.attachments - Email attachments
 * @returns {Promise<Object>} Send result
 */
export async function sendEmail(options) {
  const {
    to,
    subject,
    html,
    text,
    from = process.env.EMAIL_FROM || 'noreply@dentalapp.com',
    attachments = [],
  } = options;

  // Skip sending if email is disabled in development
  if (process.env.DISABLE_EMAILS === 'true') {
    console.log('[Email Service] Emails disabled, skipping:', { to, subject });
    return { success: true, skipped: true };
  }

  const transporter = createTransporter();

  const mailOptions = {
    from: `"Dental App" <${from}>`,
    to,
    subject,
    html,
    text,
    attachments,
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('[Email Service] Email sent successfully:', {
      to,
      subject,
      messageId: result.messageId,
    });
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send templated email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.template - Template name
 * @param {Object} options.data - Template data
 * @param {string} options.subject - Optional subject override
 * @returns {Promise<Object>} Send result
 */
export async function sendTemplatedEmail(options) {
  const { to, template, data, subject: customSubject } = options;

  const templateFn = TEMPLATES[template];
  if (!templateFn) {
    throw new Error(`Email template '${template}' not found`);
  }

  const { subject, html, text } = templateFn(data);

  return sendEmail({
    to,
    subject: customSubject || subject,
    html,
    text,
  });
}

/**
 * Send batch emails
 * @param {Array} emails - Array of email options
 * @returns {Promise<Object>} Batch result
 */
export async function sendBatchEmails(emails) {
  const results = {
    success: [],
    failed: [],
  };

  for (const email of emails) {
    try {
      const result = await sendEmail(email);
      if (result.success) {
        results.success.push(email.to);
      } else {
        results.failed.push({ to: email.to, error: result.error });
      }
    } catch (error) {
      results.failed.push({ to: email.to, error: error.message });
    }
  }

  return results;
}

/**
 * Verify SMTP connection
 * @returns {Promise<boolean>} Connection status
 */
export async function verifyConnection() {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    console.error('[Email Service] SMTP connection failed:', error);
    return false;
  }
}
