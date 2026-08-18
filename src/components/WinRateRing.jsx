export default function WinRateRing({ percent, total, color = '#fbbf24', size = 160, stroke = 10 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - percent / 100)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          className="text-stone-800"
          stroke="currentColor"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          stroke={color}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
        <span className="text-5xl font-bold text-stone-50">
          {percent}
          <span className="text-xl" style={{ color }}>%</span>
        </span>
        {total != null && (
          <>
            <span className="w-8 h-px" style={{ backgroundColor: color, opacity: 0.5 }} />
            <span className="text-xs uppercase tracking-widest" style={{ color, opacity: 0.85 }}>
              {total} партій
            </span>
          </>
        )}
      </div>
    </div>
  )
}
