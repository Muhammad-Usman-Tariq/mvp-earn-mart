import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';
import { createLedgerEntry, calculateWalletBalance } from '@/lib/ledger';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const investments = await prisma.partnerInvestment.findMany({
      where: { user_id: payload.userId },
      include: { profit_logs: { orderBy: { profit_date: 'desc' } } },
      orderBy: { created_at: 'desc' },
    });

    const profitBalance = await calculateWalletBalance(payload.userId, 'partner_profit');

    let totalInvestedPaisa = 0;
    for (const inv of investments) {
      if (inv.status === 'active') {
        totalInvestedPaisa += inv.principal_paisa;
      }
    }

    return NextResponse.json({
      investments,
      totalInvestedPaisa,
      profitBalance,
    });
  } catch (error: any) {
    console.error('Partner GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch partner data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { principalPaisa } = body;

    const amount = parseInt(principalPaisa, 10);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid investment principal amount' }, { status: 400 });
    }

    const investment = await prisma.partnerInvestment.create({
      data: {
        user_id: payload.userId,
        principal_paisa: amount,
        weekly_profit_rate: 0.02,
        status: 'active',
      },
    });

    await createLedgerEntry({
      userId: payload.userId,
      walletType: 'partner_profit',
      type: 'credit',
      amountPaisa: amount,
      status: 'pending',
      referenceType: 'partner_deposit',
      referenceId: investment.id,
    });

    await prisma.user.update({
      where: { id: payload.userId },
      data: { role: 'partner' },
    });

    await logAuditEvent({
      actorId: payload.userId,
      action: 'PARTNER_INVESTMENT_CREATED',
      entityType: 'PartnerInvestment',
      entityId: investment.id,
      afterState: { principalPaisa: amount, weeklyProfitRate: 0.02 },
    });

    return NextResponse.json({ success: true, investment });
  } catch (error: any) {
    console.error('Partner POST error:', error);
    return NextResponse.json({ error: error.message || 'Partner investment failed' }, { status: 500 });
  }
}
