/**
 * Gabay mark: a compass rose (gabay = "guide"). The north needle is solid, the rest recede,
 * so the mark literally points the way. Monochrome via currentColor, like the rest of the UI.
 * Keep in sync with app/icon.svg (the favicon).
 */
export function Logo({ size = 24 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="currentColor" aria-hidden className="shrink-0 text-[var(--fg)]">
      <g opacity="0.42">
        <path d="M30.5 16 20 20.2 17.6 16 20 11.8Z" />
        <path d="M16 30.5 11.8 20 16 17.6 20.2 20Z" />
        <path d="M1.5 16 12 11.8 14.4 16 12 20.2Z" />
      </g>
      <path d="M16 1.5 20.2 12 16 14.4 11.8 12Z" />
    </svg>
  );
}
