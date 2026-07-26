import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import AuthLayout from '../components/AuthLayout'

const STRENGTH = [
  { label: 'Короткий', color: 'bg-red-600' },
  { label: 'Слабкий', color: 'bg-red-500' },
  { label: 'Середній', color: 'bg-amber-500' },
  { label: 'Хороший', color: 'bg-amber-400' },
  { label: 'Надійний', color: 'bg-green-500' },
]

function passwordStrength(password) {
  if (!password) return null
  let score = 0
  if (password.length >= 6) score++
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  const level = Math.min(score, STRENGTH.length - 1)
  return { ...STRENGTH[level], percent: ((level + 1) / STRENGTH.length) * 100 }
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const strength = passwordStrength(password)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })

    if (error) {
      setError(error.message)
      setSubmitting(false)
      return
    }

    if (!data.session) {
      // Falls back here only if "Confirm email" is still enabled in Supabase.
      setError('Реєстрація успішна, але потрібне підтвердження email — перевірте пошту.')
      setSubmitting(false)
      return
    }

    navigate('/dashboard')
  }

  return (
    <AuthLayout mode="register" eyebrow="Новий гравець" title="Сідай за стіл">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <p className="bg-red-950 border border-red-800 text-red-300 rounded-md px-3 py-2 text-[17px]">
            {error}
          </p>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm uppercase tracking-widest text-stone-500">Ім'я за столом</span>
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Ґеральт"
            className="bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-[17px] text-stone-100 placeholder-stone-600"
          />
        </label>

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
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-stone-950 border border-stone-700 rounded-md px-3 py-2 text-[17px] text-stone-100"
          />
          {strength && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${strength.color}`}
                  style={{ width: `${strength.percent}%` }}
                />
              </div>
              <span className="text-sm uppercase tracking-widest text-stone-500">
                {strength.label}
              </span>
            </div>
          )}
        </label>

        <label className="flex items-center gap-2 text-[17px] text-stone-400">
          <input
            type="checkbox"
            required
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="accent-amber-500"
          />
          Погоджуюсь із{' '}
          <a
            href="/rules"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-amber-400 hover:text-amber-300 underline"
          >
            правилами
          </a>
        </label>

        <button
          type="submit"
          disabled={submitting || !agreed}
          className="mt-1 px-4 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer text-stone-950 font-semibold text-[17px]"
        >
          {submitting ? 'Реєстрація...' : 'Створити акаунт'}
        </button>

        <p className="text-[17px] text-stone-500 text-center">
          Вже маєш акаунт?{' '}
          <Link to="/login" className="text-amber-400 hover:text-amber-300">
            Увійти
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
