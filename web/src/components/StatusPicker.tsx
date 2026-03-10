import { cn } from '@/lib/utils';
import { QUESTION_STATUS_LABELS } from '@/shared';

type Status = 'draft' | 'moderation' | 'approved' | 'rejected';

const STATUS_STYLES: Record<Status, { base: string; active: string }> = {
  draft:      { base: 'border-border text-text-secondary hover:border-text-secondary',         active: 'border-text-secondary bg-surface-secondary text-text-primary' },
  moderation: { base: 'border-orange/40 text-orange/70 hover:border-orange',                   active: 'border-orange bg-orange/15 text-orange' },
  approved:   { base: 'border-primary/40 text-primary/70 hover:border-primary',                active: 'border-primary bg-primary/15 text-primary-dark' },
  rejected:   { base: 'border-red/40 text-red/70 hover:border-red',                            active: 'border-red bg-red/15 text-red' },
};

const STATUSES: Status[] = ['draft', 'moderation', 'approved', 'rejected'];

type StatusPickerProps = {
  value: Status;
  onChange: (value: Status) => void;
};

export function StatusPicker({ value, onChange }: StatusPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {STATUSES.map((s) => {
        const { base, active } = STATUS_STYLES[s];
        const isActive = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all',
              isActive ? active : cn(base, 'opacity-50'),
            )}
          >
            {QUESTION_STATUS_LABELS[s]}
          </button>
        );
      })}
    </div>
  );
}
