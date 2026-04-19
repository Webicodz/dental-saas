/**
 * Notifications API - List and Create Notifications
 * GET /api/notifications - List user notifications
 * POST /api/notifications - Create new notification
 */

import { NextResponse } from 'next/server';
import { authenticate, authError } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { 
  getNotifications, 
  createNotification, 
  NOTIFICATION_TYPES,
  CHANNELS,
  PRIORITY
} from '@/lib/notifications';

/**
 * GET /api/notifications
 * List notifications for the authenticated user
 */
export async function GET(request) {
  try {
    const user = authenticate(request);
    
    if (!user) {
      return authError();
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const type = searchParams.get('type');

    const result = await getNotifications(user.userId, {
      page,
      limit,
      unreadOnly,
      type,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/notifications
 * Create a new notification (admin/staff only)
 */
export async function POST(request) {
  try {
    const user = authenticate(request);
    
    if (!user) {
      return authError();
    }

    // Check if user has permission to create notifications
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, clinicId: true },
    });

    if (!dbUser || !['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(dbUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      userId,
      type,
      title,
      message,
      data,
      priority,
      channels,
      clinicId,
      // Bulk notification options
      patientIds,
      allPatients,
      allStaff,
    } = body;

    // Single user notification
    if (userId) {
      const result = await createNotification({
        userId,
        type: type || NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
        title,
        message,
        data: data || {},
        priority: priority || PRIORITY.MEDIUM,
        channels: channels || [CHANNELS.IN_APP],
        clinicId: clinicId || dbUser.clinicId,
      });

      return NextResponse.json({
        success: true,
        message: 'Notification created',
        result,
      });
    }

    // Bulk notifications
    const recipients = [];

    if (allPatients) {
      const patients = await prisma.patient.findMany({
        where: { clinicId: dbUser.clinicId },
        include: { user: true },
      });
      recipients.push(...patients.filter(p => p.user).map(p => p.user.id));
    }

    if (allStaff) {
      const staff = await prisma.user.findMany({
        where: { clinicId: dbUser.clinicId },
      });
      recipients.push(...staff.map(s => s.id));
    }

    if (patientIds && patientIds.length > 0) {
      const patients = await prisma.patient.findMany({
        where: { id: { in: patientIds } },
        include: { user: true },
      });
      recipients.push(...patients.filter(p => p.user).map(p => p.user.id));
    }

    // Remove duplicates
    const uniqueRecipients = [...new Set(recipients)];

    // Create notifications for each recipient
    const results = {
      success: [],
      failed: [],
    };

    for (const recipientId of uniqueRecipients) {
      try {
        await createNotification({
          userId: recipientId,
          type: type || NOTIFICATION_TYPES.SYSTEM_ANNOUNCEMENT,
          title,
          message,
          data: data || {},
          priority: priority || PRIORITY.MEDIUM,
          channels: channels || [CHANNELS.IN_APP],
          clinicId: clinicId || dbUser.clinicId,
        });
        results.success.push(recipientId);
      } catch (error) {
        results.failed.push({ userId: recipientId, error: error.message });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${results.success.length} notifications`,
      results,
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
