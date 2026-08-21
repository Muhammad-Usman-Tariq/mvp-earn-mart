'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatPKR } from '@/lib/formatters';
import {
  Copy, Check, Users, ShoppingBag, Wallet, ArrowUpRight,
  AlertCircle, X, Network, ExternalLink, Banknote, GitFork, UserCheck, ShieldCheck, ChevronRight, TrendingUp
} from 'lucide-react';
import { authFetch } from '@/lib/api-client';

const LEVEL_CONFIGS: Record<number, { rate: string; roleName: string; desc: string; color: string; border: string }> = {
  1: { rate: '10%', roleName: 'Direct Referrals',   desc: 'Users who signed up using your direct referral link. Earn 10% on all their approved sales.', color: 'bg-brand-500/15 text-brand-300', border: 'border-brand-500/40' },
  2: { rate: '5%',  roleName: 'Level 2 Downline',  desc: 'Sub-referrals brought by your Direct Referrals. Earn 5% override on all their sales.', color: 'bg-brand-600/10 text-brand-400', border: 'border-brand-600/30' },
  3: { rate: '3%',  roleName: 'Level 3 Downline',  desc: '3rd-generation referrals down your unilevel tree. Earn 3% on all sales generated.', color: 'bg-surface-3 text-gold-400', border: 'border-gold-500/25' },
  4: { rate: '2%',  roleName: 'Level 4 Downline',  desc: '4th-generation referrals down your unilevel tree. Earn 2% override commission.', color: 'bg-surface-3 text-text-secondary', border: 'border-surface-border' },
  5: { rate: '1%',  roleName: 'Level 5 Downline',  desc: '5th-generation maximum network depth. Earn 1% on all approved purchases at this level.', color: 'bg-surface-3 text-text-muted', border: 'border-surface-border' },
};

