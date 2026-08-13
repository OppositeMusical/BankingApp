/**
 * A price line, small enough to sit beside a ticker.
 *
 * Inline SVG rather than a charting library: it is a polyline through n points
 * with no axes, no legend and no interaction, and every library that draws one
 * is 40kB to avoid twenty lines. Purely decorative — the figure beside it
 * carries the actual number, so this is aria-hidden.
 *
 * Colour comes from the direction of the series, not from a prop, so a green
 * line can never sit next to a negative percentage.
 */
export function Sparkline({
  points,
  width = 72,
  height = 24,
  className,
}: {
  points: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  if (points.length < 2) {
    return <span aria-hidden className="inline-block" style={{ width, height }} />;
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  // A flat series has zero range; without this it divides by zero and the line
  // vanishes. Draw it down the middle instead.
  const span = max - min || 1;

  const stepX = width / (points.length - 1);
  const path = points
    .map((value, index) => {
      const x = index * stepX;
      // SVG y grows downward, so a high price is a low y.
      const y = height - ((value - min) / span) * height;
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const rising = points[points.length - 1] >= points[0];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      className={className}
      aria-hidden
      // Leave room for the stroke so the line is not clipped at the extremes.
      style={{ overflow: "visible" }}
    >
      <path
        d={path}
        fill="none"
        stroke={rising ? "var(--positive)" : "var(--negative)"}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
