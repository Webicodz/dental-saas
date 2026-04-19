/**
 * Notification System - Core Helpers
 * Handles notification creation, management, and delivery
 */

import prisma from './prisma';
import { sendEmail } from './email/send';
import { sendSMS } from './sms/send';

// Notification types
export const NOTIFICATION_TYPES = {
  APPOINTMENT_REMINDER: 'appointment_reminder',
  APPOINTMENT_CANCELLED: 'appointment_cancelled',
  APPOINTMENT_CONFIRMED: 'appointment_confirmed',
  APPOINTMENT_RESCHEDULED: 'appointment_rescheduled',
  NEW_MESSAGE: 'new_message',
  INVOICE_GENERATED: 'invoice_generated',
  INVOICE_PAID: 'invoice_paid',
  PAYMENT_REMINDER: 'payment_reminder',
  TREATMENT_PLAN_UPDATED: 'treatment_plan_updated',
  DOCUMENT_UPLOADED: 'document_uploaded',
  SYSTEM_ANNOUNCEMENT: 'system_announcement',
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password_reset',
};

// Notification channels
export const CHANNELS = {
  IN_APP: 'in_app',
  EMAIL: 'email',
  SMS: 'sms',
};

// Priority levels
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

/**
 * Create a new notification
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Created notification
 */
export async function createNotification(data) {
  const {
    userId,
    type,
    title,
    message,
    data: notificationData = {},
    priority = PRIORITY.MEDIUM,
    channels = [CHANNELS.IN_APP],
    clinicId,
  } = data;

  // Create in-app notification
  if (channels.includes(CHANNELS.IN_APP)) {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: notificationData,
        priority,
        channel: CHANNELS.IN_APP,
        clinicId,
      },
    });
  }

  // Get user for email/SMS
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { patient: true },
  });

  // Send email notification
  if (channels.includes(CHANNELS.EMAIL) && user?.email) {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title: `Email: ${title}`,
        message,
        data: notificationData,
        priority,
        channel: CHANNELS.EMAIL,
        clinicId,
      },
    });

    await sendEmailNotification(user, type, title, message, notificationData);
  }

  // Send SMS notification
  if (channels.includes(CHANNELS.SMS) && user?.phone) {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title: `SMS: ${title}`,
        message,
        data: notificationData,
        priority,
        channel: CHANNELS.SMS,
        clinicId,
      },
    });

    await sendSMSNotification(user, type, message, notificationData);
  }

  return { success: true };
}

/**
 * Send email notification based on type
 */
async function sendEmailNotification(user, type, title, message, data) {
  let template = null;

  switch (type) {
    case NOTIFICATION_TYPES.APPOINTMENT_REMINDER:
    case NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED:
    case NOTIFICATION_TYPES.APPOINTMENT_RESCHEDULED:
      template = 'appointment-reminder';
      break;
    case NOTIFICATION_TYPES.INVOICE_GENERATED:
    case NOTIFICATION_TYPES.INVOICE_PAID:
      template = 'invoice';
      break;
    case NOTIFICATION_TYPES.WELCOME:
      template = 'welcome';
      break;
    case NOTIFICATION_TYPES.PASSWORD_RESET:
      template = 'password-reset';
      break;
    default:
      template = null;
  }

  if (template) {
    await sendEmail({
      to: user.email,
      template,
      data: {
        userName: `${user.firstName} ${user.lastName}`,
        ...data,
      },
    });
  }
}

/**
 * Send SMS notification based on type
 */
async function sendSMSNotification(user, type, message, data) {
  const phone = user.phone || user.patient?.phone;
  if (!phone) return;

  // Customize SMS message based on type
  let smsMessage = message;

  // For appointment reminders, send a shorter version
  if (type === NOTIFICATION_TYPES.APPOINTMENT_REMINDER) {
    smsMessage = `Dental Reminder: ${message} Reply STOP to unsubscribe.`;
  }

  await sendSMS({
    to: phone,
    message: smsMessage,
  });
}

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Notifications with pagination
 */
export async function getNotifications(userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    unreadOnly = false,
    type,
  } = options;

  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(unreadOnly && { readAt: null }),
    ...(type && { type }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
}

/**
 * Get unread notification count
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread count
 */
export async function getUnreadCount(userId) {
  return prisma.notification.count({
    where: {
      userId,
      readAt: null,
    },
  });
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Updated notification
 */
export async function markAsRead(notificationId, userId) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  });
}

/**
 * Mark all notifications as read for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Update result
 */
