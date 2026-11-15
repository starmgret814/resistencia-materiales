import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = path.resolve(import.meta.dirname, '..')
const temporary = fs.mkdtempSync(path.join(root, '.math-tests-'))
function compile(file, name, replacements = []) {
  let source = fs.readFileSync(path.join(root, file), 'utf8')
  for (const [from, to] of replacements) source = source.replace(from, to)
  fs.writeFileSync(path.join(temporary, name), ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText)
}
try {
  compile('lib/utils.ts', 'utils.mjs')
  compile('lib/content-context.tsx', 'context.mjs')
  compile('lib/course-markdown.ts', 'markdown.mjs')
  compile('lib/remark-number-headings.ts', 'headings.mjs')
  compile('components/mdx-components.tsx', 'components.mjs', [["'@/lib/utils'", "'./utils.mjs'"], ["'@/lib/content-context'", "'./context.mjs'"]])
  compile('components/content-renderer.tsx', 'renderer.mjs', [
    ["'@/lib/remark-number-headings'", "'./headings.mjs'"], ["'@/lib/course-markdown'", "'./markdown.mjs'"],
    ["'@/components/mdx-components'", "'./components.mjs'"], ["import { Tool } from '@/components/interactive-tools'", 'const Tool = () => null'],
  ])
  const { ContentRenderer } = await import(pathToFileURL(path.join(temporary, 'renderer.mjs')).href)
  const { normalizeLegacyMdx } = await import(pathToFileURL(path.join(temporary, 'markdown.mjs')).href)
  const render = contentMarkdown => renderToStaticMarkup(React.createElement(ContentRenderer, { document: { contentMarkdown } }))
  const fixtures = [
    String.raw`Inercias $I_z + I_y$ y $\sigma_x$.`,
    String.raw`\(I_z + I_y\)`,
    String.raw`\[N(x) = \int_{A(x)} \sigma\,dA\]`,
    String.raw`$$\frac{P}{A}$$`,
    String.raw`$$C = (\sigma_{\mathrm{prom}},0)$$ donde $$\sigma_{\mathrm{prom}} = \frac{\sigma_x + \sigma_y}{2}$$`,
    String.raw`<Formula number="8.3.1" boxed="true">
$$
N(x) = \int_{A(x)} \sigma\,dA
$$
</Formula>`,
    String.raw`$$
\begin{aligned}
\sigma_x &= \frac{P}{A} \\
\tau &= \sqrt{x^2 + y^2}
\end{aligned}
$$`,
    String.raw`<Quiz question="¿Cambia $I_z + I_y$?">
No, $J_O = I_z + I_y$.
</Quiz>`,
  ]
  for (const fixture of fixtures) {
    const html = render(fixture)
    assert(html.includes('class="katex"'), fixture)
    assert(html.includes('katex-html'), 'Visual HTML must accompany the accessible MathML')
    assert(!html.includes('katex-error'), fixture)
  }
  assert(render(fixtures[2]).includes('katex-display'), 'Bracket delimiters produce display math')
  assert(render(fixtures[2]).includes('large-op'), 'Display integrals use the large LaTeX operator')
  assert(render(fixtures[3]).includes('katex-display'), 'Standalone same-line dollars produce display math')
  assert(render(fixtures[5]).includes('id="eq-8.3.1"'))
  const literal = String.raw`\(x\)`
  assert.equal(normalizeLegacyMdx('`' + literal + '`'), '`' + literal + '`', 'Inline code is never treated as an equation')
  const fenced = '```latex\n' + literal + '\n```'
  assert.equal(normalizeLegacyMdx(fenced), fenced, 'Code examples remain untouched')
  const req = createRequire(import.meta.url)
  const rendererReq = createRequire(req.resolve('rehype-katex'))
  assert.equal(req('katex/package.json').version, rendererReq('katex/package.json').version, 'Local CSS and both renderers must share one KaTeX version')
  let pages = 0
  const errors = []
  const directory = path.join(root, 'src/content/resistencia')
  for (const file of fs.readdirSync(directory, { recursive: true }).filter(file => file.endsWith('.mdx'))) {
    const html = render(fs.readFileSync(path.join(directory, file), 'utf8'))
    if (html.includes('katex-error')) errors.push(`${file}: ${html.match(/<span[^>]*class="katex-error"[^>]*>/g)?.join('; ')}`)
    pages++
  }
  assert.equal(errors.length, 0, `Invalid LaTeX in local sections: ${errors.join(', ')}`)
  console.log(`PASS: Inline/display math, large integrals, fractions, aligned equations, quizzes, protected code, matching KaTeX assets and ${pages} local sections.`)
} finally {
  if (!temporary.startsWith(path.join(root, '.math-tests-'))) throw new Error('Unexpected test directory')
  fs.rmSync(temporary, { recursive: true, force: true })
}
