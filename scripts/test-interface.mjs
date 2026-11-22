import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import React from 'react'
import * as jsx from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import * as icons from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Check the actual proposal's tokens in each available color combination.
const css = fs.readFileSync(new URL('../src/styles/interface.css', import.meta.url), 'utf8')
function tokens(selector) {
  const start = css.indexOf(`${selector} {`)
  assert(start >= 0, `Missing theme: ${selector}`)
  const block = css.slice(start, css.indexOf('}', start))
  return Object.fromEntries([...block.matchAll(/(--ui-[\w-]+):\s*(#[\da-f]{6})\s*;/gi)].map(match => [match[1], match[2]]))
}
function luminance(hex) {
  const rgb = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4)
  return .2126 * rgb[0] + .7152 * rgb[1] + .0722 * rgb[2]
}
function contrast(a, b) { const values = [luminance(a), luminance(b)].sort((x, y) => y - x); return (values[0] + .05) / (values[1] + .05) }
const base = tokens('.ui-theme')
const burgundy = tokens(".ui-theme[data-palette='burgundy']")
const dark = tokens(".ui-theme[data-theme='dark']")
const darkBurgundy = tokens(".ui-theme[data-theme='dark'][data-palette='burgundy']")
const themes = { ink: base, burgundy: { ...base, ...burgundy }, 'dark ink': { ...base, ...dark }, 'dark burgundy': { ...base, ...burgundy, ...dark, ...darkBurgundy } }
for (const [name, values] of Object.entries(themes)) {
  const pairs = [
    ['text', 'background'], ['text', 'surface'], ['muted', 'surface'], ['muted', 'subtle'],
    ['accent', 'accent-soft'], ['on-accent', 'accent'], ['on-accent', 'accent-hover'],
    ['success', 'success-soft'], ['warning', 'warning-soft'], ['danger', 'danger-soft'],
  ]
  for (const [foreground, background] of pairs) {
    const ratio = contrast(values[`--ui-${foreground}`], values[`--ui-${background}`])
    assert(ratio >= 4.5, `${name}: ${foreground} on ${background} has contrast ${ratio.toFixed(2)}`)
  }
  assert(contrast(values['--ui-input-border'], values['--ui-surface']) >= 3, `${name}: input boundary must remain distinguishable`)
}

// Server-render real shared controls: labels, descriptions, safe button defaults.
const exports = {}
const code = ts.transpileModule(fs.readFileSync(new URL('../components/ui/controls.tsx', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
vm.runInNewContext(code, { exports, require: name => ({ react: React, 'react/jsx-runtime': jsx, 'lucide-react': icons, '@/lib/utils': { cn: (...values) => twMerge(clsx(values)) } })[name] })
const { Button, TextField, Badge } = exports
const render = (Component, props, children) => renderToStaticMarkup(React.createElement(Component, props, children))
assert(render(Button, {}, 'Cancelar').includes('type="button"'), 'An action inside a form must not accidentally submit it')
const busy = render(Button, { busy: true, variant: 'primary' }, 'Guardando…')
assert(busy.includes('disabled=""') && busy.includes('aria-busy="true"'), 'Busy controls must prevent repeated actions and expose their state')
const field = render(TextField, { id: 'chapter-title', label: 'Título', hint: 'Indicación', error: 'Completa el título', 'aria-describedby': 'extra-help' })
assert(field.includes('for="chapter-title"'))
assert(field.includes('aria-invalid="true"'))
assert(field.includes('aria-describedby="extra-help chapter-title-hint chapter-title-error"'))
assert(field.includes('role="alert"'))
assert(render(Badge, { tone: 'success' }, 'Publicado').includes('Publicado'), 'State information cannot depend on color alone')
console.log('PASS: text contrast in four themes, input boundaries, associated labels, error descriptions and safe busy/button states.')
