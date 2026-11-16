import { useEffect, useRef, useState } from 'react'
import { LocalDraftBuffer, type DraftSnapshot, type DraftValues } from '@/lib/local-draft'

export function useLocalDraft<T extends DraftValues>(key: string | null, values: T, ready: boolean) {
  const buffer = useRef<LocalDraftBuffer<T> | null>(null)
  const latest = useRef({ key, values })
  latest.current = { key, values }
  const [state, setState] = useState<{ key: string | null; pending: DraftSnapshot<T> | null; savedAt: number | null; failed: boolean }>({ key: null, pending: null, savedAt: null, failed: false })
  const report = (current: LocalDraftBuffer<T>) => setState({ key: current.key, pending: current.pending, savedAt: current.savedAt, failed: current.failed })

  useEffect(() => {
    if (!key || !ready) { buffer.current = null; return }
    let current: LocalDraftBuffer<T>
    try { current = new LocalDraftBuffer(window.localStorage, key, latest.current.values) }
    catch { setState({ key, pending: null, savedAt: null, failed: true }); return }
    buffer.current = current
    report(current)
    const flush = () => {
      if (latest.current.key === key) current.update(latest.current.values)
      current.flush()
      report(current)
    }
    const onVisibility = () => { if (document.visibilityState === 'hidden') flush() }
    window.addEventListener('pagehide', flush)
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flush)
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', onVisibility)
      if (latest.current.key === key) current.update(latest.current.values)
      current.flush()
      if (buffer.current === current) buffer.current = null
    }
  }, [key, ready])

  const serialized = JSON.stringify(values)
  useEffect(() => {
    const current = buffer.current
    if (!current || current.key !== key || !ready || current.pending) return
    current.update(latest.current.values)
    const timer = window.setTimeout(() => { current.flush(); report(current) }, 800)
    return () => window.clearTimeout(timer)
  }, [key, ready, serialized])

  function recover() {
    const current = buffer.current
    if (!current || current.key !== key) return
    const recovered = current.recover()
    if (recovered) latest.current = { key, values: recovered }
    report(current)
    return recovered
  }
  function discard() {
    const current = buffer.current
    if (!current || current.key !== key) return
    current.update(latest.current.values)
    current.discard()
    report(current)
  }
  function acknowledge(saved: T) {
    const current = buffer.current
    if (!current || current.key !== key) return
    if (JSON.stringify(latest.current.values) === JSON.stringify(values)) latest.current = { key, values: saved }
    current.update(latest.current.values)
    current.acknowledge(saved)
    report(current)
  }
  return { pending: state.key === key && ready ? state.pending : null, savedAt: state.key === key ? state.savedAt : null, failed: state.key === key && state.failed, recover, discard, acknowledge }
}
