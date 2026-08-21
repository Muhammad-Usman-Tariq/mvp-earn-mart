'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogIn, KeyRound, AlertCircle, ShieldCheck, Network, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { saveAuthToken } from '@/lib/api-client';

const features = [
  { icon: <Network className="w-5 h-5 text-brand-400" />, title: '5-Level Commissions', desc: 'Earn up to 21% across your referral tree.' },
  { icon: <TrendingUp className="w-5 h-5 text-gold-400" />, title: 'Partner Investments', desc: 'Weekly returns on your invested principal.' },
  { icon: <ShieldCheck className="w-5 h-5 text-success" />, title: 'ACID Ledger', desc: 'Every transaction audited and immutable.' },
];

export default function LoginPage() {
  const router = useRouter();
  const [userIdInput, setUserIdInput] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIdInput, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');
      if (data.token) {
        saveAuthToken(data.token);
      }
      if (data.user.role === 'admin') {
        router.push('/admin');
      } else if (data.user.role === 'partner') {
        router.push('/dashboard/partner');
      } else {
        router.push('/dashboard/affiliate');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-8">
      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-2 gap-0 rounded-2xl overflow-hidden shadow-modal border border-surface-border">

        {/* ── Left: Brand Panel ─────────────────────────── */}
        <div className="hidden lg:flex flex-col justify-between p-10 bg-hero-mesh"
          style={{ background: 'linear-gradient(135deg, #0f1118 0%, #161824 50%, #1a1c2e 100%)' }}>
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-10">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 60%, #fbbf24 100%)', boxShadow: '0 0 16px rgba(99,102,241,0.40)' }}>
                AS
              </div>
              <span className="text-xl font-extrabold gradient-text-brand">AffiliateStore</span>
            </Link>

            <h2 className="text-2xl font-black text-text-primary mb-2">Welcome back!</h2>
            <p className="text-sm text-text-muted leading-relaxed mb-8">
              Sign in to access your affiliate dashboard, track commissions, and manage your partner investments.
            </p>

            <div className="space-y-5">
              {features.map((f) => (
                <div key={f.title} className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface-3 flex items-center justify-center flex-shrink-0 border border-surface-border">
                    {f.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary">{f.title}</p>
                    <p className="text-xs text-text-muted">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-xs text-text-muted border-t border-surface-border pt-6 mt-8">
            <p className="font-medium text-text-secondary mb-1">Demo Credentials</p>
            <p>Admin: <code className="text-gold-400">admin@platform.com</code> / <code className="text-gold-400">Admin@1234</code></p>
            <p>User: <code className="text-brand-400">user@test.com</code> / <code className="text-brand-400">Test@1234</code></p>
          </div>
        </div>

        {/* ── Right: Form Panel ─────────────────────────── */}
        <div className="p-8 md:p-10 flex flex-col justify-center" style={{ backgroundColor: 'var(--surface-1)' }}>
          <div className="space-y-2 mb-8">
            <div className="w-12 h-12 rounded-xl bg-brand-500/15 border border-brand-500/30 flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-brand-400" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Sign In</h1>
            <p className="text-sm text-text-muted">Enter your credentials to continue</p>
          </div>

          {error && (
            <div className="alert-error mb-5">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="login-userid" className="input-label">User ID (Email or Phone)</label>
              <input
                id="login-userid"
                type="text"
                required
                value={userIdInput}
                onChange={(e) => setUserIdInput(e.target.value)}
                placeholder="e.g. user@example.com or 03001234567"
                className="input"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="input-label mb-0">Password</label>
                <button type="button" className="text-xs text-brand-400 hover:text-brand-300 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={submitting}
              className="btn btn-primary btn-md w-full text-base py-3"
            >
              <KeyRound className="w-4 h-4" />
              <span>{submitting ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-text-muted border-t border-surface-border pt-5">
            Don't have an account?{' '}
            <Link href="/register" className="text-brand-400 font-semibold hover:text-brand-300 transition-colors">
              Create one free →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
