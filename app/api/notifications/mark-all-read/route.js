/**
 * Mark All Notifications Read API
 * POST /api/notifications/mark-all-read - Mark all as read
 */

import { NextResponse } from 'next/server';
import { authenticate, authError } from '@/lib/middleware';
import { markAllAsRead } from '@/lib/notifications';

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
export async function POST(request) {
  try {
    const user = authenticate(request);
    
    if (!user) {
      return authError();
    }

    const result = await markAllAsRead(user.userId);

    return NextResponse.json({
      success: true,
      message: `${result.count} notifications marked as read`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notifications as read' },
      { status: 500 }
    );
  }
}
