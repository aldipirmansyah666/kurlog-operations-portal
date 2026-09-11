'use client';

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { BarChart3, TrendingUp } from 'lucide-react';
import { STATUS_COLORS } from '@/lib/constants';

interface ChartData {
  statusChartData: { name: string; value: number }[];
  topAgenChartData: { name: string; count: number }[];
}

const tooltipStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: '16px',
  color: '#0f172a',
  fontSize: '12px',
  boxShadow: '0 8px 24px rgba(15,23,42,0.08), 0 1px 2px rgba(15,23,42,0.06)',
};

export function StatusPieChart({ data }: { data: ChartData['statusChartData'] }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-indigo-600 to-sky-500" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center shadow-sm">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
          </span>
          <div>
            <h3 className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">Distribusi Status</h3>
            <p className="text-[11px] text-slate-400">Proporsi resi per status pengiriman</p>
          </div>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  label={({ percent }: { percent?: number }) =>
                    `${((percent || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {data.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={STATUS_COLORS[entry.name] || '#6366f1'}
                      stroke="#ffffff"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'transparent' }} />
                <Legend
                  verticalAlign="bottom"
                  height={32}
                  wrapperStyle={{ fontSize: '11px', color: '#64748b', paddingTop: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 italic">Belum ada data</p>
          )}
        </div>
      </div>
    </div>
  );
}

export function TopAgenBarChart({ data }: { data: ChartData['topAgenChartData'] }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="h-1 w-full bg-gradient-to-r from-amber-500 to-orange-500" />
      <div className="p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="h-8 w-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-sm">
            <TrendingUp className="w-4 h-4 text-amber-600" />
          </span>
          <div>
            <h3 className="text-[11px] font-bold tracking-widest text-slate-600 uppercase">Top 5 Agen Perlu Follow Up</h3>
            <p className="text-[11px] text-slate-400">Agen dengan resi follow-up terbanyak</p>
          </div>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          {data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 20, right: 16 }}>
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#e2e8f0' }} tickLine={{ stroke: '#e2e8f0' }} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#475569"
                  width={110}
                  tick={{ fontSize: 11, fill: '#334155' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: '#f1f5f9' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 12, 12, 0]} name="Jml Resi" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-xs text-slate-400 italic">Tidak ada agen perlu follow up</p>
          )}
        </div>
      </div>
    </div>
  );
}
