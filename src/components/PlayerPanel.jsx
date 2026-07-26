import { useState } from 'react'
import { avatarColor, getInitials } from '../lib/avatar'
import { ROUNDS_TO_WIN } from '../lib/gwentRules'
import PointsCalculator from './PointsCalculator'

const ROUND_SLOT_STYLES = {
  win: 'bg-green-950 border-green-800 text-green-400',
  loss: 'bg-red-950 border-red-900 text-red-400',
  tie: 'bg-stone-300 border-stone-400 text-stone-900',
  empty: 'border-stone-800 text-stone-700',
}

export default function PlayerPanel({
  name,
  faction,
  roundSlots,
  roundsWon,
  currentPoints,
  onPointsChange,
  disabled,
  showCalculator = false,
  align = 'left',
}) {
  const [calculatorOpen, setCalculatorOpen] = useState(false)
  const isRight = align === 'right'

  return (
    <div className="min-w-0 border border-stone-800 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
      <div className={`flex items-center gap-2 min-w-0 ${isRight ? 'flex-row-reverse' : ''}`}>
        <span
          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${avatarColor(name)}`}
        >
          {getInitials(name)}
        </span>
        <div className={`min-w-0 flex-1 ${isRight ? 'text-right' : ''}`}>
          <p className="truncate text-stone-100">{name}</p>
          <p className="truncate text-xs text-stone-500">{faction}</p>
        </div>
        <div className={`flex gap-1 shrink-0 ${isRight ? 'flex-row-reverse' : ''}`}>
          {Array.from({ length: ROUNDS_TO_WIN }, (_, i) => (
            <span
              key={i}
              className={`inline-block w-2.5 h-2.5 rotate-45 ${
                i < roundsWon ? 'bg-amber-400' : 'border border-stone-600'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-stone-800 pt-3">
        <p className={`text-[10px] uppercase tracking-widest text-stone-500 mb-2 ${isRight ? 'text-right' : ''}`}>
          Очки на столі
        </p>
        <div className={`flex items-center gap-2 ${isRight ? 'flex-row-reverse' : ''}`}>
          <button
            onClick={() => onPointsChange(Math.max(0, currentPoints - 1))}
            disabled={disabled}
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-md border border-stone-700 hover:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-stone-300 text-lg"
          >
            −
          </button>
          <input
            type="number"
            min={0}
            value={currentPoints}
            disabled={disabled}
            onChange={(e) => onPointsChange(Math.max(0, Number(e.target.value)))}
            className="w-0 flex-1 min-w-0 bg-transparent border border-stone-700 rounded-md px-1 py-2 text-center text-2xl sm:text-3xl font-semibold text-stone-100 disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button
            onClick={() => onPointsChange(currentPoints + 1)}
            disabled={disabled}
            className="w-9 h-9 sm:w-10 sm:h-10 shrink-0 rounded-md border border-stone-700 hover:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-stone-300 text-lg"
          >
            +
          </button>
        </div>

        {showCalculator && (
          <button
            onClick={() => setCalculatorOpen(true)}
            disabled={disabled}
            className="w-full mt-2 px-3 py-2 rounded-md bg-stone-800 border border-stone-700 hover:border-stone-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer text-stone-300 text-xs font-medium flex items-center justify-center gap-1.5"
          >
            <span className="inline-block w-1.5 h-1.5 rotate-45 border border-stone-500 shrink-0" />
            Калькулятор очок
          </button>
        )}

        <div className="grid grid-cols-3 gap-1.5 mt-3">
          {roundSlots.map((slot, i) => (
            <div
              key={i}
              className={`rounded border px-1 py-1.5 text-center ${
                slot ? ROUND_SLOT_STYLES[slot.result] : ROUND_SLOT_STYLES.empty
              }`}
            >
              <p className="text-[9px] uppercase leading-tight text-stone-500">Р{i + 1}</p>
              <p className="font-mono text-sm font-semibold leading-tight">{slot ? slot.points : '—'}</p>
            </div>
          ))}
        </div>
      </div>

      {calculatorOpen && (
        <PointsCalculator
          playerName={name}
          initialValue={currentPoints}
          onCancel={() => setCalculatorOpen(false)}
          onConfirm={(value) => {
            onPointsChange(value)
            setCalculatorOpen(false)
          }}
        />
      )}
    </div>
  )
}
