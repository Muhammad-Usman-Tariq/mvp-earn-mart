import React from 'react';

type StatusType =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'available'
  | 'processing'
  | 'completed'
  | 'cancelled'
  | 'reversed'
  | 'active'
  | 'inactive'
  | string;

interface StatusBadgeProps {
  status: StatusType;
  label?: string;
}

const statusConfig: Record<string, { dot: string; text: string; bg: string; border: string }> = {
  pending:    { dot: 'bg-warning', text: 'text-warning',       bg: 'bg-warning/10',  border: 'border-warning/25' },
  approved:   { dot: 'bg-success', text: 'text-success-light', bg: 'bg-success/10',  border: 'border-success/25' },
  available:  { dot: 'bg-success', text: 'text-success-light', bg: 'bg-success/10',  border: 'border-success/25' },
  completed:  { dot: 'bg-success', text: 'text-success-light', bg: 'bg-success/10',  border: 'border-success/25' },
  active:     { dot: 'bg-success', text: 'text-success-light', bg: 'bg-success/10',  border: 'border-success/25' },
  rejected:   { dot: 'bg-danger',  text: 'text-danger-light',  bg: 'bg-danger/10',   border: 'border-danger/25' },
  cancelled:  { dot: 'bg-danger',  text: 'text-danger-light',  bg: 'bg-danger/10',   border: 'border-danger/25' },
  reversed:   { dot: 'bg-danger',  text: 'text-danger-light',  bg: 'bg-danger/10',   border: 'border-danger/25' },
  processing: { dot: 'bg-brand-400', text: 'text-brand-300',   bg: 'bg-brand-500/10', border: 'border-brand-500/25' },
  inactive:   { dot: 'bg-text-muted', text: 'text-text-muted', bg: 'bg-surface-3',   border: 'border-surface-border' },
};

const defaultConfig = { dot: 'bg-text-muted', text: 'text-text-secondary', bg: 'bg-surface-3', border: 'border-surface-border' };

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const config = statusConfig[status.toLowerCase()] || defaultConfig;
  const displayLabel = label || (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase());

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${config.bg} ${config.border} ${config.text}`}>
      <span className={`status-dot ${config.dot}`} />
      {displayLabel}
    </span>
  );
}
