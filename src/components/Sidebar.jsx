import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useGameInvite } from '../lib/GameInviteContext'
import { getMyGames, getProfiles } from '../lib/api'
import { computeCurrentStreak } from '../lib/stats'
import { getInitials } from '../lib/avatar'
import { showEasterEgg } from '../lib/easterEgg'
import { randomSignOutQuote } from '../lib/signOutQuotes'
import ConfirmDialog from './ConfirmDialog'
import logo from '../assets/gwent-tracker-logo.png'

const links = [
  { to: '/dashboard', label: 'Дашборд', shortLabel: 'Дашборд' },
  { to: '/game', label: 'Поточна гра', shortLabel: 'Гра' },
  { to: '/history', label: 'Історія', shortLabel: 'Історія' },
  { to: '/players', label: 'Гравці', shortLabel: 'Гравці' },
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

const LOGO_EASTER_EGGS = [
  'Тихіше, Плотва спить 🐴',
  'Ще раз — і я покличу Весеміра',
  'Гвінт — це не просто гра, це стиль життя',
  'На Лебеді клянусь!',
  'Обережно, тут ходить Дикий Гін',
  'Цірі, це ти клікаєш?',
  'Йеннефер не схвалює цей клік',
  'Трісс би це сподобалось',
  'Хтось замовляв кубло грифонів?',
  'Данделіон уже пише про це пісню',
  'Ласка теж любить клікати не по ділу',
  'Ще трохи — і покличемо Регіса',
  'Це вже занадто, навіть для відьмака',
  'Курва, ще раз — і я тебе прокляну',
  'Трясця, знову ти сюди лізеш',
  'Холера ясна, це вже перебір',
  'Зараза, дай лого спокій',
  'Ану відчепись, бляха',
  'Чорт забирай, ти вперта людина',
  'Досить, я вже втомився від тебе',
  'Ще один клік — і я звільняюсь',
  'Ти як Лютик — набридливий, але кумедний',
  'Трясця твоїй матері, заспокойся',
  'Холера, дай лого перепочити',
  'Курва його мать, ну що тобі треба',
  'Зимно як в Каер Морхені, а ти все клікаєш',
  'Ще трохи — і викличу Ложу Чарівниць',
  'Гірше за ніч в Ередінському лісі',
  'Йой, курва, обережніше з мишкою',
  'Досить, бляха муха, я не render-машина',
  'Трясця, у мене вже дежавю',
  'Ще один клік і я стаю Дикою Гонею',
]

const LOGO_SPAM_EASTER_EGGS = [
  'Курва, спокійно...',
  'Трясця, вгамуйся вже',
  'Досить, я не бездонний колодязь фраз',
  'Холера, дай лого відпочити',
  'Курва, невже нема інших справ?',
]

const RATE_LIMIT_WINDOW_MS = 10000
const RATE_LIMIT_CLICKS = 5

export default function Sidebar() {
  const { user, signOut } = useAuth()
  const { activeInvite } = useGameInvite()
  const location = useLocation()
  const [streak, setStreak] = useState(0)
  const [gamesCount, setGamesCount] = useState(0)
  const [playersCount, setPlayersCount] = useState(0)
  const [now, setNow] = useState(() => Date.now())
  const [confirmingSignOut, setConfirmingSignOut] = useState(false)
  const [signOutQuote, setSignOutQuote] = useState('')
  const logoClickTimestamps = useRef([])

  function handleLogoClick(e) {
    const now = Date.now()
    const recentClicks = [...logoClickTimestamps.current, now].filter(
      (t) => now - t <= RATE_LIMIT_WINDOW_MS,
    )
    logoClickTimestamps.current = recentClicks

    if (recentClicks.length > RATE_LIMIT_CLICKS) {
      const spamText = LOGO_SPAM_EASTER_EGGS[Math.floor(Math.random() * LOGO_SPAM_EASTER_EGGS.length)]
      showEasterEgg(spamText, e)
      return
    }

    const randomText = LOGO_EASTER_EGGS[Math.floor(Math.random() * LOGO_EASTER_EGGS.length)]
    showEasterEgg(randomText, e)
  }

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
      <nav
        className="hidden md:flex md:sticky md:top-0 md:h-screen md:overflow-y-auto md:flex-col md:w-52 md:shrink-0 border-r border-stone-800 bg-stone-950 p-3 gap-1"
        style={{
          // Static, subtle golden wash in the corner — no animation, no
          // hard edge (a fading radial-gradient, same trick as the ray
          // glow below, just always-on and much fainter).
          backgroundImage: 'radial-gradient(circle at 0% 0%, rgba(251,191,36,0.1) 0%, transparent 55%)',
        }}
      >
        <img
          src={logo}
          alt="Gwent Tracker"
          onClick={handleLogoClick}
          className="h-24 w-auto object-contain self-start mb-2 cursor-pointer"
        />

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

        <div
          aria-hidden="true"
          className="sidebar-glow absolute left-1/2 -translate-x-1/2 bottom-12 w-64 h-64 opacity-0 pointer-events-none"
          style={{
            // No clip-path — CSS applies `filter` BEFORE `clip-path`, so a
            // polygon on a blurred element still cuts a hard, unblurred
            // edge on top of the soft result (that's the sharp star outline
            // from before). Rays here are just several off-center, unevenly
            // sized ellipse gradients layered over one central glow — each
            // one already fades to transparent on its own, so there's no
            // boundary anywhere left for the blur to reveal.
            background: [
              'radial-gradient(ellipse 55% 32% at 50% 22%, rgba(251,191,36,0.5) 0%, transparent 70%)',
              'radial-gradient(ellipse 26% 48% at 70% 60%, rgba(251,191,36,0.4) 0%, transparent 70%)',
              'radial-gradient(ellipse 40% 20% at 26% 66%, rgba(251,191,36,0.35) 0%, transparent 70%)',
              'radial-gradient(ellipse 18% 40% at 22% 28%, rgba(251,191,36,0.3) 0%, transparent 70%)',
              'radial-gradient(circle at 50% 50%, rgba(251,191,36,0.55) 0%, transparent 60%)',
            ].join(', '),
            filter: 'blur(50px)',
          }}
        />

        <div className="mt-auto pt-4 border-t border-stone-800 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-amber-900 text-amber-200 flex items-center justify-center text-xs font-bold shrink-0">
            {getInitials(name)}
          </span>
          <span className="text-sm text-stone-300 truncate min-w-0 flex-1">{name}</span>
          <button
            onClick={() => {
              setSignOutQuote(randomSignOutQuote())
              setConfirmingSignOut(true)
            }}
            className="ml-auto shrink-0 text-sm text-stone-400 hover:text-stone-100 cursor-pointer"
          >
            Вийти
          </button>
        </div>
      </nav>

      <nav className="md:hidden fixed bottom-0 pb-[calc(0.75rem_+_env(safe-area-inset-bottom))] left-0 right-0 z-10 border-t border-amber-900/40 bg-stone-950 flex gap-1.5 px-1.5 pt-1.5">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard'}
            className={({ isActive }) =>
              `relative flex-1 flex flex-col items-center gap-1.5 py-2.5 border rounded-md overflow-hidden transition-colors ${
                isActive
                  ? 'border-amber-500 bg-amber-950/20 shadow-[0_0_14px_rgba(251,191,36,0.35)]'
                  : 'border-stone-800/70'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`inline-block w-2 h-2 rotate-45 shrink-0 ${
                    isActive
                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.85)]'
                      : 'border border-stone-600'
                  }`}
                />
                <span
                  className={`text-[10px] uppercase tracking-widest font-medium ${
                    isActive ? 'text-amber-300' : 'text-stone-500'
                  }`}
                >
                  {link.shortLabel}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <ConfirmDialog
        open={confirmingSignOut}
        title="Вийти з акаунта?"
        message={signOutQuote}
        confirmLabel="Вийти"
        onConfirm={signOut}
        onCancel={() => setConfirmingSignOut(false)}
      />
    </>
  )
}
