import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  resetKey: string
  onRetry: () => void
}

/** A preview failure must never unmount the editor or its unsaved document. */
export default class PreviewErrorBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() { return { failed: true } }

  componentDidCatch(error: Error) {
    console.error('No se pudo mostrar la vista previa:', error)
  }

  componentDidUpdate(previous: Props) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false })
  }

  render() {
    if (!this.state.failed) return this.props.children
    return <div role="alert" className="rounded-lg border border-[#e3caca] bg-[#fcf7f5] p-5 text-sm text-[#604747]">
      <p className="font-semibold text-[#7f0303]">No se pudo mostrar la vista previa</p>
      <p className="mt-2 leading-relaxed">Puedes seguir editando y guardar tu documento. Si acabas de cambiar el contenido, revisa su formato e inténtalo de nuevo.</p>
      <button type="button" onClick={this.props.onRetry} className="mt-4 rounded-md border border-[#d5baba] px-3 py-2 font-semibold text-[#7f0303] hover:bg-[#f2dddd]">Reintentar vista previa</button>
    </div>
  }
}
