import { useNavigate } from 'react-router-dom'
import { useGameInvite } from '../lib/GameInviteContext'

export default function InvitePopup() {
  const navigate = useNavigate()
  const { activeInvite, isInvitee, opponent, acceptInvite, declineInvite } = useGameInvite()

  if (!activeInvite || activeInvite.status !== 'pending' || !isInvitee) return null

  async function handleAccept() {
    await acceptInvite()
    navigate('/game')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-sm bg-stone-950 border border-stone-700 rounded-lg p-5 flex flex-col gap-4 text-center">
        <h2 className="text-xl text-amber-50">Запрошення у гру</h2>
        <p className="text-stone-300">
          <span className="font-semibold text-stone-100">{opponent?.display_name}</span> запрошує вас
          зіграти.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={declineInvite}
            className="px-4 py-2 rounded-md border border-stone-700 hover:border-stone-500 text-stone-200 text-sm cursor-pointer"
          >
            Відхилити
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 text-sm font-semibold cursor-pointer"
          >
            Прийняти
          </button>
        </div>
      </div>
    </div>
  )
}
