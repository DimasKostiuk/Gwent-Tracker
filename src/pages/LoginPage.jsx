import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm flex flex-col gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-6"
      >
        <h1 className="text-xl font-bold text-zinc-100 text-center">Вхід</h1>

        {error && (
          <p className="bg-red-950 border border-red-800 text-red-300 rounded-md px-3 py-2 text-sm">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-zinc-400">
          Пароль
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-zinc-950 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 px-4 py-2 rounded-md bg-red-700 hover:bg-red-600 disabled:opacity-60 text-white font-medium"
        >
          {submitting ? 'Вхід...' : 'Увійти'}
        </button>

        <p className="text-sm text-zinc-500 text-center">
          Немає акаунта?{' '}
          <Link to="/register" className="text-red-400 hover:underline">
            Зареєструватись
          </Link>
        </p>
      </form>
    </div>
  )
}
