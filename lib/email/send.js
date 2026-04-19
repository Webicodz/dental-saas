/**
 * Email Service - Stub Implementation
 * Provides email functions without requiring nodemailer
 * Configure SMTP in .env to enable real email sending
 */

// Email templates registry (stub - templates not needed for stub)
const TEMPLATES = {};

/**
 * Send an email (stub - logs to console in development)
 * @param {Object} options - Email options
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

  // Log email instead of sending (stub behavior)
  console.log('[Email Service] Email (stub):', {
    to,
    subject,
    from,
    hasHtml: !!html,
    hasText: !!text,
    attachments: attachments.length,
  });

  return { success: true, stub: true, messageId: `stub-${Date.now()}` };
}

/**
 * Send templated email (stub)
 * @param {Object} options - Email options
 * @returns {Promise<Object>} Send result
 */
export async function sendTemplatedEmail(options) {
  const { to, template, data, subject: customSubject } = options;

  console.log('[Email Service] Templated email (stub):', { to, template, customSubject, data });

  return { success: true, stub: true };
}

/**
 * Send batch emails (stub)
 * @param {Array} emails - Array of email options
 * @returns {Promise<Object>} Batch result
 */
export async function sendBatchEmails(emails) {
  const results = {
    success: [],
    failed: [],
  };

  for (const email of emails) {
    results.success.push(email.to);
  }

  console.log('[Email Service] Batch emails (stub):', {
    count: emails.length,
    results,
  });

  return results;
}

/**
 * Verify SMTP connection (stub - always returns true)
 * @returns {Promise<boolean>} Connection status
 */
export async function verifyConnection() {
  console.log('[Email Service] SMTP connection check (stub)');
  return true;
}
