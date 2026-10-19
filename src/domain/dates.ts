/** Clé de jour locale 'YYYY-MM-DD'. */
export function toDateKey(ms: number): string {
  const d = new Date(ms)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

function parseKey(key: string): [number, number, number] {
  const [y, m, d] = key.split('-').map(Number)
  return [y, m - 1, d]
}

/** Décale une clé de jour de n jours (négatif = passé). */
export function addDays(key: string, n: number): string {
  const [y, m, d] = parseKey(key)
  return toDateKey(new Date(y, m, d + n).getTime())
}

/** Timestamp (ms) du début du jour suivant la clé donnée (minuit local). */
export function startOfNextDay(key: string): number {
  const [y, m, d] = parseKey(key)
  return new Date(y, m, d + 1).getTime()
}
