import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import { useAuth } from '../lib/AuthContext'
import { GameInviteProvider } from '../lib/GameInviteContext'
import InvitePopup from './InvitePopup'
import logo from '../assets/gwent-tracker-logo.png'

export default function AppLayout() {
  const { signOut } = useAuth()

  return (
    <GameInviteProvider>
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="md:hidden border-b border-stone-800 bg-stone-950 px-4 py-2 flex items-center justify-between">
            <img src={logo} alt="Gwent Tracker" className="h-14 w-auto object-contain" />
            <button
              onClick={signOut}
              className="px-3 py-1.5 rounded-md bg-stone-900 hover:bg-stone-800 text-sm text-stone-200 cursor-pointer"
            >
              Вийти
            </button>
          </header>
          <main className="flex-1 min-w-0 px-4 md:px-6 py-4 md:py-8 pb-20 md:pb-8">
            <Outlet />
          </main>
        </div>
      </div>
      <InvitePopup />
    </GameInviteProvider>
  )
}
