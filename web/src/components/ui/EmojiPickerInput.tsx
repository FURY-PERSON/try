import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

const EMOJI_CATEGORIES = [
  {
    label: 'Животные',
    emojis: ['🐶','🐱','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🐔','🐧','🦅','🦆','🦉','🐺','🐗','🐴','🦄','🐝','🦋','🐞','🐢','🐍','🦎','🐙','🦑','🐬','🐳','🦈','🦔','🦩','🐰','🐉'],
  },
  {
    label: 'Природа',
    emojis: ['🌿','🌸','🌺','🌻','🌹','🌷','🍀','🍁','🍂','🌴','🌵','🌾','🌱','🌲','🌳','🍄','🌍','🌎','🌏'],
  },
  {
    label: 'Еда',
    emojis: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍑','🍒','🍍','🥝','🍔','🍕','🌭','🌮','🍣','🍜','🍴','🥤'],
  },
  {
    label: 'Наука',
    emojis: ['🧪','🧬','🔬','🔭','🧲','🧫','💊','💉','🩺','⚛️','🧠'],
  },
  {
    label: 'Спорт',
    emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏆','🥇','🏅','🎯'],
  },
  {
    label: 'Искусство',
    emojis: ['🎨','🎭','🎪','🎬','🎤','🎵','🎶','🎹','🎸','🎺'],
  },
  {
    label: 'Путешествия',
    emojis: ['🗺️','🏔️','🌋','🗻','🏝️','✈️','🚀','🏛️','🗽','🎡'],
  },
  {
    label: 'Объекты',
    emojis: ['📖','📜','📚','✏️','🔑','💡','⏰','📷','💻','🖥️','📱','💎','👑','🛡️','⚔️','🧭'],
  },
  {
    label: 'Символы',
    emojis: ['❤️','💛','💚','💙','💜','🖤','⭐','🌟','✨','💫','🔥','❄️','☀️','🌙','⚡'],
  },
];

type EmojiPickerInputProps = {
  value: string;
  onChange: (emoji: string) => void;
  label?: string;
  error?: string;
  placeholder?: string;
};

export function EmojiPickerInput({ value, onChange, label, error, placeholder = '🔬' }: EmojiPickerInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (emoji: string) => {
    onChange(emoji);
    setOpen(false);
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}
      <div className="relative">
        <div
          onClick={() => setOpen(!open)}
          className={cn(
            'flex h-10 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary cursor-pointer items-center gap-2',
            'hover:border-primary/40 transition-colors',
            error && 'border-red',
            open && 'ring-2 ring-primary/40 border-primary',
          )}
        >
          {value ? (
            <span className="text-xl">{value}</span>
          ) : (
            <span className="text-text-tertiary">{placeholder}</span>
          )}
        </div>

        {open && (
          <div className="absolute z-50 top-full left-0 mt-1 w-72 max-h-64 overflow-auto bg-surface border border-border rounded-lg shadow-xl p-2">
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.label} className="mb-2">
                <p className="text-[10px] font-medium text-text-secondary uppercase tracking-wider px-1 mb-1">
                  {cat.label}
                </p>
                <div className="flex flex-wrap gap-0.5">
                  {cat.emojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleSelect(emoji)}
                      className={cn(
                        'w-8 h-8 flex items-center justify-center rounded hover:bg-surface-secondary transition-colors text-lg',
                        value === emoji && 'bg-primary/10 ring-1 ring-primary',
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red mt-1">{error}</p>}
    </div>
  );
}
