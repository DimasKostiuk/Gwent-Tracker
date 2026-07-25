import { useEffect, useState } from 'react'
import { getProfiles } from '../lib/api'
import { avatarColor, getInitials } from '../lib/avatar'

export default function PlayersPage() {
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getProfiles()
      .then(setProfiles)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">
      <h1 className="text-2xl font-bold text-zinc-100">Гравці</h1>

      {loading && <p className="text-zinc-500">Завантаження...</p>}
      {error && <p className="text-red-400 text-sm">{error}</p>}
      {!loading && !error && profiles.length === 0 && (
        <p className="text-zinc-500">Ще ніхто не зареєструвався.</p>
      )}

      <ul className="flex flex-col gap-2">
        {profiles.map((p) => (
          <li
            key={p.id}
            className="flex items-center gap-3 bg-zinc-900 border border-zinc-800 rounded-md px-4 py-3"
          >
            <span
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${avatarColor(p.display_name)}`}
            >
              {getInitials(p.display_name)}
            </span>
            <div>
              <p className="text-zinc-100 font-medium">{p.display_name}</p>
              <p className="text-xs text-zinc-500">
                Зареєструвався{' '}
                {new Date(p.created_at).toLocaleDateString('uk-UA', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div></div>
          </li>
        ))}
      </ul>
    </div>
  )
}
