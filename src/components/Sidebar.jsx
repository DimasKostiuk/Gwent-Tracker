import { NavLink } from 'react-router-dom'

const links = [
  { to: '/dashboard', label: 'Дашборд', icon: '📊' },
  { to: '/game', label: 'Поточна гра', icon: '🎮' },
  { to: '/history', label: 'Історія', icon: '📜' },
  { to: '/players', label: 'Гравці', icon: '👥' },
]

export default function Sidebar() {
  return (
    <>
      <nav className="hidden md:flex md:flex-col md:w-56 md:shrink-0 border-r border-zinc-800 bg-zinc-950 p-3 gap-1">
        <span className="text-lg font-semibold text-zinc-100 px-2 py-3">Gwent Tracker</span>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive ? 'bg-red-700 text-white' : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
              }`
            }
          >
            <span>{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-10 border-t border-zinc-800 bg-zinc-950 flex">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                isActive ? 'text-red-500' : 'text-zinc-400'
              }`
            }
          >
            <span className="text-lg leading-none">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>
    </>
  )
}
