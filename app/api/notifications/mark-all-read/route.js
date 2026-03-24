/**
 * Mark All Notifications Read API
 * POST /api/notifications/mark-all-read - Mark all as read
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { markAllAsRead } from '@/lib/notifications';

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for the authenticated user
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await markAllAsRead(session.user.id);

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
