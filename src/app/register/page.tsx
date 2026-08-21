'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck, UserCheck, KeyRound, AlertCircle, ArrowRight,
  Check, Eye, EyeOff, Copy, UserPlus, Mail,
} from 'lucide-react';
import { saveAuthToken } from '@/lib/api-client';

const STEPS = [
  { id: 1, label: 'Credentials', icon: <KeyRound className="w-4 h-4" /> },
  { id: 2, label: 'Verify OTP',  icon: <Mail className="w-4 h-4" /> },
  { id: 3, label: 'Profile',     icon: <UserCheck className="w-4 h-4" /> },
];

function RegisterFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1
  const [userIdInput, setUserIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [roleInput, setRoleInput] = useState('affiliate');

  // Step 2
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpCopied, setOtpCopied] = useState(false);

  // Step 3
  const [nameInput, setNameInput] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const [cityInput, setCityInput] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlRef = searchParams.get('ref');
    if (urlRef) {
      setReferralCodeInput(urlRef.trim().toUpperCase());
    } else {
      const savedRef = localStorage.getItem('mvp_referral_code');
      if (savedRef) setReferralCodeInput(savedRef.toUpperCase());
    }
  }, [searchParams]);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userIdInput || !password) {
      setError('Email/Phone and password are required.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode !== generatedOtp) {
      setError('Incorrect OTP. Please enter the code shown above.');
      return;
    }
    setError(null);
    setStep(3);
  };

  const copyOtp = () => {
    navigator.clipboard.writeText(generatedOtp);
    setOtpCopied(true);
    setTimeout(() => setOtpCopied(false), 2000);
  };

  const handleStep3 = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userIdInput,
          password,
          referralCode: referralCodeInput || undefined,
          role: roleInput,
          name: nameInput || undefined,
          phone: phoneInput || undefined,
          city: cityInput || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      if (data.token) {
        saveAuthToken(data.token);
      }
      localStorage.removeItem('mvp_referral_code');
      if (data.user?.role === 'partner') {
        router.push('/dashboard/partner');
      } else {
        router.push('/dashboard/affiliate');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-lg">

        {/* Header */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-500/30"
            style={{ background: 'linear-gradient(135deg, rgba(79,70,229,0.2), rgba(129,140,248,0.1))' }}>
            <UserPlus className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Create Account</h1>
          <p className="text-sm text-text-muted mt-1">Join the affiliate network and start earning</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 mb-8">
          {STEPS.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div className="flex flex-col items-center gap-1.5">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border ${
                  step > s.id
                    ? 'bg-success border-success text-white'
                    : step === s.id
                      ? 'bg-brand-500 border-brand-500 text-white shadow-glow-brand'
                      : 'bg-surface-3 border-surface-border text-text-muted'
                }`}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.icon}
                </div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${step >= s.id ? 'text-text-secondary' : 'text-text-muted'}`}>
                  {s.label}
                </span>
              </div>
              {idx < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-2 mt-[-12px] rounded-full transition-all duration-500 ${step > s.id ? 'bg-success' : 'bg-surface-border'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Card */}
        <div className="card p-8 border border-surface-border animate-fade-up">

          {error && (
            <div className="alert-error mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* ── Step 1: Credentials ──────────────────── */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <label htmlFor="reg-userid" className="input-label">Email or Phone *</label>
                <input
                  id="reg-userid"
                  type="text"
                  required
                  value={userIdInput}
                  onChange={(e) => setUserIdInput(e.target.value)}
                  placeholder="e.g. user@example.com or 03001234567"
                  className="input"
                />
              </div>

              <div>
                <label htmlFor="reg-password" className="input-label">Password *</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 characters"
                    className="input pr-10"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-text-muted hover:text-text-secondary">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="reg-ref" className="input-label">
                  Referral Code
                  {referralCodeInput && (
                    <span className="ml-2 badge badge-gold normal-case font-normal">Auto-filled</span>
                  )}
                </label>
                <input
                  id="reg-ref"
                  type="text"
                  value={referralCodeInput}
                  onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                  placeholder="Leave blank if you don't have one"
                  className="input font-mono tracking-widest"
                />
              </div>

              <div>
                <label className="input-label">Account Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {[['affiliate', 'Affiliate (Earn commissions)'], ['customer', 'Customer (Buy only)']].map(([val, lbl]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRoleInput(val)}
                      className={`p-3 rounded-lg text-xs font-medium border text-left transition-all ${
                        roleInput === val
                          ? 'bg-brand-500/15 border-brand-500/40 text-brand-300'
                          : 'bg-surface-2 border-surface-border text-text-muted hover:border-surface-border-light'
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-md w-full py-3">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ── Step 2: OTP Verification ─────────────── */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-6">
              <div className="text-center p-5 rounded-xl bg-surface-2 border border-surface-border space-y-3">
                <p className="text-xs text-text-muted">Your one-time verification code:</p>
                <div className="text-5xl font-black tracking-[0.3em] text-text-primary font-mono select-all">
                  {generatedOtp}
                </div>
                <button
                  type="button"
                  onClick={copyOtp}
                  className="btn btn-ghost btn-sm gap-1.5"
                >
                  {otpCopied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {otpCopied ? 'Copied!' : 'Copy code'}
                </button>
                <p className="text-[11px] text-text-muted">In production, this would be sent to {userIdInput}</p>
              </div>

              <div>
                <label htmlFor="reg-otp" className="input-label">Enter OTP Code</label>
                <input
                  id="reg-otp"
                  type="text"
                  required
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  className="input text-center text-2xl font-mono tracking-[0.5em]"
                />
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn btn-ghost btn-md flex-1">
                  ← Back
                </button>
                <button type="submit" className="btn btn-primary btn-md flex-1">
                  Verify <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* ── Step 3: Profile ──────────────────────── */}
          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-5">
              <div className="alert-info mb-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                <span>Identity verified! Complete your profile to finish registration.</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label htmlFor="reg-name" className="input-label">Full Name</label>
                  <input
                    id="reg-name"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Muhammad Ali"
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="reg-phone" className="input-label">Phone</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="0300-1234567"
                    className="input"
                  />
                </div>
                <div>
                  <label htmlFor="reg-city" className="input-label">City</label>
                  <input
                    id="reg-city"
                    type="text"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    placeholder="Karachi"
                    className="input"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setStep(2)} className="btn btn-ghost btn-md flex-1">
                  ← Back
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary btn-md flex-1">
                  <UserCheck className="w-4 h-4" />
                  {submitting ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          Already have an account?{' '}
          <Link href="/login" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <RegisterFormContent />
    </Suspense>
  );
}
