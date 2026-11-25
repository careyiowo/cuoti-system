import { cn } from '@/lib/utils';
import { MASTERY_META } from '@/lib/question';
import type { Mastery } from '@/lib/types';

interface MasteryMarkProps {
  mastery: Mastery;
  withLabel?: boolean;
  className?: string;
}

const DOT: Record<Mastery, string> = {
  new: 'border border-border bg-transparent',
  reviewing: 'border border-primary bg-primary/35',
  mastered: 'bg-primary',
  stuck: 'bg-destructive',
};

const TEXT: Record<Mastery, string> = {
  new: 'text-muted-foreground',
  reviewing: 'text-foreground/70',
  mastered: 'text-primary',
  stuck: 'text-destructive',
};

export default function MasteryMark({ mastery, withLabel = false, className }: MasteryMarkProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <span className={cn('inline-block size-2.5 rounded-full', DOT[mastery])} />
      {withLabel && <span className={cn('text-[12px]', TEXT[mastery])}>{MASTERY_META[mastery].label}</span>}
    </span>
  );
}
