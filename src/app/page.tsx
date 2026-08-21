'use client';

import React, { useEffect, useState } from 'react';
import ProductCard from '@/components/ProductCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  Search, Sparkles, Network, TrendingUp, ShieldCheck,
  Shirt, Smartphone, Leaf, Watch, ChevronRight, Users, Package,
} from 'lucide-react';

const categoryConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; border: string }> = {
  'Gents Cloth':        { icon: <Shirt className="w-4 h-4" />,      color: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20' },
  'Ladies Cloth':       { icon: <Shirt className="w-4 h-4" />,      color: 'text-pink-400',    bg: 'bg-pink-500/10',    border: 'border-pink-500/20' },
  'Mobile Accessories': { icon: <Smartphone className="w-4 h-4" />, color: 'text-brand-300',   bg: 'bg-brand-500/10',   border: 'border-brand-500/20' },
  'Herbal Products':    { icon: <Leaf className="w-4 h-4" />,       color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  'Watches':            { icon: <Watch className="w-4 h-4" />,      color: 'text-gold-400',    bg: 'bg-gold-500/10',    border: 'border-gold-500/20' },
};

const commissionTiers = [
  { level: 'L1', label: 'Direct',  pct: '10%', color: 'bg-brand-500', textColor: 'text-brand-300', height: 'h-20' },
  { level: 'L2', label: 'Tier 2',  pct: '5%',  color: 'bg-brand-600', textColor: 'text-brand-400', height: 'h-16' },
  { level: 'L3', label: 'Tier 3',  pct: '3%',  color: 'bg-brand-700', textColor: 'text-brand-400', height: 'h-12' },
  { level: 'L4', label: 'Tier 4',  pct: '2%',  color: 'bg-brand-800', textColor: 'text-brand-400', height: 'h-9' },
  { level: 'L5', label: 'Tier 5',  pct: '1%',  color: 'bg-brand-900', textColor: 'text-text-muted', height: 'h-7' },
];

export default function HomePage() {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = '/api/products';
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (search) params.append('search', search);
      if (params.toString()) url += `?${params.toString()}`;
      const res = await fetch(url);
      const data = await res.json();
      setProducts(data.products || []);
      if (data.categories) setCategories(data.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  return (
    <div className="space-y-16">

      {/* ── Hero Section ─────────────────────────────────────────── */}
      <section className="relative rounded-2xl overflow-hidden card border border-surface-border-light">
        {/* Background mesh */}
        <div className="absolute inset-0 bg-hero-mesh pointer-events-none" />
        <div className="absolute inset-0 opacity-30"
          style={{ backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(99,102,241,0.15) 0%, transparent 50%)' }} />

        <div className="relative px-8 md:px-12 py-12 md:py-16 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          {/* Left: Copy */}
          <div className="space-y-6 animate-fade-up">
            <div className="badge badge-brand">
              <Sparkles className="w-3.5 h-3.5" />
              Unilevel 5-Tier Affiliate Network
            </div>

            <h1 className="text-3xl md:text-4xl xl:text-5xl font-black text-text-primary leading-tight tracking-tight">
              Shop. Refer.{' '}
              <span className="gradient-text">
                Earn Commissions.
              </span>
            </h1>

            <p className="text-base text-text-secondary leading-relaxed max-w-md">
              Browse our product catalog across Apparel, Mobile Accessories, Herbal Products & Timepieces.
              Earn up to <strong className="text-gold-400">10% direct</strong> + <strong className="text-gold-400">11% indirect</strong> referral commissions on every verified sale.
            </p>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-4 pt-2">
              {[
                { icon: <Network className="w-4 h-4 text-brand-400" />, label: 'L1: 10% | L2: 5% | L3–5: 6%' },
                { icon: <TrendingUp className="w-4 h-4 text-gold-400" />, label: 'Partner Investment Returns' },
                { icon: <ShieldCheck className="w-4 h-4 text-success" />, label: 'ACID Double-Entry Ledger' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-text-muted">
                  {icon}
                  <span>{label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <a href="/register" className="btn btn-primary btn-md">
                Start Earning Free <ChevronRight className="w-4 h-4" />
              </a>
              <a href="#catalog" className="btn btn-ghost btn-md">
                Browse Catalog
              </a>
            </div>
          </div>

          {/* Right: Commission Pyramid Visual */}
          <div className="hidden lg:flex flex-col items-center justify-center gap-2 animate-fade-in">
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">Commission Structure</p>
            {commissionTiers.map((tier, i) => (
              <div key={tier.level} className="w-full flex justify-center">
                <div
                  className={`flex items-center justify-between px-4 rounded-lg ${tier.color} ${tier.height} transition-all hover:opacity-90 cursor-default`}
                  style={{ width: `${100 - i * 14}%`, opacity: 0.9 }}
                >
                  <span className="text-xs font-bold text-white/80">{tier.level}</span>
                  <span className="text-xl font-black text-white">{tier.pct}</span>
                  <span className="text-xs text-white/60">{tier.label}</span>
                </div>
              </div>
            ))}
            <p className="text-[11px] text-text-muted mt-2">21% total network payout per verified order</p>
          </div>
        </div>
      </section>

      {/* ── Catalog Section ──────────────────────────────────────── */}
      <section id="catalog" className="space-y-6">
        {/* Header + Search */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Product Catalog</h2>
            <p className="section-subtitle mt-0.5">Filter by category or search for items</p>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full md:w-72 relative">
            <input
              id="product-search"
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input pl-10 pr-4"
            />
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-3 pointer-events-none" />
          </form>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              selectedCategory === ''
                ? 'bg-brand-500/20 text-brand-300 border-brand-500/40 shadow-glow-brand/10'
                : 'bg-surface-2 text-text-muted border-surface-border hover:text-text-secondary hover:border-surface-border-light'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            All Categories
          </button>

          {categories.map((cat) => {
            const conf = categoryConfig[cat.name] || { icon: <Package className="w-3.5 h-3.5" />, color: 'text-text-muted', bg: 'bg-surface-2', border: 'border-surface-border' };
            const isActive = selectedCategory === cat.slug;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                  isActive
                    ? `${conf.bg} ${conf.color} ${conf.border}`
                    : 'bg-surface-2 text-text-muted border-surface-border hover:text-text-secondary hover:border-surface-border-light'
                }`}
              >
                <span className={isActive ? conf.color : 'text-text-muted'}>{conf.icon}</span>
                {cat.name}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {loading ? (
          <LoadingSpinner label="Loading products..." />
        ) : products.length === 0 ? (
          <div className="py-20 text-center card border border-surface-border rounded-2xl space-y-3">
            <Package className="w-12 h-12 text-text-muted mx-auto stroke-[1.5]" />
            <p className="text-sm font-semibold text-text-secondary">No products found</p>
            <p className="text-xs text-text-muted">
              {selectedCategory ? 'Try selecting another category or check back soon!' : 'Check back soon for new arrivals.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((product, i) => (
              <div key={product.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Commission Structure Detail ───────────────────────────── */}
      <section className="card rounded-2xl p-8 border border-surface-border space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <div className="badge badge-brand mx-auto">
            <Network className="w-3.5 h-3.5" /> Unilevel Architecture
          </div>
          <h2 className="section-title text-2xl">5-Tier Commission Structure</h2>
          <p className="section-subtitle">
            Earn automatic referral payouts on every verified customer purchase — up to 5 levels deep.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
          {[
            { lvl: 1, pct: '10%', label: 'Direct Referral',  color: 'ring-brand-500/50 bg-brand-500/10', textColor: 'text-brand-300', dot: 'bg-brand-500' },
            { lvl: 2, pct: '5%',  label: 'Tier 2 Indirect', color: 'ring-brand-600/30 bg-brand-600/10', textColor: 'text-brand-400', dot: 'bg-brand-600' },
            { lvl: 3, pct: '3%',  label: 'Tier 3 Indirect', color: 'ring-surface-border-light bg-surface-2', textColor: 'text-text-secondary', dot: 'bg-text-muted' },
            { lvl: 4, pct: '2%',  label: 'Tier 4 Indirect', color: 'ring-surface-border-light bg-surface-2', textColor: 'text-text-secondary', dot: 'bg-text-muted' },
            { lvl: 5, pct: '1%',  label: 'Tier 5 Indirect', color: 'ring-surface-border-light bg-surface-2', textColor: 'text-text-muted',    dot: 'bg-surface-border-light' },
          ].map(({ lvl, pct, label, color, textColor, dot }) => (
            <div key={lvl} className={`p-5 rounded-xl ring-1 ${color} text-center space-y-2 transition-transform hover:-translate-y-0.5`}>
              <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${textColor}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
                Level {lvl}
              </span>
              <p className="text-3xl font-black text-text-primary">{pct}</p>
              <p className="text-[11px] text-text-muted">{label}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 pt-2 border-t border-surface-border text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success" />
            Commissions recorded in immutable double-entry ledger
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-brand-400" />
            Closure table architecture — O(1) ancestry lookups
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-gold-400" />
            21% total network payout per order
          </div>
        </div>
      </section>

    </div>
  );
}
