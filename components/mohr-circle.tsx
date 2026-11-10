import { useId, useState } from 'react'
import { RotateCcw, CircleDot } from 'lucide-react'
import katex from 'katex'
import { mohrTools, transformMohr, parseMohrValues, expandMohrRange, type MohrInput, type MohrMode, type MohrValues } from '@/lib/mohr-circle'
import { MohrPlot, RotatedElement, mohrNumber as number, originalColor as original, rotatedColor as rotated } from '@/components/mohr-plot'

export function MohrCircle({ mode, title }: { mode: MohrMode; title?: string }) {
  const config = mohrTools.find(tool => tool.mode === mode)!
  const initial = () => ({ input: { ...config.initial } as MohrInput, values: Object.fromEntries(Object.entries(config.initial).map(([key, value]) => [key, String(value)])) as MohrValues, range: mode === 'stress' ? 100 : 1000, angleRange: 180 })
  const [form, setForm] = useState(initial)
  const { input, values, range, angleRange } = form
  const validation = parseMohrValues(values, mode)
  const valid = Boolean(validation.input)
  const update = (key: keyof MohrInput, value: string) => setForm(current => {
    const next = { ...current.values, [key]: value }
    const parsed = parseMohrValues(next, mode)
    return { ...current, values: next, input: parsed.input || current.input,
      range: parsed.input ? expandMohrRange(current.range, Math.max(Math.abs(parsed.input.x), Math.abs(parsed.input.y), Math.abs(parsed.input.shear))) : current.range,
      angleRange: parsed.input ? expandMohrRange(current.angleRange, parsed.input.theta) : current.angleRange,
    }
  })
  const expandAtEdge = (key: keyof MohrInput) => setForm(current => {
    const rangeKey = key === 'theta' ? 'angleRange' : 'range'
    return Math.abs(current.input[key]) >= current[rangeKey] * 0.98 ? { ...current, [rangeKey]: Math.min(Number.MAX_VALUE, current[rangeKey] * 2) } : current
  })
  const changeScale = (enlarge: boolean) => setForm(current => ({ ...current, range: enlarge
    ? Math.min(Number.MAX_VALUE, current.range * 2)
    : Math.max(current.range / 2, Math.abs(current.input.x), Math.abs(current.input.y), Math.abs(current.input.shear), Number.MIN_VALUE) }))
  const instance = useId()
  const state = transformMohr(input, mode)
  const stress = mode === 'stress'
  const unit = stress ? 'MPa' : 'µε'
  const symbol = stress ? 'σ' : 'ε'
  const shearSymbol = stress ? 'τ' : 'γ'
  const controls: { key: keyof MohrInput; label: string; unit: string }[] = [
    { key: 'x', label: `${symbol}x`, unit },
    { key: 'y', label: `${symbol}y`, unit },
    { key: 'shear', label: `${shearSymbol}xy`, unit },
    { key: 'theta', label: 'Ángulo θ', unit: '°' },
  ]
  const metrics = [
    { label: stress ? 'Radio R = τmáx' : 'Radio R = γmáx/2', value: state.radius, unit },
    { label: `${symbol}prom`, value: state.average, unit },
    { label: `${symbol}1`, value: state.principal1, unit }, { label: `${symbol}2`, value: state.principal2, unit },
    { label: `θp₁ · dirección de ${symbol}1`, value: state.principalAngle, unit: '°' },
    { label: `θp₂ · dirección de ${symbol}2`, value: state.principalAngle2, unit: '°' },
  ]
  const rotatedMetrics = [{ label: `${symbol}x′`, value: state.rotatedX }, { label: `${symbol}y′`, value: state.rotatedY }, { label: `${shearSymbol}x′y′`, value: state.rotatedShear }]
  const formula = stress
    ? "\\sigma_{x'} = \\frac{\\sigma_x+\\sigma_y}{2}+\\frac{\\sigma_x-\\sigma_y}{2}\\cos 2\\theta+\\tau_{xy}\\sin 2\\theta"
    : "\\varepsilon_{x'} = \\frac{\\varepsilon_x+\\varepsilon_y}{2}+\\frac{\\varepsilon_x-\\varepsilon_y}{2}\\cos 2\\theta+\\frac{\\gamma_{xy}}{2}\\sin 2\\theta"
  return <section className="course-tool mohr-tool my-7 overflow-hidden rounded-xl border border-[#dfc5c3] bg-white text-[#4d3838] dark:border-[#422527] dark:bg-[#1a0f10] dark:text-[#ead4d2]" aria-label={title || config.title}>
    <header className="flex items-start gap-3 border-b border-[#eedfdd] bg-[#fbf3f0] px-4 py-3 dark:border-[#382022] dark:bg-[#281517]"><CircleDot className="mt-0.5 size-5 shrink-0 text-[#8f2525] dark:text-[#fca5a5]" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="font-semibold">{title || config.title}</p><p className="mt-1 text-xs text-[#866b6b] dark:text-[#cbb0ae]">{config.description}</p></div><button type="button" onClick={() => setForm(initial())} className="rounded-md p-2 hover:bg-[#efdcda] dark:hover:bg-[#381618]" aria-label={`Restablecer ${config.title}`} title="Restablecer valores iniciales"><RotateCcw className="size-4" aria-hidden="true" /></button></header>
    <div className="space-y-3 p-3 sm:p-4">
      <div className="mohr-workspace">
        <div className="mohr-visual min-w-0">
          {!valid && <p role="status" className="rounded-md bg-[#fbf3f0] px-3 py-2 text-xs dark:bg-[#281517]">{validation.errors.result || 'Completa los valores. El gráfico conserva el último estado válido.'}</p>}
          <div className="mohr-diagrams">
            <RotatedElement angle={input.theta} state={state} mode={mode} scale={mode === 'stress' ? 100 : 1000} />
            <MohrPlot input={input} state={state} mode={mode} />
          </div>
          <div className="overflow-x-auto border-t border-[#eedfdd] dark:border-[#382022]">
            <div className="flex min-w-max items-center gap-4 py-2 text-[11px] whitespace-nowrap"><span className="flex items-center gap-2"><span className="h-0.5 w-4" style={{ backgroundColor: original }} />A, B · original</span><span className="flex items-center gap-2"><span className="h-0.5 w-4" style={{ backgroundColor: rotated }} />A′, B′ · rotado</span><span className="font-mono">θ = {number(input.theta)}°</span><span className="text-[#866b6b] dark:text-[#cbb0ae]">Vista centrada en C · misma escala en ambos ejes</span></div>
          </div>
        </div>
        <div className="mohr-controls-grid">
        <div className="mohr-panel min-w-0 rounded-lg bg-[#faf5f3] p-3 dark:bg-[#231416]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#866b6b] dark:text-[#cbb0ae]">Datos de entrada</p>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[11px]"><span>Rango: ±{number(range)} {unit}</span><div className="flex gap-1"><button type="button" onClick={() => changeScale(false)} aria-label="Reducir rango de los deslizadores" className="rounded border border-[#dcc3c3] px-2 py-0.5 dark:border-[#422527]">÷2</button><button type="button" onClick={() => changeScale(true)} aria-label="Ampliar rango de los deslizadores" className="rounded border border-[#dcc3c3] px-2 py-0.5 dark:border-[#422527]">×2</button></div></div>
          <div className="space-y-2">{controls.map(control => {
            const id = `${instance}-${control.key}`
            const angle = control.key === 'theta'
            const bound = angle ? angleRange : range
            return <div key={control.key}><div className="grid grid-cols-[5.1rem_minmax(3rem,1fr)_5rem] items-center gap-2"><label htmlFor={id} className="block whitespace-nowrap text-xs font-semibold">{control.label} <span className="text-[10px] font-normal">({control.unit})</span></label><input id={`${id}-slider`} aria-label={`Ajustar ${control.label} con deslizador`} type="range" min={-bound} max={bound} step="any" value={input[control.key]} onChange={event => update(control.key, event.target.value)} onPointerUp={() => expandAtEdge(control.key)} onKeyUp={() => expandAtEdge(control.key)} className="block w-full accent-[#8f2525] dark:accent-[#fca5a5]" /><input id={id} type="text" inputMode="decimal" value={values[control.key]} onChange={event => update(control.key, event.target.value)} aria-invalid={Boolean(validation.errors[control.key])} aria-describedby={validation.errors[control.key] ? `${id}-error` : undefined} className="h-8 w-full min-w-0 rounded-md border border-[#dcc3c3] bg-white px-2 font-mono text-sm tabular-nums outline-none focus:border-[#a35a5a] focus:ring-2 focus:ring-[#7f0303]/10 dark:border-[#422527] dark:bg-[#1a0f10]" /></div>{validation.errors[control.key] && <p id={`${id}-error`} className="text-[10px] text-[#a51f1f] dark:text-[#fca5a5]">{validation.errors[control.key]}</p>}</div>
          })}</div>
          <p className="mt-2 text-[10px] text-[#866b6b] dark:text-[#cbb0ae]">El rango se amplía al soltar en un extremo. El valor escrito es libre.</p>
        </div>
        <div className="mohr-panel mohr-results min-w-0 rounded-lg bg-[#faf5f3] p-3 dark:bg-[#231416]">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#866b6b] dark:text-[#cbb0ae]">Propiedades del círculo</p>
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2" aria-live="polite" aria-atomic="true">{metrics.map(metric => <div key={metric.label} className="min-w-0"><dt className="text-[11px] text-[#866b6b] dark:text-[#cbb0ae]">{metric.label}</dt><dd className="font-mono text-sm font-semibold tabular-nums">{valid && metric.value !== null ? number(metric.value) : '—'} <span className="text-[10px] font-normal">{metric.unit}</span></dd></div>)}</dl>
          {!stress && <p className="mt-2 text-[11px]">γmáx = 2R = {valid ? number(state.maxShear) : '—'} {unit}</p>}
          {state.principalAngle === null && valid && <p className="mt-2 text-[11px]">Todas las orientaciones son principales.</p>}
          <div className="my-3 border-t border-[#e8d5d2] dark:border-[#422527]" />
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-[#866b6b] dark:text-[#cbb0ae]">Plano girado · {unit} · θ = {number(input.theta)}°</p>
          <dl className="grid grid-cols-3 gap-2">{rotatedMetrics.map(metric => <div key={metric.label}><dt className="text-[11px] text-[#866b6b] dark:text-[#cbb0ae]">{metric.label}</dt><dd className="font-mono text-xs font-semibold">{valid ? number(metric.value) : '—'}</dd></div>)}</dl>
        </div>
        </div>
      </div>
      <details className="border-t border-[#eedfdd] pt-4 text-xs dark:border-[#382022]"><summary className="cursor-pointer font-semibold">Ecuación y convención de signos</summary><div className="mt-3 overflow-x-auto" dangerouslySetInnerHTML={{ __html: katex.renderToString(formula, { displayMode: true, output: 'mathml', throwOnError: false }) }} /><p className="mt-3 leading-6">θ es el giro físico antihorario de los ejes; en el círculo se representa 2θ. El eje vertical es positivo hacia abajo. {stress ? 'Tracción positiva y compresión negativa. El cortante máximo mostrado corresponde al plano xy, no al máximo tridimensional.' : 'Se introduce γxy ingenieril, pero se grafica γxy/2. Por ello γmáx = 2R. Los resultados están en microdeformaciones (1 µε = 10⁻⁶). Se asumen pequeñas deformaciones.'}</p><p className="mt-2"><a href="https://mechanics.ju.se/SolidMechanics/MohrsCircle.html" target="_blank" rel="noopener noreferrer" className="underline">Referencia: Applied Mechanics · Jönköping University</a></p></details>
    </div>
  </section>
}
