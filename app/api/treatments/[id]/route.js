import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/treatments/[id] - Get treatment details
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const treatment = await prisma.treatment.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
          },
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            licenseNumber: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            endTime: true,
            status: true,
            notes: true,
          },
        },
      },
    });

    if (!treatment) {
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(treatment);
  } catch (error) {
    console.error('Error fetching treatment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch treatment' },
      { status: 500 }
    );
  }
}

// PUT /api/treatments/[id] - Update treatment
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      treatmentName,
      tooth,
      procedure,
      status,
      startDate,
      completedDate,
      estimatedCost,
      actualCost,
      notes,
      prescriptions,
    } = body;

    // Check if treatment exists and belongs to this clinic
    const existingTreatment = await prisma.treatment.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existingTreatment) {
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      );
    }

    // Build update data
    const updateData = {};

    if (treatmentName !== undefined) updateData.treatmentName = treatmentName;
    if (tooth !== undefined) updateData.tooth = tooth;
    if (procedure !== undefined) updateData.procedure = procedure;
    if (status !== undefined) updateData.status = status;
    if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
    if (completedDate !== undefined) updateData.completedDate = completedDate ? new Date(completedDate) : null;
    if (estimatedCost !== undefined) updateData.estimatedCost = estimatedCost ? parseFloat(estimatedCost) : null;
    if (actualCost !== undefined) updateData.actualCost = actualCost ? parseFloat(actualCost) : null;
    if (notes !== undefined) updateData.notes = notes;
    if (prescriptions !== undefined) updateData.prescriptions = prescriptions;

    // Update treatment
    const treatment = await prisma.treatment.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            specialization: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        appointment: {
          select: {
            id: true,
            appointmentDate: true,
            startTime: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(treatment);
  } catch (error) {
    console.error('Error updating treatment:', error);
    return NextResponse.json(
      { error: 'Failed to update treatment' },
      { status: 500 }
    );
  }
}

// DELETE /api/treatments/[id] - Delete treatment
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if treatment exists and belongs to this clinic
    const existingTreatment = await prisma.treatment.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existingTreatment) {
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      );
    }

    // Cannot delete completed treatments
    if (existingTreatment.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'Cannot delete a completed treatment. Archive it instead.' },
        { status: 400 }
      );
    }

    // Delete treatment
    await prisma.treatment.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Treatment deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting treatment:', error);
    return NextResponse.json(
      { error: 'Failed to delete treatment' },
      { status: 500 }
    );
  }
}
