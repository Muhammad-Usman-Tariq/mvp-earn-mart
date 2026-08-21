import React from 'react';
import Link from 'next/link';
import { CreditCard, Smartphone, Landmark, Bitcoin, ShieldCheck, Network, Zap } from 'lucide-react';

const paymentMethods = [
  { label: 'JazzCash',      icon: <Smartphone className="w-3.5 h-3.5" />, color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20' },
  { label: 'EasyPaisa',     icon: <Zap className="w-3.5 h-3.5" />,        color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  { label: 'Bank Transfer', icon: <Landmark className="w-3.5 h-3.5" />,   color: 'text-blue-400',   bg: 'bg-blue-500/10',   border: 'border-blue-500/20' },
  { label: 'USDT/Crypto',   icon: <Bitcoin className="w-3.5 h-3.5" />,    color: 'text-amber-400',  bg: 'bg-amber-500/10',  border: 'border-amber-500/20' },
  { label: 'Cash',          icon: <CreditCard className="w-3.5 h-3.5" />, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
];

const links = {
  catalog: ['Gents Cloth', 'Ladies Cloth', 'Mobile Accessories', 'Herbal Products', 'Watches'],
  platform: [
    { label: 'Affiliate Dashboard', href: '/dashboard/affiliate' },
    { label: 'Partner Program',     href: '/dashboard/partner' },
    { label: 'My Orders',           href: '/orders' },
    { label: 'Register',            href: '/register' },
    { label: 'Login',               href: '/login' },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-20 border-t border-surface-border" style={{ backgroundColor: 'var(--surface-1)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer grid */}
        <div className="py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">

          {/* Brand Column */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm select-none flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 60%, #fbbf24 100%)', boxShadow: '0 0 12px rgba(99,102,241,0.30)' }}
              >
                AS
              </div>
              <span className="text-base font-extrabold gradient-text-brand">AffiliateStore</span>
            </Link>
            <p className="text-xs text-text-muted leading-relaxed mb-4">
              Pakistan's production-grade multi-level affiliate e-commerce platform. 5-tier unilevel commissions, double-entry ledger accounting, and a partner investment module.
            </p>
            <div className="flex items-center gap-1.5 text-xs text-success">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-medium">ACID Ledger · Audited · Secure</span>
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4">
              Categories
            </h4>
            <ul className="space-y-2">
              {links.catalog.map((cat) => (
                <li key={cat}>
                  <span className="text-sm text-text-muted hover:text-text-secondary transition-colors cursor-pointer">
                    {cat}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Links */}
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4">
              Platform
            </h4>
            <ul className="space-y-2">
              {links.platform.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-text-muted hover:text-brand-300 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Payment Methods */}
          <div>
            <h4 className="text-xs font-bold text-text-primary uppercase tracking-widest mb-4">
              Accepted Payments
            </h4>
            <div className="flex flex-wrap gap-2 mb-5">
              {paymentMethods.map((pm) => (
                <span
                  key={pm.label}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border ${pm.color} ${pm.bg} ${pm.border}`}
                >
                  {pm.icon}
                  {pm.label}
                </span>
              ))}
            </div>

            {/* Commission Structure Mini-Preview */}
            <div className="card p-3 space-y-1">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2 flex items-center gap-1">
                <Network className="w-3 h-3" /> Commission Tiers
              </p>
              {[['L1 Direct', '10%', 'text-brand-300'], ['L2', '5%', 'text-brand-400'], ['L3', '3%', 'text-text-secondary'], ['L4', '2%', 'text-text-secondary'], ['L5', '1%', 'text-text-muted']].map(([lvl, pct, cls]) => (
                <div key={lvl} className="flex justify-between items-center text-[11px]">
                  <span className="text-text-muted">{lvl}</span>
                  <span className={`font-bold ${cls}`}>{pct}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-surface-border py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
          <span>© {new Date().getFullYear()} AffiliateStore. All rights reserved.</span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-brand-400" />
            Built for production-grade scalability · All balances computed from immutable ledger entries.
          </span>
        </div>
      </div>
    </footer>
  );
}
