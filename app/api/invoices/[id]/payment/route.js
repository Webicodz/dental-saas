import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authenticate, authError } from '@/lib/middleware';

// POST /api/invoices/[id]/payment - Record a payment
export async function POST(request, { params }) {
  try {
    const user = authenticate(request);
    
    if (!user || !user.clinicId) {
      return authError();
    }

    const { id } = params;
    const body = await request.json();
    const { amount, method, referenceNumber, notes } = body;

    // Validate required fields
    if (!amount || parseFloat(amount) <= 0) {
      return NextResponse.json(
        { error: 'Valid payment amount is required' },
        { status: 400 }
      );
    }

    if (!method || !['CASH', 'CARD', 'INSURANCE', 'CHECK'].includes(method)) {
      return NextResponse.json(
        { error: 'Valid payment method is required (CASH, CARD, INSURANCE, CHECK)' },
        { status: 400 }
      );
    }

    // Get invoice and verify it belongs to this clinic
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinicId: user.clinicId,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    // Check if invoice can accept payments
    if (invoice.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot record payment on a cancelled invoice' },
        { status: 400 }
      );
    }

    if (invoice.status === 'PAID') {
      return NextResponse.json(
        { error: 'Invoice is already fully paid' },
        { status: 400 }
      );
    }

    // Validate payment amount doesn't exceed balance
    const paymentAmount = parseFloat(amount);
    if (paymentAmount > invoice.balanceDue) {
      return NextResponse.json(
        { error: `Payment amount exceeds balance due ($${invoice.balanceDue.toFixed(2)})` },
        { status: 400 }
      );
    }

    // Create payment and update invoice in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the payment record
      const payment = await tx.payment.create({
        data: {
          clinicId: user.clinicId,
          invoiceId: id,
          amount: paymentAmount,
          method,
          referenceNumber,
          notes,
          status: 'COMPLETED',
        },
      });

      // Calculate new totals
      const newPaidAmount = invoice.paidAmount + paymentAmount;
      const newBalanceDue = invoice.total - newPaidAmount;

      // Determine new status
      let newStatus = invoice.status;
      if (newBalanceDue <= 0) {
        newStatus = 'PAID';
      } else if (newPaidAmount > 0) {
        newStatus = 'PARTIALLY_PAID';
      }

      // Update invoice
      const updatedInvoice = await tx.invoice.update({
        where: { id },
        data: {
          paidAmount: newPaidAmount,
          balanceDue: Math.max(0, newBalanceDue),
          status: newStatus,
          paymentMethod: method,
          paymentDate: new Date(),
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

      return { payment, invoice: updatedInvoice };
    });

    return NextResponse.json({
      message: 'Payment recorded successfully',
      payment: result.payment,
      invoice: result.invoice,
    }, { status: 201 });
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}

// GET /api/invoices/[id]/payment - Get payment history for an invoice
export async function GET(request, { params }) {
  try {
    const user = authenticate(request);
    
    if (!user || !user.clinicId) {
      return authError();
    }

    const { id } = params;

    // Verify invoice belongs to this clinic
    const invoice = await prisma.invoice.findFirst({
      where: {
        id,
        clinicId: user.clinicId,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: 'Invoice not found' },
        { status: 404 }
      );
    }

    const payments = await prisma.payment.findMany({
      where: {
        invoiceId: id,
        clinicId: user.clinicId,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}
