import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const userPayload = getAuthPayload(req);

    const body = await req.json();
    const { items, paymentMethod, shippingAddress, guestName, guestEmail, guestPhone, guestCity } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Order must contain at least one item' }, { status: 400 });
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 });
    }

    if (!userPayload) {
      if (!guestName || (!guestEmail && !guestPhone)) {
        return NextResponse.json({ error: 'Guest Name and Contact (Email or Phone) are required for guest checkout' }, { status: 400 });
      }
    }

    const productIds = items.map((i: any) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds } },
    });

    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    let totalAmountPaisa = 0;
    const orderItemsData = [];

    for (const item of items) {
      const prod = productMap.get(item.productId);
      if (!prod) {
        return NextResponse.json({ error: `Product not found: ${item.productId}` }, { status: 400 });
      }
      if (prod.stock_count < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for product: ${prod.title}` }, { status: 400 });
      }

      const itemTotalPaisa = prod.price_paisa * item.quantity;
      totalAmountPaisa += itemTotalPaisa;

      orderItemsData.push({
        product_id: prod.id,
        quantity: item.quantity,
        unit_price_paisa: prod.price_paisa,
        net_commissionable_paisa: prod.net_commissionable_paisa,
      });
    }

    const orderNumber = `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const order = await prisma.order.create({
      data: {
        order_number: orderNumber,
        user_id: userPayload?.userId || null,
        guest_name: !userPayload ? guestName : null,
        guest_email: !userPayload ? guestEmail : null,
        guest_phone: !userPayload ? guestPhone : null,
        guest_city: !userPayload ? guestCity : null,
        shipping_address: shippingAddress,
        total_amount_paisa: totalAmountPaisa,
        payment_method: paymentMethod || 'bank',
        status: 'awaiting_payment',
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: { include: { product: true } },
      },
    });

    await logAuditEvent({
      actorId: userPayload?.userId || null,
      action: 'ORDER_CREATED',
      entityType: 'Order',
      entityId: order.id,
      afterState: { orderNumber, totalAmountPaisa, isGuest: !userPayload },
    });

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error('Order creation error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create order' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload) return NextResponse.json({ orders: [] });

    const orders = await prisma.order.findMany({
      where: { user_id: payload.userId },
      include: {
        items: { include: { product: true } },
        payment_proofs: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch orders' }, { status: 500 });
  }
}
