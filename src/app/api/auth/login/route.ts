import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { comparePassword, generateJwtToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userIdInput, password } = body;

    if (!userIdInput || !password) {
      return NextResponse.json({ error: 'User ID and password are required' }, { status: 400 });
    }

    const inputClean = userIdInput.trim().toLowerCase();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: inputClean },
          { phone: userIdInput.trim() },
        ],
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid Email/Phone or Password' }, { status: 401 });
    }

    const isMatch = await comparePassword(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid Email/Phone or Password' }, { status: 401 });
    }

    const token = generateJwtToken({
      userId: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      adminRole: user.admin_role,
    });

    const response = NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
        adminRole: user.admin_role,
        referralCode: user.referral_code,
        profileCompleted: user.profile_completed,
      },
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: error.message || 'Login failed' }, { status: 500 });
  }
}
