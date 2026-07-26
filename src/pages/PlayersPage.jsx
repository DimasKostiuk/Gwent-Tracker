import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useGameInvite } from '../lib/GameInviteContext'
import { getMyGames, getProfiles, getRoundsForGames } from '../lib/api'
import { buildOpponentCards } from '../lib/stats'
import { avatarColor, getInitials } from '../lib/avatar'
import { formatDate } from '../lib/format'
import PlayerProfileModal from '../components/PlayerProfileModal'

const SORTS = [
  { key: 'games', label: 'За кількістю партій' },
  { key: 'winrate', label: 'За вінрейтом' },
  { key: 'name', label: 'За іменем' },
  { key: 'activity', label: 'За активністю' },
]

function sortCards(cards, sortKey) {
  const arr = [...cards]
  switch (sortKey) {
    case 'winrate':
      return arr.sort((a, b) => (b.winRate ?? -1) - (a.winRate ?? -1))
    case 'name':
      return arr.sort((a, b) => a.profile.display_name.localeCompare(b.profile.display_name))
    case 'activity':
      return arr.sort((a, b) => {
        if (!a.lastPlayedAt && !b.lastPlayedAt) return 0
        if (!a.lastPlayedAt) return 1
        if (!b.lastPlayedAt) return -1
        return new Date(b.lastPlayedAt) - new Date(a.lastPlayedAt)
      })
    case 'games':
    default:
      return arr.sort((a, b) => b.totalGames - a.totalGames)
  }
}

function AddPlayerModal({ onClose }) {
  const [email, setEmail] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const subject = encodeURIComponent('Запрошення в Gwent Tracker')
    const body = encodeURIComponent(
      `Привіт!\n\nЗапрошую тебе приєднатися до Gwent Tracker — трекера партій у Gwent.\n\n` +
        `Зареєструйся тут: ${window.location.origin}/register\n\nДо зустрічі за картами!`,
    )
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-stone-950 border border-stone-700 rounded-lg p-5 flex flex-col gap-4">
        <div className="flex items-start justify-between">
          <h2 className="text-xl text-amber-50">Додати гравця</h2>
          <button
            onClick={onClose}
            className="text-stone-500 hover:text-stone-300 cursor-pointer text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-stone-400">
          Вкажи email — відкриється твій поштовий клієнт із готовим листом і посиланням на
          реєстрацію.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@example.com"
            className="bg-stone-900 border border-stone-700 rounded-md px-3 py-2 text-stone-100"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold cursor-pointer"
          >
            Надіслати запрошення
          </button>
        </form>
      </div>
    </div>
  )
}

