export function formatDuration(startedAt, finishedAt) {
  const ms = new Date(finishedAt).getTime() - new Date(startedAt).getTime()
  const totalSeconds = Math.max(0, Math.round(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds} с`
  return `${minutes} хв ${seconds} с`
}

export function formatDate(value) {
  return new Date(value).toLocaleDateString('uk-UA', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
