import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-affiliate-mlm-jwt-key-2026';

export interface TokenPayload {
  userId: string;
  email?: string | null;
  phone?: string | null;
  role: string;
  adminRole?: string | null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateJwtToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyJwtToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

export function getAuthToken(req: any): string | null {
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearer = authHeader.substring(7).trim();
    if (bearer) return bearer;
  }
  return req.cookies.get('token')?.value || null;
}

export function getAuthPayload(req: any): TokenPayload | null {
  const token = getAuthToken(req);
  if (!token) return null;
  return verifyJwtToken(token);
}

export function generateReferralCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function getUniqueReferralCode(): Promise<string> {
  let code = generateReferralCode();
  let exists = await prisma.user.findUnique({ where: { referral_code: code } });
  let attempts = 0;
  while (exists && attempts < 10) {
    code = generateReferralCode();
    exists = await prisma.user.findUnique({ where: { referral_code: code } });
    attempts++;
  }
  return code;
}

// Simulated OTP generation (6 digits)
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
