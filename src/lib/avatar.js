const AVATAR_COLORS = [
  'bg-blue-700',
  'bg-amber-700',
  'bg-emerald-700',
  'bg-purple-700',
  'bg-pink-700',
  'bg-cyan-700',
]

export function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function avatarColor(name) {
  let hash = 0
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % AVATAR_COLORS.length
  return AVATAR_COLORS[hash]
}
