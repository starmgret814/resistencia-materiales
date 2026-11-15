import { useEffect, useRef, type RefObject } from 'react'

/** Keep keyboard focus and scrolling inside an open overlay, then restore its trigger. */
export function useModalFocus(open: boolean, container: RefObject<HTMLElement>, onClose: () => void) {
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const region = container.current
    if (!open || !region) return
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    const disabled: HTMLElement[] = []
    let branch: HTMLElement = region
    while (branch.parentElement && branch !== document.body) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch && sibling instanceof HTMLElement && !sibling.inert && !sibling.hasAttribute('data-modal-backdrop')) {
          sibling.inert = true
          disabled.push(sibling)
        }
      }
      branch = branch.parentElement
    }
    document.body.style.overflow = 'hidden'
    const focusable = () => Array.from(region.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]')).filter(element => element.tabIndex >= 0 && element.getClientRects().length && !element.closest('[inert]'))
    ;(region.querySelector<HTMLElement>('[data-modal-autofocus]') || focusable()[0] || region).focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        close.current()
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      const first = items[0]
      const last = items.at(-1)
      if (!first) { event.preventDefault(); region.focus(); return }
      if (event.shiftKey && (document.activeElement === first || !region.contains(document.activeElement))) {
        event.preventDefault(); last?.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !region.contains(document.activeElement))) {
        event.preventDefault(); first.focus()
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('keydown', handleKey)
      disabled.forEach(element => { element.inert = false })
      document.body.style.overflow = overflow
      if (trigger?.isConnected) trigger.focus({ preventScroll: true })
    }
  }, [open, container])
}
