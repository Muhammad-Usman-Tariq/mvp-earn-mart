'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { formatPKR } from '@/lib/formatters';
import { ShoppingBag, Package, Tag } from 'lucide-react';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    slug: string;
    description: string;
    price_paisa: number;
    net_commissionable_paisa: number;
    stock_count: number;
    image_url?: string | null;
    category?: { name: string };
    subcategory?: { name: string } | null;
  };
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({
      productId: product.id,
      title: product.title,
      pricePaisa: product.price_paisa,
      netCommissionablePaisa: product.net_commissionable_paisa,
      imageUrl: product.image_url,
    });
  };

  const inStock = product.stock_count > 0;
  const commissionPercent = product.price_paisa > 0
    ? Math.round((product.net_commissionable_paisa / product.price_paisa) * 100 * 10) / 10
    : 0;

  return (
    <div className="card card-hover flex flex-col overflow-hidden group">
      {/* Image */}
      <div className="relative w-full h-52 overflow-hidden" style={{ backgroundColor: 'var(--surface-2)' }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center" style={{ color: 'var(--text-muted)' }}>
            <Package className="w-14 h-14 stroke-[1.5] mb-2 opacity-40" />
            <span className="text-[10px] uppercase tracking-widest opacity-40 font-semibold">No Image</span>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface-2/90 to-transparent pointer-events-none" />

        {/* Category badge */}
        {product.category && (
          <span className="absolute top-2.5 left-2.5 badge badge-neutral text-[10px]">
            {product.category.name}
            {product.subcategory && <> · {product.subcategory.name}</>}
          </span>
        )}

        {/* Stock indicator */}
        <span className={`absolute top-2.5 right-2.5 badge ${inStock ? 'badge-success' : 'badge-danger'}`}>
          <span className={`status-dot ${inStock ? 'bg-success' : 'bg-danger'}`} />
          {inStock ? `${product.stock_count} in stock` : 'Sold out'}
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div className="flex-1">
          <Link href={`/products/${product.id}`}>
            <h3 className="text-sm font-bold text-text-primary hover:text-brand-400 transition-colors line-clamp-1 mb-1">
              {product.title}
            </h3>
          </Link>
          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
            {product.description || 'High-quality catalog item eligible for multi-level referral commissions.'}
          </p>
        </div>

        {/* Price & Commission */}
        <div className="flex items-end justify-between pt-2 border-t border-surface-border/50">
          <div>
            <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wider block mb-0.5">Price</span>
            <span className="text-lg font-extrabold text-gold-400 font-mono tracking-tight">
              {formatPKR(product.price_paisa)}
            </span>
          </div>
          <div className="text-right">
            <span className="badge badge-gold flex items-center gap-1 mb-0.5">
              <Tag className="w-2.5 h-2.5" />
              {commissionPercent}% Pool
            </span>
            <span className="text-[10px] text-text-muted font-mono block">
              Base: {formatPKR(product.net_commissionable_paisa)}
            </span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className="btn btn-primary btn-md w-full group/btn"
        >
          <ShoppingBag className="w-4 h-4 transition-transform group-hover/btn:-translate-y-0.5" />
          <span>{inStock ? 'Add to Cart' : 'Out of Stock'}</span>
        </button>
      </div>
    </div>
  );
}
