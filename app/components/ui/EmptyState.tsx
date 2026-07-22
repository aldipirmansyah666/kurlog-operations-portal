import { Package } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
}

export default function EmptyState({
  title = 'Belum ada data',
  description = 'Tidak ada data yang ditemukan.',
  icon,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-800 mb-4">
        {icon || <Package className="w-8 h-8 text-slate-500" />}
      </div>
      <p className="text-sm font-medium text-slate-300">{title}</p>
      <p className="text-xs text-slate-500 mt-1 max-w-xs">{description}</p>
    </div>
  );
}
