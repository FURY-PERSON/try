import { cn } from '@/lib/utils';

const STYLES = {
  true:  { base: 'border-primary/40 text-primary/70 hover:border-primary', active: 'border-primary bg-primary/15 text-primary-dark' },
  false: { base: 'border-red/40 text-red/70 hover:border-red',             active: 'border-red bg-red/15 text-red' },
};

type FactFakePickerProps = {
  value: 'true' | 'false';
  onChange: (value: 'true' | 'false') => void;
};

export function FactFakePicker({ value, onChange }: FactFakePickerProps) {
  return (
    <div className="flex gap-2">
      {(['true', 'false'] as const).map((v) => {
        const { base, active } = STYLES[v];
        const isActive = value === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => onChange(v)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium border transition-all',
              isActive ? active : cn(base, 'opacity-50'),
            )}
          >
            {v === 'true' ? 'Факт (правда)' : 'Фейк (ложь)'}
          </button>
        );
      })}
    </div>
  );
}
