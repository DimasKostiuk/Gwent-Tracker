import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useGameInvite } from '../lib/GameInviteContext'
import { deleteGame, getGameRounds, getMyGames } from '../lib/api'
import { formatDate, formatDuration } from '../lib/format'
import { getGameStatus } from '../lib/stats'
import { getFactionTheme } from '../lib/factionThemes'
import ConfirmDialog from '../components/ConfirmDialog'

const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень',
]

const STATUS_META = {
  win: { label: 'Перемога', badge: 'text-green-400', bar: 'bg-green-500' },
  loss: { label: 'Поразка', badge: 'text-red-400', bar: 'bg-red-500' },
  draw: { label: 'Нічия', badge: 'text-sky-400', bar: 'bg-sky-400' },
  incomplete: { label: 'Незавершена', badge: 'text-amber-400', bar: 'bg-amber-400' },
}

const FILTERS = [
  { key: 'all', label: 'Усі' },
  { key: 'win', label: 'Перемоги' },
  { key: 'loss', label: 'Поразки' },
  { key: 'draw', label: 'Нічиї' },
  { key: 'incomplete', label: 'Незавершені' },
]

export default function HistoryPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { activeInvite, sendInvite } = useGameInvite()
  const [searchParams] = useSearchParams()

  const [games, setGames] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState(() => searchParams.get('opponent') || '')
  const [filter, setFilter] = useState('all')

  const [expandedIds, setExpandedIds] = useState(new Set())
  const [roundsByGame, setRoundsByGame] = useState({})
  const [roundsLoadingId, setRoundsLoadingId] = useState(null)

  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    getMyGames(user.id)
      .then(setGames)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user.id])

  const counts = useMemo(() => {
    const c = { all: games.length, win: 0, loss: 0, draw: 0, incomplete: 0 }
    for (const g of games) c[getGameStatus(g, user.id)]++
    return c
  }, [games, user.id])

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    return games.filter((g) => {
      if (filter !== 'all' && getGameStatus(g, user.id) !== filter) return false
      if (term) {
        const opponent = g.player1_id === user.id ? g.player2 : g.player1
        if (!opponent.display_name.toLowerCase().includes(term)) return false
      }
      return true
    })
  }, [games, filter, search, user.id])

  const groups = useMemo(() => {
    const list = []
    for (const g of filtered) {
      const d = new Date(g.finished_at)
      const key = `${d.getFullYear()}-${d.getMonth()}`
      let group = list.find((x) => x.key === key)
      if (!group) {
        group = { key, label: `${MONTHS[d.getMonth()]} ${d.getFullYear()}`.toUpperCase(), games: [] }
        list.push(group)
      }
      group.games.push(g)
    }
    return list
  }, [filtered])

  async function fetchRoundsIfMissing(gameId) {
    if (roundsByGame[gameId]) return
    setRoundsLoadingId(gameId)
    try {
      const rounds = await getGameRounds(gameId)
      setRoundsByGame((prev) => ({ ...prev, [gameId]: rounds }))
    } catch (err) {
      setError(err.message)
    } finally {
      setRoundsLoadingId(null)
    }
  }

  async function toggleExpand(game) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(game.id)) next.delete(game.id)
      else next.add(game.id)
      return next
    })
    await fetchRoundsIfMissing(game.id)
  }

  const allExpanded = filtered.length > 0 && filtered.every((g) => expandedIds.has(g.id))

  async function handleToggleExpandAll() {
    if (allExpanded) {
      setExpandedIds(new Set())
      return
    }
    setExpandedIds(new Set(filtered.map((g) => g.id)))
    const missing = filtered.filter((g) => !roundsByGame[g.id])
    if (missing.length > 0) {
      const results = await Promise.all(
        missing.map((g) => getGameRounds(g.id).then((r) => [g.id, r]).catch(() => [g.id, []])),
      )
      setRoundsByGame((prev) => {
        const next = { ...prev }
        for (const [id, rounds] of results) next[id] = rounds
        return next
      })
    }
  }

  async function handleRematch(opponentId) {
    setActionError(null)
    try {
      await sendInvite(opponentId)
      navigate('/game')
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      await deleteGame(confirmingDeleteId)
      setGames((prev) => prev.filter((g) => g.id !== confirmingDeleteId))
      setConfirmingDeleteId(null)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <p className="text-stone-500">Завантаження...</p>
  if (error) return <p className="text-red-400 text-sm">{error}</p>

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-500">Архів партій</p>
          <h1 className="text-4xl text-amber-50">Історія ігор</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за суперником..."
            className="bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-stone-100 text-sm placeholder-stone-600"
          />
          <button
            onClick={handleToggleExpandAll}
            disabled={filtered.length === 0}
            className="px-4 py-2 rounded-md border border-stone-700 hover:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-stone-200 text-sm whitespace-nowrap"
          >
            {allExpanded ? 'Згорнути все' : 'Розгорнути все'}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-3 py-1.5 rounded-md border text-sm cursor-pointer ${
                filter === f.key
                  ? 'bg-amber-500 border-amber-500 text-stone-950 font-semibold'
                  : 'border-stone-700 text-stone-300 hover:border-stone-500'
              }`}
            >
              {f.label} <span className="opacity-70">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500">
          Показано {filtered.length} з {games.length} партій
        </p>
      </div>

      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

      {games.length === 0 && (
        <p className="text-stone-500 text-center py-10">Ти ще не зіграв жодної гри.</p>
      )}
      {games.length > 0 && filtered.length === 0 && (
        <p className="text-stone-500 text-center py-10">
          Нічого не знайдено за цим фільтром чи пошуком.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {groups.map((group) => {
          const wins = group.games.filter((g) => getGameStatus(g, user.id) === 'win').length
          const losses = group.games.filter((g) => getGameStatus(g, user.id) === 'loss').length
          const draws = group.games.filter((g) => getGameStatus(g, user.id) === 'draw').length
          return (
            <div key={group.key}>
              <div className="flex items-center justify-between text-xs uppercase tracking-widest text-stone-500 border-b border-stone-800 pb-2 mb-2">
                <span>{group.label}</span>
                <span className="font-mono">
                  {wins}-{losses}-{draws}
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {group.games.map((game) => {
                  const isPlayer1 = game.player1_id === user.id
                  const opponent = isPlayer1 ? game.player2 : game.player1
                  const myFaction = isPlayer1 ? game.player1_faction : game.player2_faction
                  const opponentFaction = isPlayer1 ? game.player2_faction : game.player1_faction
                  const myFactionColor = getFactionTheme(myFaction)?.color
                  const opponentFactionColor = getFactionTheme(opponentFaction)?.color
                  const myRounds = isPlayer1 ? game.player1_rounds_won : game.player2_rounds_won
                  const opponentRounds = isPlayer1 ? game.player2_rounds_won : game.player1_rounds_won
                  const status = getGameStatus(game, user.id)
                  const meta = STATUS_META[status]
                  const isExpanded = expandedIds.has(game.id)
                  const rounds = roundsByGame[game.id]

                  return (
                    <div key={game.id} className="border border-stone-800 rounded-md overflow-hidden">
                      <button
                        onClick={() => toggleExpand(game)}
                        className="w-full flex items-stretch text-left hover:bg-stone-900/50 cursor-pointer"
                      >
                        <span className={`w-1 shrink-0 ${meta.bar}`} />
                        <div className="flex-1 min-w-0 flex flex-wrap sm:flex-nowrap items-center gap-x-4 gap-y-1 px-4 py-3">
                          <div className="min-w-0 flex items-center gap-4">
                            <div className="min-w-0">
                              <p className="text-stone-100 truncate">проти {opponent.display_name}</p>
                              <p className="text-xs text-stone-500 truncate">
                                <span style={{ color: myFactionColor }}>{myFaction}</span> проти{' '}
                                <span style={{ color: opponentFactionColor }}>{opponentFaction}</span>
                              </p>
                            </div>
                            <p className={`text-xs uppercase tracking-wide shrink-0 ${meta.badge}`}>
                              {meta.label}
                            </p>
                          </div>

                          <div className="ml-auto flex items-center gap-4 shrink-0">
                            <p className="text-xs text-stone-500 hidden sm:block">
                              {formatDate(game.finished_at)} ·{' '}
                              {formatDuration(game.started_at, game.finished_at)}
                            </p>
                            <p className="font-mono text-xl text-stone-100">
                              {myRounds} : {opponentRounds}
                            </p>
                            <span className="text-stone-600 text-xs">{isExpanded ? '▲' : '▼'}</span>
                          </div>
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-stone-800 px-4 py-3 flex flex-col gap-3">
                          {roundsLoadingId === game.id && !rounds && (
                            <p className="text-stone-500 text-sm">Завантаження...</p>
                          )}
                          {rounds && rounds.length > 0 && (
                            <div className="flex flex-col gap-2">
                              {rounds.map((r) => {
                                const myPoints = isPlayer1 ? r.player1_points : r.player2_points
                                const oppPoints = isPlayer1 ? r.player2_points : r.player1_points
                                const total = myPoints + oppPoints || 1
                                const myShare = Math.round((myPoints / total) * 100)
                                const barColor =
                                  r.round_winner_id === null
                                    ? 'bg-stone-400'
                                    : r.round_winner_id === user.id
                                      ? 'bg-green-500'
                                      : 'bg-red-500'
                                return (
                                  <div key={r.id} className="flex items-center gap-3">
                                    <span className="text-xs text-stone-500 w-16 shrink-0">
                                      Раунд {r.round_number}
                                    </span>
                                    <div className="flex-1 h-2 bg-stone-800 rounded-full overflow-hidden">
                                      <div className={`h-full ${barColor}`} style={{ width: `${myShare}%` }} />
                                    </div>
                                    <span className="font-mono text-xs text-stone-300 w-14 text-right shrink-0">
                                      {myPoints}:{oppPoints}
                                    </span>
                                  </div>
                                )
                              })}
                              <p className="text-xs text-stone-500 mt-1">
                                Сума очок:{' '}
                                <span className="font-mono text-stone-300">
                                  {rounds.reduce(
                                    (s, r) => s + (isPlayer1 ? r.player1_points : r.player2_points),
                                    0,
                                  )}
                                  {' : '}
                                  {rounds.reduce(
                                    (s, r) => s + (isPlayer1 ? r.player2_points : r.player1_points),
                                    0,
                                  )}
                                </span>
                              </p>
                            </div>
                          )}
                          {rounds && rounds.length === 0 && (
                            <p className="text-stone-500 text-sm">Раунди не збережено.</p>
                          )}

                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleRematch(opponent.id)}
                              disabled={!!activeInvite}
                              className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-stone-950 text-sm font-semibold"
                            >
                              Реванш
                            </button>
                            <button
                              onClick={() => setConfirmingDeleteId(game.id)}
                              className="px-3 py-1.5 rounded-md border border-red-900 hover:border-red-700 text-red-400 text-sm cursor-pointer"
                            >
                              Видалити
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!confirmingDeleteId}
        title="Видалити гру?"
        message="Цю дію не можна скасувати — гра назавжди зникне з історії."
        confirming={deleting}
        error={confirmingDeleteId ? actionError : null}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmingDeleteId(null)}
      />
    </div>
  )
}
