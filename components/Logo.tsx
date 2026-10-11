"use client";
import { useId } from "react";

/** Gabay brand mark: a gradient badge with a guiding star (gabay = "guide"). */
export function Logo({ size = 24 }: { size?: number }) {
  const id = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8b6dff" />
          <stop offset="1" stopColor="#4f8cff" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <path
        d="M16 5 Q17.3 14.7 27 16 Q17.3 17.3 16 27 Q14.7 17.3 5 16 Q14.7 14.7 16 5 Z"
        fill="#fff"
      />
    </svg>
  );
}
