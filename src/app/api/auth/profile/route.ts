import { NextRequest, NextResponse } from 'next/server';
import { getAuthPayload } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const payload = getAuthPayload(req);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, phone, email, city, cnic, bankName, bankAccountNo, bankIban } = body;

    if (!name || (!phone && !email) || !city) {
      return NextResponse.json({ error: 'Name, Phone/Email, and City are required' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: name.trim(),
        phone: phone ? phone.trim() : undefined,
        email: email ? email.trim().toLowerCase() : undefined,
        city: city.trim(),
        cnic: cnic ? cnic.trim() : undefined,
        bank_name: bankName ? bankName.trim() : undefined,
        bank_account_no: bankAccountNo ? bankAccountNo.trim() : undefined,
        bank_iban: bankIban ? bankIban.trim() : undefined,
        profile_completed: true,
      },
    });

    await logAuditEvent({
      actorId: updatedUser.id,
      action: 'PROFILE_UPDATED',
      entityType: 'User',
      entityId: updatedUser.id,
      afterState: { name, city, cnic, profileCompleted: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        city: updatedUser.city,
        cnic: updatedUser.cnic,
        profileCompleted: updatedUser.profile_completed,
      },
    });
  } catch (error: any) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: error.message || 'Profile update failed' }, { status: 500 });
  }
}
