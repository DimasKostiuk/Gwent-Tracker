const SEGMENT_COLORS = {
  win: 'text-green-500',
  loss: 'text-red-500',
  draw: 'text-sky-400',
}

export default function WinLossDonut({ wins, losses, draws, size = 96, stroke = 12 }) {
  const total = wins + losses + draws
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius

  const segments = [
    { key: 'win', value: wins },
    { key: 'loss', value: losses },
    { key: 'draw', value: draws },
  ].filter((s) => s.value > 0)

  let cumulative = 0

  return (
    <svg width={size} height={size} className="-rotate-90 shrink-0">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        stroke="currentColor"
        className="text-stone-800"
      />
      {total > 0 &&
        segments.map((seg) => {
          const fraction = seg.value / total
          const dash = fraction * circumference
          const offset = -cumulative * circumference
          cumulative += fraction
          return (
            <circle
              key={seg.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              strokeWidth={stroke}
              fill="none"
              stroke="currentColor"
              className={SEGMENT_COLORS[seg.key]}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
            />
          )
        })}
    </svg>
  )
}
