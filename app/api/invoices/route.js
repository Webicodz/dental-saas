import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/invoices - List invoices with filters
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const patientId = searchParams.get('patientId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const skip = (page - 1) * limit;

    // Build where clause
    const where = {
      clinicId: session.user.clinicId,
    };

    if (status) {
      where.status = status;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    if (startDate || endDate) {
      where.issueDate = {};
      if (startDate) {
        where.issueDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.issueDate.lte = new Date(endDate);
      }
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
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
          payments: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    return NextResponse.json({
      invoices,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create new invoice
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      patientId,
      items,
      subtotal,
      tax = 0,
      discount = 0,
      dueDate,
      notes,
      paymentMethod,
    } = body;

    // Validate required fields
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'At least one item is required' },
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

    // Calculate totals
    const calculatedSubtotal = items.reduce((sum, item) => {
      return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
    }, 0);

    const calculatedTotal = calculatedSubtotal + parseFloat(tax || 0) - parseFloat(discount || 0);
    const balanceDue = calculatedTotal;

    // Generate invoice number: INV-YYYYMMDD-XXXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of invoices created today for this clinic
    const todayStart = new Date(today.setHours(0, 0, 0, 0));
    const todayEnd = new Date(today.setHours(23, 59, 59, 999));
    
    const todayCount = await prisma.invoice.count({
      where: {
        clinicId: session.user.clinicId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const sequenceNumber = String(todayCount + 1).padStart(4, '0');
    const invoiceNumber = `INV-${dateStr}-${sequenceNumber}`;

    // Create invoice
    const invoice = await prisma.invoice.create({
      data: {
        clinicId: session.user.clinicId,
        patientId,
        invoiceNumber,
        items,
        subtotal: calculatedSubtotal,
        tax: parseFloat(tax || 0),
        discount: parseFloat(discount || 0),
        total: calculatedTotal,
        balanceDue,
        status: 'PENDING',
        dueDate: dueDate ? new Date(dueDate) : null,
        notes,
        paymentMethod,
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
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
