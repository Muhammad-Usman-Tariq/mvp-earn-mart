import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { direction: 'up' | 'down' | 'neutral'; label: string };
  subtitle?: string;
  className?: string;
  highlight?: boolean;
}

export default function StatCard({
  label,
  value,
  icon,
  iconBg = 'bg-brand-500/15 text-brand-400',
  trend,
  subtitle,
  className = '',
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={`card p-5 flex flex-col gap-4 ${highlight ? 'ring-1 ring-brand-500/30 shadow-glow-brand' : ''} ${className}`}
      style={{ animationFillMode: 'both' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-1">{label}</p>
          <p className="text-2xl font-bold text-text-primary leading-none">{value}</p>
          {subtitle && <p className="text-xs text-text-muted mt-1">{subtitle}</p>}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {trend.direction === 'up' && (
            <>
              <TrendingUp className="w-3.5 h-3.5 text-success" />
              <span className="text-success">{trend.label}</span>
            </>
          )}
          {trend.direction === 'down' && (
            <>
              <TrendingDown className="w-3.5 h-3.5 text-danger" />
              <span className="text-danger">{trend.label}</span>
            </>
          )}
          {trend.direction === 'neutral' && (
            <>
              <Minus className="w-3.5 h-3.5 text-text-muted" />
              <span className="text-text-muted">{trend.label}</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
