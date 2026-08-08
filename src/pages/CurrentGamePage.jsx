import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { useGameInvite } from '../lib/GameInviteContext'
import { getMyGamesCount, getProfiles } from '../lib/api'
import { FACTIONS } from '../lib/factions'
import { MAX_ROUNDS, isMatchDecided, resolveRoundWinner } from '../lib/gwentRules'
import PlayerPanel from '../components/PlayerPanel'
import ConfirmDialog from '../components/ConfirmDialog'

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
    undoLastRound,
    finishGame,
    dismiss,
  } = useGameInvite()

  const me = { id: user.id, name: user.user_metadata?.display_name || user.email }

  const [subPhase, setSubPhase] = useState('idle') // 'idle' | 'inviting'
  const [profiles, setProfiles] = useState([])
  const [profilesError, setProfilesError] = useState(null)
  const [actionError, setActionError] = useState(null)

  const [selectedFaction, setSelectedFaction] = useState(FACTIONS[0])
  const [confirmingFaction, setConfirmingFaction] = useState(false)

  const [confirmingRound, setConfirmingRound] = useState(false)
  const [pendingForceTie, setPendingForceTie] = useState(false)
  const [confirmingUndo, setConfirmingUndo] = useState(false)
  const [confirmingGame, setConfirmingGame] = useState(false)
  const [busy, setBusy] = useState(false)

  const [gameNumber, setGameNumber] = useState(null)
  const [now, setNow] = useState(() => Date.now())

  const isPlayingPhase = activeInvite?.status === 'playing'

  useEffect(() => {
    if (!isPlayingPhase) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isPlayingPhase])

  const elapsedSeconds =
    isPlayingPhase && activeInvite?.game_started_at
      ? Math.max(0, Math.floor((now - new Date(activeInvite.game_started_at).getTime()) / 1000))
      : 0
  const durationLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(
    elapsedSeconds % 60,
  ).padStart(2, '0')}`

  const myRoundsWon = rounds.filter((r) => r.result === 'win').length
  const opponentRoundsWon = rounds.filter((r) => r.result === 'loss').length
  const matchDecided = isMatchDecided(myRoundsWon, opponentRoundsWon, rounds.length)

  useEffect(() => {
    if (subPhase !== 'inviting') return
    getProfiles()
      .then((data) => setProfiles(data.filter((p) => p.id !== user.id)))
      .catch((err) => setProfilesError(err.message))
  }, [subPhase, user.id])

  useEffect(() => {
    if (activeInvite?.status !== 'playing') return
    getMyGamesCount(user.id)
      .then((count) => setGameNumber(count + 1))
      .catch(() => {})
  }, [activeInvite?.status, user.id])

  async function handleConfirmFaction() {
    setActionError(null)
    setConfirmingFaction(true)
    try {
      await setMyFaction(selectedFaction)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setConfirmingFaction(false)
    }
  }

  async function handleInvite(toUserId) {
    setActionError(null)
    try {
      await sendInvite(toUserId)
    } catch (err) {
      setActionError(err.message)
    }
  }

  function handleRequestFinishRound(forceTie) {
    setActionError(null)
    setPendingForceTie(forceTie)
    setConfirmingRound(true)
  }

  async function handleConfirmRound() {
    setBusy(true)
    try {
      await finishRound({ forceTie: pendingForceTie })
      setConfirmingRound(false)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleConfirmUndo() {
    setBusy(true)
    try {
      await undoLastRound()
      setConfirmingUndo(false)
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
      await finishGame(!matchDecided)
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
    const myWins = rounds.filter((r) => r.result === 'win').length
    const opponentWins = rounds.filter((r) => r.result === 'loss').length
    return (
      <div className="max-w-md mx-auto flex flex-col items-center text-center gap-4 pt-12">
        <h1 className="text-3xl text-amber-50">Гру завершено</h1>
        <p className="text-stone-400">
          Фінальний рахунок: <span className="font-mono text-stone-100">{myWins} : {opponentWins}</span>
        </p>
        <p className="text-lg">
          {myWins > opponentWins && <span className="text-green-500 font-semibold">Ти переміг!</span>}
          {myWins < opponentWins && (
            <span className="text-red-500 font-semibold">Переможець {opponent?.display_name}</span>
          )}
          {myWins === opponentWins && <span className="text-sky-400 font-semibold">Нічия!</span>}
        </p>
        <button
          onClick={handleDismissFinished}
          className="px-6 py-3 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold cursor-pointer"
        >
          Добре
        </button>
      </div>
    )
  }

  // --- Жива гра: раунди, очки, завершення ---
  if (activeInvite?.status === 'playing') {
    const mySlots = Array.from({ length: MAX_ROUNDS }, (_, i) => {
      const r = rounds[i]
      if (!r) return null
      return { points: r.myPoints, result: r.result }
    })
    const opponentSlots = Array.from({ length: MAX_ROUNDS }, (_, i) => {
      const r = rounds[i]
      if (!r) return null
      const opponentResult = r.result === 'tie' ? 'tie' : r.result === 'win' ? 'loss' : 'win'
      return { points: r.opponentPoints, result: opponentResult }
    })

    const displayRound = matchDecided ? rounds.length : Math.min(rounds.length + 1, MAX_ROUNDS)
    const delta = myPoints - opponentPoints

    const previewWinner = resolveRoundWinner(myPoints, opponentPoints, myFaction, opponentFaction)
    let previewText
    if (previewWinner === 'tie') {
      previewText = 'Нічия в раунді.'
    } else {
      const winnerName = previewWinner === 'a' ? me.name : opponent?.display_name
      previewText =
        delta === 0
          ? `${winnerName} виграє раунд завдяки нічиї (Нільфгард).`
          : `${winnerName} виграє раунд з перевагою ${Math.abs(delta)}.`
    }

    return (
      <div className="max-w-5xl mx-auto w-full flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-widest text-stone-500">
              {new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}
              {gameNumber && <> · Партія #{gameNumber}</>}
            </p>
            <h1 className="text-3xl text-amber-50">
              Раунд {displayRound} з {MAX_ROUNDS}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-green-800 text-green-400 text-xs uppercase tracking-wide">
              <span className="inline-block w-1.5 h-1.5 rotate-45 bg-green-400" />
              Гра йде
            </span>
            <button
              onClick={() => setConfirmingGame(true)}
              className="px-4 py-1.5 rounded-md border border-stone-700 hover:border-stone-500 text-stone-200 text-sm cursor-pointer"
            >
              Завершити гру
            </button>
          </div>
        </div>

        <div className="md:hidden flex items-center gap-1.5 text-xs text-stone-400 -mt-1">
          <span className="inline-block w-1.5 h-1.5 rotate-45 bg-amber-400 shrink-0" />
          Тривалість: <span className="font-mono text-amber-400">{durationLabel}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-2">
          <PlayerPanel
            name={me.name}
            faction={myFaction}
            roundSlots={mySlots}
            roundsWon={myRoundsWon}
            currentPoints={myPoints}
            onPointsChange={setMyPoints}
            disabled={matchDecided}
            showCalculator
          />

          <div className="border border-stone-800 rounded-lg p-3 flex flex-col items-center justify-center gap-2 md:w-32">
            <div className="text-center">
              <p className="text-[10px] uppercase tracking-widest text-stone-500">Раунди</p>
              <p className="text-2xl font-mono mt-1">
                <span className="text-amber-100">{myRoundsWon}</span>
                <span className="text-stone-700 mx-1.5">|</span>
                <span className="text-stone-500">{opponentRoundsWon}</span>
              </p>
            </div>
            <div className="border-t border-stone-800 pt-3 text-center">
              <p className="text-[10px] uppercase tracking-widest text-stone-500">Перевага</p>
              <p className="text-2xl font-semibold text-amber-400 mt-1">
                {delta === 0 ? '0' : delta > 0 ? `+${delta}` : `−${Math.abs(delta)}`}
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {delta === 0 ? 'Порівну' : `${delta > 0 ? me.name : opponent?.display_name} попереду`}
              </p>
            </div>
          </div>

          <PlayerPanel
            name={opponent?.display_name}
            faction={opponentFaction}
            roundSlots={opponentSlots}
            roundsWon={opponentRoundsWon}
            currentPoints={opponentPoints}
            onPointsChange={() => {}}
            disabled
            align="right"
          />
        </div>

        <div className="border border-stone-800 rounded-lg p-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-stone-400">
            {matchDecided ? 'Партію вирішено — натисни «Завершити гру» вгорі.' : previewText}
          </p>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setConfirmingUndo(true)}
              disabled={rounds.length === 0}
              className="px-4 py-2 rounded-md border border-stone-700 hover:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-stone-200 text-sm font-medium"
            >
              Скасувати дію
            </button>
            <button
              onClick={() => handleRequestFinishRound(true)}
              disabled={matchDecided}
              className="px-4 py-2 rounded-md border border-stone-700 hover:border-stone-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-stone-200 text-sm font-medium"
            >
              Нічия в раунді
            </button>
            <button
              onClick={() => handleRequestFinishRound(false)}
              disabled={matchDecided}
              className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer text-stone-950 text-sm font-semibold"
            >
              Завершити раунд
            </button>
          </div>
        </div>

        {actionError && <p className="text-red-400 text-sm">{actionError}</p>}

        <ConfirmDialog
          open={confirmingRound}
          title="Завершити раунд?"
          message={(() => {
            const winner = pendingForceTie
              ? resolveRoundWinner(0, 0, myFaction, opponentFaction)
              : resolveRoundWinner(myPoints, opponentPoints, myFaction, opponentFaction)
            let resultLine
            if (winner === 'tie') {
              resultLine = 'Нічия'
            } else {
              const winnerName = winner === 'a' ? me.name : opponent?.display_name
              const nilfNote =
                pendingForceTie || myPoints === opponentPoints
                  ? ' (нічия — вирішує лідер Нільфгарда)'
                  : ''
              resultLine = `Переможець раунду: ${winnerName}${nilfNote}`
            }
            const scoreLine = pendingForceTie
              ? `Раунд ${rounds.length + 1} оголошується нічиєю`
              : `Раунд ${rounds.length + 1}: ${me.name} ${myPoints} : ${opponentPoints} ${opponent?.display_name}`
            return `${scoreLine}\n${resultLine}`
          })()}
          confirming={busy}
          error={confirmingRound ? actionError : null}
          onConfirm={handleConfirmRound}
          onCancel={() => setConfirmingRound(false)}
        />

        <ConfirmDialog
          open={confirmingUndo}
          title="Скасувати останню дію?"
          message="Останній зафіксований раунд буде видалено, а його очки повернуться в поле для редагування."
          confirming={busy}
          error={confirmingUndo ? actionError : null}
          onConfirm={handleConfirmUndo}
          onCancel={() => setConfirmingUndo(false)}
        />

        <ConfirmDialog
          open={confirmingGame}
          title="Завершити гру?"
          message={`${
            matchDecided
              ? ''
              : '⚠ Гра ще не закінчена (зіграно не всі вирішальні раунди)! Ти точно хочеш завершити її достроково?\n\n'
          }Поточний рахунок: ${myRoundsWon} : ${opponentRoundsWon}\nРезультат: ${
            myRoundsWon > opponentRoundsWon
              ? `переміг ${me.name}`
              : myRoundsWon < opponentRoundsWon
                ? `переміг ${opponent?.display_name}`
                : 'нічия'
          }${matchDecided ? '' : ' (буде позначено як незавершена гра)'}\n\nЦю дію не можна скасувати — результат буде збережено в історію.`}
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
        <h1 className="text-3xl text-amber-50">Оберіть сторону</h1>
        <p className="text-stone-400">
          Гра проти <span className="text-stone-100 font-medium">{opponent?.display_name}</span>
        </p>
        <div className="border border-stone-800 rounded-lg p-4 flex flex-col gap-3">
          <p className="text-sm text-stone-400">Твоя сторона</p>
          {myFaction ? (
            <p className="text-stone-100 font-medium">{myFaction}</p>
          ) : (
            <>
              <select
                value={selectedFaction}
                onChange={(e) => setSelectedFaction(e.target.value)}
                className="bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-stone-100"
              >
                {FACTIONS.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
              <button
                onClick={handleConfirmFaction}
                disabled={confirmingFaction}
                className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-stone-950 font-semibold"
              >
                {confirmingFaction ? 'Зачекайте...' : 'Підтвердити сторону'}
              </button>
            </>
          )}
        </div>
        {actionError && <p className="text-red-400 text-sm">{actionError}</p>}
        {myFaction && !opponentFaction && (
          <p className="text-stone-500 text-sm">Очікуємо, поки {opponent?.display_name} обере сторону...</p>
        )}
      </div>
    )
  }

  // --- Мене запросили і я ще не відповів (fallback, якщо потрапив без поп-апу) ---
  if (activeInvite?.status === 'pending' && isInvitee) {
    return (
      <div className="max-w-md mx-auto flex flex-col items-center text-center gap-5 pt-12">
        <h1 className="text-3xl text-amber-50">Запрошення у гру</h1>
        <p className="text-stone-400">
          <span className="text-stone-100 font-medium">{opponent?.display_name}</span> запрошує вас
          зіграти.
        </p>
        <div className="flex gap-3">
          <button
            onClick={declineInvite}
            className="px-4 py-2 rounded-md border border-stone-700 hover:border-stone-500 text-stone-200 cursor-pointer"
          >
            Відхилити
          </button>
          <button
            onClick={acceptInvite}
            className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold cursor-pointer"
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
        <h1 className="text-3xl text-amber-50">Очікування відповіді</h1>
        <p className="text-stone-400">
          Запрошення надіслано{' '}
          <span className="text-stone-100 font-medium">{opponent?.display_name}</span>. Чекаємо,
          поки гравець прийме.
        </p>
        <span className="text-stone-600 text-sm animate-pulse">●●●</span>
        <button
          onClick={cancelInvite}
          className="px-4 py-2 rounded-md border border-stone-700 hover:border-stone-500 text-stone-200 text-sm cursor-pointer"
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
        <h1 className="text-3xl text-amber-50">Поточна гра</h1>
        <p className="text-stone-500 max-w-sm">
          Запроси іншого гравця, щоб почати нову ігрову сесію.
        </p>
        <button
          onClick={() => setSubPhase('inviting')}
          className="px-6 py-3 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold cursor-pointer"
        >
          Почати гру
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-4">
      <h1 className="text-3xl text-amber-50">Оберіть суперника</h1>
      {profilesError && <p className="text-red-400 text-sm">{profilesError}</p>}
      {actionError && <p className="text-red-400 text-sm">{actionError}</p>}
      <ul className="flex flex-col gap-2">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="flex items-center justify-between border border-stone-800 rounded-md px-4 py-3"
          >
            <span className="text-stone-100">{p.display_name}</span>
            <button
              onClick={() => handleInvite(p.id)}
              className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold cursor-pointer"
            >
              Запросити
            </button>
          </li>
        ))}
        {profiles.length === 0 && !profilesError && (
          <p className="text-stone-500 text-sm">Немає інших зареєстрованих гравців.</p>
        )}
      </ul>
      <button
        onClick={() => setSubPhase('idle')}
        className="text-sm text-stone-500 hover:text-stone-300 self-start cursor-pointer"
      >
        ← Назад
      </button>
    </div>
  )
}
