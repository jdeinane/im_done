import { describe, expect, it } from 'vitest'
import { formatClock, formatDuration, formatOvertime } from './format'

describe('format', () => {
  it('formate le chrono', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(309_000)).toBe('05:09')
    expect(formatClock(3_909_000)).toBe('1:05:09')
    expect(formatClock(-5000)).toBe('00:00')
  })

  it('tronque les millisecondes (pas d’arrondi qui avance le chrono)', () => {
    expect(formatClock(59_999)).toBe('00:59')
  })

  it('formate le dépassement', () => {
    expect(formatOvertime(309_000)).toBe('+05:09')
  })

  it('formate les durées cibles', () => {
    expect(formatDuration(120)).toBe('2h')
    expect(formatDuration(80)).toBe('1h20')
    expect(formatDuration(65)).toBe('1h05')
    expect(formatDuration(45)).toBe('45 min')
  })
})
