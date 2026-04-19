/**
 * Unread Notification Count API
 * GET /api/notifications/unread-count - Get unread count
 */

import { NextResponse } from 'next/server';
import { authenticate, authError } from '@/lib/middleware';
import { getUnreadCount } from '@/lib/notifications';

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications for the authenticated user
 */
export async function GET(request) {
  try {
    const user = authenticate(request);
    
    if (!user) {
      return authError();
    }

    const count = await getUnreadCount(user.userId);

    return NextResponse.json({
      unreadCount: count,
      hasUnread: count > 0,
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread count' },
      { status: 500 }
    );
  }
}
