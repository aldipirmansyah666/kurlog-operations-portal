import { STATUS_BADGE_CLASSES } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const classes = STATUS_BADGE_CLASSES[status.toUpperCase()] || STATUS_BADGE_CLASSES.PERJALANAN;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px] leading-none' : 'px-2.5 py-1 text-xs leading-none';
  return (
    <span className={`inline-flex items-center font-bold rounded-full border uppercase tracking-widest shadow-sm ${sizeClass} ${classes}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70 mr-1.5 hidden sm:inline-block" />
      {status}
    </span>
  );
}
