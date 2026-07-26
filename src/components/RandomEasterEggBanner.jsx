import { useEffect, useState } from 'react'
import { RANDOM_EASTER_EGGS } from '../lib/randomEasterEggs'

const MIN_DELAY_MS = 10 * 60 * 1000
const MAX_DELAY_MS = 40 * 60 * 1000
const VISIBLE_MS = 6000

function randomDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS)
}

// Mounted once, globally, in App.jsx — fires on its own timer regardless of
// which page you're on (including /login, /rules, etc).
export default function RandomEasterEggBanner() {
  const [text, setText] = useState(null)

  useEffect(() => {
    let showTimer
    let hideTimer

    function scheduleNext() {
      showTimer = setTimeout(() => {
        if (RANDOM_EASTER_EGGS.length > 0) {
          const phrase = RANDOM_EASTER_EGGS[Math.floor(Math.random() * RANDOM_EASTER_EGGS.length)]
          setText(phrase)
          hideTimer = setTimeout(() => setText(null), VISIBLE_MS)
        }
        scheduleNext()
      }, randomDelay())
    }

    scheduleNext()

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  if (!text) return null

  return (
    <div className="fixed top-4 right-4 z-[100] pointer-events-none">
      <div className="inline-block whitespace-nowrap bg-stone-900 border border-amber-500/50 text-amber-100 text-sm px-3 py-0.5 rounded-md shadow-lg">
        {text}
      </div>
    </div>
  )
}
