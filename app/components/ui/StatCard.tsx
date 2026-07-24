import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger' | 'info';
}

const VARIANT_ACCENT: Record<string, string> = {
  default: 'border-l-blue-500',
  warning: 'border-l-amber-500',
  success: 'border-l-emerald-500',
  danger: 'border-l-rose-500',
  info: 'border-l-sky-500',
};

const VARIANT_VALUE: Record<string, string> = {
  default: 'text-slate-800',
  warning: 'text-amber-600',
  success: 'text-emerald-600',
  danger: 'text-rose-600',
  info: 'text-sky-600',
};

const VARIANT_LABEL: Record<string, string> = {
  default: 'text-slate-400',
  warning: 'text-amber-500',
  success: 'text-emerald-500',
  danger: 'text-rose-500',
  info: 'text-sky-500',
};

export default function StatCard({ label, value, icon, variant = 'default' }: StatCardProps) {
  return (
    <div
      className={`bg-white p-5 rounded-xl border border-[#E2E8F0] border-l-4 shadow-sm hover:shadow-md transition-shadow ${VARIANT_ACCENT[variant]}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-[11px] uppercase tracking-wider font-semibold ${VARIANT_LABEL[variant]}`}>
            {label}
          </p>
          <h3 className={`text-3xl font-bold mt-1 ${VARIANT_VALUE[variant]}`}>{value}</h3>
        </div>
        <div className={`opacity-60 ${VARIANT_VALUE[variant]}`}>{icon}</div>
      </div>
    </div>
  );
}
