import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AuthLayout from '../components/AuthLayout'

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <AuthLayout mode="login" eyebrow="З поверненням" title="Вхід">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="bg-red-950 border border-red-800 text-red-300 rounded-md px-3 py-2 text-[17px]">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm uppercase tracking-widest text-stone-500">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="geralt@kaer-morhen.gg"
            className="bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-[17px] text-stone-100 placeholder-stone-600"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="flex items-center justify-between">
            <span className="text-sm uppercase tracking-widest text-stone-500">Пароль</span>
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="text-sm text-amber-400 hover:text-amber-300 cursor-pointer"
            >
              {showPassword ? 'Приховати' : 'Показати'}
            </button>
          </span>
          <input
            type={showPassword ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-[17px] text-stone-100"
          />
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="mt-1 px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-stone-950 font-semibold text-[17px]"
        >
          {submitting ? 'Вхід...' : 'Увійти'}
        </button>

        <p className="text-[17px] text-stone-500 text-center">
          Немає акаунта?{' '}
          <Link to="/register" className="text-amber-400 hover:text-amber-300">
            Зареєструватись
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