export default function PlayersPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { activeInvite, sendInvite } = useGameInvite()

  const [profiles, setProfiles] = useState([])
  const [games, setGames] = useState([])
  const [rounds, setRounds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('games')
  const [showAddModal, setShowAddModal] = useState(false)
  const [profileTarget, setProfileTarget] = useState(null)
  const [invitingId, setInvitingId] = useState(null)
  const [actionError, setActionError] = useState(null)

  useEffect(() => {
    Promise.all([getProfiles(), getMyGames(user.id)])
      .then(([profilesData, gamesData]) => {
        setProfiles(profilesData.filter((p) => p.id !== user.id))
        setGames(gamesData)
        return getRoundsForGames(gamesData.map((g) => g.id))
      })
      .then(setRounds)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [user.id])

  const cards = useMemo(
    () => buildOpponentCards(profiles, games, rounds, user.id),
    [profiles, games, rounds, user.id],
  )

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    const list = term
      ? cards.filter((c) => c.profile.display_name.toLowerCase().includes(term))
      : cards
    return sortCards(list, sort)
  }, [cards, search, sort])

  async function handleInvite(playerId) {
    setActionError(null)
    setInvitingId(playerId)
    try {
      await sendInvite(playerId)
      navigate('/game')
    } catch (err) {
      setActionError(err.message)
      setInvitingId(null)
    }
  }

  if (loading) return <p className="text-stone-500">Завантаження...</p>
  if (error) return <p className="text-red-400 text-sm">{error}</p>

  return (
    <div className="max-w-4xl mx-auto w-full flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-stone-500">Коло суперників</p>
          <h1 className="text-4xl text-amber-50">Гравці</h1>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Пошук за іменем..."
            className="bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-stone-100 text-sm placeholder-stone-600"
          />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold cursor-pointer whitespace-nowrap"
          >
            Додати гравця
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-widest text-stone-500">Сортування</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={`px-3 py-1.5 rounded-md border text-sm cursor-pointer ${
                sort === s.key
                  ? 'bg-amber-500 border-amber-500 text-stone-950 font-semibold'
                  : 'border-stone-700 text-stone-300 hover:border-stone-500'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-stone-500">
          Показано {filtered.length} з {cards.length}
        </p>
      </div>

      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}
      {activeInvite && (
        <p className="text-amber-400 text-sm">
          У тебе вже є активна гра чи запрошення — заверши або скасуй його на сторінці "Поточна
          гра", перш ніж запрошувати іншого гравця.
        </p>
      )}

      {filtered.length === 0 && <p className="text-stone-500 text-center py-10">Нічого не знайдено.</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((card) => {
          const { profile, totalGames } = card
          const hasGames = totalGames > 0
          return (
            <div
              key={profile.id}
              className={`border rounded-lg p-5 flex flex-col gap-3 ${
                hasGames ? 'border-stone-800' : 'border-stone-900 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${avatarColor(profile.display_name)}`}
                  >
                    {getInitials(profile.display_name)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-lg text-stone-100 truncate">{profile.display_name}</p>
                    <p className="text-xs text-stone-500 truncate">
                      {hasGames ? `Остання гра ${formatDate(card.lastPlayedAt)}` : 'Ще не грали'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-mono text-stone-100">
                    {card.wins} – {card.losses}
                  </p>
                  <p className="text-[10px] uppercase text-stone-500">твій рахунок</p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-stone-500 mb-1">
                  <span>Твій вінрейт проти</span>
                  <span>{card.winRate === null ? '—' : `${card.winRate}%`}</span>
                </div>
                <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600" style={{ width: `${card.winRate ?? 0}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="border border-stone-800 rounded-md py-2">
                  <p className="text-lg text-stone-100">{card.totalGames}</p>
                  <p className="text-[10px] uppercase text-stone-500">партій</p>
                </div>
                <div className="border border-stone-800 rounded-md py-2">
                  <p
                    className={`text-lg ${
                      card.streak > 0
                        ? 'text-green-400'
                        : card.streak < 0
                          ? 'text-red-400'
                          : 'text-stone-100'
                    }`}
                  >
                    {card.streak === null ? '—' : card.streak > 0 ? `+${card.streak}` : card.streak}
                  </p>
                  <p className="text-[10px] uppercase text-stone-500">серія</p>
                </div>
                <div className="border border-stone-800 rounded-md py-2">
                  <p className="text-lg text-stone-100">{card.avgPoints ?? '—'}</p>
                  <p className="text-[10px] uppercase text-stone-500">сер. очок</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 flex-wrap">
                <p className="text-xs text-stone-500 truncate min-w-0 flex-1">
                  Улюблена колода: <span className="text-stone-300">{card.favoriteFaction ?? '—'}</span>
                </p>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => setProfileTarget(profile)}
                    className="px-3 py-1.5 rounded-md border border-stone-700 hover:border-stone-500 text-stone-200 text-sm cursor-pointer"
                  >
                    Профіль
                  </button>
                  <button
                    onClick={() => handleInvite(profile.id)}
                    disabled={!!activeInvite || invitingId === profile.id}
                    className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-stone-950 text-sm font-semibold"
                  >
                    Почати гру
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {showAddModal && <AddPlayerModal onClose={() => setShowAddModal(false)} />}
      {profileTarget && (
        <PlayerProfileModal profile={profileTarget} onClose={() => setProfileTarget(null)} />
      )}
    </div>
  )
}
