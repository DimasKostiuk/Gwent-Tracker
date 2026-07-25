import { useEffect, useState } from 'react'
import { useAuth } from '../lib/AuthContext'
import { getGameRounds, getMyGames } from '../lib/api'
import { avatarColor, getInitials } from '../lib/avatar'
import { formatDate, formatDuration } from '../lib/format'

export default function HistoryPage() {
  const { user } = useAuth()
  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [expandedId, setExpandedId] = useState(null)
  const [roundsByGame, setRoundsByGame] = useState({})
  const [roundsLoading, setRoundsLoading] = useState(false)

  useEffect(() => {
    getMyGames(user.id)
      .then(setGames)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user.id])

  async function toggleExpand(game) {
    if (expandedId === game.id) {
      setExpandedId(null)
      return
    }
    setExpandedId(game.id)
    if (roundsByGame[game.id]) return
    setRoundsLoading(true)
    try {
      const rounds = await getGameRounds(game.id)
      setRoundsByGame((prev) => ({ ...prev, [game.id]: rounds }))
    } catch (err) {
      setError(err.message)
    } finally {
      setRoundsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-zinc-100">Історія ігор</h1>

      {loading && <p className="text-zinc-500">Завантаження...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && games.length === 0 && (
        <p className="text-zinc-500">Ти ще не зіграв жодної гри.</p>
      )}

      <ul className="flex flex-col gap-2">
        {games.map((game) => {
          const isPlayer1 = game.player1_id === user.id
          const opponent = isPlayer1 ? game.player2 : game.player1
          const myFaction = isPlayer1 ? game.player1_faction : game.player2_faction
          const opponentFaction = isPlayer1 ? game.player2_faction : game.player1_faction
          const myRounds = isPlayer1 ? game.player1_rounds_won : game.player2_rounds_won
          const opponentRounds = isPlayer1 ? game.player2_rounds_won : game.player1_rounds_won
          const isWin = game.winner_id === user.id
          const isExpanded = expandedId === game.id
          const rounds = roundsByGame[game.id]

          return (
            <li key={game.id} className="bg-zinc-900 border border-zinc-800 rounded-md overflow-hidden">
              <button
                onClick={() => toggleExpand(game)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/50"
              >
                <span
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${avatarColor(opponent.display_name)}`}
                >
                  {getInitials(opponent.display_name)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-zinc-100 font-medium truncate">
                      проти {opponent.display_name}
                    </p>
                    <span className="font-mono font-semibold text-zinc-100">
                      {myRounds} : {opponentRounds}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                    <span
                      className={`px-1.5 py-0.5 rounded font-medium ${
                        isWin ? 'bg-green-900 text-green-400' : 'bg-red-950 text-red-400'
                      }`}
                    >
                      {isWin ? 'Перемога' : 'Поразка'}
                    </span>
                    <span>{myFaction} проти {opponentFaction}</span>
                    <span>·</span>
                    <span>{formatDate(game.finished_at)}</span>
                    <span>·</span>
                    <span>{formatDuration(game.started_at, game.finished_at)}</span>
                  </div>
                </div>
                <span className="text-zinc-600 text-xs shrink-0">{isExpanded ? '▲' : '▼'}</span>
              </button>

              {isExpanded && (
                <div className="border-t border-zinc-800 px-4 py-3">
                  {roundsLoading && !rounds && <p className="text-zinc-500 text-sm">Завантаження...</p>}
                  {rounds && (
                    <ul className="flex flex-col gap-1">
                      {rounds.map((r) => {
                        const myPoints = isPlayer1 ? r.player1_points : r.player2_points
                        const opponentPoints = isPlayer1 ? r.player2_points : r.player1_points
                        const roundWin = r.round_winner_id === user.id
                        return (
                          <li
                            key={r.id}
                            className="flex items-center justify-between text-sm font-mono px-2 py-1 rounded bg-zinc-950"
                          >
                            <span className="text-zinc-500">Раунд {r.round_number}</span>
                            <span className={roundWin ? 'text-green-400' : 'text-red-400'}>
                              {myPoints} : {opponentPoints}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
