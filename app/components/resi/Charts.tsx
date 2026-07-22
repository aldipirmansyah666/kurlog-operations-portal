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

const tooltipStyle = {
  backgroundColor: '#0f172a',
  borderColor: '#334155',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '12px',
};

export function StatusPieChart({ data }: { data: ChartData['statusChartData'] }) {
  return (
    <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800/80 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-blue-400" />
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Distribusi Status
        </h3>
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
                    fill={STATUS_COLORS[entry.name] || '#3b82f6'}
                    stroke="#0f172a"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend
                verticalAlign="bottom"
                height={32}
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8', paddingTop: '8px' }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-slate-600 italic">Belum ada data</p>
        )}
      </div>
    </div>
  );
}

export function TopAgenBarChart({ data }: { data: ChartData['topAgenChartData'] }) {
  return (
    <div className="bg-slate-900/70 p-5 rounded-xl border border-slate-800/80 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-amber-400" />
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Top 5 Agen Perlu Follow Up
        </h3>
      </div>
      <div className="h-64 w-full flex items-center justify-center">
        {data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
              <XAxis type="number" stroke="#64748b" />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#cbd5e1"
                width={110}
                tick={{ fontSize: 10 }}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Jml Resi" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs text-slate-600 italic">Tidak ada agen perlu follow up</p>
        )}
      </div>
    </div>
  );
}
