import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const userPayload = getAuthPayload(req);

    const body = await req.json();
    const { orderId, method, amountPaisa, txRefNo, proofImagePath, proofHash } = body;

    if (!orderId || !method || !amountPaisa || !txRefNo || !proofImagePath) {
      return NextResponse.json({ error: 'Order ID, Payment Method, Amount, Transaction Ref, and Proof Image are required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const existingDuplicate = await prisma.paymentProof.findFirst({
      where: {
        OR: [
          ...(proofHash ? [{ proof_hash: proofHash }] : []),
          { tx_ref_no: txRefNo.trim() },
        ],
        status: { in: ['pending', 'approved'] },
      },
    });

    const isFlagged = Boolean(existingDuplicate);
    const flagReason = isFlagged
      ? `Duplicate transaction reference (${txRefNo}) or image hash detected from order ID ${existingDuplicate?.order_id}`
      : null;

    const paymentProof = await prisma.paymentProof.create({
      data: {
        order_id: orderId,
        user_id: userPayload?.userId || order.user_id || null,
        method,
        amount_paisa: parseInt(amountPaisa, 10),
        tx_ref_no: txRefNo.trim(),
        proof_image_path: proofImagePath,
        proof_hash: proofHash || 'N/A',
        status: 'pending',
        is_flagged: isFlagged,
        flag_reason: flagReason,
      },
    });

    await logAuditEvent({
      actorId: userPayload?.userId || null,
      action: 'PAYMENT_PROOF_SUBMITTED',
      entityType: 'PaymentProof',
      entityId: paymentProof.id,
      afterState: { orderId, method, txRefNo, isFlagged, flagReason },
    });

    return NextResponse.json({ success: true, paymentProof, isFlagged });
  } catch (error: any) {
    console.error('Payment proof submission error:', error);
    return NextResponse.json({ error: error.message || 'Payment proof submission failed' }, { status: 500 });
  }
}
