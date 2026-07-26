import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyGames, getRoundsForGames } from '../lib/api'
import { computeOverallPlayerStats } from '../lib/stats'
import { avatarColor, getInitials } from '../lib/avatar'
import { formatDate } from '../lib/format'
import WinLossDonut from './WinLossDonut'

function LegendRow({ colorClass, label, value }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colorClass}`} />
      <span className="text-stone-400">{label}</span>
      <span className="ml-auto font-mono text-stone-100">{value}</span>
    </div>
  )
}

function StatBox({ label, value, accent = 'text-stone-100' }) {
  return (
    <div className="border border-stone-800 rounded-md py-2 text-center">
      <p className={`text-lg ${accent}`}>{value}</p>
      <p className="text-[10px] uppercase text-stone-500">{label}</p>
    </div>
  )
}

export default function PlayerProfileModal({ profile, onClose }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    getMyGames(profile.id)
      .then(async (games) => {
        const rounds = await getRoundsForGames(games.map((g) => g.id))
        if (!cancelled) setStats(computeOverallPlayerStats(games, rounds, profile.id))
      })
      .catch((err) => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [profile.id])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-stone-950 border border-stone-700 rounded-lg p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold text-white shrink-0 ${avatarColor(profile.display_name)}`}
            >
              {getInitials(profile.display_name)}
            </span>
            <div className="min-w-0">
              <p className="text-xl text-stone-100 truncate">{profile.display_name}</p>
              <p className="text-xs text-stone-500">У грі з {formatDate(profile.created_at)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 cursor-pointer text-lg leading-none shrink-0"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-stone-500 text-sm text-center py-8">Завантаження...</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {stats && stats.totalGames === 0 && (
          <p className="text-stone-500 text-sm text-center py-8">
            Цей гравець ще не зіграв жодної партії.
          </p>
        )}

        {stats && stats.totalGames > 0 && (
          <>
            <div className="flex items-center gap-5">
              <WinLossDonut wins={stats.wins} losses={stats.losses} draws={stats.draws} />
              <div className="flex-1 flex flex-col gap-1.5">
                <LegendRow colorClass="bg-green-500" label="Перемоги" value={stats.wins} />
                <LegendRow colorClass="bg-red-500" label="Поразки" value={stats.losses} />
                <LegendRow colorClass="bg-sky-400" label="Нічиї" value={stats.draws} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <StatBox label="Партій" value={stats.totalGames} />
              <StatBox label="Вінрейт" value={`${stats.winRate}%`} />
              <StatBox
                label="Поточна серія"
                value={stats.currentStreak > 0 ? `+${stats.currentStreak}` : stats.currentStreak}
                accent={stats.currentStreak > 0 ? 'text-green-400' : 'text-stone-100'}
              />
              <StatBox label="Найдовша серія" value={stats.longestStreak} accent="text-amber-400" />
            </div>

            <div className="text-sm text-stone-400 flex flex-col gap-1">
              <p>
                Улюблена колода: <span className="text-stone-200">{stats.favoriteFaction ?? '—'}</span>
              </p>
              <p>
                Середні очки за раунд:{' '}
                <span className="text-stone-200">{stats.avgPoints ?? '—'}</span>
              </p>
              <p>
                Остання гра: <span className="text-stone-200">{formatDate(stats.lastPlayedAt)}</span>
              </p>
            </div>

            <Link
              to={`/history?opponent=${encodeURIComponent(profile.display_name)}`}
              onClick={onClose}
              className="text-center text-sm text-amber-400 hover:text-amber-300"
            >
              Історія ваших ігор →
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
