import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';
import { distributeOrderCommissions } from '@/lib/referrals';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const paymentProofs = await prisma.paymentProof.findMany({
      include: {
        order: { include: { items: { include: { product: true } }, user: true } },
        user: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ paymentProofs });
  } catch (error: any) {
    console.error('Admin payments GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch payment proofs' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { proofId, action, rejectionReason } = body;

    if (!proofId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Valid Proof ID and Action (approve/reject) are required' }, { status: 400 });
    }

    const proof = await prisma.paymentProof.findUnique({
      where: { id: proofId },
      include: { order: true },
    });

    if (!proof) {
      return NextResponse.json({ error: 'Payment proof not found' }, { status: 404 });
    }

    if (action === 'approve') {
      const updatedProof = await prisma.paymentProof.update({
        where: { id: proofId },
        data: { status: 'approved' },
      });

      const returnSetting = await prisma.systemSetting.findUnique({ where: { key: 'return_window_days' } });
      const windowDays = parseInt(returnSetting?.value || '14', 10);
      const returnExpiry = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000);

      await prisma.order.update({
        where: { id: proof.order_id },
        data: {
          status: 'paid',
          return_window_expiry: returnExpiry,
        },
      });

      const commissionTxs = await distributeOrderCommissions(proof.order_id);

      await logAuditEvent({
        actorId: payload.userId,
        action: 'PAYMENT_APPROVED',
        entityType: 'PaymentProof',
        entityId: proofId,
        beforeState: { status: proof.status },
        afterState: { status: 'approved', commissionsCreated: commissionTxs.length },
      });

      return NextResponse.json({ success: true, proof: updatedProof, commissionsCreated: commissionTxs.length });
    } else {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Mandatory rejection reason required when rejecting payment proof' }, { status: 400 });
      }

      const updatedProof = await prisma.paymentProof.update({
        where: { id: proofId },
        data: {
          status: 'rejected',
          rejection_reason: rejectionReason,
        },
      });

      await logAuditEvent({
        actorId: payload.userId,
        action: 'PAYMENT_REJECTED',
        entityType: 'PaymentProof',
        entityId: proofId,
        beforeState: { status: proof.status },
        afterState: { status: 'rejected', rejectionReason },
      });

      return NextResponse.json({ success: true, proof: updatedProof });
    }
  } catch (error: any) {
    console.error('Admin payment approval error:', error);
    return NextResponse.json({ error: error.message || 'Payment action failed' }, { status: 500 });
  }
}
