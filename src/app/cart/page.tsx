'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatPKR } from '@/lib/formatters';
import { ShoppingBag, Trash2, ArrowRight, Package, ShieldCheck, Minus, Plus } from 'lucide-react';

export default function CartPage() {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, totalPaisa, itemCount } = useCart();

  if (cart.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center card p-8 border border-surface-border space-y-5 animate-fade-up">
        <div className="w-16 h-16 rounded-full bg-surface-3 border border-surface-border flex items-center justify-center mx-auto text-text-muted">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-text-primary">Your Cart is Empty</h2>
          <p className="text-xs text-text-muted">Explore our product catalog to start shopping and earning commissions.</p>
        </div>
        <Link href="/" className="btn btn-primary btn-md inline-flex py-2.5 px-6">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Shopping Cart ({itemCount} items)</h1>
        <Link href="/" className="text-xs text-brand-400 hover:text-brand-300 font-semibold transition-colors">
          ← Continue Shopping
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items List */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <div
              key={item.productId}
              className="card p-4 border border-surface-border flex items-center justify-between gap-4 hover:border-surface-border-light transition-all"
            >
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl bg-surface-2 border border-surface-border overflow-hidden flex items-center justify-center shrink-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Package className="w-6 h-6 text-text-muted opacity-50" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary line-clamp-1">{item.title}</h3>
                  <p className="text-xs font-semibold text-gold-400 font-mono mt-1">
                    {formatPKR(item.pricePaisa)}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Quantity Controls */}
                <div className="flex items-center space-x-1 bg-surface-3 border border-surface-border rounded-xl p-1">
                  <button
                    type="button"
                    aria-label="Decrease quantity"
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary text-xs transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-7 text-center text-xs font-bold text-text-primary font-mono">{item.quantity}</span>
                  <button
                    type="button"
                    aria-label="Increase quantity"
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="w-7 h-7 flex items-center justify-center text-text-muted hover:text-text-primary text-xs transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeFromCart(item.productId)}
                  className="p-2 text-text-muted hover:text-danger transition-colors rounded-lg hover:bg-surface-3"
                  title="Remove item"
                  aria-label="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Box */}
        <div className="card p-6 border border-surface-border space-y-6 h-fit">
          <h2 className="text-base font-bold text-text-primary border-b border-surface-border pb-3">Order Summary</h2>

          <div className="space-y-3 text-xs text-text-secondary">
            <div className="flex justify-between">
              <span className="text-text-muted">Subtotal ({itemCount} items)</span>
              <span className="font-mono font-bold text-text-primary">{formatPKR(totalPaisa)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-muted">Shipping (Pakistan)</span>
              <span className="text-success font-semibold">FREE</span>
            </div>
            <div className="border-t border-surface-border pt-3 flex justify-between text-sm">
              <span className="font-bold text-text-primary">Total</span>
              <span className="font-mono font-extrabold text-gold-400 text-base">{formatPKR(totalPaisa)}</span>
            </div>
          </div>

          <button
            onClick={() => router.push('/checkout')}
            className="btn btn-gold btn-md w-full py-3 text-sm justify-center"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center space-x-2 text-[11px] text-text-muted pt-1">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>Encrypted Payment Proof System</span>
          </div>
        </div>
      </div>
    </div>
  );
}
