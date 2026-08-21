'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import {
  ShoppingBag, LogOut, ShieldCheck, LayoutDashboard,
  TrendingUp, Store, Menu, X, User, ChevronDown, Receipt,
} from 'lucide-react';
import { authFetch, clearAuthToken } from '@/lib/api-client';

function RefTracker() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      const cleanRef = refCode.trim().toUpperCase();
      localStorage.setItem('mvp_referral_code', cleanRef);
      document.cookie = `ref_code=${cleanRef}; path=/; max-age=${30 * 24 * 60 * 60}`;
      if (pathname === '/' || !pathname.startsWith('/register')) {
        router.push(`/register?ref=${cleanRef}`);
      }
    }
  }, [searchParams, pathname, router]);

  return null;
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link
      href={href}
      className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
        active
          ? 'text-brand-300 bg-brand-500/10'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
      }`}
    >
      <span className={`w-4 h-4 flex-shrink-0 ${active ? 'text-brand-400' : ''}`}>{icon}</span>
      {label}
      {active && (
        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-brand-500" />
      )}
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { itemCount } = useCart();

  const [user, setUser] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    authFetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => { if (data.user) setUser(data.user); else setUser(null); })
      .catch(() => setUser(null));
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await authFetch('/api/auth/logout', { method: 'POST' });
    clearAuthToken();
    setUser(null);
    router.push('/login');
  };

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? 'U';

  return (
    <nav
      className={`sticky top-0 z-50 navbar-glass transition-shadow duration-200 ${scrolled ? 'shadow-modal' : ''}`}
    >
      <Suspense fallback={null}>
        <RefTracker />
      </Suspense>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand Logo ─────────────────────────────── */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm select-none flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #818cf8 60%, #fbbf24 100%)', boxShadow: '0 0 16px rgba(99,102,241,0.35)' }}>
              AS
            </div>
            <span className="text-base font-extrabold tracking-tight gradient-text-brand hidden sm:block">
              AffiliateStore
            </span>
          </Link>

          {/* ── Desktop Nav Links ───────────────────────── */}
          <div className="hidden md:flex items-center gap-1">
            <NavLink href="/" icon={<Store className="w-4 h-4" />} label="Catalog" active={pathname === '/'} />

            {user && (
              <>
                <NavLink
                  href="/dashboard/affiliate"
                  icon={<LayoutDashboard className="w-4 h-4" />}
                  label="Dashboard"
                  active={pathname.startsWith('/dashboard/affiliate')}
                />
                {(user.role === 'partner' || user.role === 'admin') && (
                  <NavLink
                    href="/dashboard/partner"
                    icon={<TrendingUp className="w-4 h-4" />}
                    label="Partner"
                    active={pathname.startsWith('/dashboard/partner')}
                  />
                )}
                {user.role === 'admin' && (
                  <Link
                    href="/admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all duration-150 ${
                      pathname.startsWith('/admin')
                        ? 'bg-gold-600/20 text-gold-300 border border-gold-500/30'
                        : 'bg-gold-500/10 text-gold-400 border border-gold-500/20 hover:bg-gold-500/20'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Admin
                  </Link>
                )}
              </>
            )}
          </div>

          {/* ── Right Actions ───────────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cart */}
            <Link href="/cart" className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-3 transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-gold-500 text-surface-0 font-bold text-[10px] rounded-full flex items-center justify-center px-1 shadow">
                  {itemCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="flex items-center gap-2 border-l border-surface-border pl-3">
                <Link href="/profile" className="flex items-center gap-2 group">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ring-2 ring-transparent group-hover:ring-brand-500/50 transition-all"
                    style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)' }}
                  >
                    {initials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <p className="text-xs font-semibold text-text-primary leading-tight">{user.name || user.email || user.phone}</p>
                    <p className="text-[10px] text-text-muted uppercase tracking-widest">{user.role}</p>
                  </div>
                </Link>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-1.5 text-text-muted hover:text-danger hover:bg-danger/10 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 border-l border-surface-border pl-3">
                <Link href="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link href="/register" className="btn btn-primary btn-sm">Register</Link>
              </div>
            )}
          </div>

          {/* ── Mobile Toggle ───────────────────────────── */}
          <div className="flex md:hidden items-center gap-2">
            <Link href="/cart" className="relative p-2 text-text-secondary">
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-gold-500 text-surface-0 text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                  {itemCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-text-secondary hover:text-text-primary hover:bg-surface-3 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Drawer ──────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-border animate-slide-down" style={{ backgroundColor: 'rgba(8,9,15,0.97)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
            {user && (
              <div className="flex items-center gap-3 p-3 mb-3 rounded-xl bg-surface-2 border border-surface-border">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #4f46e5, #818cf8)' }}>
                  {initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-text-primary">{user.name || user.email}</p>
                  <p className="text-xs text-text-muted uppercase tracking-wider">{user.role}</p>
                </div>
              </div>
            )}

            <MobileNavLink href="/" icon={<Store className="w-4 h-4" />} label="Catalog" />
            {user ? (
              <>
                <MobileNavLink href="/dashboard/affiliate" icon={<LayoutDashboard className="w-4 h-4" />} label="Affiliate Dashboard" />
                <MobileNavLink href="/dashboard/partner" icon={<TrendingUp className="w-4 h-4" />} label="Partner Program" />
                <MobileNavLink href="/profile" icon={<User className="w-4 h-4" />} label="My Profile" />
                {user.role === 'admin' && (
                  <MobileNavLink href="/admin" icon={<ShieldCheck className="w-4 h-4" />} label="Admin Panel" highlight />
                )}
                <div className="pt-3 border-t border-surface-border mt-3">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm font-medium text-danger hover:bg-danger/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="pt-3 border-t border-surface-border mt-3 flex flex-col gap-2">
                <Link href="/login" className="btn btn-ghost btn-md w-full">Login</Link>
                <Link href="/register" className="btn btn-primary btn-md w-full">Create Account</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileNavLink({ href, icon, label, highlight }: { href: string; icon: React.ReactNode; label: string; highlight?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/' && pathname.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-brand-500/10 text-brand-300'
          : highlight
            ? 'text-gold-400 hover:bg-gold-500/10'
            : 'text-text-secondary hover:text-text-primary hover:bg-surface-3'
      }`}
    >
      <span className={active ? 'text-brand-400' : ''}>{icon}</span>
      {label}
    </Link>
  );
}
