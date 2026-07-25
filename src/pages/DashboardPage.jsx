import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { getMyGames } from '../lib/api'
import { formatDate } from '../lib/format'

export default function DashboardPage() {
  const { user } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getMyGames(user.id)
      .then(setGames)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user.id])

  const wins = games.filter((g) => g.winner_id === user.id).length
  const losses = games.length - wins
  const winRate = games.length > 0 ? Math.round((wins / games.length) * 100) : 0

  const lastGame = games[0]
  const lastGameIsPlayer1 = lastGame?.player1_id === user.id
  const lastGameOpponent = lastGame && (lastGameIsPlayer1 ? lastGame.player2 : lastGame.player1)
  const lastGameMyRounds = lastGame && (lastGameIsPlayer1 ? lastGame.player1_rounds_won : lastGame.player2_rounds_won)
  const lastGameOpponentRounds = lastGame && (lastGameIsPlayer1 ? lastGame.player2_rounds_won : lastGame.player1_rounds_won)
  const lastGameIsWin = lastGame?.winner_id === user.id

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-zinc-100">Дашборд</h1>

      {/* Блок 1: загальна статистика */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        {loading && <p className="text-zinc-500">Завантаження...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {!loading && !error && games.length === 0 && (
          <p className="text-zinc-200">
            Ти навіть срібла не заслуговуєш. Йди у перший бій салаго.
          </p>
        )}
        {!loading && !error && games.length > 0 && (
          <p className="text-zinc-200">
            Загальна статистика: <span className="font-semibold text-green-500">{wins} виграв</span> /{' '}
            <span className="font-semibold text-red-500">{losses} програв</span>{' '}
            <span className="text-zinc-500">({winRate}% перемог)</span>
          </p>
        )}
      </section>

      {/* Блок 2: старт нової гри + остання гра + прев'ю ігрового поля */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 flex flex-col md:flex-row gap-5">
        <div className="flex items-center justify-center md:justify-start">
          <Link
            to="/game"
            className="px-6 py-3 rounded-md bg-red-700 hover:bg-red-600 text-white font-semibold whitespace-nowrap"
          >
            Почати гру
          </Link>
        </div>

        <div className="flex-1 flex flex-col gap-3">
          <div className="bg-zinc-950 border border-zinc-800 rounded-md p-4">
            <p className="text-xs uppercase tracking-wide text-zinc-500 mb-2">Остання гра</p>
            {!loading && !lastGame && <p className="text-zinc-500 text-sm">Ще не зіграно жодної гри.</p>}
            {lastGame && (
              <>
                <div className="flex items-center justify-between text-zinc-200">
                  <span>Ти vs {lastGameOpponent.display_name}</span>
                  <span className="font-mono">
                    {lastGameMyRounds} : {lastGameOpponentRounds}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  {formatDate(lastGame.finished_at)} · {lastGameIsWin ? 'перемога' : 'поразка'}
                </p>
              </>
            )}
          </div>

          <div className="flex-1 min-h-40 bg-zinc-950 border border-dashed border-zinc-700 rounded-md flex items-center justify-center text-zinc-600 text-sm">
            Скрін ігрового поля (буде пізніше)
          </div>
        </div>
      </section>
    </div>
  )
}
