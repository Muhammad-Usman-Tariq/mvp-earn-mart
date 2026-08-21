import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword, getUniqueReferralCode, generateJwtToken } from '@/lib/auth';
import { registerReferralClosure } from '@/lib/referrals';
import { logAuditEvent } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userIdInput,
      password,
      referralCode,
      referralCodeInput,
      role,
      roleInput,
      name,
      phone: phoneProfile,
      city,
    } = body;

    const finalUserIdInput = userIdInput || body.email || body.phone;
    const finalRefCode = (referralCode || referralCodeInput || '').trim().toUpperCase();
    const finalRole = role || roleInput || 'affiliate';

    if (!finalUserIdInput || !password) {
      return NextResponse.json({ error: 'User ID (Email or Phone) and password are required' }, { status: 400 });
    }

    const isEmail = finalUserIdInput.includes('@');
    const email = isEmail ? finalUserIdInput.toLowerCase().trim() : null;
    const phone = !isEmail ? finalUserIdInput.trim() : (phoneProfile || null);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          ...(email ? [{ email }] : []),
          ...(phone ? [{ phone }] : []),
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'User with this Email or Phone already exists' }, { status: 409 });
    }

    // Check referral code & find sponsor
    let sponsorId: string | null = null;
    if (finalRefCode) {
      const sponsor = await prisma.user.findUnique({
        where: { referral_code: finalRefCode },
      });
      if (sponsor) {
        sponsorId = sponsor.id;
      }
    }

    const passwordHash = await hashPassword(password);
    const newReferralCode = await getUniqueReferralCode();

    const allowedRoles = ['affiliate', 'customer', 'partner'];
    const assignedRole = allowedRoles.includes(finalRole) ? finalRole : 'affiliate';
    const isProfileCompleted = Boolean(name && name.trim().length > 0);

    const newUser = await prisma.user.create({
      data: {
        email,
        phone,
        password_hash: passwordHash,
        role: assignedRole,
        referral_code: newReferralCode,
        sponsor_id: sponsorId,
        is_verified: true, // OTP verified
        name: name ? name.trim() : null,
        city: city ? city.trim() : null,
        profile_completed: isProfileCompleted,
      },
    });

    // Insert into closure table for 5-level unilevel tree
    await registerReferralClosure(newUser.id, sponsorId);

    // Audit log entry
    await logAuditEvent({
      actorId: newUser.id,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser.id,
      afterState: { id: newUser.id, email, phone, role: assignedRole, sponsorId },
    });

    const token = generateJwtToken({
      userId: newUser.id,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        referralCode: newUser.referral_code,
        profileCompleted: newUser.profile_completed,
        name: newUser.name,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ error: error.message || 'Registration failed' }, { status: 500 });
  }
}
