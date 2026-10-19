let context: AudioContext | null = null

function getContext(): AudioContext | null {
  try {
    context ??= new AudioContext()
    return context
  } catch {
    return null
  }
}

/** À appeler depuis un geste utilisateur : les navigateurs bloquent l'audio sinon. */
export function primeSound(): void {
  void getContext()?.resume()
}

/** Petit carillon à deux notes, généré (pas de fichier audio à embarquer). */
export function playChime(): void {
  const ctx = getContext()
  if (!ctx) return
  void ctx.resume()
  const start = ctx.currentTime
  ;[659.25, 880].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const t = start + i * 0.16
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(0.25, t + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t)
    osc.stop(t + 0.4)
  })
}
