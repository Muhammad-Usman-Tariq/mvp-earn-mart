import { prisma } from './db';

export type WalletType = 'commission' | 'partner_profit' | 'main';
export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'pending' | 'available' | 'reversed';
export type ReferenceType = 'order' | 'commission' | 'withdrawal' | 'refund_clawback' | 'partner_deposit' | 'partner_yield';

export interface CreateLedgerParams {
  userId: string;
  walletType: WalletType;
  type: TransactionType;
  amountPaisa: number;
  status?: TransactionStatus;
  referenceType: ReferenceType;
  referenceId?: string;
}

export async function createLedgerEntry(params: CreateLedgerParams) {
  if (!Number.isInteger(params.amountPaisa) || params.amountPaisa <= 0) {
    throw new Error('Ledger amount must be a positive integer in paisa');
  }

  return prisma.walletTransaction.create({
    data: {
      user_id: params.userId,
      wallet_type: params.walletType,
      type: params.type,
      amount: params.amountPaisa,
      status: params.status || 'pending',
      reference_type: params.referenceType,
      reference_id: params.referenceId || null,
    },
  });
}

export async function calculateWalletBalance(userId: string, walletType?: WalletType) {
  const whereClause: any = { user_id: userId };
  if (walletType) {
    whereClause.wallet_type = walletType;
  }

  const txs = await prisma.walletTransaction.findMany({
    where: whereClause,
  });

  let availablePaisa = 0;
  let pendingPaisa = 0;
  let totalWithdrawnPaisa = 0;
  let totalReversedPaisa = 0;

  for (const tx of txs) {
    if (tx.type === 'credit') {
      if (tx.status === 'available') {
        availablePaisa += tx.amount;
      } else if (tx.status === 'pending') {
        pendingPaisa += tx.amount;
      } else if (tx.status === 'reversed') {
        totalReversedPaisa += tx.amount;
      }
    } else if (tx.type === 'debit') {
      // Debits (such as withdrawals or clawbacks) reduce available balance regardless of pending status
      availablePaisa -= tx.amount;
      if (tx.reference_type === 'withdrawal') {
        totalWithdrawnPaisa += tx.amount;
      }
    }
  }

  return {
    availablePaisa,
    pendingPaisa,
    totalWithdrawnPaisa,
    totalReversedPaisa,
  };
}

export async function releasePendingCommissionsForOrder(orderId: string) {
  const pendingCommissions = await prisma.walletTransaction.findMany({
    where: {
      reference_id: orderId,
      reference_type: 'commission',
      status: 'pending',
    },
  });

  if (pendingCommissions.length === 0) return 0;

  const result = await prisma.walletTransaction.updateMany({
    where: {
      reference_id: orderId,
      reference_type: 'commission',
      status: 'pending',
    },
    data: {
      status: 'available',
    },
  });

  return result.count;
}

export async function clawbackCommissionsForOrder(orderId: string) {
  const commissions = await prisma.walletTransaction.findMany({
    where: {
      reference_id: orderId,
      reference_type: 'commission',
    },
  });

  let clawedBackCount = 0;

  for (const comm of commissions) {
    if (comm.status === 'pending') {
      await prisma.walletTransaction.update({
        where: { id: comm.id },
        data: { status: 'reversed' },
      });
      clawedBackCount++;
    } else if (comm.status === 'available') {
      // Mark original credit as reversed
      await prisma.walletTransaction.update({
        where: { id: comm.id },
        data: { status: 'reversed' },
      });
      // Add explicit debit entry for audit and ledger accounting
      await prisma.walletTransaction.create({
        data: {
          user_id: comm.user_id,
          wallet_type: comm.wallet_type,
          type: 'debit',
          amount: comm.amount,
          status: 'available',
          reference_type: 'refund_clawback',
          reference_id: orderId,
        },
      });
      clawedBackCount++;
    }
  }

  return clawedBackCount;
}
