import { STATUS_BADGE_CLASSES } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export default function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const classes = STATUS_BADGE_CLASSES[status.toUpperCase()] || STATUS_BADGE_CLASSES.PERJALANAN;
  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]';

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-md border uppercase tracking-wide ${sizeClass} ${classes}`}
    >
      {status}
    </span>
  );
}
