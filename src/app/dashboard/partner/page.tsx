'use client';

import React, { useEffect, useState } from 'react';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  TrendingUp, Wallet, ArrowUpRight, DollarSign, Clock, ShieldCheck,
  Plus, CheckCircle2, AlertTriangle, HelpCircle, Lock, Info, X, PieChart, ShieldAlert, PlusCircle, AlertCircle
} from 'lucide-react';
import { authFetch } from '@/lib/api-client';

export default function PartnerDashboard() {
  const [partnerData, setPartnerData] = useState<any>({ investments: [], totalInvestedPaisa: 0, profitBalance: {} });
  const [loading, setLoading] = useState(true);

  const [depositAmount, setDepositAmount] = useState('');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [submittingDeposit, setSubmittingDeposit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => { fetchPartnerData(); }, []);

  const fetchPartnerData = async () => {
    setLoading(true);
    try {
      const meRes = await authFetch('/api/auth/me');
      const meData = await meRes.json();
      if (meData.user) setCurrentUser(meData.user);

      const res = await authFetch('/api/partner');
      const data = await res.json();
      setPartnerData(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingDeposit(true);
    setError(null);
    try {
      const principalPaisa = Math.round(parseFloat(depositAmount) * 100);
      const res = await authFetch('/api/partner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ principalPaisa }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Investment deposit failed');
      setShowDepositModal(false);
      setDepositAmount('');
      fetchPartnerData();
    } catch (err: any) {
      setError(err.message || 'Deposit failed');
    } finally {
      setSubmittingDeposit(false);
    }
  };

  if (loading) return <LoadingSpinner label="Loading partner program..." />;

  const totalInvestedPKR   = (partnerData.totalInvestedPaisa / 100).toLocaleString('en-PK');
  const availableProfitPKR = ((partnerData.profitBalance?.availablePaisa || 0) / 100).toLocaleString('en-PK');

  return (
    <div className="space-y-8">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-2xl font-bold text-text-primary">Partner Program</h1>
            <span className="badge badge-gold">Investment Program</span>
          </div>
          <p className="text-sm text-text-muted">Track your capital investments and weekly profit yields.</p>
        </div>
        <button
          onClick={() => setShowDepositModal(true)}
          className="btn btn-gold btn-md"
        >
          <PlusCircle className="w-4 h-4" />
          New Investment
        </button>
      </div>

      {/* ── Role Gate Notice for Non-Partner Accounts ────────────── */}
      {currentUser && currentUser.role !== 'partner' && currentUser.role !== 'admin' && (
        <div className="card p-6 border border-gold-500/30 bg-gold-500/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/20 text-gold-400 flex items-center justify-center font-bold">
              ★
            </div>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Partner Account Status Required</h3>
              <p className="text-xs text-text-muted">
                Your current account role is <span className="badge badge-brand uppercase">{currentUser.role}</span>. Capital investment pools and weekly yield payouts are restricted to verified Partner Accounts.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Regulatory Disclaimer ─────────────────────────────────── */}
      <div className="alert-warning">
        <ShieldAlert className="w-5 h-5 flex-shrink-0" />
        <div>
          <p className="font-semibold text-sm">Regulatory Risk Notice</p>
          <p className="text-xs mt-0.5 opacity-80">
            Fixed or guaranteed weekly investment yields carry legal requirements under Pakistani securities law. Please consult qualified legal counsel before enabling live partner investment pools in commercial production.
          </p>
        </div>
      </div>

      {/* ── KPI Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Capital Invested"
          value={`PKR ${totalInvestedPKR}`}
          icon={<PieChart className="w-5 h-5" />}
          iconBg="bg-gold-500/15 text-gold-400"
          subtitle="Active partner principal"
        />
        <StatCard
          label="Available Profit"
          value={`PKR ${availableProfitPKR}`}
          icon={<TrendingUp className="w-5 h-5" />}
          iconBg="bg-success/15 text-success"
          subtitle="Weekly profit balance"
          highlight={partnerData.profitBalance?.availablePaisa > 0}
        />
        <StatCard
          label="Weekly Yield Rate"
          value="2.0% / week"
          icon={<DollarSign className="w-5 h-5" />}
          iconBg="bg-brand-500/15 text-brand-400"
          subtitle="Configurable by admin"
        />
      </div>

      {/* ── Investment Pools ───────────────────────────────────────── */}
      <div className="card rounded-2xl p-6 border border-surface-border space-y-5">
        <h2 className="section-title border-b border-surface-border pb-4">
          Active Investment Pools & Profit Logs
        </h2>

        {partnerData.investments.length === 0 ? (
          <div className="text-center py-10 space-y-3">
            <Wallet className="w-12 h-12 mx-auto text-text-muted stroke-[1.5] opacity-40" />
            <p className="text-sm text-text-secondary">No active investments yet.</p>
            <p className="text-xs text-text-muted">Click "New Investment" to deposit your first capital pool.</p>
            <button onClick={() => setShowDepositModal(true)} className="btn btn-gold btn-sm mt-2">
              <PlusCircle className="w-4 h-4" /> Make First Investment
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {partnerData.investments.map((inv: any) => (
              <div key={inv.id} className="card-elevated rounded-xl p-5 border border-surface-border space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
                  <div>
                    <span className="text-[10px] text-text-muted font-mono block mb-1">Pool #{inv.id.slice(0, 8).toUpperCase()}</span>
                    <span className="text-xl font-bold text-text-primary">
                      PKR {(inv.principal_paisa / 100).toLocaleString('en-PK')}
                    </span>
                    <span className="text-xs text-text-muted ml-2">principal</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={inv.status} />
                    <span className="badge badge-gold">{(inv.weekly_profit_rate * 100).toFixed(1)}% / week</span>
                  </div>
                </div>

                {/* Profit Logs */}
                <div>
                  <h4 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Weekly Profit Logs</h4>
                  {(!inv.profit_logs || inv.profit_logs.length === 0) ? (
                    <p className="text-xs text-text-muted">No weekly profit logs generated yet. Logs are generated every 7 days from deposit date.</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {inv.profit_logs.map((log: any) => (
                        <div key={log.id} className="p-3 rounded-lg bg-surface-3 border border-surface-border flex flex-col gap-1">
                          <span className="text-[10px] font-mono text-text-muted">
                            {new Date(log.profit_date).toLocaleDateString('en-PK')}
                          </span>
                          <span className="text-sm font-bold text-success">
                            + PKR {(log.amount_paisa / 100).toLocaleString('en-PK')}
                          </span>
                          <StatusBadge status={log.status || 'available'} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Deposit Modal ─────────────────────────────────────────── */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="card rounded-2xl p-6 border border-surface-border-light max-w-md w-full shadow-modal animate-fade-up">
            <div className="flex justify-between items-center border-b border-surface-border pb-4 mb-5">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-gold-400" />
                Create Partner Investment
              </h3>
              <button onClick={() => setShowDepositModal(false)} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="alert-error mb-4">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="input-label">Capital Deposit (PKR) *</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="100"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Minimum PKR 1,000"
                  className="input"
                />
              </div>

              <div className="p-4 rounded-xl bg-surface-2 border border-gold-500/20 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-text-muted">Weekly Return Rate:</span>
                  <span className="font-bold text-gold-400">2.0% / week</span>
                </div>
                {depositAmount && parseFloat(depositAmount) >= 1000 && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Est. Weekly Return:</span>
                    <span className="font-bold text-success">
                      PKR {(parseFloat(depositAmount) * 0.02).toLocaleString('en-PK', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                )}
                <p className="text-[10px] text-text-muted pt-1 border-t border-surface-border">
                  Payout options: withdraw weekly profit only, or request full principal withdrawal.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowDepositModal(false)} className="btn btn-ghost btn-md flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={submittingDeposit} className="btn btn-gold btn-md flex-1">
                  {submittingDeposit ? 'Processing...' : 'Confirm Investment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
