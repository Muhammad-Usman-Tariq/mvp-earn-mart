import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const withdrawals = await prisma.withdrawalRequest.findMany({
      include: { user: true },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ withdrawals });
  } catch (error: any) {
    console.error('Admin withdrawals GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch withdrawals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { withdrawalId, action, rejectionReason } = body;

    if (!withdrawalId || !['approve', 'reject', 'paid'].includes(action)) {
      return NextResponse.json({ error: 'Valid Withdrawal ID and Action (approve/reject/paid) are required' }, { status: 400 });
    }

    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 });
    }

    if (action === 'paid') {
      const updated = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: 'paid' },
      });

      if (withdrawal.transaction_id) {
        await prisma.walletTransaction.update({
          where: { id: withdrawal.transaction_id },
          data: { status: 'available' },
        });
      }

      await logAuditEvent({
        actorId: payload.userId,
        action: 'WITHDRAWAL_MARKED_PAID',
        entityType: 'WithdrawalRequest',
        entityId: withdrawalId,
        beforeState: { status: withdrawal.status },
        afterState: { status: 'paid' },
      });

      return NextResponse.json({ success: true, withdrawal: updated });
    } else if (action === 'approve') {
      const updated = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: { status: 'approved' },
      });

      await logAuditEvent({
        actorId: payload.userId,
        action: 'WITHDRAWAL_APPROVED',
        entityType: 'WithdrawalRequest',
        entityId: withdrawalId,
        beforeState: { status: withdrawal.status },
        afterState: { status: 'approved' },
      });

      return NextResponse.json({ success: true, withdrawal: updated });
    } else {
      if (!rejectionReason) {
        return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 });
      }

      const updated = await prisma.withdrawalRequest.update({
        where: { id: withdrawalId },
        data: {
          status: 'rejected',
          rejection_reason: rejectionReason,
        },
      });

      if (withdrawal.transaction_id) {
        await prisma.walletTransaction.delete({
          where: { id: withdrawal.transaction_id },
        });
      }

      await logAuditEvent({
        actorId: payload.userId,
        action: 'WITHDRAWAL_REJECTED',
        entityType: 'WithdrawalRequest',
        entityId: withdrawalId,
        beforeState: { status: withdrawal.status },
        afterState: { status: 'rejected', rejectionReason },
      });

      return NextResponse.json({ success: true, withdrawal: updated });
    }
  } catch (error: any) {
    console.error('Admin withdrawal action error:', error);
    return NextResponse.json({ error: error.message || 'Withdrawal action failed' }, { status: 500 });
  }
}
