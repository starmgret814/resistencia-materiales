export type DraftValues = Record<string, string>
export interface DraftSnapshot<T extends DraftValues> { version: 1; savedAt: number; values: T }
type DraftStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export function localDraftKey(owner: string, scope: 'chapter' | 'exam', id: string) {
  return `mc361:local-draft:v1:${encodeURIComponent(owner.trim().toLowerCase())}:${scope}:${encodeURIComponent(id)}`
}

/** Browser storage only. Loading never overwrites a different recoverable copy. */
export class LocalDraftBuffer<T extends DraftValues> {
  pending: DraftSnapshot<T> | null = null
  savedAt: number | null = null
  failed = false
  private baseline: string
  private latest: T
  private written: string | null = null
  private stored: string | null = null

  constructor(private storage: DraftStorage, readonly key: string, initial: T, private now = Date.now) {
    this.latest = { ...initial }
    this.baseline = JSON.stringify(initial)
    try {
      const raw = storage.getItem(key)
      this.stored = raw
      if (!raw) return
      const snapshot = JSON.parse(raw)
      const fields = Object.keys(initial)
      if (snapshot?.version !== 1 || !Number.isFinite(snapshot.savedAt) || snapshot.savedAt <= 0 || !snapshot.values || typeof snapshot.values !== 'object'
        || Object.keys(snapshot.values).length !== fields.length || fields.some(field => typeof snapshot.values[field] !== 'string')) return
      const values = Object.fromEntries(fields.map(field => [field, snapshot.values[field]])) as T
      if (JSON.stringify(values) !== this.baseline) this.pending = { version: 1, savedAt: snapshot.savedAt, values }
    } catch { this.failed = true }
  }

  update(values: T) { this.latest = { ...values } }

  flush() {
    if (this.pending) return
    const text = JSON.stringify(this.latest)
    try {
      if (text === this.baseline) {
        // An idle tab must not delete a newer copy written by another tab.
        if (this.storage.getItem(this.key) === this.stored) this.storage.removeItem(this.key)
        this.stored = null
        this.written = null
        this.savedAt = null
      } else if (text !== this.written || this.failed) {
        const savedAt = this.now()
        const stored = JSON.stringify({ version: 1, savedAt, values: this.latest })
        this.storage.setItem(this.key, stored)
        this.stored = stored
        this.written = text
        this.savedAt = savedAt
      }
      this.failed = false
    } catch { this.failed = true }
  }

  recover(): T | undefined {
    if (!this.pending) return
    const values = { ...this.pending.values }
    this.latest = values
    this.pending = null
    this.flush()
    return values
  }

  discard() {
    this.pending = null
    this.written = null
    this.savedAt = null
    this.flush()
  }

  acknowledge(saved: T) {
    this.baseline = JSON.stringify(saved)
    this.flush()
  }
}
