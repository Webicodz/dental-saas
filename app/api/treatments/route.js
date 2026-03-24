import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/treatments - List treatments with filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const doctorId = searchParams.get('doctorId');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      clinicId: session.user.clinicId,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (status) {
      where.status = status;
    }

    const [treatments, total] = await Promise.all([
      prisma.treatment.findMany({
        where,
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.treatment.count({ where }),
    ]);

    return NextResponse.json({
      treatments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching treatments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch treatments' },
      { status: 500 }
    );
  }
}

// POST /api/treatments - Create new treatment
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      doctorId,
      appointmentId,
      treatmentName,
      tooth,
      procedure,
      status = 'PLANNED',
      startDate,
      estimatedCost,
      notes,
      prescriptions,
    } = body;

    // Validate required fields
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    if (!doctorId) {
      return NextResponse.json(
        { error: 'Doctor ID is required' },
        { status: 400 }
      );
    }

    if (!treatmentName) {
      return NextResponse.json(
        { error: 'Treatment name is required' },
        { status: 400 }
      );
    }

    if (!procedure) {
      return NextResponse.json(
        { error: 'Procedure description is required' },
        { status: 400 }
      );
    }

    // Verify patient belongs to this clinic
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        clinicId: session.user.clinicId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Verify doctor belongs to this clinic
    const doctor = await prisma.doctor.findFirst({
      where: {
        id: doctorId,
        clinicId: session.user.clinicId,
      },
    });

    if (!doctor) {
      return NextResponse.json(
        { error: 'Doctor not found' },
        { status: 404 }
      );
    }

    // Create treatment
    const treatment = await prisma.treatment.create({
      data: {
        clinicId: session.user.clinicId,
        patientId,
        doctorId,
        appointmentId,
        treatmentName,
        tooth,
        procedure,
        status,
        startDate: startDate ? new Date(startDate) : null,
        estimatedCost: estimatedCost ? parseFloat(estimatedCost) : null,
        notes,
        prescriptions,
      },
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

    return NextResponse.json(treatment, { status: 201 });
  } catch (error) {
    console.error('Error creating treatment:', error);
    return NextResponse.json(
      { error: 'Failed to create treatment' },
      { status: 500 }
    );
  }
}
