import { cn } from '@/lib/utils';
import { DIFFICULTY_LABELS } from '@/shared';

const DIFFICULTY_STYLES: Record<number, { base: string; active: string }> = {
  1: { base: 'border-primary/40 text-primary/70 hover:border-primary',   active: 'border-primary bg-primary/15 text-primary-dark' },
  2: { base: 'border-blue/40 text-blue/70 hover:border-blue',            active: 'border-blue bg-blue/15 text-blue' },
  3: { base: 'border-orange/40 text-orange/70 hover:border-orange',      active: 'border-orange bg-orange/15 text-orange' },
  4: { base: 'border-red/40 text-red/70 hover:border-red',               active: 'border-red bg-red/15 text-red' },
  5: { base: 'border-red/60 text-red/80 hover:border-red',               active: 'border-red bg-red/25 text-red' },
};

type DifficultyPickerProps = {
  value: number;
  onChange: (value: number) => void;
};

export function DifficultyPicker({ value, onChange }: DifficultyPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {([1, 2, 3, 4, 5] as const).map((d) => {
        const { base, active } = DIFFICULTY_STYLES[d];
        const isActive = value === d;
        return (
          <button
            key={d}
            type="button"
            onClick={() => onChange(d)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all',
              isActive ? active : cn(base, 'opacity-50'),
            )}
          >
            {d} — {DIFFICULTY_LABELS[d]}
          </button>
        );
      })}
    </div>
  );
}
