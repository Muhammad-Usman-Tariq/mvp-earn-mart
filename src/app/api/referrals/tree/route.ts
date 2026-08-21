import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthPayload } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = payload.userId;

    // Fetch closure downlines where ancestor is user and depth > 0 and depth <= 5
    const closures = await prisma.referralClosure.findMany({
      where: {
        ancestor_id: userId,
        depth: { gte: 1, lte: 5 },
      },
      orderBy: [
        { depth: 'asc' },
        { created_at: 'desc' },
      ],
    });

    const descendantIds = closures.map((c) => c.descendant_id);

    // Fetch user details for descendants
    const downlineUsers = await prisma.user.findMany({
      where: { id: { in: descendantIds } },
      select: {
        id: true,
        name: true,
        email: true,
        referral_code: true,
        sponsor_id: true,
        created_at: true,
      },
    });

    const userMap = new Map(downlineUsers.map((u) => [u.id, u]));

    // Fetch total approved order amounts per descendant
    const orderAggregates = await prisma.order.groupBy({
      by: ['user_id'],
      where: {
        user_id: { in: descendantIds },
        status: { in: ['completed', 'processing'] },
      },
      _sum: {
        total_amount_paisa: true,
      },
    });

    const salesMap = new Map(orderAggregates.map((a) => [a.user_id, a._sum.total_amount_paisa || 0]));

    // Build structured level map
    const levels: Record<number, any[]> = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    const levelCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const levelSalesPaisa: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    for (const c of closures) {
      const u = userMap.get(c.descendant_id);
      if (!u) continue;

      const salesVolumePaisa = salesMap.get(u.id) || 0;
      const depth = c.depth;

      levelCounts[depth] = (levelCounts[depth] || 0) + 1;
      levelSalesPaisa[depth] = (levelSalesPaisa[depth] || 0) + salesVolumePaisa;

      if (levels[depth]) {
        levels[depth].push({
          id: u.id,
          name: u.name || u.email || 'Member',
          referralCode: u.referral_code,
          sponsorId: u.sponsor_id,
          depth,
          salesVolumePaisa,
          createdAt: u.created_at,
        });
      }
    }

    // Direct referral count
    const directCount = levelCounts[1] || 0;
    const totalNetworkCount = Object.values(levelCounts).reduce((a, b) => a + b, 0);
    const totalNetworkSalesPaisa = Object.values(levelSalesPaisa).reduce((a, b) => a + b, 0);

    return NextResponse.json({
      success: true,
      tree: {
        directCount,
        totalNetworkCount,
        totalNetworkSalesPaisa,
        levelCounts,
        levelSalesPaisa,
        levels,
      },
    });
  } catch (error: any) {
    console.error('Referral tree API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch referral tree' }, { status: 500 });
  }
}
