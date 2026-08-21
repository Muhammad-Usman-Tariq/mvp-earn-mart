import { NextRequest, NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const payload = getAuthPayload(req);
  if (!payload) {
    return NextResponse.json({ user: null });
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      city: true,
      cnic: true,
      bank_name: true,
      bank_account_no: true,
      bank_iban: true,
      role: true,
      admin_role: true,
      referral_code: true,
      sponsor_id: true,
      profile_completed: true,
      is_verified: true,
    },
  });

  return NextResponse.json({ user });
}
