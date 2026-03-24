/**
 * Notification Settings API
 * GET /api/notifications/settings - Get user settings
 * PUT /api/notifications/settings - Update user settings
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNotificationSettings, updateNotificationSettings } from '@/lib/notifications';

/**
 * GET /api/notifications/settings
 * Get notification settings for the authenticated user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await getNotificationSettings(session.user.id);

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/notifications/settings
 * Update notification settings for the authenticated user
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      emailEnabled,
      smsEnabled,
      inAppEnabled,
      appointmentReminders,
      invoiceNotifications,
      marketingEmails,
      reminderHoursBefore,
      // Channel-specific settings
      emailChannels,
      smsChannels,
      inAppChannels,
    } = body;

    // Validate reminder hours
    if (reminderHoursBefore !== undefined) {
      if (reminderHoursBefore < 1 || reminderHoursBefore > 168) {
        return NextResponse.json(
          { error: 'Reminder hours must be between 1 and 168 (1 week)' },
          { status: 400 }
        );
      }
    }

    const settings = await updateNotificationSettings(session.user.id, {
      emailEnabled,
      smsEnabled,
      inAppEnabled,
      appointmentReminders,
      invoiceNotifications,
      marketingEmails,
      reminderHoursBefore,
      emailChannels,
      smsChannels,
      inAppChannels,
    });

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}
