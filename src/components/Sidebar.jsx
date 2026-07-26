import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useGameInvite } from '../lib/GameInviteContext'
import { getMyGames, getProfiles } from '../lib/api'
import { computeCurrentStreak } from '../lib/stats'
import { getInitials } from '../lib/avatar'
import logo from '../assets/gwent-tracker-logo.png'

const links = [
  { to: '/dashboard', label: 'Дашборд' },
  { to: '/game', label: 'Поточна гра' },
  { to: '/history', label: 'Історія' },
  { to: '/players', label: 'Гравці' },
]

function Diamond({ active }) {
  return (
    <span
      className={`inline-block w-2 h-2 rotate-45 shrink-0 ${
        active ? 'bg-amber-400' : 'border border-stone-600'
      }`}
    />
  )
}

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const { activeInvite } = useGameInvite()
  const location = useLocation()
  const [streak, setStreak] = useState(0)
  const [gamesCount, setGamesCount] = useState(0)
  const [playersCount, setPlayersCount] = useState(0)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    getMyGames(user.id)
      .then((games) => {
        setStreak(computeCurrentStreak(games, user.id))
        setGamesCount(games.length)
      })
      .catch(() => {})
    getProfiles()
      .then((profiles) => setPlayersCount(profiles.filter((p) => p.id !== user.id).length))
      .catch(() => {})
  }, [user.id])

  const isPlaying = activeInvite?.status === 'playing'

  useEffect(() => {
    if (!isPlaying) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isPlaying])

  const name = user.user_metadata?.display_name || user.email

  const elapsedSeconds = isPlaying
    ? Math.max(0, Math.floor((now - new Date(activeInvite.game_started_at).getTime()) / 1000))
    : 0
  const durationLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(
    elapsedSeconds % 60,
  ).padStart(2, '0')}`

  let statBox
  if (isPlaying) {
    statBox = (
      <>
        <p className="text-[11px] uppercase tracking-widest text-stone-500">Тривалість</p>
        <p className="mt-1 text-3xl font-mono font-semibold text-amber-400">{durationLabel}</p>
      </>
    )
  } else if (location.pathname.startsWith('/history')) {
    statBox = (
      <>
        <p className="text-[11px] uppercase tracking-widest text-stone-500">Усього партій</p>
        <p className="mt-1 text-3xl font-semibold text-amber-400">{gamesCount}</p>
      </>
    )
  } else if (location.pathname.startsWith('/players')) {
    statBox = (
      <>
        <p className="text-[11px] uppercase tracking-widest text-stone-500">Суперників</p>
        <p className="mt-1 text-3xl font-semibold text-amber-400">{playersCount}</p>
      </>
    )
  } else {
    statBox = (
      <>
        <p className="text-[11px] uppercase tracking-widest text-stone-500">Серія</p>
        <p className="mt-1">
          <span className="text-3xl font-semibold text-amber-400">{streak}</span>{' '}
          <span className="text-sm text-stone-400">перемоги поспіль</span>
        </p>
      </>
    )
  }

  return (
    <>
      <nav className="hidden md:flex md:flex-col md:w-52 md:shrink-0 border-r border-stone-800 bg-stone-950 p-3 gap-1">
        <img src={logo} alt="Gwent Tracker" className="h-24 w-auto object-contain self-start mb-2" />

        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-base font-medium transition-colors border-l-2 ${
                isActive
                  ? 'bg-amber-950/30 border-amber-400 text-amber-50 font-semibold'
                  : 'border-transparent text-stone-400 hover:bg-stone-900 hover:text-stone-100'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Diamond active={isActive} />
                {link.label}
              </>
            )}
          </NavLink>
        ))}

        <div className="mt-6 border border-stone-800 rounded-md p-3">{statBox}</div>

        <div className="mt-auto pt-4 border-t border-stone-800 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-amber-900 text-amber-200 flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(name)}
          </span>
          <span className="text-sm text-stone-300 truncate min-w-0 flex-1">{name}</span>
          <button
            onClick={signOut}
            className="ml-auto shrink-0 text-sm text-stone-400 hover:text-stone-100 cursor-pointer"
          >
            Вийти
          </button>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 pb-3 left-0 right-0 z-10 border-t border-stone-800 bg-stone-950 flex">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-1 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-amber-400' : 'text-stone-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Diamond active={isActive} />
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
