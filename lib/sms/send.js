/**
 * SMS Service - Twilio SMS Sender
 * Handles sending SMS messages using Twilio
 */

// Twilio client (optional import, will be loaded conditionally)
let twilioClient = null;

/**
 * Initialize Twilio client
 */
function getTwilioClient() {
  if (twilioClient) return twilioClient;

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    console.warn('[SMS Service] Twilio credentials not configured');
    return null;
  }

  // Dynamic import for Twilio
  try {
    const twilio = require('twilio');
    twilioClient = twilio(accountSid, authToken);
    return twilioClient;
  } catch (error) {
    console.error('[SMS Service] Failed to load Twilio:', error.message);
    return null;
  }
}

/**
 * Format phone number for Twilio
 * @param {string} phone - Phone number
 * @returns {string} Formatted phone number
 */
function formatPhoneNumber(phone) {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Add country code if not present (default to US +1)
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If already has country code
  if (digits.startsWith('1') && digits.length === 12) {
    return `+${digits}`;
  }
  
  return digits.startsWith('+') ? digits : `+${digits}`;
}

/**
 * Send an SMS message
 * @param {Object} options - SMS options
 * @param {string} options.to - Recipient phone number
 * @param {string} options.message - Message content
 * @param {string} options.from - Sender phone number (optional)
 * @returns {Promise<Object>} Send result
 */
export async function sendSMS(options) {
  const {
    to,
    message,
    from = process.env.TWILIO_PHONE_NUMBER,
  } = options;

  // Skip sending if SMS is disabled
  if (process.env.DISABLE_SMS === 'true') {
    console.log('[SMS Service] SMS disabled, skipping:', { to, message: message.substring(0, 50) });
    return { success: true, skipped: true };
  }

  // Check if Twilio is configured
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    console.warn('[SMS Service] Twilio not configured, SMS not sent');
    return { success: false, error: 'SMS service not configured' };
  }

  const client = getTwilioClient();
  if (!client) {
    return { success: false, error: 'Failed to initialize Twilio client' };
  }

  const formattedTo = formatPhoneNumber(to);

  // Validate message length
  if (message.length > 1600) {
    return { success: false, error: 'Message too long (max 1600 characters)' };
  }

  try {
    const result = await client.messages.create({
      body: message,
      to: formattedTo,
      from: from || process.env.TWILIO_PHONE_NUMBER,
    });

    console.log('[SMS Service] SMS sent successfully:', {
      to: formattedTo,
      sid: result.sid,
      status: result.status,
    });

    return {
      success: true,
      sid: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error('[SMS Service] Failed to send SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send bulk SMS messages
 * @param {Array} messages - Array of message options
 * @returns {Promise<Object>} Bulk result
 */
export async function sendBulkSMS(messages) {
  const results = {
    success: [],
    failed: [],
  };

  for (const msg of messages) {
    try {
      const result = await sendSMS(msg);
      if (result.success) {
        results.success.push({ to: msg.to, sid: result.sid });
      } else {
        results.failed.push({ to: msg.to, error: result.error });
      }
    } catch (error) {
      results.failed.push({ to: msg.to, error: error.message });
    }
  }

  return results;
}

/**
 * Get SMS status
 * @param {string} sid - Message SID
 * @returns {Promise<Object>} Message status
 */
export async function getSMSStatus(sid) {
  const client = getTwilioClient();
  if (!client) {
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const message = await client.messages(sid).fetch();
    return {
      success: true,
      status: message.status,
      dateSent: message.dateSent,
      dateCreated: message.dateCreated,
      errorCode: message.errorCode,
      errorMessage: message.errorMessage,
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Cancel a scheduled SMS
 * @param {string} sid - Message SID
 * @returns {Promise<Object>} Cancel result
 */
export async function cancelSMS(sid) {
  const client = getTwilioClient();
  if (!client) {
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const message = await client.messages(sid).fetch();
    
    if (message.status === 'queued' || message.status === 'scheduled') {
      await client.messages(sid).update({ status: 'cancelled' });
      return { success: true };
    }
    
    return { success: false, error: 'Message cannot be cancelled' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Send appointment reminder SMS
 * @param {Object} options - Appointment details
 * @returns {Promise<Object>} Send result
 */
export async function sendAppointmentReminderSMS(options) {
  const { phone, patientName, doctorName, clinicName, appointmentTime, appointmentDate } = options;

  const dateStr = appointmentDate || new Date(appointmentTime).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const timeStr = new Date(appointmentTime).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });

  const message = `Hi ${patientName}, this is a reminder of your dental appointment with Dr. ${doctorName} at ${clinicName} on ${dateStr} at ${timeStr}. Reply C to confirm or R to reschedule.`;

  return sendSMS({ to: phone, message });
}

/**
 * Verify Twilio connection
 * @returns {Promise<boolean>} Connection status
 */
export async function verifyConnection() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    return false;
  }

  try {
    const client = getTwilioClient();
    if (!client) return false;
    
    await client.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
    return true;
  } catch (error) {
    console.error('[SMS Service] Twilio connection failed:', error);
    return false;
  }
}
