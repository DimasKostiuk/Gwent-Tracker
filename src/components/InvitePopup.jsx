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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-lg p-5 flex flex-col gap-4 text-center">
        <h2 className="text-lg font-semibold text-zinc-100">Запрошення у гру</h2>
        <p className="text-zinc-300">
          <span className="font-semibold">{opponent?.display_name}</span> запрошує вас зіграти.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={declineInvite}
            className="px-4 py-2 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-sm"
          >
            Відхилити
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-2 rounded-md bg-green-700 hover:bg-green-600 text-white text-sm font-medium"
          >
            Прийняти
          </button>
        </div>
      </div>
    </div>
  )
}
