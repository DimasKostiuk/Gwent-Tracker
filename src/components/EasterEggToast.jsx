import { useEffect, useRef, useState } from 'react'

// Mounted once, globally, in App.jsx. Listens for the 'easter-egg' window
// event dispatched by showEasterEgg() — nothing to wire up per-page.
export default function EasterEggToast() {
  const [state, setState] = useState(null)
  const timeoutRef = useRef(null)

  useEffect(() => {
    function handleEvent(e) {
      setState({ text: e.detail.text, x: e.detail.x, y: e.detail.y })
      clearTimeout(timeoutRef.current)
      timeoutRef.current = setTimeout(() => setState(null), e.detail.duration ?? 3000)
    }
    window.addEventListener('easter-egg', handleEvent)
    return () => {
      window.removeEventListener('easter-egg', handleEvent)
      clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!state) return null

  return (
    <div
      className="fixed z-[100] pointer-events-none -translate-x-1/2 -translate-y-full"
      style={{ left: state.x, top: state.y - 12 }}
    >
      <div className="inline-block whitespace-nowrap bg-stone-900 border border-amber-500/50 text-amber-100 text-sm px-3 py-0.5 rounded-md shadow-lg">
        {Array.isArray(state.text) ? state.text.join(' ') : state.text}
      </div>
    </div>
  )
}
