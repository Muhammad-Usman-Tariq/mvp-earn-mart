import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || 'daily';

    let dateThreshold = new Date();
    if (range === 'daily') {
      dateThreshold.setHours(0, 0, 0, 0);
    } else if (range === 'weekly') {
      dateThreshold.setDate(dateThreshold.getDate() - 7);
    } else if (range === 'monthly') {
      dateThreshold.setMonth(dateThreshold.getMonth() - 1);
    } else {
      dateThreshold = new Date(0);
    }

    const newUsersCount = await prisma.user.count({
      where: { created_at: { gte: dateThreshold } },
    });

    const orderAgg = await prisma.order.aggregate({
      where: {
        created_at: { gte: dateThreshold },
        status: { in: ['paid', 'processing', 'shipped', 'delivered', 'completed'] },
      },
      _sum: { total_amount_paisa: true },
      _count: { id: true },
    });

    const commAgg = await prisma.walletTransaction.aggregate({
      where: {
        created_at: { gte: dateThreshold },
        reference_type: 'commission',
        status: { in: ['pending', 'available'] },
      },
      _sum: { amount: true },
    });

    const withdrawalAgg = await prisma.withdrawalRequest.aggregate({
      where: {
        created_at: { gte: dateThreshold },
        status: 'paid',
      },
      _sum: { net_amount_paisa: true },
      _count: { id: true },
    });

    const topProducts = await prisma.orderItem.groupBy({
      by: ['product_id'],
      _sum: { quantity: true, unit_price_paisa: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const productIds = topProducts.map((p) => p.product_id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const topSellingDetails = topProducts.map((tp) => ({
      product: productMap.get(tp.product_id),
      totalQuantity: tp._sum.quantity || 0,
      totalSalesPaisa: tp._sum.unit_price_paisa || 0,
    }));

    return NextResponse.json({
      range,
      newUsersCount,
      totalOrdersCount: orderAgg._count.id || 0,
      totalSalesPaisa: orderAgg._sum.total_amount_paisa || 0,
      totalCommissionsPaidPaisa: commAgg._sum.amount || 0,
      totalWithdrawalCount: withdrawalAgg._count.id || 0,
      totalWithdrawalVolumePaisa: withdrawalAgg._sum.net_amount_paisa || 0,
      topSellingDetails,
    });
  } catch (error: any) {
    console.error('Reports GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to generate report' }, { status: 500 });
  }
}
