interface ExampleActions {
  copy: (text: string) => Promise<void>
  render: (target: HTMLElement, markdown: string, id: string) => Promise<() => void>
}

/** Keep the original code intact; preview rendering is requested only on demand. */
export function bindGuideExamples(root: HTMLElement, template: HTMLTemplateElement, actions: ExampleActions) {
  const cleanups: (() => void)[] = []
  root.querySelectorAll<HTMLPreElement>('pre').forEach((pre, index) => {
    if (pre.closest('.guide-example')) return
    const text = (pre.querySelector('code')?.textContent || pre.textContent || '').trim()
    if (!text) return
    const wrapper = document.createElement('div')
    wrapper.className = 'guide-example'
    const controls = template.content.cloneNode(true) as DocumentFragment
    const copy = controls.querySelector<HTMLButtonElement>('[data-example-copy]')!
    const preview = controls.querySelector<HTMLButtonElement>('[data-example-preview]')!
    const status = controls.querySelector<HTMLElement>('[data-example-status]')!
    const panel = document.createElement('div')
    panel.className = 'guide-example-preview'
    panel.id = `guide-example-preview-${index + 1}`
    panel.hidden = true
    preview.setAttribute('aria-controls', panel.id)
    preview.setAttribute('aria-expanded', 'false')
    pre.parentNode!.insertBefore(wrapper, pre)
    wrapper.append(controls, pre, panel)
    let disposed = false, rendered = false, loading = false
    let unmount: (() => void) | undefined
    const onCopy = async () => {
      copy.disabled = true
      try { await actions.copy(text); status.textContent = 'Código copiado.' }
      catch { status.textContent = 'No se pudo copiar. Selecciona el código y cópialo manualmente.' }
      finally { copy.disabled = false }
    }
    const onPreview = async () => {
      if (loading) return
      if (!panel.hidden) { panel.hidden = true; preview.setAttribute('aria-expanded', 'false'); return }
      panel.hidden = false
      preview.setAttribute('aria-expanded', 'true')
      if (rendered) return
      loading = true
      preview.disabled = true
      panel.textContent = 'Preparando ejemplo…'
      try {
        unmount = await actions.render(panel, text, panel.id)
        rendered = true
        if (disposed) unmount()
      } catch {
        panel.textContent = 'No se pudo cargar el resultado. Cierra y vuelve a abrir la vista previa para reintentar. El código sigue disponible.'
      } finally { loading = false; preview.disabled = false }
    }
    copy.addEventListener('click', onCopy)
    preview.addEventListener('click', onPreview)
    cleanups.push(() => { disposed = true; copy.removeEventListener('click', onCopy); preview.removeEventListener('click', onPreview); unmount?.() })
  })
  return () => cleanups.forEach(cleanup => cleanup())
}
