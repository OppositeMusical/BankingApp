"use client";

import { useId, useState } from "react";
import type { Quote } from "@/lib/market/quotes";

/**
 * A price history chart.
 *
 * Hand-rolled SVG, same as trend-chart.tsx — this is one series with no
 * legend, and a charting library would be more code than the chart.
 *
 * The baseline is the period's opening price, not zero: a stock chart answers
 * "up or down since then", and a zero baseline squashes every real move into
 * the top inch. The fill is tinted by direction so the answer is legible before
 * any number is read.
 */
export function PriceChart({
  quote,
  height = 180,
}: {
  quote: Quote;
  height?: number;
}) {
  const gradientId = useId();
  const [hover, setHover] = useState<number | null>(null);

  const points = quote.points;
  if (points.length < 2) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">
        No price history available for {quote.symbol}.
      </p>
    );
  }

  const width = 600;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const span = max - min || 1;
  // Breathing room so the extremes are not welded to the frame.
  const pad = span * 0.08;
  const low = min - pad;
  const high = max + pad;

  const x = (index: number) => (index / (points.length - 1)) * width;
  const y = (value: number) => height - ((value - low) / (high - low)) * height;

  const line = points
    .map((value, index) => `${index === 0 ? "M" : "L"}${x(index).toFixed(1)},${y(value).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${width},${height} L0,${height} Z`;

  const rising = quote.change >= 0;
  const stroke = rising ? "var(--positive)" : "var(--negative)";
  const active = hover ?? points.length - 1;

  return (
    <figure className="m-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`${quote.symbol} price, ${points.length} points, ${
          rising ? "up" : "down"
        } ${Math.abs(quote.changePercent).toFixed(2)} percent over the period`}
        onMouseLeave={() => setHover(null)}
        onMouseMove={(event) => {
          const box = event.currentTarget.getBoundingClientRect();
          const ratio = (event.clientX - box.left) / box.width;
          const index = Math.round(ratio * (points.length - 1));
          setHover(Math.min(points.length - 1, Math.max(0, index)));
        }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Opening price: the line every point is judged against. */}
        <line
          x1="0"
          x2={width}
          y1={y(points[0])}
          y2={y(points[0])}
          stroke="var(--chart-grid)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke={stroke}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {hover !== null && (
          <>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1="0"
              y2={height}
              stroke="var(--border-strong)"
              strokeWidth="1"
            />
            <circle
              cx={x(hover)}
              cy={y(points[hover])}
              r="3.5"
              fill={stroke}
              stroke="var(--surface)"
              strokeWidth="2"
            />
          </>
        )}
      </svg>

      <figcaption className="mt-2 flex items-baseline justify-between gap-3 text-sm">
        <span className="tabular text-ink">
          {points[active].toLocaleString("en-US", {
            style: "currency",
            currency: quote.currency,
          })}
        </span>
        <span className="text-xs text-ink-subtle">
          {hover === null
            ? `${points.length} points · high ${max.toFixed(2)} · low ${min.toFixed(2)}`
            : new Date(quote.times[active] * 1000).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
        </span>
      </figcaption>
    </figure>
  );
}
