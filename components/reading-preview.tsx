import { useId, useState, type CSSProperties } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import ContentRenderer from '@/components/content-renderer'
import { ContentProvider } from '@/lib/content-context'
import type { CourseDocument } from '@/lib/content-schema'

type Font = 'academic' | 'times'
type Size = 'current' | 'large' | 'larger'
type Leading = 'compact' | 'current' | 'spacious'
type MathShape = 'latex' | 'katex'
type MathWeight = 'regular' | 'medium' | 'semibold' | 'bold'
type MathSize = 'compact' | 'balanced' | 'large' | 'larger'
type TextColor = 'current' | 'black'
const fonts = [
  { value: 'academic', label: 'Académica actual' },
  { value: 'times', label: 'Times New Roman' },
] as const
const sizes = [
  { value: 'current', label: 'Actual' },
  { value: 'large', label: '20 px' },
  { value: 'larger', label: '22 px' },
] as const
const leadings = [
  { value: 'compact', label: 'Compacto · 1,65' },
  { value: 'current', label: 'Actual · 1,8' },
  { value: 'spacious', label: 'Amplio · 2' },
] as const
const mathShapes = [
  { value: 'latex', label: 'LaTeX técnico' },
  { value: 'katex', label: 'KaTeX original' },
] as const
const mathWeights = [
  { value: 'regular', label: 'Peso normal' },
  { value: 'medium', label: 'Peso medio' },
  { value: 'semibold', label: 'Seminegrita' },
  { value: 'bold', label: 'Negrita' },
] as const
const mathSizes = [
  { value: 'compact', label: '100 %' },
  { value: 'balanced', label: '108 % · equilibrado' },
  { value: 'large', label: '116 %' },
  { value: 'larger', label: '124 %' },
] as const
const textColors = [
  { value: 'current', label: 'Color actual' },
  { value: 'black', label: 'Negro' },
] as const

