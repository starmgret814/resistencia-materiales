import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = path.resolve(import.meta.dirname, '..')
const temporary = fs.mkdtempSync(path.join(root, '.table-tests-'))
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
  compile('lib/table-snippets.ts', 'snippets.mjs')
  compile('lib/exam-authoring.ts', 'exams.mjs', [["'./table-snippets'", "'./snippets.mjs'"]])
  compile('components/mdx-components.tsx', 'components.mjs', [["'@/lib/utils'", "'./utils.mjs'"], ["'@/lib/content-context'", "'./context.mjs'"]])
  compile('components/content-renderer.tsx', 'renderer.mjs', [
    ["'@/lib/remark-number-headings'", "'./headings.mjs'"], ["'@/lib/course-markdown'", "'./markdown.mjs'"],
    ["'@/components/mdx-components'", "'./components.mjs'"], ["import { Tool } from '@/components/interactive-tools'", 'const Tool = () => null'],
  ])
  const load = name => import(pathToFileURL(path.join(temporary, name)).href)
  const { ContentRenderer } = await load('renderer.mjs')
  const { ContentProvider } = await load('context.mjs')
  const { normalizeLegacyMdx } = await load('markdown.mjs')
  const { imageTableSnippet } = await load('snippets.mjs')
  const { examSnippets } = await load('exams.mjs')
  const render = (contentMarkdown, slug = 'capitulo/seccion') => renderToStaticMarkup(React.createElement(ContentProvider, { slug }, React.createElement(ContentRenderer, { document: { contentMarkdown } })))
  const cells = html => [...html.matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/g)].map(match => match[1])

  const example = render(imageTableSnippet)
  assert.equal((example.match(/<table\b/g) || []).length, 1)
  assert.equal(cells(example).length, 4)
  assert(example.includes('min-width:44rem'))
  assert(example.includes('width:34%'))
  assert(example.includes('width:260px'))
  assert(example.includes('max-height:140px'))
  assert(example.includes('role="region" aria-label="Tabla de cargas" tabindex="0"'))
  assert(example.includes('scope="col"'))
  assert(cells(example)[0].includes('src="https://res.cloudinary.com/dtjpmhekb/image/upload/v1795396514/azazmev0ea8exhfa8qxy.svg"'))
  assert(cells(example)[0].includes('course-table-image-caption">Fuerza concentrada'))
  assert(!example.includes('<figure'), 'Cell images should not introduce figure margins or frames.')
  assert.equal(cells(example).filter(cell => cell.includes('katex-html')).length, 3, 'The three equation cells must render as LaTeX, not raster images.')
  assert(!example.includes('katex-error'))
  assert.equal(examSnippets.find(item => item.id === 'image-table').content, imageTableSnippet)

  const custom = String.raw`<Table title="Datos" align="center" imageWidth="220px" imageHeight="150px">

| Dibujo | Dato | Observación |
| --- | ---: | :--- |
| <Image src="esquema.png" alt="Dibujo A" width="180px" height="100px" caption="Esquema A" /> | $\displaystyle N = \int_A \sigma\,dA$ | Texto **editable** |
| ![Dibujo B](./segundo.svg) | 25 | Otro texto |

</Table>`
  const normalized = normalizeLegacyMdx(custom)
  assert(!normalized.includes(':::image'), 'Images must remain inline so the table is not split into separate blocks.')
  const html = render(custom)
  assert.equal((html.match(/<table\b/g) || []).length, 1)
  assert.equal(cells(html).length, 6)
  assert(cells(html)[0].includes('/api/imagen/capitulo/seccion/esquema.png'))
  assert(cells(html)[0].includes('width:180px'))
  assert(cells(html)[0].includes('max-height:100px'))
  assert(cells(html)[0].includes('Esquema A'))
  assert(cells(html)[3].includes('width:220px'))
  assert(cells(html)[3].includes('max-height:150px'))
  assert(cells(html)[3].includes('/api/imagen/capitulo/seccion/segundo.svg'))
  assert(cells(html)[1].includes('large-op'), 'A display-style integral remains a large LaTeX operator in a cell.')
  assert(cells(html)[2].includes('<strong>editable</strong>'))
  assert.match(html, /<td style="text-align:right[^>]*>/)
  assert.match(html, /<td style="text-align:left[^>]*>/)
  assert(!html.includes('katex-error'))

  const mixed = render('| ![Cabecera](/cabecera.svg) | Texto |\n| --- | --- |\n| <Image src="a.svg" alt="Uno" /> y <Image src="b.svg" alt="Dos" /> | $x$ |')
  assert.equal((mixed.match(/<img\b/g) || []).length, 3, 'Images work in headers and multiple images can share a cell.')
  assert.equal(cells(mixed).length, 2)
  assert(!mixed.includes('<figure'))
  const escaped = render('| Figura |\n| --- |\n| <Image src="a.svg?x=1&y=2" alt="A | B" caption=\'Una "figura"\' /> |')
  assert.equal(cells(escaped).length, 1, 'Pipes in image attributes must not create extra columns.')
  assert(escaped.includes('alt="A | B"'))
  assert(escaped.includes('Una &quot;figura&quot;'))
  assert(escaped.includes('a.svg?x=1&amp;y=2'))

  const grid = render('<TableGrid columns="2">\n\n' + imageTableSnippet + '\n\n<Table title="Otra" imageWidth="90px">\n\n| Figura |\n| --- |\n| ![Otra](/otra.svg) |\n\n</Table>\n\n</TableGrid>')
  assert.equal((grid.match(/<table\b/g) || []).length, 2)
  assert(cells(grid).at(-1).includes('width:90px'), 'Options stay local to their own table in a grid.')
  const outside = render('![Figura independiente](figura.png "Explicación")')
  assert(outside.includes('<figure'))
  assert(outside.includes('course-figure my-8'))
  assert(!outside.includes('course-table-image'))
  const invalid = render(custom.replace('width="180px"', 'width="calc(100% + 999px)"').replace('imageWidth="220px"', 'imageWidth="invalid"'))
  assert(!invalid.includes('calc('))
  assert(invalid.includes('width:240px'))
  const fenced = '```mdx\n' + custom + '\n```'
  assert.equal(normalizeLegacyMdx(fenced), fenced)
  assert(!render('<script>alert(1)</script>').includes('<script>'), 'Table support must not enable arbitrary HTML or executable MDX.')
  console.log('PASS: native tables, mixed images/text/LaTeX, inline Image dimensions/captions, relative paths, alignment, independent grids, accessible scrolling and preserved code/figures.')
} finally {
  if (!temporary.startsWith(path.join(root, '.table-tests-'))) throw new Error('Unexpected test directory')
  fs.rmSync(temporary, { recursive: true, force: true })
}
