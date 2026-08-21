'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import { formatPKR } from '@/lib/formatters';
import { Package, ShoppingBag, ArrowLeft, ShieldCheck, Tag, CheckCircle2, Minus, Plus } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetch(`/api/products`)
        .then((res) => res.json())
        .then((data) => {
          const found = (data.products || []).find((p: any) => p.id === params.id);
          setProduct(found);
        })
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  if (loading) {
    return <LoadingSpinner label="Loading product details..." />;
  }

  if (!product) {
    return (
      <div className="py-20 text-center space-y-4">
        <Package className="w-12 h-12 text-text-muted mx-auto stroke-[1.5] opacity-40" />
        <p className="text-base font-semibold text-text-primary">Product not found.</p>
        <button onClick={() => router.push('/')} className="btn btn-ghost btn-sm">
          ← Return to Catalog
        </button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(
      {
        productId: product.id,
        title: product.title,
        pricePaisa: product.price_paisa,
        netCommissionablePaisa: product.net_commissionable_paisa,
        imageUrl: product.image_url,
      },
      quantity
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    handleAddToCart();
    router.push('/cart');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="inline-flex items-center space-x-2 text-xs font-semibold text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Products</span>
      </button>

      <div className="card rounded-2xl p-6 md:p-8 border border-surface-border grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Product Image */}
        <div className="w-full h-80 md:h-96 bg-surface-2 rounded-xl border border-surface-border flex items-center justify-center overflow-hidden relative">
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-text-muted space-y-2">
              <Package className="w-16 h-16 stroke-[1.2] opacity-40" />
              <span className="text-xs uppercase tracking-widest font-semibold">No Image Uploaded</span>
            </div>
          )}
        </div>

        {/* Right: Product Info */}
        <div className="space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="badge badge-brand">
                {product.category?.name || 'General'} {product.subcategory ? `• ${product.subcategory.name}` : ''}
              </span>
              <span className={`badge ${product.stock_count > 0 ? 'badge-success' : 'badge-danger'}`}>
                {product.stock_count > 0 ? `${product.stock_count} in stock` : 'Out of stock'}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-text-primary leading-snug">{product.title}</h1>

            <div className="flex items-center justify-between py-3 border-y border-surface-border">
              <div>
                <span className="text-[10px] text-text-muted uppercase tracking-wider block">Price</span>
                <span className="text-2xl font-extrabold text-gold-400 font-mono tracking-tight">
                  {formatPKR(product.price_paisa)}
                </span>
              </div>
              {product.net_commissionable_paisa && (
                <div className="text-right">
                  <span className="text-[10px] text-text-muted uppercase tracking-wider block">Commission Base</span>
                  <span className="text-sm font-semibold text-brand-300 font-mono">
                    {formatPKR(product.net_commissionable_paisa)}
                  </span>
                </div>
              )}
            </div>

            <p className="text-xs text-text-muted leading-relaxed">
              {product.description || 'High quality item eligible for 5-level unilevel affiliate commissions.'}
            </p>

            {/* Quantity Stepper */}
            <div className="space-y-2 pt-2">
              <label className="input-label">Quantity</label>
              <div className="flex items-center space-x-3">
                <div className="flex items-center border border-surface-border bg-surface-2 rounded-xl p-1">
                  <button
                    type="button"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-bold text-sm text-text-primary font-mono">{quantity}</span>
                  <button
                    type="button"
                    disabled={quantity >= product.stock_count}
                    aria-label="Increase quantity"
                    onClick={() => setQuantity((q) => Math.min(product.stock_count, q + 1))}
                    className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary disabled:opacity-30 disabled:hover:text-text-muted transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <span className="text-xs text-text-muted">
                  Subtotal: <strong className="text-text-primary font-mono">{formatPKR(product.price_paisa * quantity)}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4 border-t border-surface-border">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock_count <= 0}
                className="btn btn-ghost btn-md py-3 text-xs justify-center"
              >
                {added ? <CheckCircle2 className="w-4 h-4 text-success" /> : <ShoppingBag className="w-4 h-4" />}
                <span>{added ? 'Added to Cart!' : 'Add to Cart'}</span>
              </button>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={product.stock_count <= 0}
                className="btn btn-gold btn-md py-3 text-xs justify-center"
              >
                <span>Buy Now</span>
              </button>
            </div>

            <div className="flex items-center justify-center space-x-2 text-[11px] text-text-muted pt-1">
              <ShieldCheck className="w-4 h-4 text-success" />
              <span>ACID Ledger Audited · 14-Day Return Guarantee</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
