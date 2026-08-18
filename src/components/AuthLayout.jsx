import { Link } from 'react-router-dom'
import logo from '../assets/gwent-tracker-logo.png'
import sigil from '../assets/gwent-sigil.png'

export default function AuthLayout({ mode, eyebrow, title, children }) {
  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-stone-950">
      <div className="pointer-events-none absolute -top-32 -right-32 w-96 h-96 rounded-full bg-amber-500/20 blur-3xl" />

      <img
        src={sigil}
        alt=""
        className="pointer-events-none select-none absolute -left-52 -bottom-52 w-[520px] opacity-10"
      />
      <img
        src={sigil}
        alt=""
        className="pointer-events-none select-none absolute -right-52 top-1/4 w-[520px] opacity-10"
      />

      <div className="relative z-10 p-6 mt-16 sm:mt-4">
        <img src={logo} alt="Gwent Tracker" className="h-16 w-auto object-contain" />
      </div>

      <div className="relative z-10 flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm flex flex-col gap-5 text-[17px]">
          <div>
            <p className="text-sm uppercase tracking-widest text-stone-500">{eyebrow}</p>
            <h1 className="text-4xl text-amber-50">{title}</h1>
          </div>

          <div className="grid grid-cols-2 border border-stone-700 rounded-md overflow-hidden">
            <Link
              to="/login"
              className={`text-center py-2.5 font-medium transition-colors ${
                mode === 'login'
                  ? 'bg-stone-800 text-stone-100'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Вхід
            </Link>
            <Link
              to="/register"
              className={`text-center py-2.5 font-medium transition-colors ${
                mode === 'register'
                  ? 'bg-stone-800 text-stone-100'
                  : 'text-stone-500 hover:text-stone-300'
              }`}
            >
              Реєстрація
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}
