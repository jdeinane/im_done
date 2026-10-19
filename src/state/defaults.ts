import type { AppState, Block } from '../domain/types'

export const DEFAULT_TEMPLATE: Block[] = [
  { id: 'leetcode', name: 'LeetCode', emoji: '🧩', color: '#6366f1', targetMin: 120 },
  { id: 'backend', name: 'Backend', emoji: '💻', color: '#0ea5e9', targetMin: 120 },
  { id: 'pilates', name: 'Pilates', emoji: '🧘', color: '#ec4899', targetMin: 60 },
  { id: 'muscu', name: 'Muscu', emoji: '🏋️', color: '#ef4444', targetMin: 80 },
  { id: 'lecture', name: 'Lecture', emoji: '📚', color: '#10b981', targetMin: 60 },
]

export function initialState(): AppState {
  return { schemaVersion: 1, template: DEFAULT_TEMPLATE, days: {}, activeBlockId: null }
}
