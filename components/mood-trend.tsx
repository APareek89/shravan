export function MoodTrend({
  points,
}: {
  points: { date: string; score: number | null }[];
}) {
  const valid = points
    .map((point, index) => ({ ...point, index }))
    .filter((point): point is typeof point & { score: number } => point.score !== null);

  if (!valid.length) {
    return (
      <div className="flex h-24 items-center justify-center rounded-2xl bg-[#f2f3ed] text-sm text-muted">
        Mood appears after the first check-in
      </div>
    );
  }

  const width = 360;
  const height = 92;
  const pad = 9;
  const x = (index: number) =>
    pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
  const y = (score: number) =>
    pad + ((5 - score) / 4) * (height - pad * 2);
  const path = valid
    .map((point, index) => `${index === 0 ? "M" : "L"} ${x(point.index)} ${y(point.score)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-24 w-full overflow-visible"
      role="img"
      aria-label="Fourteen day mood trend"
    >
      {[1, 3, 5].map((score) => (
        <line
          key={score}
          x1={pad}
          x2={width - pad}
          y1={y(score)}
          y2={y(score)}
          stroke="#dfe5db"
          strokeDasharray="4 6"
        />
      ))}
      <path
        d={path}
        fill="none"
        stroke="#1f5948"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {valid.map((point) => (
        <circle
          key={point.date}
          cx={x(point.index)}
          cy={y(point.score)}
          r="4"
          fill="#edb74d"
          stroke="#1f5948"
          strokeWidth="2"
        />
      ))}
    </svg>
  );
}

