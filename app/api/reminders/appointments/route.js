/**
 * Appointment Reminders API
 * Handles scheduling and sending appointment reminders
 * POST /api/reminders/appointments - Schedule reminders for appointments
 * GET /api/reminders/appointments - Get scheduled reminders
 * DELETE /api/reminders/appointments - Cancel scheduled reminders
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAppointmentReminder, getNotificationSettings } from '@/lib/notifications';

/**
 * POST /api/reminders/appointments
 * Schedule reminders for appointments
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Only staff can schedule reminders
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true, clinicId: true },
    });

    if (!user || !['ADMIN', 'DOCTOR', 'RECEPTIONIST'].includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden - Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { appointmentIds, hoursBefore = 24 } = body;

    if (!appointmentIds || !Array.isArray(appointmentIds)) {
      return NextResponse.json(
        { error: 'appointmentIds array is required' },
        { status: 400 }
      );
    }

    if (hoursBefore < 1 || hoursBefore > 168) {
      return NextResponse.json(
        { error: 'hoursBefore must be between 1 and 168' },
        { status: 400 }
      );
    }

    const results = {
      success: [],
      failed: [],
      skipped: [],
    };

    for (const appointmentId of appointmentIds) {
      try {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: {
            patient: {
              include: { user: true },
            },
          },
        });

        if (!appointment) {
          results.failed.push({
            appointmentId,
            error: 'Appointment not found',
          });
          continue;
        }

        // Check if appointment is in the future
        const appointmentTime = new Date(appointment.startTime);
        const reminderTime = new Date(appointmentTime);
        reminderTime.setHours(reminderTime.getHours() - hoursBefore);

        if (appointmentTime <= new Date()) {
          results.skipped.push({
            appointmentId,
            reason: 'Appointment is in the past',
          });
          continue;
        }

        // Get user settings to check if reminders are enabled
        if (appointment.patient?.userId) {
          const settings = await getNotificationSettings(appointment.patient.userId);
          
          if (!settings.appointmentReminders) {
            results.skipped.push({
              appointmentId,
              reason: 'User has disabled appointment reminders',
            });
            continue;
          }
        }

        // Create the reminder
        await createAppointmentReminder(appointmentId, hoursBefore);

        results.success.push({
          appointmentId,
          reminderTime: reminderTime.toISOString(),
        });
      } catch (error) {
        results.failed.push({
          appointmentId,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      scheduled: results.success.length,
      skipped: results.skipped.length,
      failed: results.failed.length,
      results,
    });
  } catch (error) {
    console.error('Error scheduling appointment reminders:', error);
    return NextResponse.json(
      { error: 'Failed to schedule reminders' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reminders/appointments
 * Get scheduled reminders for appointments
 */
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const appointmentId = searchParams.get('appointmentId');
    const clinicId = searchParams.get('clinicId');

    // Build query
    const where = {
      type: 'appointment_reminder',
      ...(appointmentId && { data: { path: ['appointmentId'], equals: appointmentId } }),
    };

    // Get user's clinic
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { clinicId: true, role: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Filter by clinic if not admin
    if (user.role !== 'ADMIN' && clinicId !== user.clinicId) {
      where.clinicId = user.clinicId;
    } else if (clinicId) {
      where.clinicId = clinicId;
    }

    const reminders = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({
      reminders,
      count: reminders.length,
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}
