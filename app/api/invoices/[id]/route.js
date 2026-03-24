import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/invoices/[id] - Get invoice details
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    const invoice = await prisma.invoice.findFirst({
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
            address: true,
            insuranceProvider: true,
            insuranceNumber: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[id] - Update invoice
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const {
      items,
      tax,
      discount,
      dueDate,
      notes,
      paymentMethod,
    } = body;

    // Check if invoice exists and belongs to this clinic
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Cannot update cancelled invoices
    if (existingInvoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot update a cancelled invoice' },
        { status: 400 }
      );
    }

    // Calculate new totals if items are provided
    let subtotal = existingInvoice.subtotal;
    let total = existingInvoice.total;

    if (items && Array.isArray(items)) {
      subtotal = items.reduce((sum, item) => {
        return sum + (parseFloat(item.quantity) * parseFloat(item.unitPrice));
      }, 0);

      const newTax = parseFloat(tax ?? existingInvoice.tax);
      const newDiscount = parseFloat(discount ?? existingInvoice.discount);
      total = subtotal + newTax - newDiscount;
    }

    // Update invoice
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        ...(items && { items }),
        ...(tax !== undefined && { tax: parseFloat(tax) }),
        ...(discount !== undefined && { discount: parseFloat(discount) }),
        subtotal,
        total,
        balanceDue: total - existingInvoice.paidAmount,
        ...(dueDate !== undefined && { 
          dueDate: dueDate ? new Date(dueDate) : null 
        }),
        ...(notes !== undefined && { notes }),
        ...(paymentMethod !== undefined && { paymentMethod }),
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
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[id] - Cancel invoice
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.clinicId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Check if invoice exists and belongs to this clinic
    const existingInvoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinicId: session.user.clinicId,
      },
      include: {
        payments: true,
      },
    });

    if (!existingInvoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Cannot delete fully paid invoices - cancel instead
    if (existingInvoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Cannot cancel a fully paid invoice. Please issue a refund instead.' },
        { status: 400 }
      );
    }

    // Cancel the invoice (soft delete)
    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        balanceDue: 0,
      },
    });

    return NextResponse.json({
      message: 'Invoice cancelled successfully',
      invoice,
    });
  } catch (error) {
    console.error('Error cancelling invoice:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invoice' },
      { status: 500 }
    );
  }
}
