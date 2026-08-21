import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';
import { distributeOrderCommissions } from '@/lib/referrals';
import { releasePendingCommissionsForOrder, clawbackCommissionsForOrder } from '@/lib/ledger';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      include: {
        items: { include: { product: true } },
        payment_proofs: true,
        user: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Admin orders GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { orderId, action, newStatus } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (action === 'approve_cash_payment') {
      await prisma.paymentProof.create({
        data: {
          order_id: order.id,
          user_id: order.user_id,
          method: 'cash',
          amount_paisa: order.total_amount_paisa,
          tx_ref_no: `CASH-ADMIN-${Date.now()}`,
          proof_image_path: '/uploads/cash_approval.png',
          proof_hash: 'CASH_APPROVAL_ADMIN',
          status: 'approved',
        },
      });

      const returnSetting = await prisma.systemSetting.findUnique({ where: { key: 'return_window_days' } });
      const windowDays = parseInt(returnSetting?.value || '14', 10);
      const returnExpiry = new Date(Date.now() + windowDays * 24 * 60 * 60 * 1000);

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          return_window_expiry: returnExpiry,
        },
      });

      await distributeOrderCommissions(orderId);

      await logAuditEvent({
        actorId: payload.userId,
        action: 'CASH_PAYMENT_APPROVED_BY_ADMIN',
        entityType: 'Order',
        entityId: orderId,
        afterState: { status: 'paid' },
      });

      return NextResponse.json({ success: true, order: updatedOrder });
    } else if (action === 'update_status') {
      if (!newStatus) {
        return NextResponse.json({ error: 'New status is required' }, { status: 400 });
      }

      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status: newStatus },
      });

      let ledgerEffect = '';

      if (newStatus === 'completed') {
        const releasedCount = await releasePendingCommissionsForOrder(orderId);
        ledgerEffect = `Released ${releasedCount} pending commissions to available`;
      } else if (newStatus === 'returned') {
        const clawbackCount = await clawbackCommissionsForOrder(orderId);
        ledgerEffect = `Reversed / clawed back ${clawbackCount} commissions`;
      }

      await logAuditEvent({
        actorId: payload.userId,
        action: `ORDER_STATUS_CHANGED_TO_${newStatus.toUpperCase()}`,
        entityType: 'Order',
        entityId: orderId,
        beforeState: { status: order.status },
        afterState: { status: newStatus, ledgerEffect },
      });

      return NextResponse.json({ success: true, order: updatedOrder, ledgerEffect });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Admin order update error:', error);
    return NextResponse.json({ error: error.message || 'Order update failed' }, { status: 500 });
  }
}
