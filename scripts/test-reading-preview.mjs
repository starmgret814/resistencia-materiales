import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as jsx from 'react/jsx-runtime'
import * as icons from 'lucide-react'

// Exercise the actual sample controls with isolated React state. The sample has
// no database, network or preference storage dependency.
const source = fs.readFileSync(new URL('../components/reading-preview.tsx', import.meta.url), 'utf8')
const styles = fs.readFileSync(new URL('../src/styles/reading-preview.css', import.meta.url), 'utf8')
const slots = []
let cursor = 0
const dependencies = {
  react: {
    useId: () => 'reading-sample',
    useState(initial) {
      const index = cursor++
      if (!(index in slots)) slots[index] = initial
      return [slots[index], value => { slots[index] = typeof value === 'function' ? value(slots[index]) : value }]
    },
  },
  'react/jsx-runtime': jsx,
  'lucide-react': icons,
  '@/components/content-renderer': { default: 'course-content' },
  '@/lib/content-context': { ContentProvider: 'content-provider' },
}
const exports = {}
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText, { exports, require(name) { assert(name in dependencies, `Unexpected dependency in local sample: ${name}`); return dependencies[name] } })
const document = Object.freeze({ schemaVersion: 2, chapterId: '01', slug: 'subtema-inicial', title: 'Concepto de esfuerzo', contentMarkdown: '# Concepto\n\nContenido original $x$.' })
function render() { cursor = 0; return exports.default({ document, slug: '01-esfuerzos-falla/subtema-inicial' }) }
function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined
  if (Array.isArray(node)) return node.map(child => find(child, predicate)).find(Boolean)
  return predicate(node) ? node : find(node.props?.children, predicate)
}
function click(label) {
  function text(node) {
    if (typeof node === 'string' || typeof node === 'number') return String(node)
    if (Array.isArray(node)) return node.map(text).join('')
    return node && typeof node === 'object' ? text(node.props?.children) : ''
  }
  const button = find(render(), node => node.type === 'button' && text(node.props.children) === label)
  assert(button, `Missing sample control: ${label}`)
  button.props.onClick()
}
const sample = () => find(render(), node => node.props?.id === 'reading-sample')
const content = () => find(render(), node => node.type === 'course-content')
assert.equal(content().props.document, document)
assert.equal(sample().props.style['--reading-preview-font'], 'var(--font-serif)')
assert.equal(sample().props.style['--reading-preview-size'], '1.25rem')
assert(sample().props.className.includes('reading-math-latex'), 'The proposal starts with the technical LaTeX treatment.')
assert(sample().props.className.includes('reading-math-regular'))
assert(sample().props.className.includes('reading-math-balanced'))
assert(sample().props.className.includes('reading-text-current'))
click('Times New Roman')
click('22 px')
click('Amplio · 2')
assert(sample().props.style['--reading-preview-font'].includes('Times New Roman'))
assert.equal(sample().props.style['--reading-preview-size'], '1.375rem')
assert.equal(sample().props.style['--reading-preview-leading'], 2)
click('KaTeX original')
click('Negrita')
click('124 %')
click('Negro')
assert(sample().props.className.includes('reading-math-katex'))
assert(sample().props.className.includes('reading-math-bold'))
assert(sample().props.className.includes('reading-math-larger'))
assert(sample().props.className.includes('reading-text-black'))
click('Ver formato actual')
assert.equal(sample().props.style, undefined, 'The current view must remove all proposal overrides.')
assert(!sample().props.className.includes('reading-math-'), 'Current format must not inherit proposed equation options.')
assert.equal(content().props.document, document, 'Comparison must not replace, reformat or save the academic text.')
click('Ver propuesta')
assert.equal(sample().props.style['--reading-preview-size'], '1.375rem', 'The proposal survives comparison with the original.')
click('Restaurar ajustes de muestra')
assert.equal(sample().props.style['--reading-preview-font'], 'var(--font-serif)')
assert.equal(sample().props.style['--reading-preview-leading'], 1.8)
assert.equal(sample().props.style['--reading-preview-size'], '1.25rem')
assert(sample().props.className.includes('reading-math-latex'))
assert(sample().props.className.includes('reading-math-regular'))
assert(sample().props.className.includes('reading-math-balanced'))
assert(sample().props.className.includes('reading-text-current'))
click('20 px')
click('Compacto · 1,65')
click('Peso medio')
click('116 %')
assert.equal(sample().props.style['--reading-preview-size'], '1.25rem')
assert.equal(sample().props.style['--reading-preview-leading'], 1.65)
assert(sample().props.className.includes('reading-math-medium'))
assert(sample().props.className.includes('reading-math-large'))
assert.equal(content().props.document.contentMarkdown, document.contentMarkdown)
assert(styles.includes('.reading-math-latex .katex .mathnormal.technical-math-greek'))
assert(!styles.includes('.reading-math-latex .katex .mathit'), 'Explicit author italics must not be overridden.')
console.log('PASS: local reading sample, responsive defaults, font/size/leading controls, current/proposed comparison, reset and unchanged academic content.')
