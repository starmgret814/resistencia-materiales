import type { CSSProperties } from 'react'

export interface ReadingPreferences { fontSize: number; leading: number; width: number }
export const READING_PREFERENCES_KEY = 'mc361-reading-preferences-v1'
export const defaultReadingPreferences: ReadingPreferences = { fontSize: 20, leading: 1.8, width: 840 }

const limits = { fontSize: [18, 26, 1], leading: [1.5, 2.1, .05], width: [680, 1080, 20] } as const
function snap(value: unknown, [min, max, step]: readonly [number, number, number], fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  const bounded = Math.min(max, Math.max(min, value))
  return Number((Math.round((bounded - min) / step) * step + min).toFixed(2))
}

/** Accept the previous three-choice format so existing browser preferences migrate safely. */
export function parseReadingPreferences(value: unknown): ReadingPreferences {
  if (!value || typeof value !== 'object') return { ...defaultReadingPreferences }
  const candidate = value as Record<string, unknown>
  const legacySizes = { comfortable: 20, large: 22, larger: 24 } as Record<string, number>
  const legacyLeading = { compact: 1.65, comfortable: 1.8, spacious: 2 } as Record<string, number>
  const legacyWidths = { narrow: 720, comfortable: 840, wide: 980 } as Record<string, number>
  return {
    fontSize: snap(typeof candidate.fontSize === 'string' ? legacySizes[candidate.fontSize] : candidate.fontSize, limits.fontSize, 20),
    leading: snap(typeof candidate.leading === 'string' ? legacyLeading[candidate.leading] : candidate.leading, limits.leading, 1.8),
    width: snap(typeof candidate.width === 'string' ? legacyWidths[candidate.width] : candidate.width, limits.width, 840),
  }
}

export function readingPreferenceStyle(preferences: ReadingPreferences) {
  const safe = parseReadingPreferences(preferences)
  return { '--reader-font-size': `${safe.fontSize}px`, '--reader-line-height': String(safe.leading), '--reader-width': `${safe.width}px` } as CSSProperties
}

export const readingPreferenceLimits = limits
