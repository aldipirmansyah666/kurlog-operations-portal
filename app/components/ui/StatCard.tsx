import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: ReactNode;
  variant?: 'default' | 'warning' | 'success' | 'danger' | 'info';
  trend?: 'up' | 'down' | 'flat';
  trendValue?: string;
  subtitle?: string;
}

const VARIANT: Record<string, { accent: string; iconWrap: string; value: string; dot: string }> = {
  default: {
    accent: 'from-indigo-600 to-blue-600',
    iconWrap: 'bg-indigo-50 text-indigo-600 ring-indigo-200',
    value: 'text-slate-900',
    dot: 'bg-indigo-500',
  },
  warning: {
    accent: 'from-amber-500 to-orange-500',
    iconWrap: 'bg-amber-50 text-amber-600 ring-amber-200',
    value: 'text-slate-900',
    dot: 'bg-amber-500',
  },
  success: {
    accent: 'from-emerald-500 to-teal-500',
    iconWrap: 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    value: 'text-slate-900',
    dot: 'bg-emerald-500',
  },
  danger: {
    accent: 'from-rose-500 to-pink-500',
    iconWrap: 'bg-rose-50 text-rose-600 ring-rose-200',
    value: 'text-slate-900',
    dot: 'bg-rose-500',
  },
  info: {
    accent: 'from-sky-500 to-cyan-500',
    iconWrap: 'bg-sky-50 text-sky-600 ring-sky-200',
    value: 'text-slate-900',
    dot: 'bg-sky-500',
  },
};

export default function StatCard({ label, value, icon, variant = 'default', trend, trendValue, subtitle }: StatCardProps) {
  const v = VARIANT[variant];
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-150">
      {/* accent top */}
      <div className={`h-1 w-full bg-gradient-to-r ${v.accent} opacity-90`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="flex items-center gap-2">
              <span className={`h-1.5 w-1.5 rounded-full ${v.dot}`} />
              <p className="text-[11px] font-semibold tracking-widest text-slate-500 uppercase truncate">{label}</p>
            </div>
            <h3 className={`text-[28px] font-bold tracking-tight leading-none ${v.value}`}>{value}</h3>
            {(subtitle || trendValue) && (
              <div className="flex items-center gap-2 text-xs">
                {trend && (
                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[11px] font-semibold ring-1 ${trend === 'up' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : trend === 'down' ? 'bg-rose-50 text-rose-700 ring-rose-200' : 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                    {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {trendValue}
                  </span>
                )}
                {subtitle && <span className="text-slate-400 truncate">{subtitle}</span>}
              </div>
            )}
          </div>
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ring-1 shadow-sm shrink-0 ${v.iconWrap}`}>
            <div className="h-5 w-5">{icon}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
