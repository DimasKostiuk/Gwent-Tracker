import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getGameRounds, getMyGames } from '../lib/api'
import { formatDate, formatDuration } from '../lib/format'
import {
  computeCurrentStreak,
  computeForm,
  computeLongestStreak,
  computeOpponentStats,
} from '../lib/stats'
import WinRateRing from '../components/WinRateRing'

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

export default function DashboardPage() {
  const { user } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastGameRounds, setLastGameRounds] = useState(null)

  useEffect(() => {
    getMyGames(user.id)
      .then(setGames)
      .catch((err) => setError(err.message))
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
      <div className="flex flex-col gap-6">
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

  const draws = games.filter((g) => g.is_draw).length
  const wins = games.filter((g) => !g.is_draw && g.winner_id === user.id).length
  const losses = games.length - wins - draws
  const winRate = Math.round((wins / games.length) * 100)

  const longestStreak = computeLongestStreak(games, user.id)
  const form = computeForm(games, user.id, 12)
  const opponentStats = computeOpponentStats(games, user.id)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs uppercase tracking-widest text-stone-500">{monthLabel}</p>
        <h1 className="text-4xl text-amber-50">Дашборд</h1>
        <div className="mt-3 border-b border-stone-800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 border border-stone-800 rounded-lg p-5 flex flex-col gap-4">
          <div className="flex items-start justify-between text-xs uppercase tracking-widest text-stone-500">
            <span>Остання партія</span>
            <span>
              {formatDate(lastGame.finished_at)} · {formatDuration(lastGame.started_at, lastGame.finished_at)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xl text-stone-100">{user.user_metadata?.display_name || user.email}</p>
              <p className="text-xs text-stone-500">{myFaction}</p>
            </div>
            <p className="text-3xl font-mono">
              <span className="text-amber-400">{myRounds}</span>
              <span className="text-stone-700 mx-1">|</span>
              <span className="text-stone-500">{opponentRounds}</span>
            </p>
            <div className="text-right">
              <p className="text-xl text-stone-100">{lastOpponent.display_name}</p>
              <p className="text-xs text-stone-500">{opponentFaction}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => {
              const r = lastGameRounds?.[i]
              const p1 = r?.player1_points
              const p2 = r?.player2_points
              return (
                <div
                  key={i}
                  className={`rounded-md border px-3 py-2 text-center ${
                    r ? 'border-stone-700' : 'border-dashed border-stone-800'
                  }`}
                >
                  <p className="text-[10px] uppercase tracking-wide text-stone-500">Раунд {i + 1}</p>
                  {r ? (
                    <p className="font-mono text-sm text-stone-200 mt-1">
                      {isPlayer1 ? p1 : p2} : {isPlayer1 ? p2 : p1}
                    </p>
                  ) : (
                    <p className="text-stone-700 mt-1">—</p>
                  )}
                </div>
              )
            })}
          </div>

          <Link
            to="/game"
            className="self-start px-5 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold"
          >
            Почати нову гру
          </Link>
        </div>

        <div className="border border-stone-800 rounded-lg p-5 flex flex-col items-center gap-4">
          <p className="text-xs uppercase tracking-widest text-stone-500 self-start">
            Відсоток перемог
          </p>
          <WinRateRing percent={winRate} />
          <p className="text-xs text-stone-500 -mt-2">{games.length} партій</p>
          <div className="grid grid-cols-3 gap-2 w-full text-center">
            <div>
              <p className="text-lg font-semibold text-green-500">{wins}</p>
              <p className="text-[10px] uppercase text-stone-500">виграв</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-red-500">{losses}</p>
              <p className="text-[10px] uppercase text-stone-500">програв</p>
            </div>
            <div>
              <p className="text-lg font-semibold text-sky-400">{draws}</p>
              <p className="text-[10px] uppercase text-stone-500">нічиї</p>
            </div>
          </div>
        </div>
      </div>

      <div className="border border-stone-800 rounded-lg p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs uppercase tracking-widest text-stone-500">
            Форма · останні {form.length}
          </span>
          <div className="flex gap-1.5">
            {form.map((outcome, i) => (
              <span
                key={i}
                className={`w-7 h-7 flex items-center justify-center rounded text-xs font-bold border ${FORM_STYLES[outcome]}`}
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