export default function AffiliateDashboard() {
  const [user, setUser] = useState<any>(null);
  const [wallet, setWallet] = useState<any>({ availablePaisa: 0, pendingPaisa: 0, totalWithdrawnPaisa: 0 });
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [userOrders, setUserOrders] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeLevelTab, setActiveLevelTab] = useState<number>(1);

  // Withdrawal modal state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [accountDetails, setAccountDetails] = useState('');
  const [submittingWithdrawal, setSubmittingWithdrawal] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const [treeData, setTreeData] = useState<any>(null);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const meRes = await authFetch('/api/auth/me');
      const meData = await meRes.json();
      if (!meData.user) return;
      setUser(meData.user);
      setAccountDetails(meData.user.bank_iban || meData.user.bank_account_no || '');

      const [wRes, oRes, tRes] = await Promise.all([
        authFetch('/api/withdrawals'),
        authFetch('/api/orders'),
        authFetch('/api/referrals/tree'),
      ]);
      const wData = await wRes.json();
      const oData = await oRes.json();
      const tData = await tRes.json();
      if (wData.walletBalance) setWallet(wData.walletBalance);
      if (wData.withdrawals) setWithdrawals(wData.withdrawals);
      if (oData.orders) setUserOrders(oData.orders);
      if (tData.tree) setTreeData(tData.tree);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    if (!user) return;
    const link = `${window.location.origin}/?ref=${user.referral_code}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingWithdrawal(true);
    setWithdrawError(null);
    try {
      const amountPaisa = Math.round(parseFloat(withdrawAmount) * 100);
      const res = await authFetch('/api/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amountPaisa, walletType: 'commission', payoutMethod, accountDetails }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Withdrawal request failed');
      setShowWithdrawModal(false);
      setWithdrawAmount('');
      fetchDashboardData();
    } catch (err: any) {
      setWithdrawError(err.message || 'Withdrawal request failed');
    } finally {
      setSubmittingWithdrawal(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading affiliate dashboard..." />;

  const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${user?.referral_code}` : '';
  const currentLvlConfig = LEVEL_CONFIGS[activeLevelTab];

  return (
    <div className="space-y-8">

      {/* ── Page Header ──────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-text-primary">Affiliate Dashboard</h1>
            <span className="badge badge-brand uppercase">{user?.role}</span>
          </div>
          <p className="text-sm text-text-muted">
            Share your referral link and earn across 5 levels of your network.
          </p>
        </div>
        <button
          onClick={() => setShowWithdrawModal(true)}
          disabled={!user?.profile_completed || wallet.availablePaisa <= 0}
          className="btn btn-gold btn-md"
        >
          <Banknote className="w-4 h-4" />
          Request Withdrawal
        </button>
      </div>

      {/* ── Profile Incomplete Warning ────────────────────────────── */}
      {!user?.profile_completed && (
        <div className="alert-warning">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Complete your profile to enable withdrawals</p>
            <p className="text-xs mt-0.5 opacity-80">Name, City, CNIC, and bank details are required before requesting wallet payouts.</p>
          </div>
          <Link href="/profile" className="btn btn-gold btn-sm flex-shrink-0">
            Complete Profile →
          </Link>
        </div>
      )}

      {/* ── Referral Card ─────────────────────────────────────────── */}
      <div className="card p-5 border border-brand-500/30 bg-gradient-to-r from-brand-500/10 via-surface-1 to-surface-1 shadow-glow-brand">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">Your Unique Referral Link</p>
            <div className="flex items-center gap-2">
              <code className="text-sm font-mono font-bold text-gold-400 bg-surface-3 px-3 py-1.5 rounded-lg border border-gold-500/30 truncate max-w-xs">
                {user?.referral_code}
              </code>
              <span className="text-text-muted text-xs font-mono truncate hidden sm:block">{referralLink}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={copyReferralLink} className="btn btn-gold btn-sm">
              {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
            {referralLink && (
              <a href={referralLink} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI Stat Row (Wallet balance dominant hierarchy) ──────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-5 border border-success/40 bg-gradient-to-br from-success/10 via-surface-1 to-surface-1 rounded-xl space-y-2 relative overflow-hidden shadow-glow-brand">
          <div className="flex items-center justify-between text-text-muted text-xs">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Available Balance</span>
            <div className="w-8 h-8 rounded-lg bg-success/20 text-success flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-success font-mono">
            {formatPKR(wallet.availablePaisa)}
          </div>
          <div className="flex items-center justify-between text-[11px] pt-1">
            <span className="text-text-muted">Ready to withdraw</span>
            <button
              onClick={() => setShowWithdrawModal(true)}
              disabled={!user?.profile_completed || wallet.availablePaisa <= 0}
              className="text-gold-400 font-bold hover:underline disabled:opacity-40"
            >
              Withdraw →
            </button>
          </div>
        </div>

        <StatCard
          label="Pending Commissions"
          value={formatPKR(wallet.pendingPaisa)}
          icon={<Network className="w-5 h-5" />}
          iconBg="bg-warning/15 text-warning"
          subtitle="14-day return window"
        />
        <StatCard
          label="Total Orders"
          value={userOrders.length}
          icon={<ShoppingBag className="w-5 h-5" />}
          iconBg="bg-brand-500/15 text-brand-400"
          subtitle="Direct purchases made"
        />
        <StatCard
          label="Total Paid Out"
          value={formatPKR(wallet.totalWithdrawnPaisa)}
          icon={<ArrowUpRight className="w-5 h-5" />}
          iconBg="bg-gold-500/15 text-gold-400"
          subtitle="Processed withdrawals"
        />
      </div>

      {/* ── Unilevel Referral Tree Visualization ─────────────────────── */}
      <div className="card rounded-2xl p-6 border border-surface-border space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-surface-border pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <GitFork className="w-5 h-5 text-brand-400" />
              <h2 className="section-title">Unilevel Referral Network Tree</h2>
            </div>
            <p className="text-xs text-text-muted">5-tier depth closure table commission tracking</p>
          </div>

          {/* Level Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl border border-surface-border bg-surface-2">
            {[1, 2, 3, 4, 5].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setActiveLevelTab(lvl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeLevelTab === lvl
                    ? 'bg-brand-500 text-white shadow-glow-brand'
                    : 'text-text-muted hover:text-text-secondary'
                }`}
              >
                L{lvl} ({LEVEL_CONFIGS[lvl].rate})
              </button>
            ))}
          </div>
        </div>

        {/* Visual Network Hierarchy Nodes */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const isSelected = activeLevelTab === lvl;
            const cfg = LEVEL_CONFIGS[lvl];
            const count = treeData?.levelCounts?.[lvl] || 0;
            const salesPaisa = treeData?.levelSalesPaisa?.[lvl] || 0;

            return (
              <button
                key={lvl}
                type="button"
                onClick={() => setActiveLevelTab(lvl)}
                className={`p-4 rounded-xl border text-left space-y-3 transition-all relative ${
                  isSelected
                    ? `${cfg.border} bg-brand-500/10 ring-2 ring-brand-500/30`
                    : 'border-surface-border bg-surface-2 hover:border-surface-border-light'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Level {lvl}</span>
                  <span className={`badge ${isSelected ? 'badge-gold' : 'badge-neutral'}`}>{cfg.rate}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-text-primary">{cfg.roleName}</p>
                  <p className="text-[11px] font-mono text-gold-400 font-semibold mt-1">
                    {count} member{count !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-surface-border/50 text-[10px] text-text-muted">
                  <span>Sales:</span>
                  <span className="font-mono font-bold text-text-primary">{formatPKR(salesPaisa)}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Level Deep-Dive Card */}
        <div className={`p-5 rounded-xl border ${currentLvlConfig.border} ${currentLvlConfig.color} space-y-4`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-surface-border/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-surface-3 border border-surface-border flex items-center justify-center font-bold text-sm text-gold-400 font-mono">
                L{activeLevelTab}
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  {currentLvlConfig.roleName} — {currentLvlConfig.rate} Commission Rate
                </h3>
                <p className="text-xs text-text-muted">{currentLvlConfig.desc}</p>
              </div>
            </div>
            <span className="badge badge-brand flex-shrink-0">Level {activeLevelTab} Depth</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
            <div className="p-3 rounded-lg bg-surface-1 border border-surface-border text-xs space-y-1">
              <span className="text-text-muted block text-[10px] uppercase font-semibold">Active Members</span>
              <span className="text-base font-bold text-text-primary font-mono">
                {treeData?.levelCounts?.[activeLevelTab] || 0}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-surface-1 border border-surface-border text-xs space-y-1">
              <span className="text-text-muted block text-[10px] uppercase font-semibold">Commission Rate</span>
              <span className="text-base font-bold text-gold-400 font-mono">{currentLvlConfig.rate}</span>
            </div>
            <div className="p-3 rounded-lg bg-surface-1 border border-surface-border text-xs space-y-1">
              <span className="text-text-muted block text-[10px] uppercase font-semibold">Level Volume</span>
              <span className="text-base font-bold text-success font-mono">
                {formatPKR(treeData?.levelSalesPaisa?.[activeLevelTab] || 0)}
              </span>
            </div>
          </div>

          {/* Members Table */}
          {treeData?.levels?.[activeLevelTab]?.length > 0 ? (
            <div className="pt-2">
              <p className="text-xs font-bold text-text-primary mb-2">Level {activeLevelTab} Downline Members</p>
              <div className="overflow-x-auto rounded-lg border border-surface-border bg-surface-1">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Member</th>
                      <th>Referral Code</th>
                      <th>Joined Date</th>
                      <th>Sales Volume</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treeData.levels[activeLevelTab].map((m: any) => (
                      <tr key={m.id}>
                        <td className="font-semibold text-text-primary">{m.name}</td>
                        <td><code className="font-mono text-gold-400 text-xs">{m.referralCode}</code></td>
                        <td className="font-mono text-[11px]">{new Date(m.createdAt).toLocaleDateString('en-PK')}</td>
                        <td className="font-mono font-bold text-success">{formatPKR(m.salesVolumePaisa)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-muted pt-1">
              No members at level {activeLevelTab} yet. Share your referral link to build your team.
            </p>
          )}
        </div>
      </div>

      {/* ── Orders Table ──────────────────────────────────────────── */}
      <div className="card rounded-2xl p-6 border border-surface-border space-y-4">
        <h2 className="section-title border-b border-surface-border pb-4">My Orders</h2>

        {userOrders.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto stroke-[1.5] opacity-30" />
            <p>No orders placed yet.</p>
            <Link href="/" className="btn btn-ghost btn-sm inline-flex">Browse catalog →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Order Items</th>
                  <th>Total</th>
                  <th>Payment Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {userOrders.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-[11px]">{new Date(o.created_at).toLocaleDateString('en-PK')}</td>
                    <td className="font-medium text-text-primary">{o.items?.length ?? '—'} item(s)</td>
                    <td className="font-bold text-gold-400 font-mono">{formatPKR(o.total_paisa)}</td>
                    <td className="uppercase text-[11px] tracking-wider">{o.payment_method || '—'}</td>
                    <td><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Withdrawal History ────────────────────────────────────── */}
      <div className="card rounded-2xl p-6 border border-surface-border space-y-4">
        <h2 className="section-title border-b border-surface-border pb-4">Withdrawal History</h2>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-text-muted text-sm space-y-2">
            <Banknote className="w-10 h-10 mx-auto stroke-[1.5] opacity-30" />
            <p>No withdrawal requests submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Gross Amount</th>
                  <th>Fee (5%)</th>
                  <th>Net Payout</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td className="font-mono text-[11px]">{new Date(w.created_at).toLocaleDateString('en-PK')}</td>
                    <td className="font-semibold text-text-primary font-mono">{formatPKR(w.amount_paisa)}</td>
                    <td className="text-danger font-mono">- {formatPKR(w.fee_paisa)}</td>
                    <td className="font-bold text-success font-mono">{formatPKR(w.net_amount_paisa)}</td>
                    <td className="uppercase text-[11px]">{w.payout_method}</td>
                    <td><StatusBadge status={w.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Withdrawal Modal ─────────────────────────────────────── */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="card rounded-2xl p-6 border border-surface-border-light max-w-md w-full shadow-modal animate-fade-up">
            <div className="flex justify-between items-center border-b border-surface-border pb-4 mb-5">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Banknote className="w-5 h-5 text-gold-400" />
                Request Withdrawal
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {withdrawError && (
              <div className="alert-error mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{withdrawError}</span>
              </div>
            )}

            <form onSubmit={handleWithdrawSubmit} className="space-y-4">
              <div>
                <label className="input-label">Amount (PKR) *</label>
                <input
                  type="number"
                  required
                  min="500"
                  step="1"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Min PKR 500"
                  className="input font-mono"
                />
                <p className="text-[11px] text-text-muted mt-1">
                  Available: <span className="font-semibold text-success font-mono">{formatPKR(wallet.availablePaisa)}</span> · 5% fee deducted
                </p>
              </div>

              <div>
                <label className="input-label">Payout Method *</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="input"
                >
                  <option value="bank">Bank Transfer</option>
                  <option value="jazzcash">JazzCash</option>
                  <option value="easypaisa">EasyPaisa</option>
                  <option value="crypto">USDT / Crypto</option>
                </select>
              </div>

              <div>
                <label className="input-label">Account / IBAN / Wallet Number *</label>
                <input
                  type="text"
                  required
                  value={accountDetails}
                  onChange={(e) => setAccountDetails(e.target.value)}
                  placeholder="Bank Name, IBAN or Mobile Account No."
                  className="input font-mono"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowWithdrawModal(false)} className="btn btn-ghost btn-md flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submittingWithdrawal} className="btn btn-gold btn-md flex-1">
                  {submittingWithdrawal ? 'Processing...' : 'Confirm Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
