'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import LoadingSpinner from '@/components/LoadingSpinner';
import { ShieldCheck, Save, CheckCircle2, AlertCircle, User, CreditCard, Building } from 'lucide-react';
import { authFetch } from '@/lib/api-client';

function ProfileFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get('new') === 'true';

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [cnic, setCnic] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankIban, setBankIban] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    authFetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setName(data.user.name || '');
          setPhone(data.user.phone || '');
          setEmail(data.user.email || '');
          setCity(data.user.city || '');
          setCnic(data.user.cnic || '');
          setBankName(data.user.bank_name || '');
          setBankAccountNo(data.user.bank_account_no || '');
          setBankIban(data.user.bank_iban || '');
        } else {
          router.push('/login');
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      const res = await authFetch('/api/auth/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          city,
          cnic,
          bankName,
          bankAccountNo,
          bankIban,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Profile update failed');

      setSuccessMsg('Profile updated successfully!');
      if (isNew) {
        setTimeout(() => router.push('/dashboard/affiliate'), 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Profile update failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading profile..." />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Complete Profile</h1>
        <p className="text-sm text-text-muted">
          Fill in your identity and payout details to enable wallet withdrawals.
        </p>
      </div>

      {isNew && (
        <div className="alert-warning">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-sm">Welcome to AffiliateStore!</p>
            <p className="text-xs opacity-80 mt-0.5">
              Please complete your profile below to start withdrawing your unilevel affiliate commissions.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="alert-success">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Details */}
        <div className="card p-6 border border-surface-border space-y-4">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2 border-b border-surface-border pb-3">
            <User className="w-4 h-4 text-brand-400" /> Personal Identity Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Muhammad Ali"
                className="input"
              />
            </div>
            <div>
              <label className="input-label">City *</label>
              <input
                type="text"
                required
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Lahore / Karachi"
                className="input"
              />
            </div>
            <div>
              <label className="input-label">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0300-1234567"
                className="input"
              />
            </div>
            <div>
              <label className="input-label">CNIC Number (Identity Verification) *</label>
              <input
                type="text"
                required
                value={cnic}
                onChange={(e) => setCnic(e.target.value)}
                placeholder="35202-1234567-1"
                className="input font-mono"
              />
              <p className="text-[10px] text-text-muted mt-1">Required for Pakistani withdrawal compliance (KYC).</p>
            </div>
          </div>
        </div>

        {/* Bank & Payout Details */}
        <div className="card p-6 border border-surface-border space-y-4">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2 border-b border-surface-border pb-3">
            <Building className="w-4 h-4 text-gold-400" /> Bank & Payout Account Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="input-label">Bank Name / Wallet Provider *</label>
              <input
                type="text"
                required
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Meezan Bank / JazzCash / EasyPaisa"
                className="input"
              />
            </div>
            <div>
              <label className="input-label">Account / Mobile Number *</label>
              <input
                type="text"
                required
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value)}
                placeholder="0300-1234567 or Account No"
                className="input font-mono"
              />
            </div>
            <div>
              <label className="input-label">IBAN / Wallet Address (Optional)</label>
              <input
                type="text"
                value={bankIban}
                onChange={(e) => setBankIban(e.target.value)}
                placeholder="PK36MEZN0001234567890123"
                className="input font-mono"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center space-x-2 text-xs text-text-muted">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Information encrypted & protected</span>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-gold btn-md px-6 py-2.5"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<LoadingSpinner label="Loading profile..." />}>
      <ProfileFormContent />
    </Suspense>
  );
}
