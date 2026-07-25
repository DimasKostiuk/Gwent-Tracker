import { avatarColor, getInitials } from '../lib/avatar'

const ROUND_SLOT_STYLES = {
  win: 'bg-green-900 border-green-700 text-green-400',
  loss: 'bg-red-950 border-red-800 text-red-400',
  empty: 'bg-zinc-900 border-zinc-800 text-zinc-600',
}

export default function PlayerPanel({
  name,
  faction,
  roundSlots,
  roundsWon,
  currentPoints,
  onPointsChange,
  disabled,
}) {
  return (
    <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${avatarColor(name)}`}
        >
          {getInitials(name)}
        </span>
        <div>
          <p className="font-semibold text-zinc-100">{name}</p>
          <span className="text-xs px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">{faction}</span>
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">
          Раунди <span className="text-zinc-600">(виграно: {roundsWon})</span>
        </p>
        <div className="grid grid-cols-3 gap-2">
          {roundSlots.map((slot, i) => (
            <div
              key={i}
              className={`rounded-md border px-2 py-2 text-center ${
                slot ? ROUND_SLOT_STYLES[slot.result] : ROUND_SLOT_STYLES.empty
              }`}
            >
              <p className="text-[10px] uppercase">Р{i + 1}</p>
              <p className="font-mono font-semibold">{slot ? slot.points : '—'}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Поточний раунд</p>
        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Очки
          <input
            type="number"
            min={0}
            value={currentPoints}
            disabled={disabled}
            onChange={(e) => onPointsChange(Math.max(0, Number(e.target.value)))}
            className="bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 text-lg font-mono disabled:opacity-50"
          />
        </label>
      </div>
    </div>
  )
}
