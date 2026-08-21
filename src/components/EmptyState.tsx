'use client';

import React from 'react';
import Link from 'next/link';
import { Package } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
  onCtaClick?: () => void;
}

export default function EmptyState({
  icon,
  title,
  body,
  ctaLabel,
  ctaHref,
  onCtaClick,
}: EmptyStateProps) {
  return (
    <div className="card p-8 border border-surface-border rounded-2xl text-center space-y-4 max-w-md mx-auto animate-fade-up">
      <div className="w-14 h-14 rounded-2xl bg-surface-3 border border-surface-border flex items-center justify-center mx-auto text-text-muted">
        {icon || <Package className="w-7 h-7 stroke-[1.5]" />}
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-text-primary font-display">{title}</h3>
        <p className="text-xs text-text-muted leading-relaxed">{body}</p>
      </div>

      {(ctaLabel && (ctaHref || onCtaClick)) && (
        <div className="pt-2">
          {ctaHref ? (
            <Link href={ctaHref} className="btn btn-primary btn-md inline-flex">
              {ctaLabel}
            </Link>
          ) : (
            <button type="button" onClick={onCtaClick} className="btn btn-primary btn-md inline-flex">
              {ctaLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
