import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';
import { calculateWalletBalance, createLedgerEntry } from '@/lib/ledger';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const withdrawals = await prisma.withdrawalRequest.findMany({
      where: { user_id: payload.userId },
      orderBy: { created_at: 'desc' },
    });

    const walletBalance = await calculateWalletBalance(payload.userId, 'commission');

    return NextResponse.json({ withdrawals, walletBalance });
  } catch (error: any) {
    console.error('Withdrawals GET error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch withdrawals' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    if (!user.profile_completed || !user.name || !user.city || !user.cnic) {
      return NextResponse.json(
        { error: 'Profile completion & KYC (Name, City, CNIC, Bank/Wallet) are required before requesting withdrawal' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { amountPaisa, walletType, payoutMethod, accountDetails } = body;

    const reqAmount = parseInt(amountPaisa, 10);
    if (!reqAmount || reqAmount <= 0) {
      return NextResponse.json({ error: 'Invalid withdrawal amount' }, { status: 400 });
    }

    const minSetting = await prisma.systemSetting.findUnique({ where: { key: 'min_withdrawal_paisa' } });
    const maxSetting = await prisma.systemSetting.findUnique({ where: { key: 'max_withdrawal_paisa' } });
    const feeSetting = await prisma.systemSetting.findUnique({ where: { key: 'withdrawal_fee_percent' } });

    const minPaisa = parseInt(minSetting?.value || '50000', 10);
    const maxPaisa = parseInt(maxSetting?.value || '10000000', 10);
    const feePercent = parseFloat(feeSetting?.value || '5');

    if (reqAmount < minPaisa) {
      return NextResponse.json({ error: `Minimum withdrawal amount is PKR ${(minPaisa / 100).toLocaleString()}` }, { status: 400 });
    }

    if (reqAmount > maxPaisa) {
      return NextResponse.json({ error: `Maximum withdrawal amount per request is PKR ${(maxPaisa / 100).toLocaleString()}` }, { status: 400 });
    }

    const targetWallet = walletType === 'partner_profit' ? 'partner_profit' : 'commission';
    const balance = await calculateWalletBalance(user.id, targetWallet);

    if (balance.availablePaisa < reqAmount) {
      return NextResponse.json(
        { error: `Insufficient available balance. You have PKR ${(balance.availablePaisa / 100).toLocaleString()} available.` },
        { status: 400 }
      );
    }

    const feePaisa = Math.floor((reqAmount * feePercent) / 100);
    const netAmountPaisa = reqAmount - feePaisa;

    const withdrawal = await prisma.withdrawalRequest.create({
      data: {
        user_id: user.id,
        wallet_type: targetWallet,
        amount_paisa: reqAmount,
        fee_paisa: feePaisa,
        net_amount_paisa: netAmountPaisa,
        payout_method: payoutMethod || 'bank',
        account_details: accountDetails || `${user.bank_name || ''} - ${user.bank_iban || user.bank_account_no || ''}`,
        status: 'requested',
      },
    });

    const ledgerTx = await createLedgerEntry({
      userId: user.id,
      walletType: targetWallet,
      type: 'debit',
      amountPaisa: reqAmount,
      status: 'pending',
      referenceType: 'withdrawal',
      referenceId: withdrawal.id,
    });

    await prisma.withdrawalRequest.update({
      where: { id: withdrawal.id },
      data: { transaction_id: ledgerTx.id },
    });

    await logAuditEvent({
      actorId: user.id,
      action: 'WITHDRAWAL_REQUESTED',
      entityType: 'WithdrawalRequest',
      entityId: withdrawal.id,
      afterState: { amountPaisa: reqAmount, feePaisa, netAmountPaisa, walletType: targetWallet },
    });

    return NextResponse.json({ success: true, withdrawal });
  } catch (error: any) {
    console.error('Withdrawal POST error:', error);
    return NextResponse.json({ error: error.message || 'Withdrawal request failed' }, { status: 500 });
  }
}
