import { useState } from 'react'

const DIGITS = [7, 8, 9, 4, 5, 6, 1, 2, 3]

export default function PointsCalculator({ playerName, initialValue, onConfirm, onCancel }) {
  const [total, setTotal] = useState(initialValue || 0)
  const [entry, setEntry] = useState('')

  const isTyping = entry !== ''
  const previewValue = total + Number(entry || 0)

  function pressDigit(digit) {
    setEntry((prev) => (prev.length >= 4 ? prev : prev + digit))
  }

  function pressOp(op) {
    const value = Number(entry || 0)
    setTotal((prev) => Math.max(0, op === '+' ? prev + value : prev - value))
    setEntry('')
  }

  function pressClear() {
    if (isTyping) setEntry('')
    else setTotal(0)
  }

  function pressBackspace() {
    setEntry((prev) => prev.slice(0, -1))
  }

  function handleConfirm() {
    onConfirm(Math.max(0, previewValue))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xs bg-stone-950 border border-stone-700 rounded-lg p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-stone-100">Калькулятор очок</h2>
            {playerName && (
              <p className="text-[10px] uppercase tracking-widest text-stone-500">{playerName}</p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="text-stone-500 hover:text-stone-300 cursor-pointer text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="border border-stone-700 rounded-md px-3 py-2 text-right">
          <p className="text-[10px] uppercase tracking-widest text-stone-500">
            {isTyping ? 'Вводиш число' : 'Сума'}
          </p>
          <p className="text-3xl font-semibold text-stone-100">{isTyping ? entry : total}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {DIGITS.map((d) => (
            <button
              key={d}
              onClick={() => pressDigit(String(d))}
              className="py-3 rounded-md border border-stone-700 hover:border-stone-500 text-stone-200 font-mono text-lg cursor-pointer"
            >
              {d}
            </button>
          ))}
          <button
            onClick={pressClear}
            className="py-3 rounded-md border border-stone-700 hover:border-stone-500 text-stone-500 text-sm cursor-pointer"
          >
            C
          </button>
          <button
            onClick={() => pressDigit('0')}
            className="py-3 rounded-md border border-stone-700 hover:border-stone-500 text-stone-200 font-mono text-lg cursor-pointer"
          >
            0
          </button>
          <button
            onClick={pressBackspace}
            disabled={!isTyping}
            className="py-3 rounded-md border border-stone-700 hover:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed text-stone-500 text-sm cursor-pointer"
          >
            ⌫
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => pressOp('-')}
            className="py-2.5 rounded-md border border-red-900 hover:border-red-700 text-red-400 font-bold text-lg cursor-pointer"
          >
            −
          </button>
          <button
            onClick={() => pressOp('+')}
            className="py-2.5 rounded-md border border-green-900 hover:border-green-700 text-green-400 font-bold text-lg cursor-pointer"
          >
            +
          </button>
        </div>

        <button
          onClick={handleConfirm}
          className="py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold cursor-pointer"
        >
          Застосувати · {previewValue}
        </button>
      </div>
    </div>
  )
}
