import { useRegisterSW } from 'virtual:pwa-register/react'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

// Mounted once, globally, in App.jsx. Deliberately manual: a new version
// never swaps the app shell out from under an in-progress live game, the
// player picks the moment by pressing "Оновити".
export default function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      setInterval(() => registration.update(), UPDATE_CHECK_INTERVAL_MS)
    },
  })

  if (!needRefresh) return null

  return (
    <div className="fixed top-[calc(1rem_+_env(safe-area-inset-top))] inset-x-0 z-[100] flex justify-center px-4">
      <div className="flex items-center gap-3 bg-stone-900 border border-amber-500/50 text-amber-100 text-sm px-3 py-1.5 rounded-md shadow-lg">
        Доступне оновлення
        <button
          onClick={() => updateServiceWorker(true)}
          className="px-2 py-1 rounded-md bg-stone-800 hover:bg-stone-700 text-stone-100 cursor-pointer"
        >
          Оновити
        </button>
      </div>
    </div>
  )
}
