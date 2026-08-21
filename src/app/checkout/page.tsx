'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import FileUpload from '@/components/FileUpload';
import { formatPKR } from '@/lib/formatters';
import {
  ShoppingBag, ShieldCheck, CheckCircle2, ArrowLeft,
  AlertCircle, CreditCard, Banknote, Building2, UploadCloud, Coins,
  Smartphone, Zap, Landmark, Bitcoin, Loader2, Wallet, DollarSign,
} from 'lucide-react';
import { authFetch } from '@/lib/api-client';

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalPaisa, clearCart } = useCart();

  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState<any>({});
  const [loadingUser, setLoadingUser] = useState(true);

  // Form State
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCity, setGuestCity] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');

  const [paymentMethod, setPaymentMethod] = useState<string>('jazzcash');
  const [txRefNo, setTxRefNo] = useState('');
  const [proofImage, setProofImage] = useState<{ url: string; hash: string } | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);

  useEffect(() => {
    // Fetch current user if logged in
    authFetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setShippingAddress(data.user.city ? `${data.user.city}, Pakistan` : '');
        }
      })
      .finally(() => setLoadingUser(false));

    // Fetch system payment gateway settings
    authFetch('/api/admin/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const map: any = {};
          data.settings.forEach((s: any) => (map[s.key] = s.value));
          setSettings(map);
        }
      })
      .catch(() => {});
  }, []);

  if (cart.length === 0 && !orderSuccess) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center card p-8 border border-surface-border space-y-4">
        <h2 className="text-xl font-bold text-text-primary">Your Cart is Empty</h2>
        <p className="text-xs text-text-muted">Add products to your cart before proceeding to checkout.</p>
        <button onClick={() => router.push('/')} className="btn btn-primary btn-md">
          Browse Products
        </button>
      </div>
    );
  }

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto py-12 card p-8 border border-success/30 space-y-6 text-center animate-fade-up">
        <div className="w-16 h-16 rounded-full bg-success/15 border border-success/30 flex items-center justify-center mx-auto text-success">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-text-primary">Order Placed Successfully!</h1>
          <p className="text-xs text-text-muted">
            Order ID: <code className="font-mono text-brand-300">{orderSuccess.id}</code>
          </p>
        </div>

        <div className="p-4 rounded-xl bg-surface-2 border border-surface-border text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-text-muted">Total Amount:</span>
            <span className="font-mono font-bold text-gold-400">{formatPKR(orderSuccess.total_paisa)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Payment Method:</span>
            <span className="uppercase font-semibold text-text-primary">{orderSuccess.payment_method}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Payment Status:</span>
            <span className="badge badge-warning">{orderSuccess.status}</span>
          </div>
        </div>

        <p className="text-xs text-text-muted leading-relaxed">
          {paymentMethod === 'cash'
            ? 'Your cash payment order is pending admin verification.'
            : 'Your payment proof has been submitted to the admin queue. Once verified, your order status will be updated.'}
        </p>

        <div className="pt-2 flex justify-center space-x-4">
          <button onClick={() => router.push('/')} className="btn btn-ghost btn-md">
            Continue Shopping
          </button>
          <button onClick={() => router.push('/dashboard/affiliate')} className="btn btn-primary btn-md">
            View Dashboard
          </button>
        </div>
      </div>
    );
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (paymentMethod !== 'cash' && !proofImage && !txRefNo) {
        throw new Error('Please upload payment proof screenshot or enter Transaction Reference Number.');
      }

      const items = cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const res = await authFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          paymentMethod,
          shippingAddress,
          guestName: !user ? guestName : undefined,
          guestEmail: !user ? guestEmail : undefined,
          guestPhone: !user ? guestPhone : undefined,
          guestCity: !user ? guestCity : undefined,
          proofImageUrl: proofImage?.url,
          proofHash: proofImage?.hash,
          accountReference: txRefNo || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      setOrderSuccess(data.order);
      clearCart();
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Cart</span>
      </button>

      <h1 className="text-2xl font-bold text-text-primary">Checkout</h1>

      {error && (
        <div className="alert-error">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleCheckoutSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Details */}
          <div className="card p-6 border border-surface-border space-y-4">
            <h2 className="text-base font-bold text-text-primary border-b border-surface-border pb-3">
              1. Shipping & Customer Details
            </h2>

            {user ? (
              <div className="p-3.5 rounded-xl bg-surface-2 border border-surface-border text-xs space-y-1">
                <p className="text-text-muted">Ordering as: <strong className="text-text-primary">{user.name || user.email}</strong></p>
                <p className="text-text-muted">Contact: <strong className="text-text-primary">{user.phone || user.email}</strong></p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="input-label">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Muhammad Ali"
                    className="input"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="input-label">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="input"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="input-label">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="input"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="input-label">City *</label>
                  <input
                    type="text"
                    required
                    value={guestCity}
                    onChange={(e) => setGuestCity(e.target.value)}
                    placeholder="Karachi"
                    className="input"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="input-label">Complete Shipping Address *</label>
              <textarea
                required
                rows={2}
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="House/Street Address, Area, City"
                className="input resize-none"
              />
            </div>
          </div>

          {/* Payment Method & Proof Selection */}
          <div className="card p-6 border border-surface-border space-y-5">
            <h2 className="text-base font-bold text-text-primary border-b border-surface-border pb-3">
              2. Select Payment Method & Attach Proof
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { id: 'jazzcash',  label: 'JazzCash',      icon: <Smartphone className="w-4 h-4 text-rose-400" /> },
                { id: 'easypaisa', label: 'EasyPaisa',     icon: <Zap className="w-4 h-4 text-emerald-400" /> },
                { id: 'bank',      label: 'Bank Transfer', icon: <Landmark className="w-4 h-4 text-blue-400" /> },
                { id: 'crypto',    label: 'Crypto USDT',   icon: <Bitcoin className="w-4 h-4 text-gold-400" /> },
                { id: 'cash',      label: 'Cash (Physical)', icon: <Banknote className="w-4 h-4 text-purple-400" /> },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center space-x-2.5 transition-all text-left ${
                    paymentMethod === m.id
                      ? 'bg-brand-500/15 border-brand-500 text-brand-300 shadow-sm'
                      : 'bg-surface-2 border-surface-border text-text-muted hover:border-surface-border-light'
                  }`}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>

            {/* Account Info Box based on selection */}
            {paymentMethod !== 'cash' && (
              <div className="p-4 rounded-xl bg-surface-2 border border-surface-border space-y-2 text-xs">
                <p className="font-bold text-text-primary uppercase tracking-wider">Company Receiver Details:</p>
                {paymentMethod === 'jazzcash' && (
                  <p className="text-text-secondary">JazzCash Account: <strong className="text-gold-400 font-mono">{settings.jazzcash_account_no || '0300-1234567'}</strong></p>
                )}
                {paymentMethod === 'easypaisa' && (
                  <p className="text-text-secondary">EasyPaisa Account: <strong className="text-gold-400 font-mono">{settings.easypaisa_account_no || '0311-1234567'}</strong></p>
                )}
                {paymentMethod === 'bank' && (
                  <div>
                    <p className="text-text-secondary">Bank Name: <strong className="text-text-primary">{settings.bank_name || 'Meezan Bank'}</strong></p>
                    <p className="text-text-secondary">IBAN: <strong className="text-gold-400 font-mono">{settings.bank_iban || 'PK36MEZN0001234567890123'}</strong></p>
                  </div>
                )}
                {paymentMethod === 'crypto' && (
                  <p className="text-text-secondary">USDT Address: <strong className="text-gold-400 font-mono break-all">{settings.crypto_wallet_address || '0x71C7656EC7ab88b...'}</strong></p>
                )}
                <p className="text-[10px] text-text-muted pt-1 border-t border-surface-border">
                  Transfer exact total amount and attach receipt screenshot below.
                </p>
              </div>
            )}

            {/* Proof Upload Component */}
            {paymentMethod !== 'cash' && (
              <div className="space-y-4 pt-2">
                <FileUpload
                  label="Attach Payment Proof Screenshot *"
                  onUploadSuccess={(data) => setProofImage({ url: data.url, hash: data.hash })}
                  helperText="Upload screenshot of JazzCash, EasyPaisa, Bank, or Crypto transfer"
                />

                <div>
                  <label className="input-label">Transaction Reference / TRX ID (Optional)</label>
                  <input
                    type="text"
                    value={txRefNo}
                    onChange={(e) => setTxRefNo(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="input font-mono"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Summary & Submit */}
        <div className="card p-6 border border-surface-border space-y-6 h-fit">
          <h2 className="text-base font-bold text-text-primary border-b border-surface-border pb-3">Order Summary</h2>

          <div className="space-y-3 text-xs text-text-secondary">
            {cart.map((item) => (
              <div key={item.productId} className="flex justify-between items-center">
                <span className="line-clamp-1 flex-1 pr-2 text-text-muted">{item.title} × {item.quantity}</span>
                <span className="font-mono font-semibold text-text-primary">{formatPKR(item.pricePaisa * item.quantity)}</span>
              </div>
            ))}

            <div className="border-t border-surface-border pt-3 flex justify-between text-sm">
              <span className="font-bold text-text-primary">Total Payable</span>
              <span className="font-mono font-extrabold text-gold-400 text-base">{formatPKR(totalPaisa)}</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn btn-gold btn-md w-full py-3.5 text-sm justify-center"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            <span>{submitting ? 'Submitting Order...' : 'Confirm Order & Submit Proof'}</span>
          </button>

          <div className="flex items-center justify-center space-x-2 text-[11px] text-text-muted pt-1">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>5-Level Commission Audit Enabled</span>
          </div>
        </div>
      </form>
    </div>
  );
}
