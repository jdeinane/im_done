const pad = (n: number) => String(n).padStart(2, '0')

/** Chrono : « 05:09 », ou « 1:05:09 » à partir d'une heure. */
export function formatClock(ms: number): string {
  const total = Math.floor(Math.max(0, ms) / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

/** Dépassement : « +05:09 ». */
export function formatOvertime(ms: number): string {
  return `+${formatClock(ms)}`
}

/** Durée en minutes : « 2h », « 1h20 », « 45 min ». */
export function formatDuration(minutes: number): string {
  const total = Math.round(Math.max(0, minutes))
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m} min`
  return m === 0 ? `${h}h` : `${h}h${pad(m)}`
}
