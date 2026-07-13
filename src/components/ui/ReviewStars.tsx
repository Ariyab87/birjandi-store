'use client';

interface Props {
  rating: number;
  size?: number;
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

export default function ReviewStars({ rating, size = 16, interactive = false, onChange }: Props) {
  const rounded = Math.round(rating);
  return (
    <div className="inline-flex items-center gap-0.5" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(n)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          style={{ fontSize: size, lineHeight: 1, color: n <= rounded ? '#d4a017' : '#e2e2e2' }}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
