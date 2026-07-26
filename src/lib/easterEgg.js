// Fire-and-forget "toast" for easter eggs. Call this from anywhere —
// any onClick, any component, doesn't need React context or props drilling.
// Pass the click event as the 2nd arg so it appears right at the cursor:
//
//   import { showEasterEgg } from '../lib/easterEgg'
//   <div onClick={(e) => showEasterEgg('Ти знайшов пасхалку!', e)}>...</div>
//
// Calling it again while one is already showing just swaps the text/position
// and restarts the timer — no need to track "was it already open".
export function showEasterEgg(text, event, duration = 3000) {
  const x = event?.clientX ?? window.innerWidth / 2
  const y = event?.clientY ?? window.innerHeight / 2
  window.dispatchEvent(new CustomEvent('easter-egg', { detail: { text, x, y, duration } }))
}
