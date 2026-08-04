"use client";

interface PriceSparklineProps {
  data: { date: string; price: number }[];
}

export function PriceSparkline({ data }: PriceSparklineProps) {
  if (data.length < 2) {
    return null;
  }

  const prices = data.map((point) => point.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 0.01;
  const width = 280;
  const height = 64;
  const padding = 4;

  const points = data
    .map((point, index) => {
      const x = padding + (index / (data.length - 1)) * (width - padding * 2);
      const y = height - padding - ((point.price - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-4 w-full" aria-hidden>
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(45,212,191,0.35)" />
          <stop offset="100%" stopColor="rgba(45,212,191,0)" />
        </linearGradient>
      </defs>
      <polygon
        fill="url(#sparkFill)"
        points={`${padding},${height - padding} ${points} ${width - padding},${height - padding}`}
      />
      <polyline
        fill="none"
        stroke="rgb(94,234,212)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}
