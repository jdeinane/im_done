import { describe, expect, it } from 'vitest'
import { MIN } from './fixtures'
import { adjustMinutes, elapsedMs, emptyProgress, pauseTimer, startTimer } from './timer'

const t0 = 1_000_000

describe('timer', () => {
  it('ne compte rien tant que le chrono est en pause', () => {
    expect(elapsedMs(emptyProgress('a'), t0 + 10 * MIN)).toBe(0)
  })

  it('dérive le temps écoulé des timestamps', () => {
    const running = startTimer(emptyProgress('a'), t0)
    expect(elapsedMs(running, t0 + 5 * MIN)).toBe(5 * MIN)
  })

  it('survit à une longue veille : le temps est celui de l’horloge, pas d’un compteur', () => {
    const running = startTimer(emptyProgress('a'), t0)
    // Aucun tick pendant 3 h, puis réouverture de la page.
    expect(elapsedMs(running, t0 + 180 * MIN)).toBe(180 * MIN)
  })

  it('cumule les sessions après pause', () => {
    let p = startTimer(emptyProgress('a'), t0)
    p = pauseTimer(p, t0 + 10 * MIN)
    p = startTimer(p, t0 + 60 * MIN)
    expect(elapsedMs(p, t0 + 65 * MIN)).toBe(15 * MIN)
  })

  it('start et pause sont idempotents', () => {
    const running = startTimer(emptyProgress('a'), t0)
    expect(startTimer(running, t0 + MIN)).toBe(running)
    const paused = emptyProgress('a')
    expect(pauseTimer(paused, t0)).toBe(paused)
  })

  it('ajoute et retire des minutes sans passer sous zéro', () => {
    let p = adjustMinutes(emptyProgress('a'), 20, t0)
    expect(elapsedMs(p, t0)).toBe(20 * MIN)
    p = adjustMinutes(p, -50, t0)
    expect(elapsedMs(p, t0)).toBe(0)
    p = adjustMinutes(p, 5, t0)
    expect(elapsedMs(p, t0)).toBe(5 * MIN)
  })

  it('le retrait de minutes tient compte du chrono en cours', () => {
    const running = startTimer(emptyProgress('a'), t0)
    const p = adjustMinutes(running, -100, t0 + 10 * MIN)
    expect(elapsedMs(p, t0 + 10 * MIN)).toBe(0)
  })
})
