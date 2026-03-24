/**
 * Unread Notification Count API
 * GET /api/notifications/unread-count - Get unread count
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getUnreadCount } from '@/lib/notifications';

/**
 * GET /api/notifications/unread-count
 * Get the count of unread notifications for the authenticated user
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

    const count = await getUnreadCount(session.user.id);

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