export default function ReadingPreview({ document, slug }: { document: CourseDocument; slug: string }) {
  const [font, setFont] = useState<Font>('academic')
  const [size, setSize] = useState<Size>('large')
  const [leading, setLeading] = useState<Leading>('current')
  const [mathShape, setMathShape] = useState<MathShape>('latex')
  const [mathWeight, setMathWeight] = useState<MathWeight>('regular')
  const [mathSize, setMathSize] = useState<MathSize>('balanced')
  const [textColor, setTextColor] = useState<TextColor>('current')
  const [proposal, setProposal] = useState(true)
  const sampleId = useId()
  const style = proposal ? {
    '--reading-preview-font': font === 'times' ? '"Times New Roman", Times, serif' : 'var(--font-serif)',
    ...(size !== 'current' ? { '--reading-preview-size': size === 'large' ? '1.25rem' : '1.375rem' } : {}),
    '--reading-preview-leading': leading === 'compact' ? 1.65 : leading === 'spacious' ? 2 : 1.8,
  } as CSSProperties : undefined
  const summary = proposal
    ? `${fonts.find(option => option.value === font)!.label} · ${sizes.find(option => option.value === size)!.label} · ${leadings.find(option => option.value === leading)!.label} · ${textColors.find(option => option.value === textColor)!.label} · Ecuaciones: ${mathShapes.find(option => option.value === mathShape)!.label}, ${mathWeights.find(option => option.value === mathWeight)!.label}, ${mathSizes.find(option => option.value === mathSize)!.label}`
    : 'Formato actual del capítulo'

  function reset() {
    setFont('academic'); setSize('large'); setLeading('current'); setMathShape('latex'); setMathWeight('regular'); setMathSize('balanced'); setTextColor('current'); setProposal(true)
  }

  return <main className="reading-preview mx-auto max-w-6xl px-4 py-6 font-sans sm:px-6 sm:py-9">
    <a href="/" className="study-control study-control-quiet mb-5"><ArrowLeft className="size-4" aria-hidden="true" />Volver al inicio</a>
    <header className="mb-6">
      <p className="mb-2 text-sm font-semibold text-[#7f0303] dark:text-[#fca5a5]">Etapa 2 · Muestra de lectura</p>
      <h1 className="text-2xl font-bold text-[#3b2022] sm:text-3xl dark:text-[#f2e1df]">Probemos cómo se lee el contenido</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-[#765e5e] dark:text-[#cbb0ae]">Compara los ajustes con el formato actual sobre el mismo tema y al mismo ancho. La fuente académica actual es STIX Two Text, con Times New Roman como respaldo. Los ajustes afectan solo a esta muestra.</p>
    </header>
    <section aria-label="Ajustes de la muestra de lectura" className="mb-6 rounded-xl border border-[#e3caca] bg-white p-4 sm:p-5 dark:border-[#382022] dark:bg-[#1a0f10]">
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        <fieldset><legend className="mb-2 text-sm font-semibold">Fuente de la propuesta</legend><div className="flex flex-wrap gap-2">
          {fonts.map(option => <button key={option.value} type="button" className="study-control" aria-pressed={font === option.value} aria-controls={sampleId} onClick={() => { setFont(option.value); setProposal(true) }}>{option.label}</button>)}
        </div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold">Tamaño de la propuesta</legend><div className="flex flex-wrap gap-2">
          {sizes.map(option => <button key={option.value} type="button" className="study-control" aria-pressed={size === option.value} aria-controls={sampleId} onClick={() => { setSize(option.value); setProposal(true) }}>{option.label}</button>)}
        </div><p className="mt-2 text-xs leading-5 text-[#765e5e] dark:text-[#cbb0ae]">Actual: 18 px en escritorio y 17 px en móvil.</p></fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold">Interlineado de la propuesta</legend><div className="flex flex-wrap gap-2">
          {leadings.map(option => <button key={option.value} type="button" className="study-control" aria-pressed={leading === option.value} aria-controls={sampleId} onClick={() => { setLeading(option.value); setProposal(true) }}>{option.label}</button>)}
        </div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold">Color del texto académico</legend><div className="flex flex-wrap gap-2">
          {textColors.map(option => <button key={option.value} type="button" className="study-control" aria-pressed={textColor === option.value} aria-controls={sampleId} onClick={() => { setTextColor(option.value); setProposal(true) }}>{option.label}</button>)}
        </div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold">Forma de las variables</legend><div className="flex flex-wrap gap-2">
          {mathShapes.map(option => <button key={option.value} type="button" className="study-control" aria-pressed={mathShape === option.value} aria-controls={sampleId} onClick={() => { setMathShape(option.value); setProposal(true) }}>{option.label}</button>)}
        </div><p className="mt-2 text-xs leading-5 text-[#765e5e] dark:text-[#cbb0ae]">LaTeX técnico: griegas como σ y τ en cursiva; letras latinas como N y A rectas. Las órdenes explícitas del autor se conservan.</p></fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold">Peso de las ecuaciones</legend><div className="flex flex-wrap gap-2">
          {mathWeights.map(option => <button key={option.value} type="button" className="study-control" aria-pressed={mathWeight === option.value} aria-controls={sampleId} onClick={() => { setMathWeight(option.value); setProposal(true) }}>{option.label}</button>)}
        </div></fieldset>
        <fieldset><legend className="mb-2 text-sm font-semibold">Tamaño de las ecuaciones</legend><div className="flex flex-wrap gap-2">
          {mathSizes.map(option => <button key={option.value} type="button" className="study-control" aria-pressed={mathSize === option.value} aria-controls={sampleId} onClick={() => { setMathSize(option.value); setProposal(true) }}>{option.label}</button>)}
        </div></fieldset>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#eadada] pt-4 dark:border-[#382022]">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Comparar formato actual y propuesta">
          <button type="button" className="study-control" aria-pressed={!proposal} aria-controls={sampleId} onClick={() => setProposal(false)}>Ver formato actual</button>
          <button type="button" className="study-control" aria-pressed={proposal} aria-controls={sampleId} onClick={() => setProposal(true)}>Ver propuesta</button>
        </div>
        <button type="button" className="study-control study-control-quiet" onClick={reset}><RotateCcw className="size-4" aria-hidden="true" />Restaurar ajustes de muestra</button>
      </div>
    </section>
    <p aria-live="polite" aria-atomic="true" className="mb-4 text-sm text-[#765e5e] dark:text-[#cbb0ae]">{summary}</p>
    <section id={sampleId} aria-label="Tema utilizado para comparar la lectura" className={`reading-preview-sample mx-auto max-w-[840px] rounded-xl border border-[#e3caca] bg-[#fbf7f4] px-5 py-7 sm:px-8 lg:px-10 dark:border-[#382022] dark:bg-[#140b0c] ${proposal ? `reading-text-${textColor} reading-math-${mathShape} reading-math-${mathWeight} reading-math-${mathSize}` : ''}`} style={style}>
      <ContentProvider slug={slug}><ContentRenderer document={document} headingPrefix="1.1" /></ContentProvider>
    </section>
    <footer className="mx-auto mt-6 max-w-[840px] text-xs leading-6 text-[#765e5e] dark:text-[#cbb0ae]">Muestra: Concepto de esfuerzo · Capítulo 1. Autor del material académico original: Ing. Eden Angel Molina Capcha. Al recargar se recuperan los ajustes iniciales.</footer>
  </main>
}
