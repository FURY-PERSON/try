const PAGE_SIZE_OPTIONS = [20, 50, 100, 200, 500];

type PageSizeSelectProps = {
  value: number;
  onChange: (size: number) => void;
};

export function PageSizeSelect({ value, onChange }: PageSizeSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary">Показывать:</span>
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 rounded-lg border border-border bg-surface px-2 text-sm text-text-primary"
      >
        {PAGE_SIZE_OPTIONS.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </div>
  );
}
