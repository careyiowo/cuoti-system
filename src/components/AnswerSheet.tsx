import { cn } from '@/lib/utils';

interface AnswerSheetEntry {
  answered: boolean;
  /** undefined = 还没提交；true/false = 判分结果 */
  result?: boolean | null;
}

interface AnswerSheetProps {
  entries: AnswerSheetEntry[];
  current: number;
  onJump: (index: number) => void;
}

export default function AnswerSheet({ entries, current, onJump }: AnswerSheetProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map((entry, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onJump(index)}
          aria-label={`第 ${index + 1} 题`}
          aria-current={index === current ? 'step' : undefined}
          className={cn(
            'grid size-8 place-items-center rounded-sm border text-[12px] tabular-nums transition-colors',
            entry.result === true && 'border-success bg-success/12 text-success',
            entry.result === false && 'border-destructive bg-destructive/12 text-destructive',
            entry.result === undefined &&
              (entry.answered
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted-foreground hover:border-primary/60'),
            index === current && 'ring-2 ring-ring/70 ring-offset-2 ring-offset-background',
          )}
        >
          {index + 1}
        </button>
      ))}
    </div>
  );
}
