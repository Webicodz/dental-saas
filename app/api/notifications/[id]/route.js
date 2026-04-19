/**
 * Notification Detail API - Mark Read/Delete
 * PATCH /api/notifications/[id] - Mark as read
 * DELETE /api/notifications/[id] - Delete notification
 */

import { NextResponse } from 'next/server';
import { authenticate, authError } from '@/lib/middleware';
import prisma from '@/lib/prisma';
import { markAsRead, deleteNotification } from '@/lib/notifications';

/**
 * PATCH /api/notifications/[id]
 * Mark notification as read
 */
export async function PATCH(request, { params }) {
  try {
    const user = authenticate(request);
    
    if (!user) {
      return authError();
    }

    const { id } = params;

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Mark as read
    const updated = await markAsRead(id, user.userId);

    return NextResponse.json({
      success: true,
      notification: updated,
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to update notification' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/notifications/[id]
 * Delete a notification
 */
export async function DELETE(request, { params }) {
  try {
    const user = authenticate(request);
    
    if (!user) {
      return authError();
    }

    const { id } = params;

    // Verify the notification belongs to the user
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return NextResponse.json(
        { error: 'Notification not found' },
        { status: 404 }
      );
    }

    if (notification.userId !== user.userId) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await deleteNotification(id, user.userId);

    return NextResponse.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    return NextResponse.json(
      { error: 'Failed to delete notification' },
      { status: 500 }
    );
  }
}
