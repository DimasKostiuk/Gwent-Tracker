import { getFactionTheme } from '../lib/factionThemes'

// Same "hexagon badge" idea the user asked for, themed off whichever
// faction is actually on top — no hardcoded color, everything (hex
// gradient, quote, edge art, breakdown bullets) derives from
// getFactionTheme() same as PlayerPanel/the last-game card.
export default function FavoriteFactionCard({ breakdown, totalGames }) {
  const top = breakdown[0]
  const theme = top ? getFactionTheme(top.faction) : null
  const accent = theme?.color ?? '#78716c'
  const percent = top && totalGames > 0 ? Math.round((top.count / totalGames) * 100) : 0

  if (!top) {
    return (
      <div className="border border-stone-800 rounded-lg p-5 flex flex-col items-center justify-center text-center gap-2">
        <p className="text-xs uppercase tracking-widest text-stone-500">Улюблена фракція</p>
        <p className="text-stone-600 text-sm">Зіграй першу партію</p>
      </div>
    )
  }

  return (
    <div
      className="relative isolate overflow-hidden border rounded-lg p-5 pr-8 flex flex-col gap-5"
      style={{
        borderColor: `${accent}40`,
        backgroundImage: `radial-gradient(circle at 50% 8%, ${accent}30 0%, transparent 55%)`,
      }}
    >
      {theme?.art && (
        <img
          src={theme.art}
          alt=""
          aria-hidden="true"
          className="absolute inset-y-0 right-0 z-0 w-8 object-cover opacity-70 pointer-events-none select-none"
        />
      )}

      <p className="relative z-10 text-xs uppercase tracking-widest text-stone-500">
        Улюблена фракція
      </p>

      <div className="relative z-10 flex flex-col items-center gap-3 text-center">
        <div
          className="w-24 h-24 flex items-center justify-center shrink-0"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
            backgroundImage: `linear-gradient(160deg, ${accent} 0%, ${accent}55 60%, ${accent}22 100%)`,
          }}
        >
          <span className="text-4xl text-stone-50">{top.faction[0]}</span>
        </div>
        <div>
          <p className="text-2xl text-stone-100 font-semibold">{top.faction}</p>
          {theme?.quote && (
            <p className="text-sm italic mt-0.5" style={{ color: accent, opacity: 0.9 }}>
              {theme.quote}
            </p>
          )}
        </div>
        <p className="flex items-baseline gap-1.5">
          <span className="text-4xl font-mono font-bold" style={{ color: accent }}>
            {top.count}
          </span>
          <span className="text-base text-stone-500">
            з <span className="text-lg font-semibold text-amber-400">{totalGames}</span> · {percent}%
          </span>
        </p>
      </div>

      {breakdown.length > 1 && (
        <div className="relative z-10 flex flex-col gap-2 mt-auto">
          {breakdown.slice(0, 3).map((entry) => {
            const entryTheme = getFactionTheme(entry.faction)
            return (
              <div key={entry.faction} className="flex items-center gap-2 text-xs">
                <span
                  className="inline-block w-1.5 h-1.5 rotate-45 shrink-0"
                  style={{ backgroundColor: entryTheme?.color ?? '#78716c' }}
                />
                <span className="text-stone-400 uppercase tracking-wide">{entry.faction}</span>
                <span className="text-stone-600">—</span>
                <span className="text-stone-300 font-mono">{entry.count}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
