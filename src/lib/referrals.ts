import { prisma } from './db';
import { createLedgerEntry } from './ledger';

export const LEVEL_COMMISSION_RATES: Record<number, number> = {
  1: 0.10, // 10%
  2: 0.05, // 5%
  3: 0.03, // 3%
  4: 0.02, // 2%
  5: 0.01, // 1%
};

/**
 * Registers a new user into the closure table referral tree.
 * Inserts self-closure (depth 0) and links for all sponsors up to maximum height.
 */
export async function registerReferralClosure(userId: string, sponsorId?: string | null) {
  // 1. Insert self link
  await prisma.referralClosure.create({
    data: {
      ancestor_id: userId,
      descendant_id: userId,
      depth: 0,
    },
  });

  if (!sponsorId) return;

  // Anti-fraud guard: check if sponsorId exists
  const sponsor = await prisma.user.findUnique({ where: { id: sponsorId } });
  if (!sponsor) return;

  // Prevent self-referral
  if (sponsorId === userId) {
    throw new Error('Self-referral is strictly forbidden');
  }

  // 2. Fetch all ancestors of the sponsor
  const sponsorAncestors = await prisma.referralClosure.findMany({
    where: { descendant_id: sponsorId },
  });

  // 3. For each ancestor of sponsor, insert link to new user with depth + 1
  for (const link of sponsorAncestors) {
    await prisma.referralClosure.create({
      data: {
        ancestor_id: link.ancestor_id,
        descendant_id: userId,
        depth: link.depth + 1,
      },
    });
  }
}

/**
 * Calculates and distributes 5-level unilevel pending commissions on a verified order.
 */
export async function distributeOrderCommissions(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!order || !order.user_id) {
    // Guest orders do not produce referral commissions
    return [];
  }

  // Calculate total net commissionable amount in paisa across items
  let totalCommissionablePaisa = 0;
  for (const item of order.items) {
    totalCommissionablePaisa += item.net_commissionable_paisa * item.quantity;
  }

  if (totalCommissionablePaisa <= 0) return [];

  // Fetch upline ancestors for levels 1 to 5
  const uplines = await prisma.referralClosure.findMany({
    where: {
      descendant_id: order.user_id,
      depth: { gte: 1, lte: 5 },
    },
    select: {
      ancestor_id: true,
      depth: true,
    },
  });

  const createdTransactions = [];

  for (const upline of uplines) {
    const rate = LEVEL_COMMISSION_RATES[upline.depth];
    if (!rate) continue;

    // Calculate commission integer paisa
    const commissionPaisa = Math.floor(totalCommissionablePaisa * rate);

    if (commissionPaisa > 0) {
      const tx = await createLedgerEntry({
        userId: upline.ancestor_id,
        walletType: 'commission',
        type: 'credit',
        amountPaisa: commissionPaisa,
        status: 'pending', // Pending until return window expires
        referenceType: 'commission',
        referenceId: order.id,
      });

      createdTransactions.push(tx);
    }
  }

  return createdTransactions;
}

/**
 * Returns descendants level by level for a given user.
 */
export async function getReferralTreeSummary(userId: string) {
  const closures = await prisma.referralClosure.findMany({
    where: {
      ancestor_id: userId,
      depth: { gte: 1, lte: 5 },
    },
  });

  const descendantIds = closures.map((c) => c.descendant_id);
  const descendants = await prisma.user.findMany({
    where: { id: { in: descendantIds } },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      referral_code: true,
      created_at: true,
    },
  });

  const userMap = new Map(descendants.map((u) => [u.id, u]));

  const levelMap: Record<number, Array<{ user: any; salesVolumePaisa: number }>> = {
    1: [],
    2: [],
    3: [],
    4: [],
    5: [],
  };

  for (const closure of closures) {
    const user = userMap.get(closure.descendant_id);
    if (!user) continue;

    // Calculate sales volume for this descendant
    const orderSum = await prisma.order.aggregate({
      where: {
        user_id: closure.descendant_id,
        status: { in: ['paid', 'processing', 'shipped', 'delivered', 'completed'] },
      },
      _sum: {
        total_amount_paisa: true,
      },
    });

    const salesVolumePaisa = orderSum._sum.total_amount_paisa || 0;

    levelMap[closure.depth]?.push({
      user,
      salesVolumePaisa,
    });
  }

  return levelMap;
}
