import { useId, useState } from 'react'
import { Calculator, RotateCcw } from 'lucide-react'
import katex from 'katex'
import { evaluateTool, getInteractiveTool, interactiveTools, type ToolDefinition } from '@/lib/interactive-tools'
import { mohrTools } from '@/lib/mohr-circle'
import { MohrCircle } from '@/components/mohr-circle'

function format(value: number) {
  if (value !== 0 && (Math.abs(value) < 0.001 || Math.abs(value) >= 1e7)) return value.toExponential(4)
  return new Intl.NumberFormat('es-PE', { maximumSignificantDigits: 6 }).format(value)
}

function CalculatorTool({ tool, title }: { tool: ToolDefinition; title?: string }) {
  const instance = useId()
  const initial = () => Object.fromEntries(tool.fields.map(field => [field.key, field.initial]))
  const [inputs, setInputs] = useState<Record<string, string>>(initial)
  const { results, errors } = evaluateTool(tool, inputs)
  const force = Number(inputs.force.replace(',', '.'))

  return <section className="course-tool my-7 overflow-hidden rounded-xl border border-[#dfc5c3] bg-white text-[#4d3838] dark:border-[#422527] dark:bg-[#1a0f10] dark:text-[#ead4d2]" aria-label={title || tool.title}>
    <header className="flex items-start gap-3 border-b border-[#eedfdd] bg-[#fbf3f0] px-5 py-4 dark:border-[#382022] dark:bg-[#281517]">
      <Calculator className="mt-0.5 size-5 shrink-0 text-[#8f2525] dark:text-[#fca5a5]" aria-hidden="true" />
      <div className="min-w-0 flex-1"><p className="font-semibold">{title || tool.title}</p><p className="mt-1 text-xs leading-5 text-[#866b6b] dark:text-[#cbb0ae]">{tool.description}</p></div>
      <button type="button" onClick={() => setInputs(initial())} className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs hover:bg-[#efdcda] focus-visible:outline-2 focus-visible:outline-[#7f0303] dark:hover:bg-[#381618]" aria-label={`Restablecer ${title || tool.title}`}><RotateCcw className="size-3.5" aria-hidden="true" /><span className="hidden sm:inline">Restablecer</span></button>
    </header>
    <div className="p-5">
      <div className="mb-5 overflow-x-auto text-center" dangerouslySetInnerHTML={{ __html: katex.renderToString(tool.formula, { displayMode: true, output: 'mathml', throwOnError: false }) }} />
      <div className="grid gap-4 sm:grid-cols-2">
        {tool.fields.map(field => {
          const id = `${instance}-${field.key}`
          return <div key={field.key}><label htmlFor={id} className="mb-1.5 block text-xs font-semibold">{field.label} <span className="font-normal text-[#967070] dark:text-[#ab8e8e]">({field.unit})</span></label>
            <input id={id} type="text" inputMode="decimal" value={inputs[field.key]} onChange={event => setInputs(current => ({ ...current, [field.key]: event.target.value }))} aria-invalid={Boolean(errors[field.key])} aria-describedby={errors[field.key] ? `${id}-error` : undefined} className="w-full min-w-0 rounded-lg border border-[#dcc3c3] bg-white px-3 py-2 text-sm outline-none focus:border-[#a35a5a] focus:ring-2 focus:ring-[#7f0303]/10 dark:border-[#422527] dark:bg-[#231416]" />
            {errors[field.key] && <p id={`${id}-error`} className="mt-1 text-xs text-[#a51f1f] dark:text-[#fca5a5]">{errors[field.key]}</p>}
          </div>
        })}
      </div>
      <p className="mt-3 text-xs text-[#967070] dark:text-[#ab8e8e]">P positiva: tracción. P negativa: compresión. Puedes escribir decimales con punto o coma.</p>
      <div className="mt-5 rounded-lg bg-[#faf2ef] p-4 dark:bg-[#281517]" aria-live="polite" aria-atomic="true">
        {results.length ? <><dl className="grid gap-4 sm:grid-cols-2">{results.map(result => <div key={result.label}><dt className="text-xs text-[#866b6b] dark:text-[#cbb0ae]">{result.label}</dt><dd className="mt-1 font-mono text-lg font-semibold tabular-nums text-[#7f0303] dark:text-[#fca5a5]">{format(result.value)} <span className="font-sans text-xs font-normal">{result.unit}</span></dd></div>)}</dl><p className="mt-3 text-xs">{force > 0 ? 'Estado de tracción.' : force < 0 ? 'Estado de compresión.' : 'Sin carga axial.'}</p></> : <p className="text-sm">{errors.result || 'Completa los datos válidos para ver el resultado.'}</p>}
      </div>
      <details className="mt-4 text-xs text-[#866b6b] dark:text-[#cbb0ae]"><summary className="cursor-pointer font-semibold">Modelo y unidades</summary><p className="mt-2 leading-6">{tool.assumptions} Conversión automática: 1 kN = 1000 N; 1 GPa = 1000 MPa; 1 MPa = 1 N/mm².</p></details>
    </div>
  </section>
}

export function Tool({ id, title }: { id: string; title?: string }) {
  const mohr = mohrTools.find(tool => tool.id === id)
  if (mohr) return <MohrCircle key={id} mode={mohr.mode} title={title} />
  const tool = getInteractiveTool(id)
  if (!tool) return <aside role="note" className="my-6 rounded-lg border border-dashed border-[#d9aaaa] p-4 text-sm">Herramienta no disponible: <code>{id || '(sin identificador)'}</code>. Disponibles: {[...mohrTools, ...interactiveTools].map(item => item.id).join(', ')}.</aside>
  return <CalculatorTool key={id} tool={tool} title={title} />
}
