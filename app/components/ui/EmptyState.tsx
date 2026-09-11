import { Package, SearchX } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export default function EmptyState({ title = 'Belum ada data', description = 'Tidak ada data yang ditemukan.', icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center card-enterprise border-dashed">
      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 flex items-center justify-center mb-4 shadow-sm">
        <div className="text-slate-400">{icon || <Package className="h-7 w-7" />}</div>
      </div>
      <p className="text-sm font-semibold tracking-tight text-slate-900">{title}</p>
      <p className="text-xs leading-relaxed text-slate-500 mt-1.5 max-w-md">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptySearchState({ query }: { query: string }) {
  return (
    <EmptyState
      title="Tidak ada hasil"
      description={query ? `Tidak ada data yang cocok dengan "${query}". Coba kata kunci lain.` : 'Coba ubah filter atau kata kunci pencarian.'}
      icon={<SearchX className="h-7 w-7" />}
    />
  );
}
