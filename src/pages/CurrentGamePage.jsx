import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useGameInvite } from '../lib/GameInviteContext'
import { getProfiles } from '../lib/api'
import { FACTIONS } from '../lib/factions'
import PlayerPanel from '../components/PlayerPanel'
import ConfirmDialog from '../components/ConfirmDialog'

const MAX_ROUNDS = 3
const ROUNDS_TO_WIN = 2

export default function CurrentGamePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    activeInvite,
    isInvitee,
    opponent,
    myFaction,
    opponentFaction,
    myPoints,
    opponentPoints,
    rounds,
    sendInvite,
    acceptInvite,
    declineInvite,
    cancelInvite,
    setMyFaction,
    setMyPoints,
    finishRound,
    finishGame,
    dismiss,
  } = useGameInvite()

  const me = { id: user.id, name: user.user_metadata?.display_name || user.email }

  const [subPhase, setSubPhase] = useState('idle') // 'idle' | 'inviting'
  const [profiles, setProfiles] = useState([])
  const [profilesError, setProfilesError] = useState(null)
  const [actionError, setActionError] = useState(null)

  const [confirmingRound, setConfirmingRound] = useState(false)
  const [confirmingGame, setConfirmingGame] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (subPhase !== 'inviting') return
    getProfiles()
      .then((data) => setProfiles(data.filter((p) => p.id !== user.id)))
      .catch((err) => setProfilesError(err.message))
  }, [subPhase, user.id])

  // Дефолтна фракція виставляється сама, щоб гра рушила далі, навіть якщо
  // гравець просто погодиться з першим варіантом і не чіпатиме дропдаун.
  useEffect(() => {
    if (activeInvite?.status === 'accepted' && !myFaction) {
      setMyFaction(FACTIONS[0]).catch((err) => setActionError(err.message))
    }
  }, [activeInvite?.status, myFaction])

  async function handleInvite(toUserId) {
    setActionError(null)
    try {
      await sendInvite(toUserId)
    } catch (err) {
      setActionError(err.message)
    }
  }

  async function handleRequestFinishRound() {
    if (myPoints === opponentPoints) {
      setActionError('Раунд не може закінчитись внічию — очки мають відрізнятись.')
      return
    }
    setActionError(null)
    setConfirmingRound(true)
  }

  async function handleConfirmRound() {
    setBusy(true)
    try {
      await finishRound()
      setConfirmingRound(false)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmGame() {
    setBusy(true)
    setActionError(null)
    try {
      await finishGame()
      setConfirmingGame(false)
      navigate('/dashboard')
    } catch (err) {
      setActionError(err.message)
      setBusy(false)
    }
  }

  async function handleDismissFinished() {
    try {
      await dismiss()
    } finally {
      navigate('/dashboard')
    }
  }

  // --- Гру завершено: підсумок, доки хтось не натисне "Добре" ---
  if (activeInvite?.status === 'finished') {
    const myWins = rounds.filter((r) => r.iWon).length
    const opponentWins = rounds.filter((r) => !r.iWon).length
    return (
      <div className="max-w-md mx-auto flex flex-col items-center text-center gap-4 pt-12">
        <h1 className="text-2xl font-bold text-zinc-100">Гру завершено</h1>
        <p className="text-zinc-400">
          Фінальний рахунок: <span className="font-mono text-zinc-100">{myWins} : {opponentWins}</span>
        </p>
        <p className="text-lg">
          {myWins > opponentWins ? (
            <span className="text-green-500 font-semibold">Ти переміг!</span>
          ) : (
            <span className="text-red-500 font-semibold">Переміг {opponent?.display_name}</span>
          )}
        </p>
        <button
          onClick={handleDismissFinished}
          className="px-6 py-3 rounded-md bg-red-700 hover:bg-red-600 text-white font-medium"
        >
          Добре
        </button>
      </div>
    )
  }

  // --- Жива гра: раунди, очки, завершення ---
  if (activeInvite?.status === 'playing') {
    const myRoundsWon = rounds.filter((r) => r.iWon).length
    const opponentRoundsWon = rounds.filter((r) => !r.iWon).length
    const matchDecided =
      myRoundsWon >= ROUNDS_TO_WIN || opponentRoundsWon >= ROUNDS_TO_WIN || rounds.length >= MAX_ROUNDS

    const mySlots = Array.from({ length: MAX_ROUNDS }, (_, i) => {
      const r = rounds[i]
      if (!r) return null
      return { points: r.myPoints, result: r.iWon ? 'win' : 'loss' }
    })
    const opponentSlots = Array.from({ length: MAX_ROUNDS }, (_, i) => {
      const r = rounds[i]
      if (!r) return null
      return { points: r.opponentPoints, result: r.iWon ? 'loss' : 'win' }
    })

    const displayRound = matchDecided ? rounds.length : Math.min(rounds.length + 1, MAX_ROUNDS)

    return (
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm text-zinc-400">
            <span>
              {new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
              · Раунд {displayRound} з {MAX_ROUNDS}
            </span>
            <span className="text-xs px-2 py-1 rounded bg-green-900 text-green-400 font-medium">
              Гра йде
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <StatBox label="Раундів зіграно" value={rounds.length} />
            <StatBox label="Твої перемоги" value={myRoundsWon} accent="text-green-500" />
            <StatBox label="Перемоги суперника" value={opponentRoundsWon} accent="text-red-500" />
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <PlayerPanel
            name={`${me.name} (ти)`}
            faction={myFaction}
            roundSlots={mySlots}
            roundsWon={myRoundsWon}
            currentPoints={myPoints}
            onPointsChange={setMyPoints}
            disabled={matchDecided}
          />
          <PlayerPanel
            name={opponent?.display_name}
            faction={opponentFaction}
            roundSlots={opponentSlots}
            roundsWon={opponentRoundsWon}
            currentPoints={opponentPoints}
            onPointsChange={() => {}}
            disabled
          />
        </div>

        {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

        <div className="flex gap-3">
          <button
            onClick={handleRequestFinishRound}
            disabled={matchDecided}
            className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 text-sm font-medium"
          >
            ✓ Завершити раунд
          </button>
          <button
            onClick={() => setConfirmingGame(true)}
            disabled={rounds.length === 0}
            className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-zinc-100 text-sm font-medium"
          >
            ⚑ Завершити гру
          </button>
        </div>

        <ConfirmDialog
          open={confirmingRound}
          title="Завершити раунд?"
          message={`Раунд ${rounds.length + 1}: ${me.name} ${myPoints} : ${opponentPoints} ${opponent?.display_name}\nПереможець раунду: ${
            myPoints > opponentPoints ? me.name : opponent?.display_name
          }`}
          confirming={busy}
          error={confirmingRound ? actionError : null}
          onConfirm={handleConfirmRound}
          onCancel={() => setConfirmingRound(false)}
        />

        <ConfirmDialog
          open={confirmingGame}
          title="Завершити гру?"
          message={`Фінальний рахунок: ${myRoundsWon} : ${opponentRoundsWon}\nПереможець: ${
            myRoundsWon > opponentRoundsWon ? me.name : opponent?.display_name
          }\n\nЦю дію не можна скасувати — результат буде збережено в історію.`}
          confirming={busy}
          error={confirmingGame ? actionError : null}
          onConfirm={handleConfirmGame}
          onCancel={() => setConfirmingGame(false)}
        />
      </div>
    )
  }

  // --- Прийнято, чекаємо вибір фракцій ---
  if (activeInvite?.status === 'accepted') {
    return (
      <div className="max-w-md mx-auto flex flex-col gap-5">
        <h1 className="text-2xl font-bold text-zinc-100">Оберіть сторону</h1>
        <p className="text-zinc-400">
          Гра проти <span className="text-zinc-100 font-medium">{opponent?.display_name}</span>
        </p>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex flex-col gap-3">
          <p className="text-sm text-zinc-400">Твоя сторона</p>
          <select
            value={myFaction || FACTIONS[0]}
            onChange={(e) => setMyFaction(e.target.value).catch((err) => setActionError(err.message))}
            className="bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100"
          >
            {FACTIONS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>
        {actionError && <p className="text-red-400 text-sm">{actionError}</p>}
        {!opponentFaction && (
          <p className="text-zinc-500 text-sm">Очікуємо, поки {opponent?.display_name} обере сторону...</p>
        )}
      </div>
    )
  }

  // --- Мене запросили і я ще не відповів (fallback, якщо потрапив без поп-апу) ---
  if (activeInvite?.status === 'pending' && isInvitee) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center text-center gap-5 pt-12">
        <h1 className="text-2xl font-bold text-zinc-100">Запрошення у гру</h1>
        <p className="text-zinc-400">
          <span className="text-zinc-100 font-medium">{opponent?.display_name}</span> запрошує вас
          зіграти.
        </p>
        <div className="flex gap-3">
          <button
            onClick={declineInvite}
            className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100"
          >
            Відхилити
          </button>
          <button
            onClick={acceptInvite}
            className="px-4 py-2 rounded-md bg-green-700 hover:bg-green-600 text-white font-medium"
          >
            Прийняти
          </button>
        </div>
      </div>
    )
  }

  // --- Я щойно запросив когось і чекаю на відповідь ---
  if (activeInvite?.status === 'pending' && !isInvitee) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center text-center gap-5 pt-12">
        <h1 className="text-2xl font-bold text-zinc-100">Очікування відповіді</h1>
        <p className="text-zinc-400">
          Запрошення надіслано{' '}
          <span className="text-zinc-100 font-medium">{opponent?.display_name}</span>. Чекаємо,
          поки гравець прийме.
        </p>
        <span className="text-zinc-600 text-sm animate-pulse">●●●</span>
        <button
          onClick={cancelInvite}
          className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm"
        >
          Скасувати запрошення
        </button>
      </div>
    )
  }

  // --- Немає активного запрошення ---
  if (subPhase === 'idle') {
    return (
      <div className="flex flex-col items-center text-center gap-4 pt-12">
        <h1 className="text-2xl font-bold text-zinc-100">Поточна гра</h1>
        <p className="text-zinc-500 max-w-sm">
          Запроси іншого гравця, щоб почати нову ігрову сесію.
        </p>
        <button
          onClick={() => setSubPhase('inviting')}
          className="px-6 py-3 rounded-md bg-green-700 hover:bg-green-600 text-white font-medium"
        >
          Почати гру
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4">
      <h1 className="text-2xl font-bold text-zinc-100">Оберіть суперника</h1>
      {profilesError && <p className="text-red-400 text-sm">{profilesError}</p>}
      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}
      <ul className="flex flex-col gap-2">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between bg-zinc-900 border border-zinc-800 rounded-md px-4 py-3"
          >
            <span className="text-zinc-100">{p.display_name}</span>
            <button
              onClick={() => handleInvite(p.id)}
              className="px-3 py-1.5 rounded-md bg-red-700 hover:bg-red-600 text-white text-sm font-medium"
            >
              Запросити
            </button>
          </li>
        ))}
        {profiles.length === 0 && !profilesError && (
          <p className="text-zinc-500 text-sm">Немає інших зареєстрованих гравців.</p>
        )}
      </ul>
      <button
        onClick={() => setSubPhase('idle')}
        className="text-sm text-zinc-500 hover:text-zinc-300 self-start"
      >
        ← Назад
      </button>
    </div>
  )
}

function StatBox({ label, value, accent = 'text-zinc-100' }) {
  return (
    <div className="bg-zinc-950 border border-zinc-800 rounded-md p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className={`text-xl font-mono font-bold ${accent}`}>{value}</p>
    </div>
  )
}
