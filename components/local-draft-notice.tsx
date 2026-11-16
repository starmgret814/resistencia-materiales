import { HardDrive, RotateCcw } from 'lucide-react'

export function LocalDraftNotice({ savedAt, content, onRecover, onDiscard }: { savedAt: number; content: string; onRecover: () => void; onDiscard: () => void }) {
  return <section aria-label="Recuperar trabajo local" className="shrink-0 rounded-lg border border-[#d5baba] bg-[#fffaf0] p-4 text-sm text-[#5f4445]">
    <p className="flex items-center gap-2 font-semibold text-[#7f0303]"><HardDrive className="size-4 shrink-0" aria-hidden="true" />Hay una copia local diferente de la versión cargada</p>
    <p className="mt-2 text-xs leading-6">Guardada el {new Date(savedAt).toLocaleString('es-PE')}, en este navegador. Recuperarla carga el texto en el editor; guardar en la plataforma y publicar siguen siendo acciones manuales.</p>
    <details className="mt-2 text-xs"><summary className="cursor-pointer font-semibold">Ver texto de la copia</summary><pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded border border-[#eadada] bg-white p-3">{content.slice(0, 2500)}{content.length > 2500 ? '\n… Vista parcial de la copia.' : ''}</pre></details>
    <div className="mt-3 flex flex-wrap gap-3"><button type="button" onClick={onRecover} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-[#7f0303] px-3 py-2 text-xs font-semibold text-white"><RotateCcw className="size-3.5" aria-hidden="true" />Recuperar copia</button><button type="button" onClick={() => { if (window.confirm('¿Descartar la copia local y conservar la versión que se ha cargado en el editor?')) onDiscard() }} className="min-h-10 rounded-md border border-[#d5baba] px-3 py-2 text-xs font-semibold">Descartar copia local</button></div>
  </section>
}

export function LocalDraftStatus({ failed, savedAt }: { failed: boolean; savedAt: number | null }) {
  return <span role={failed ? 'alert' : undefined} className={failed ? 'text-[#9a3412]' : ''}>{failed ? 'No se pudo guardar la copia local. Descarga una copia o guarda tu avance en la plataforma.' : savedAt ? 'Copia local guardada · solo en este navegador' : 'Respaldo local activo · guardar en la plataforma sigue siendo manual'}</span>
}
