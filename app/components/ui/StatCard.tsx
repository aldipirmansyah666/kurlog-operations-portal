import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger' | 'info';
}

const VARIANT_BORDERS: Record<string, string> = {
  default: 'border-slate-800/80',
  warning: 'border-amber-500/20',
  success: 'border-emerald-500/20',
  danger: 'border-rose-500/20',
  info: 'border-sky-500/20',
};

const VARIANT_ICONS: Record<string, string> = {
  default: 'bg-slate-800/80 text-slate-400 border-slate-700/50',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  danger: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  info: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
};

const VARIANT_VALUE: Record<string, string> = {
  default: 'text-white',
  warning: 'text-amber-400',
  success: 'text-emerald-400',
  danger: 'text-rose-400',
  info: 'text-sky-400',
};

const VARIANT_LABEL: Record<string, string> = {
  default: 'text-slate-400',
  warning: 'text-amber-400/80',
  success: 'text-emerald-400/80',
  danger: 'text-rose-400/80',
  info: 'text-sky-400/80',
};

export default function StatCard({ label, value, icon, variant = 'default' }: StatCardProps) {
  return (
    <div
      className={`bg-slate-900/70 p-5 rounded-xl border shadow-sm flex justify-between items-center hover:border-slate-700/80 transition-colors ${VARIANT_BORDERS[variant]}`}
    >
      <div>
        <p className={`text-[11px] uppercase tracking-wider font-semibold ${VARIANT_LABEL[variant]}`}>
          {label}
        </p>
        <h3 className={`text-3xl font-bold mt-1 ${VARIANT_VALUE[variant]}`}>{value}</h3>
      </div>
      <div className={`p-3 rounded-lg border ${VARIANT_ICONS[variant]}`}>{icon}</div>
    </div>
  );
}