export async function markAllAsRead(userId) {
  return prisma.notification.updateMany({
    where: {
      userId,
      readAt: null,
    },
    data: { readAt: new Date() },
  });
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 * @param {string} userId - User ID (for authorization)
 * @returns {Promise<Object>} Delete result
 */
export async function deleteNotification(notificationId, userId) {
  return prisma.notification.delete({
    where: { id: notificationId },
  });
}

/**
 * Get user notification settings
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User settings
 */
export async function getNotificationSettings(userId) {
  let settings = await prisma.notificationSettings.findUnique({
    where: { userId },
  });

  // Create default settings if not exists
  if (!settings) {
    settings = await prisma.notificationSettings.create({
      data: {
        userId,
        emailEnabled: true,
        smsEnabled: true,
        inAppEnabled: true,
        appointmentReminders: true,
        invoiceNotifications: true,
        marketingEmails: false,
        reminderHoursBefore: 24,
      },
    });
  }

  return settings;
}

/**
 * Update user notification settings
 * @param {string} userId - User ID
 * @param {Object} data - Settings to update
 * @returns {Promise<Object>} Updated settings
 */
export async function updateNotificationSettings(userId, data) {
  return prisma.notificationSettings.upsert({
    where: { userId },
    create: {
      userId,
      ...data,
    },
    update: data,
  });
}

/**
 * Create appointment reminder
 * @param {string} appointmentId - Appointment ID
 * @param {number} hoursBefore - Hours before appointment
 * @returns {Promise<void>}
 */
export async function createAppointmentReminder(appointmentId, hoursBefore = 24) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      patient: {
        include: { user: true },
      },
      doctor: true,
      clinic: true,
    },
  });

  if (!appointment || !appointment.patient?.user) return;

  const reminderTime = new Date(appointment.startTime);
  reminderTime.setHours(reminderTime.getHours() - hoursBefore);

  // Only send if reminder time is in the future
  if (reminderTime <= new Date()) return;

  // Get user settings
  const settings = await getNotificationSettings(appointment.patient.userId);
  
  const channels = [CHANNELS.IN_APP];
  if (settings.emailEnabled) channels.push(CHANNELS.EMAIL);
  if (settings.smsEnabled) channels.push(CHANNELS.SMS);

  await createNotification({
    userId: appointment.patient.userId,
    type: NOTIFICATION_TYPES.APPOINTMENT_REMINDER,
    title: 'Appointment Reminder',
    message: `You have an appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} on ${formatDateTime(appointment.startTime)} at ${appointment.clinic.name}.`,
    data: {
      appointmentId: appointment.id,
      doctorName: `${appointment.doctor.firstName} ${appointment.doctor.lastName}`,
      clinicName: appointment.clinic.name,
      appointmentTime: appointment.startTime,
      appointmentEndTime: appointment.endTime,
    },
    priority: PRIORITY.HIGH,
    channels,
    clinicId: appointment.clinicId,
  });
}

/**
 * Format date and time for display
 */
function formatDateTime(date) {
  return new Date(date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Send bulk notification to multiple users
 * @param {Object} data - Notification data
 * @param {Array<string>} userIds - Array of user IDs
 * @returns {Promise<Object>} Result
 */
export async function sendBulkNotification(data, userIds) {
  const results = {
    success: [],
    failed: [],
  };

  for (const userId of userIds) {
    try {
      await createNotification({
        ...data,
        userId,
      });
      results.success.push(userId);
    } catch (error) {
      console.error(`Failed to send notification to user ${userId}:`, error);
      results.failed.push(userId);
    }
  }

  return results;
}

/**
 * Notify staff of new appointment
 * @param {Object} appointment - Appointment data
 * @returns {Promise<void>}
 */
export async function notifyStaffOfNewAppointment(appointment) {
  // Get all staff members for the clinic
  const staff = await prisma.user.findMany({
    where: {
      clinicId: appointment.clinicId,
      role: { in: ['ADMIN', 'DOCTOR', 'RECEPTIONIST'] },
    },
  });

  for (const staffMember of staff) {
    await createNotification({
      userId: staffMember.id,
      type: NOTIFICATION_TYPES.APPOINTMENT_CONFIRMED,
      title: 'New Appointment',
      message: `New appointment scheduled for ${formatPatientName(appointment.patient)} on ${formatDateTime(appointment.startTime)}.`,
      data: {
        appointmentId: appointment.id,
        patientName: formatPatientName(appointment.patient),
        appointmentTime: appointment.startTime,
      },
      priority: PRIORITY.MEDIUM,
      channels: [CHANNELS.IN_APP],
      clinicId: appointment.clinicId,
    });
  }
}

function formatPatientName(patient) {
  if (!patient) return 'Unknown Patient';
  return `${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Unknown Patient';
}
