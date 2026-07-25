import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../lib/AuthContext'
import { GameInviteProvider } from '../lib/GameInviteContext'
import InvitePopup from './InvitePopup'

export default function AppLayout() {
  const { user, signOut } = useAuth()

  return (
    <GameInviteProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="border-b border-zinc-800 bg-zinc-950 px-4 py-3 flex items-center justify-between">
            <span className="text-lg font-semibold text-zinc-100 md:hidden">Gwent Tracker</span>
            <span className="hidden md:block" />
            <div className="flex items-center gap-3">
              <span className="text-sm text-zinc-400">
                {user?.user_metadata?.display_name || user?.email}
              </span>
              <button
                onClick={signOut}
                className="px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-100"
              >
                Вийти
              </button>
            </div>
          </header>
          <main className="flex-1 px-4 md:px-10 py-4 md:py-2 pb-20 md:pb-6">
            <Outlet />
          </main>
        </div>
      </div>
      <InvitePopup />
    </GameInviteProvider>
  )
}
