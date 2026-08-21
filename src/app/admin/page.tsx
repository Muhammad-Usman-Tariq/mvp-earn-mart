'use client';

import React, { useEffect, useState } from 'react';
import StatusBadge from '@/components/StatusBadge';
import StatCard from '@/components/StatCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import FileUpload from '@/components/FileUpload';
import {
  ShieldCheck, BarChart3, CheckCircle2, XCircle, Package,
  Wallet, Settings, History, TrendingUp, Users, AlertTriangle,
  Plus, Download, X, AlertCircle, DollarSign, Eye, ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { authFetch } from '@/lib/api-client';

type TabType = 'reports' | 'payments' | 'orders' | 'withdrawals' | 'products' | 'settings' | 'audit';

const TABS: { id: TabType; label: string; icon: React.ReactNode; badge?: string }[] = [
  { id: 'reports',     label: 'Reports',     icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'payments',    label: 'Payments',    icon: <CheckCircle2 className="w-4 h-4" /> },
  { id: 'orders',      label: 'Orders',      icon: <Package className="w-4 h-4" /> },
  { id: 'withdrawals', label: 'Withdrawals', icon: <Wallet className="w-4 h-4" /> },
  { id: 'products',    label: 'Products',    icon: <FileSpreadsheet className="w-4 h-4" /> },
  { id: 'settings',    label: 'Settings',    icon: <Settings className="w-4 h-4" /> },
  { id: 'audit',       label: 'Audit Log',   icon: <History className="w-4 h-4" /> },
];

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<TabType>('reports');
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<any>({});
  const [reportRange, setReportRange] = useState<string>('daily');

  const [paymentProofs, setPaymentProofs] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [adminUser, setAdminUser] = useState<any>(null);

  const [rejectionModal, setRejectionModal] = useState<{ type: 'payment' | 'withdrawal'; id: string } | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const [showProductModal, setShowProductModal] = useState(false);
  const [prodTitle, setProdTitle] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPricePaisa, setProdPricePaisa] = useState('');
  const [prodCommPaisa, setProdCommPaisa] = useState('');
  const [prodStock, setProdStock] = useState('50');
  const [prodCatId, setProdCatId] = useState('');
  const [prodSubCatId, setProdSubCatId] = useState('');
  const [prodImageUrl, setProdImageUrl] = useState('');

  useEffect(() => {
    fetchAllAdminData();
    authFetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => { if (data.user) setAdminUser(data.user); })
      .catch(() => {});
  }, [reportRange]);

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, oRes, wRes, prodRes, setRes, auditRes] = await Promise.all([
        authFetch(`/api/admin/reports?range=${reportRange}`),
        authFetch('/api/admin/payments'),
        authFetch('/api/admin/orders'),
        authFetch('/api/admin/withdrawals'),
        authFetch('/api/products'),
        authFetch('/api/admin/settings'),
        authFetch('/api/admin/audit-logs'),
      ]);
      const [rData, pData, oData, wData, prodData, setData, auditData] = await Promise.all([
        rRes.json(), pRes.json(), oRes.json(), wRes.json(), prodRes.json(), setRes.json(), auditRes.json(),
      ]);
      setReports(rData);
      if (pData.paymentProofs) setPaymentProofs(pData.paymentProofs);
      if (oData.orders) setOrders(oData.orders);
      if (wData.withdrawals) setWithdrawals(wData.withdrawals);
      if (prodData.products) setProducts(prodData.products);
      if (prodData.categories) {
        setCategories(prodData.categories);
        if (prodData.categories.length > 0) setProdCatId(prodData.categories[0].id);
      }
      if (setData.settings) setSettings(setData.settings);
      if (auditData.auditLogs) setAuditLogs(auditData.auditLogs);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handlePaymentAction = async (proofId: string, action: 'approve' | 'reject') => {
    if (action === 'reject') { setRejectionModal({ type: 'payment', id: proofId }); return; }
    await authFetch('/api/admin/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ proofId, action: 'approve' }) });
    fetchAllAdminData();
  };

  const submitRejection = async () => {
    if (!rejectionModal || !rejectionReason) return;
    const url = rejectionModal.type === 'payment' ? '/api/admin/payments' : '/api/admin/withdrawals';
    const body = rejectionModal.type === 'payment'
      ? { proofId: rejectionModal.id, action: 'reject', rejectionReason }
      : { withdrawalId: rejectionModal.id, action: 'reject', rejectionReason };
    await authFetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setRejectionModal(null); setRejectionReason(''); fetchAllAdminData();
  };

  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    await authFetch('/api/admin/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId, action: 'update_status', newStatus }) });
    fetchAllAdminData();
  };

  const handleWithdrawalAction = async (withdrawalId: string, action: 'approve' | 'reject' | 'paid') => {
    if (action === 'reject') { setRejectionModal({ type: 'withdrawal', id: withdrawalId }); return; }
    await authFetch('/api/admin/withdrawals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ withdrawalId, action }) });
    fetchAllAdminData();
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceP = Math.round(parseFloat(prodPricePaisa) * 100);
    const commP = Math.round(parseFloat(prodCommPaisa || prodPricePaisa) * 100);
    const res = await authFetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: prodTitle, description: prodDesc, price_paisa: priceP, net_commissionable_paisa: commP, stock_count: parseInt(prodStock), category_id: prodCatId, subcategory_id: prodSubCatId || undefined, image_url: prodImageUrl || undefined }),
    });
    if (res.ok) { setShowProductModal(false); setProdTitle(''); setProdDesc(''); setProdPricePaisa(''); setProdCommPaisa(''); setProdStock('50'); setProdImageUrl(''); fetchAllAdminData(); }
  };

  const pendingPaymentsCount = paymentProofs.filter(p => p.status === 'pending').length;
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'pending').length;

  const actionTabs: TabType[] = ['payments', 'withdrawals', 'orders'];
  const referenceTabs: TabType[] = ['reports', 'products', 'settings', 'audit'];

  const renderTabBtn = (tabId: TabType) => {
    const tab = TABS.find((t) => t.id === tabId)!;
    const isActive = activeTab === tab.id;
    const badgeCount = tab.id === 'payments' ? pendingPaymentsCount : tab.id === 'withdrawals' ? pendingWithdrawalsCount : 0;
    return (
      <button
        key={tab.id}
        onClick={() => setActiveTab(tab.id)}
        className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
          isActive
            ? 'bg-brand-500/15 text-brand-300 border border-brand-500/30'
            : 'text-text-muted hover:text-text-secondary hover:bg-surface-3 border border-transparent'
        }`}
      >
        <span className="flex items-center gap-2.5">
          <span className={isActive ? 'text-brand-400' : ''}>{tab.icon}</span>
          {tab.label}
        </span>
        {badgeCount > 0 && (
          <span className="min-w-[18px] h-4 bg-warning text-surface-sunk text-[10px] font-bold rounded-full flex items-center justify-center px-1 font-mono">
            {badgeCount}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-surface-border pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-gold-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-text-primary">Admin Control Panel</h1>
              {adminUser?.admin_role && (
                <span className="badge badge-gold uppercase text-[9px] font-mono">
                  {adminUser.admin_role.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-sm text-text-muted">Manage orders, payments, products, and platform settings</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Sidebar Navigation ─────────────────────────────────── */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <nav className="card p-3 space-y-4 sticky top-24">
            {/* Group 1: Needs Action */}
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2 block mb-1">
                Needs Action
              </span>
              {actionTabs.map(renderTabBtn)}
            </div>

            {/* Group 2: Reference & Systems */}
            <div className="space-y-1 pt-3 border-t border-surface-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2 block mb-1">
                Reference
              </span>
              {referenceTabs.map(renderTabBtn)}
            </div>
          </nav>
        </aside>

        {/* ── Main Content Area ──────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <LoadingSpinner label="Loading admin data..." />
          ) : (
            <>
              {/* ── REPORTS TAB ─────────────────────────────────── */}
              {activeTab === 'reports' && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h2 className="section-title">Platform Reports</h2>
                    <div className="flex items-center gap-2">
                      {['daily', 'weekly', 'monthly'].map((r) => (
                        <button key={r} onClick={() => setReportRange(r)}
                          className={`btn btn-sm ${reportRange === r ? 'btn-primary' : 'btn-ghost'}`}>
                          {r.charAt(0).toUpperCase() + r.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard label="New Users" value={reports.newUsersCount ?? 0} icon={<Users className="w-5 h-5" />} iconBg="bg-brand-500/15 text-brand-400" />
                    <StatCard label="Products Sold" value={reports.productsSoldCount ?? 0} icon={<Package className="w-5 h-5" />} iconBg="bg-success/15 text-success" />
                    <StatCard label="Gross Revenue" value={`PKR ${((reports.grossRevenuePaisa || 0) / 100).toLocaleString('en-PK')}`} icon={<TrendingUp className="w-5 h-5" />} iconBg="bg-gold-500/15 text-gold-400" />
                    <StatCard label="Commissions Paid" value={`PKR ${((reports.totalCommissionsPaisa || 0) / 100).toLocaleString('en-PK')}`} icon={<DollarSign className="w-5 h-5" />} iconBg="bg-warning/15 text-warning" />
                  </div>

                  <div className="card p-5 border border-surface-border text-center py-12 text-text-muted">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Charts & visualizations coming in next sprint</p>
                  </div>
                </div>
              )}

              {/* ── PAYMENTS TAB ────────────────────────────────── */}
              {activeTab === 'payments' && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="section-title">Payment Proof Verification Queue</h2>
                  {paymentProofs.length === 0 ? (
                    <div className="card p-10 text-center text-text-muted">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p>No payment proofs to review.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {paymentProofs.map((proof) => (
                        <div key={proof.id} className="card p-5 border border-surface-border space-y-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <StatusBadge status={proof.status} />
                                <span className="text-xs text-text-muted font-mono">{proof.id.slice(0, 8)}</span>
                              </div>
                              <p className="text-sm font-semibold text-text-primary">
                                PKR {(proof.amount_paisa / 100).toLocaleString('en-PK')}
                                <span className="text-xs text-text-muted ml-2">via {proof.payment_method?.toUpperCase()}</span>
                              </p>
                              <p className="text-xs text-text-muted mt-0.5">
                                By: {proof.user?.name || proof.user?.email} · {new Date(proof.created_at).toLocaleString('en-PK')}
                              </p>
                              {proof.account_reference && (
                                <p className="text-xs text-text-muted font-mono mt-0.5">Ref: {proof.account_reference}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {proof.image_url && (
                                <a href={proof.image_url} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm">
                                  <Eye className="w-4 h-4" /> View Proof
                                </a>
                              )}
                              {proof.status === 'pending' && (
                                <>
                                  <button onClick={() => handlePaymentAction(proof.id, 'approve')}
                                    className="btn btn-sm bg-success/15 text-success border border-success/30 hover:bg-success/25">
                                    <CheckCircle2 className="w-4 h-4" /> Approve
                                  </button>
                                  <button onClick={() => handlePaymentAction(proof.id, 'reject')}
                                    className="btn btn-danger btn-sm">
                                    <XCircle className="w-4 h-4" /> Reject
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {proof.admin_note && (
                            <div className="text-xs text-text-muted bg-surface-2 p-2 rounded-lg border border-surface-border">
                              Admin note: {proof.admin_note}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── ORDERS TAB ──────────────────────────────────── */}
              {activeTab === 'orders' && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="section-title">All Orders</h2>
                  <div className="card overflow-hidden border border-surface-border">
                    <div className="overflow-x-auto">
                      <table className="table-base">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Customer</th>
                            <th>Total</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-8 text-text-muted">No orders yet.</td></tr>
                          ) : orders.map((o) => (
                            <tr key={o.id}>
                              <td className="font-mono text-[11px]">{new Date(o.created_at).toLocaleDateString('en-PK')}</td>
                              <td className="font-medium">{o.user?.name || o.user?.email || '—'}</td>
                              <td className="font-semibold text-text-primary">PKR {(o.total_paisa / 100).toLocaleString('en-PK')}</td>
                              <td className="uppercase text-[11px]">{o.payment_method || '—'}</td>
                              <td><StatusBadge status={o.status} /></td>
                              <td>
                                <select
                                  value={o.status}
                                  onChange={(e) => handleOrderStatusUpdate(o.id, e.target.value)}
                                  className="text-xs bg-surface-3 border border-surface-border rounded-lg px-2 py-1 text-text-secondary focus:outline-none focus:border-brand-500"
                                >
                                  {['pending', 'processing', 'completed', 'cancelled'].map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── WITHDRAWALS TAB ─────────────────────────────── */}
              {activeTab === 'withdrawals' && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="section-title">Withdrawal Requests</h2>
                  <div className="space-y-3">
                    {withdrawals.length === 0 ? (
                      <div className="card p-10 text-center text-text-muted">
                        <Wallet className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No withdrawal requests pending.</p>
                      </div>
                    ) : withdrawals.map((w) => (
                      <div key={w.id} className="card p-5 border border-surface-border">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <StatusBadge status={w.status} />
                              <span className="text-xs text-text-muted">{new Date(w.created_at).toLocaleDateString('en-PK')}</span>
                            </div>
                            <p className="text-sm font-bold text-text-primary">
                              PKR {(w.net_amount_paisa / 100).toLocaleString('en-PK')} net
                              <span className="text-xs text-text-muted font-normal ml-2">
                                (PKR {(w.amount_paisa / 100).toLocaleString('en-PK')} gross − PKR {(w.fee_paisa / 100).toLocaleString('en-PK')} fee)
                              </span>
                            </p>
                            <p className="text-xs text-text-muted mt-0.5">
                              {w.user?.name || w.user?.email} · {w.payout_method?.toUpperCase()} · {w.account_details}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {w.status === 'pending' && (
                              <>
                                <button onClick={() => handleWithdrawalAction(w.id, 'approve')}
                                  className="btn btn-sm bg-success/15 text-success border border-success/30 hover:bg-success/25">
                                  <CheckCircle2 className="w-4 h-4" /> Approve
                                </button>
                                <button onClick={() => handleWithdrawalAction(w.id, 'reject')}
                                  className="btn btn-danger btn-sm">
                                  <XCircle className="w-4 h-4" /> Reject
                                </button>
                              </>
                            )}
                            {w.status === 'approved' && (
                              <button onClick={() => handleWithdrawalAction(w.id, 'paid')}
                                className="btn btn-gold btn-sm">
                                Mark as Paid
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── PRODUCTS TAB ────────────────────────────────── */}
              {activeTab === 'products' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h2 className="section-title">Product Catalog</h2>
                    <button onClick={() => setShowProductModal(true)} className="btn btn-primary btn-md">
                      <Plus className="w-4 h-4" /> Add Product
                    </button>
                  </div>

                  <div className="card overflow-hidden border border-surface-border">
                    <div className="overflow-x-auto">
                      <table className="table-base">
                        <thead>
                          <tr>
                            <th>Product</th>
                            <th>Category</th>
                            <th>Price (PKR)</th>
                            <th>Comm. Base</th>
                            <th>Stock</th>
                          </tr>
                        </thead>
                        <tbody>
                          {products.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-8 text-text-muted">No products yet. Click "Add Product".</td></tr>
                          ) : products.map((p) => (
                            <tr key={p.id}>
                              <td className="font-medium text-text-primary max-w-[200px] truncate">{p.title}</td>
                              <td className="text-xs">{p.category?.name} {p.subcategory ? `· ${p.subcategory.name}` : ''}</td>
                              <td className="font-semibold">PKR {(p.price_paisa / 100).toLocaleString('en-PK')}</td>
                              <td className="text-text-muted">PKR {(p.net_commissionable_paisa / 100).toLocaleString('en-PK')}</td>
                              <td>
                                <span className={`badge ${p.stock_count > 0 ? 'badge-success' : 'badge-danger'}`}>
                                  {p.stock_count}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SETTINGS TAB ────────────────────────────────── */}
              {activeTab === 'settings' && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="section-title">System Settings</h2>
                  <div className="card border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="table-base">
                        <thead>
                          <tr>
                            <th>Setting Key</th>
                            <th>Value</th>
                            <th>Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {settings.length === 0 ? (
                            <tr><td colSpan={3} className="text-center py-8 text-text-muted">No system settings found.</td></tr>
                          ) : settings.map((s) => (
                            <tr key={s.id}>
                              <td><code className="text-brand-300 text-xs">{s.key}</code></td>
                              <td className="font-semibold text-text-primary">{s.value}</td>
                              <td className="text-text-muted text-xs">{s.description || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── AUDIT LOG TAB ───────────────────────────────── */}
              {activeTab === 'audit' && (
                <div className="space-y-4 animate-fade-in">
                  <h2 className="section-title">Immutable Audit Trail</h2>
                  <div className="card border border-surface-border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="table-base">
                        <thead>
                          <tr>
                            <th>Timestamp</th>
                            <th>Actor</th>
                            <th>Action</th>
                            <th>Entity</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-8 text-text-muted">No audit log entries.</td></tr>
                          ) : auditLogs.map((log) => (
                            <tr key={log.id}>
                              <td className="font-mono text-[11px]">{new Date(log.created_at).toLocaleString('en-PK')}</td>
                              <td className="text-xs">{log.actor?.email || 'System'}</td>
                              <td><code className="text-gold-400 text-xs">{log.action}</code></td>
                              <td className="text-xs">{log.entity_type} {log.entity_id ? `· ${log.entity_id.slice(0, 8)}` : ''}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Add Product Modal ────────────────────────────────────── */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="card rounded-2xl p-6 border border-surface-border-light max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-modal animate-fade-up">
            <div className="flex justify-between items-center border-b border-surface-border pb-4 mb-5">
              <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Plus className="w-5 h-5 text-brand-400" /> Add New Product
              </h3>
              <button onClick={() => setShowProductModal(false)} className="p-1.5 text-text-muted hover:text-text-primary hover:bg-surface-3 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div>
                <label className="input-label">Product Title *</label>
                <input required value={prodTitle} onChange={(e) => setProdTitle(e.target.value)} placeholder="e.g. Classic Cotton Shirt" className="input" />
              </div>
              <div>
                <label className="input-label">Description</label>
                <textarea value={prodDesc} onChange={(e) => setProdDesc(e.target.value)} placeholder="Product description..." rows={3} className="input resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Price (PKR) *</label>
                  <input required type="number" min="1" value={prodPricePaisa} onChange={(e) => setProdPricePaisa(e.target.value)} placeholder="e.g. 1500" className="input" />
                </div>
                <div>
                  <label className="input-label">Commission Base (PKR)</label>
                  <input type="number" min="1" value={prodCommPaisa} onChange={(e) => setProdCommPaisa(e.target.value)} placeholder="Defaults to Price" className="input" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="input-label">Stock Count *</label>
                  <input required type="number" min="0" value={prodStock} onChange={(e) => setProdStock(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="input-label">Category *</label>
                  <select value={prodCatId} onChange={(e) => setProdCatId(e.target.value)} className="input">
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="input-label">Product Image</label>
                <FileUpload
                  label="Product Image"
                  onUploadSuccess={(data: { url: string; filename: string; hash: string }) => setProdImageUrl(data.url)}
                />
                {prodImageUrl && <p className="text-xs text-success mt-1">✓ Image uploaded</p>}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-ghost btn-md flex-1">Cancel</button>
                <button type="submit" className="btn btn-primary btn-md flex-1">
                  <Plus className="w-4 h-4" /> Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Rejection Modal ──────────────────────────────────────── */}
      {rejectionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="card rounded-2xl p-6 border border-danger/30 max-w-md w-full shadow-modal animate-fade-up">
            <div className="flex justify-between items-center border-b border-surface-border pb-4 mb-5">
              <h3 className="text-base font-bold text-danger flex items-center gap-2">
                <XCircle className="w-5 h-5" /> Reject {rejectionModal.type === 'payment' ? 'Payment Proof' : 'Withdrawal'}
              </h3>
              <button onClick={() => setRejectionModal(null)} className="p-1.5 text-text-muted hover:bg-surface-3 rounded-lg">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="input-label">Rejection Reason *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Payment screenshot is unclear or amount doesn't match"
                  rows={3}
                  className="input resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRejectionModal(null)} className="btn btn-ghost btn-md flex-1">Cancel</button>
                <button onClick={submitRejection} disabled={!rejectionReason} className="btn btn-danger btn-md flex-1">
                  Confirm Rejection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
