import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getGameRounds, getMyGames } from '../lib/api'
import { translateError } from '../lib/errors'
import { formatDate, formatDuration } from '../lib/format'
import {
  computeFactionBreakdown,
  computeForm,
  computeLongestStreak,
  computeOpponentStats,
  getGameStatus,
} from '../lib/stats'
import { getFactionTheme } from '../lib/factionThemes'
import { getInitials } from '../lib/avatar'
import WinRateRing from '../components/WinRateRing'
import FavoriteFactionCard from '../components/FavoriteFactionCard'

const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
]

const FORM_STYLES = {
  win: 'bg-green-900 text-green-400 border-green-800',
  loss: 'bg-red-950 text-red-400 border-red-900',
  draw: 'bg-sky-950 text-sky-400 border-sky-900',
}
const FORM_LABEL = { win: 'П', loss: '−', draw: 'Н' }

// Mirrors PlayerPanel's ROUND_SLOT_STYLES so a finished round reads the
// same way here as it did live on the game board.
const ROUND_SLOT_STYLES = {
  win: 'bg-green-950 border-green-800 text-green-400',
  loss: 'bg-red-950 border-red-900 text-red-400',
  tie: 'bg-stone-300 border-stone-400 text-stone-900',
  empty: 'border-dashed border-stone-800 text-stone-700',
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastGameRounds, setLastGameRounds] = useState(null)

  useEffect(() => {
    getMyGames(user.id)
      .then(setGames)
      .catch((err) => setError(translateError(err)))
      .finally(() => setLoading(false))
  }, [user.id])

  const lastGame = games[0]

  useEffect(() => {
    if (!lastGame) return
    getGameRounds(lastGame.id)
      .then(setLastGameRounds)
      .catch(() => {})
  }, [lastGame?.id])

  const now = new Date()
  const monthLabel = `${MONTHS[now.getMonth()]} ${now.getFullYear()}`

  if (loading) {
    return <p className="text-stone-500">Завантаження...</p>
  }
  if (error) {
    return <p className="text-red-400 text-sm">{error}</p>
  }

  if (games.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-500">{monthLabel}</p>
          <h1 className="text-4xl text-amber-50">Дашборд</h1>
          <div className="mt-3 border-b border-stone-800" />
        </div>
        <div className="border border-stone-800 rounded-lg p-6 flex flex-col items-center text-center gap-4">
          <p className="text-lg text-stone-200">
            Ти навіть срібла не заслуговуєш. Йди у перший бій салаго.
          </p>
          <Link
            to="/game"
            className="px-6 py-3 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold"
          >
            Почати нову гру
          </Link>
        </div>
      </div>
    )
  }

  const isPlayer1 = lastGame.player1_id === user.id
  const lastOpponent = isPlayer1 ? lastGame.player2 : lastGame.player1
  const myFaction = isPlayer1 ? lastGame.player1_faction : lastGame.player2_faction
  const opponentFaction = isPlayer1 ? lastGame.player2_faction : lastGame.player1_faction
  const myRounds = isPlayer1 ? lastGame.player1_rounds_won : lastGame.player2_rounds_won
  const opponentRounds = isPlayer1 ? lastGame.player2_rounds_won : lastGame.player1_rounds_won

  // Desktop always shows both factions in full color, same as the live game
  // board — win/loss doesn't mute either side there. Mobile is the one
  // exception: it drops the opponent down to a plain text footnote (see the
  // mobile-only block below) and only gives the full colored treatment
  // (art, avatar, wash) to the viewer, and only when they won or drew —
  // losing fades it to a neutral outline so that emphasis doesn't fight
  // the "your last game" framing.
  const lastStatus = getGameStatus(lastGame, user.id)
  const lastIsDrawish = lastStatus === 'draw' || lastStatus === 'incomplete'
  const myTheme = getFactionTheme(myFaction)
  const opponentTheme = getFactionTheme(opponentFaction)
  const myThemed = lastStatus === 'win' || lastIsDrawish ? myTheme : null
  const cardTheme = lastStatus === 'win' ? myTheme : lastStatus === 'loss' ? opponentTheme : null
  const cardWash = [
    myTheme && `linear-gradient(100deg, ${myTheme.color}22 0%, transparent 45%)`,
    opponentTheme && `linear-gradient(260deg, ${opponentTheme.color}22 0%, transparent 45%)`,
  ]
    .filter(Boolean)
    .join(', ')

  const resultColor =
    lastStatus === 'win'
      ? myTheme?.color ?? '#4ade80'
      : lastStatus === 'loss'
        ? opponentTheme?.color ?? '#f87171'
        : lastStatus === 'draw'
          ? '#38bdf8'
          : '#fbbf24'
  const resultText =
    lastStatus === 'win'
      ? `Перемога — ${myFaction} · ${myRounds}:${opponentRounds}`
      : lastStatus === 'loss'
        ? `Перемога — ${opponentFaction} · ${opponentRounds}:${myRounds}`
        : lastStatus === 'draw'
          ? `Нічия · ${myRounds}:${opponentRounds}`
          : 'Гру не завершено'

  const draws = games.filter((g) => g.is_draw).length
  const wins = games.filter((g) => !g.is_draw && g.winner_id === user.id).length
  const losses = games.length - wins - draws
  const winRate = Math.round((wins / games.length) * 100)

  const longestStreak = computeLongestStreak(games, user.id)
  const form = computeForm(games, user.id, 12)
  const opponentStats = computeOpponentStats(games, user.id)
  const factionBreakdown = computeFactionBreakdown(games, user.id)
  // Same favorite faction the card below is themed on — the win-rate ring
  // borrows that accent too instead of a hardcoded color, per the request.
  // Win/loss/draw stay their usual green/red/sky semantics, though — same
  // rule as the round slots elsewhere: outcome color is never overridden by
  // a faction's own color, or win vs loss stops being readable at a glance.
  const favoriteTheme = factionBreakdown[0] ? getFactionTheme(factionBreakdown[0].faction) : null
  const winRateAccent = favoriteTheme?.color ?? '#fbbf24'

  return (
    <div className="max-w-[1440px] mx-auto flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-stone-500">{monthLabel}</p>
        <h1 className="text-4xl text-amber-50">Дашборд</h1>
        <div className="mt-3 border-b border-stone-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 laptop-l:grid-cols-4 gap-4">
        <div
          className="lg:col-span-2 laptop-l:col-span-2 relative isolate overflow-hidden border border-stone-800 rounded-lg p-5 pl-8 sm:pl-9 pr-5 sm:pr-9 flex flex-col gap-4"
          style={{ borderColor: cardTheme?.color, backgroundImage: cardWash || undefined }}
        >
          {/* Edge art strips live in the reserved pl/pr padding gutter above —
              inset-y-0 (not h-full) so they're pinned to the card's actual
              rendered top/bottom regardless of flex/percentage-height quirks,
              and never poke past the card's own rounded/clipped edge.
              Mobile: only the viewer's, and only when it's themed (win/draw)
              — a second strip plus a full two-side row was too cramped at
              phone width. Desktop: both sides always, win or lose. */}
          {myThemed && (
            <img
              src={myThemed.art}
              alt=""
              aria-hidden="true"
              className="sm:hidden absolute inset-y-0 left-0 z-0 w-7 object-cover pointer-events-none select-none"
            />
          )}
          {myTheme && (
            <img
              src={myTheme.art}
              alt=""
              aria-hidden="true"
              className="hidden sm:block absolute inset-y-0 left-0 z-0 w-8 object-cover pointer-events-none select-none"
            />
          )}
          {opponentTheme && (
            <img
              src={opponentTheme.art}
              alt=""
              aria-hidden="true"
              className="hidden sm:block absolute inset-y-0 right-0 z-0 w-8 object-cover pointer-events-none select-none"
              style={{ transform: 'scaleX(-1)' }}
            />
          )}
          {/* Each quote hugs its OWN side (mine left, opponent's right) —
              matches where that player's name/art actually sits in this
              shared card. PlayerPanel puts a quote at the *opposite* corner
              from its art because there each panel is its own separate box;
              here left=me/right=opponent always, so that would land my
              quote under the opponent's info and vice versa. Offset past
              the art strip's own width so the text doesn't sit on top of it. */}
          {lastStatus === 'win' && myTheme && (
            <p
              className="sm:hidden absolute bottom-1 left-9 z-0 text-[10px] italic font-medium whitespace-nowrap pointer-events-none opacity-90"
              style={{ color: myTheme.color }}
            >
              {myTheme.quote}
            </p>
          )}
          {myTheme && (
            <p
              className="hidden sm:block absolute bottom-1 left-10 z-0 text-xs italic font-medium whitespace-nowrap pointer-events-none opacity-90"
              style={{ color: myTheme.color }}
            >
              {myTheme.quote}
            </p>
          )}
          {opponentTheme && (
            <p
              className="hidden sm:block absolute bottom-1 right-10 z-0 text-xs italic font-medium whitespace-nowrap pointer-events-none opacity-90"
              style={{ color: opponentTheme.color }}
            >
              {opponentTheme.quote}
            </p>
          )}

          <div className="relative z-10 flex items-start justify-between text-xs uppercase tracking-widest text-stone-500">
            <span>Остання партія</span>
            <span>
              {formatDate(lastGame.finished_at)} · {formatDuration(lastGame.started_at, lastGame.finished_at)}
            </span>
          </div>

          {/* Mobile: accent on the viewer, opponent shrinks to a footnote —
              a full two-avatar row was too tight at phone width and read as
              "two equal players" instead of "your last game". */}
          <div className="relative z-10 flex sm:hidden flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 min-w-0 max-w-[62%]">
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                    myThemed ? 'text-white' : 'text-stone-400 border border-stone-700'
                  }`}
                  style={myThemed ? { backgroundColor: myThemed.color } : undefined}
                >
                  {getInitials(user.user_metadata?.display_name || user.email)}
                </span>
                <div className="min-w-0">
                  <p className="text-lg text-stone-100 truncate">{user.user_metadata?.display_name || user.email}</p>
                  <p
                    className="text-xs uppercase tracking-wide flex items-center gap-1.5"
                    style={{ color: myThemed?.color }}
                  >
                    {myThemed && (
                      <span
                        className="inline-block w-1.5 h-1.5 rotate-45 shrink-0"
                        style={{ backgroundColor: myThemed.color }}
                      />
                    )}
                    <span className={myThemed ? '' : 'text-stone-500'}>{myFaction}</span>
                  </p>
                </div>
              </div>

              <p className="text-2xl font-mono font-semibold shrink-0 flex items-center gap-1.5">
                <span className="text-stone-100">{myRounds}</span>
                <span className="text-stone-700">|</span>
                <span className="text-stone-100">{opponentRounds}</span>
              </p>
            </div>

            <p className="text-xs text-stone-500 truncate">
              проти <span className="text-stone-300">{lastOpponent.display_name}</span>
              {' · '}
              <span style={{ color: opponentTheme?.color }}>{opponentFaction}</span>
            </p>
          </div>

          <div className="relative z-10 hidden sm:flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  myTheme ? 'text-white' : 'text-stone-400 border border-stone-700'
                }`}
                style={myTheme ? { backgroundColor: myTheme.color } : undefined}
              >
                {getInitials(user.user_metadata?.display_name || user.email)}
              </span>
              <div className="min-w-0">
                <p className="text-xl text-stone-100 truncate">{user.user_metadata?.display_name || user.email}</p>
                <p
                  className="text-xs uppercase tracking-wide flex items-center gap-1.5"
                  style={{ color: myTheme?.color }}
                >
                  {myTheme && (
                    <span
                      className="inline-block w-1.5 h-1.5 rotate-45 shrink-0"
                      style={{ backgroundColor: myTheme.color }}
                    />
                  )}
                  <span className={myTheme ? '' : 'text-stone-500'}>{myFaction}</span>
                </p>
              </div>
            </div>

            <p className="text-3xl sm:text-4xl font-mono font-semibold shrink-0 flex items-center gap-2">
              <span className="text-stone-100">{myRounds}</span>
              <span className="text-stone-700">|</span>
              <span className="text-stone-100">{opponentRounds}</span>
            </p>

            <div className="flex items-center gap-3 min-w-0 flex-row-reverse text-right">
              <span
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                  opponentTheme ? 'text-white' : 'text-stone-400 border border-stone-700'
                }`}
                style={opponentTheme ? { backgroundColor: opponentTheme.color } : undefined}
              >
                {getInitials(lastOpponent.display_name)}
              </span>
              <div className="min-w-0">
                <p className="text-xl text-stone-100 truncate">{lastOpponent.display_name}</p>
                <p
                  className="text-xs uppercase tracking-wide flex items-center justify-end gap-1.5"
                  style={{ color: opponentTheme?.color }}
                >
                  <span className={opponentTheme ? '' : 'text-stone-500'}>{opponentFaction}</span>
                  {opponentTheme && (
                    <span
                      className="inline-block w-1.5 h-1.5 rotate-45 shrink-0"
                      style={{ backgroundColor: opponentTheme.color }}
                    />
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => {
              const r = lastGameRounds?.[i]
              const p1 = r?.player1_points
              const p2 = r?.player2_points
              const result = !r
                ? 'empty'
                : r.round_winner_id === null
                  ? 'tie'
                  : r.round_winner_id === user.id
                    ? 'win'
                    : 'loss'
              return (
                <div key={i} className={`border px-3 py-2 text-center ${ROUND_SLOT_STYLES[result]}`}>
                  <p className="text-[10px] uppercase tracking-wide opacity-70">Раунд {i + 1}</p>
                  {r ? (
                    <p className="font-mono text-sm mt-1">
                      {isPlayer1 ? p1 : p2} : {isPlayer1 ? p2 : p1}
                    </p>
                  ) : (
                    <p className="mt-1">—</p>
                  )}
                </div>
              )
            })}
          </div>

          <div className="relative z-10 flex items-center gap-3 flex-wrap">
            <Link
              to="/game"
              className="px-5 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold"
            >
              Почати нову гру
            </Link>
            <p className="text-sm flex items-center gap-1.5" style={{ color: resultColor }}>
              <span
                className="inline-block w-1.5 h-1.5 rotate-45 shrink-0"
                style={{ backgroundColor: resultColor }}
              />
              {resultText}
            </p>
          </div>
        </div>

        <FavoriteFactionCard breakdown={factionBreakdown} totalGames={games.length} />

        <div
          className="border rounded-lg p-5 flex flex-col gap-4"
          style={{ borderColor: `${winRateAccent}40` }}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs uppercase tracking-widest text-stone-500">Відсоток перемог</p>
            <span
              className="inline-block w-2 h-2 rotate-45 shrink-0"
              style={{ backgroundColor: winRateAccent }}
            />
          </div>
          <div
            className="h-px"
            style={{ backgroundImage: `linear-gradient(90deg, ${winRateAccent}80, transparent)` }}
          />

          <div className="flex justify-center py-1">
            <WinRateRing percent={winRate} total={games.length} color={winRateAccent} />
          </div>

          <div className="flex flex-col gap-3">
            {[
              { label: 'Виграв', value: wins, color: '#4ade80' },
              { label: 'Програв', value: losses, color: '#f87171' },
              { label: 'Нічиї', value: draws, color: '#38bdf8' },
            ].map((row) => {
              const width = games.length > 0 ? Math.round((row.value / games.length) * 100) : 0
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-[10px] uppercase tracking-wide text-stone-500 w-14 shrink-0">
                    {row.label}
                  </span>
                  <div className="flex-1 h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${width}%`, backgroundColor: row.color }}
                    />
                  </div>
                  <span
                    className="text-sm font-mono font-semibold shrink-0 w-6 text-right"
                    style={{ color: row.color }}
                  >
                    {row.value}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="border border-stone-800 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <span className="text-xs uppercase tracking-widest text-stone-500">
            Останні ігри {form.length}
          </span>
          <div className="flex gap-1.5 w-full sm:w-auto">
            {form.map((outcome, i) => (
              <span
                key={i}
                className={`h-7 flex-1 sm:flex-none sm:w-7 items-center justify-center rounded text-xs font-bold border ${FORM_STYLES[outcome]} ${
                  i >= 9 ? 'hidden sm:flex' : 'flex'
                }`}
              >
                {FORM_LABEL[outcome]}
              </span>
            ))}
          </div>
        </div>
        <p className="text-sm text-stone-400">
          Найдовша серія перемог: <span className="text-amber-400 font-semibold">{longestStreak}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="border border-stone-800 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl text-amber-50">Останні партії</h2>
            <Link to="/history" className="text-sm text-amber-400 hover:text-amber-300">
              Уся історія →
            </Link>
          </div>
          <ul className="flex flex-col gap-1">
            {games.slice(0, 5).map((g) => {
              const gIsPlayer1 = g.player1_id === user.id
              const opponent = gIsPlayer1 ? g.player2 : g.player1
              const faction = gIsPlayer1 ? g.player1_faction : g.player2_faction
              const my = gIsPlayer1 ? g.player1_rounds_won : g.player2_rounds_won
              const their = gIsPlayer1 ? g.player2_rounds_won : g.player1_rounds_won
              const isWin = !g.is_draw && g.winner_id === user.id
              const resultLabel = g.is_draw ? 'Нічия' : isWin ? 'Перемога' : 'Поразка'
              const resultColor = g.is_draw ? 'text-sky-400' : isWin ? 'text-green-500' : 'text-red-500'
              return (
                <li key={g.id} className="flex items-center justify-between py-2 border-b border-stone-900 last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-1.5 h-1.5 rotate-45 bg-amber-500 shrink-0" />
                    <div>
                      <p className="text-stone-200">проти {opponent.display_name}</p>
                      <p className="text-xs text-stone-500">
                        {faction} · {formatDate(g.finished_at)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-stone-200">
                      {my} : {their}
                    </p>
                    <p className={`text-xs uppercase ${resultColor}`}>{resultLabel}</p>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>

        <div className="border border-stone-800 rounded-lg p-5">
          <h2 className="text-xl text-amber-50 mb-3">Суперники</h2>
          <div className="flex flex-col gap-4">
            {opponentStats.slice(0, 4).map((o) => {
              const total = o.wins + o.losses + o.draws
              const winPct = total > 0 ? Math.round((o.wins / total) * 100) : 0
              return (
                <div key={o.opponent.id}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-stone-200">{o.opponent.display_name}</span>
                    <span className="font-mono text-stone-400">
                      {o.wins}–{o.losses}
                    </span>
                  </div>
                  <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-600" style={{ width: `${winPct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
          <Link
            to="/players"
            className="mt-4 block text-center border border-stone-700 hover:border-stone-500 rounded-md py-2 text-sm text-stone-300"
          >
            Додати гравця
          </Link>
        </div>
      </div>
    </div>
  )
}
