import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Compile the actual TS modules in an isolated directory, without touching saved content.
const root = path.resolve(import.meta.dirname, '..')
const temporary = fs.mkdtempSync(path.join(root, '.heading-tests-'))
function compile(sourceFile, destination, replacements = []) {
  let source = fs.readFileSync(path.join(root, sourceFile), 'utf8')
  for (const [from, to] of replacements) source = source.replace(from, to)
  fs.writeFileSync(path.join(temporary, destination), ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText)
}
try {
  compile('lib/remark-number-headings.ts', 'numbering.mjs')
  compile('lib/course-markdown.ts', 'markdown.mjs')
  compile('lib/course-titles.ts', 'titles.mjs')
  compile('lib/course-headings.ts', 'headings.mjs', [
    ["'./remark-number-headings'", "'./numbering.mjs'"],
    ["'./course-markdown'", "'./markdown.mjs'"],
  ])
  compile('components/content-renderer.tsx', 'renderer.mjs', [
    ["'@/lib/remark-number-headings'", "'./numbering.mjs'"],
    ["'@/lib/course-markdown'", "'./markdown.mjs'"],
    [/import \{ Image,.*from '@\/components\/mdx-components'/, 'const Table = ({children}) => <div>{children}</div>; const Image = Table, ImageGrid = Table, Definition = Table, Formula = Table, Example = Table, Problem = Table, Solution = Table, Summary = Table;'],
  ])
  const { ContentRenderer } = await import(pathToFileURL(path.join(temporary, 'renderer.mjs')).href)
  const { getCourseHeadings } = await import(pathToFileURL(path.join(temporary, 'headings.mjs')).href)
  const { findSubtopicNumber } = await import(pathToFileURL(path.join(temporary, 'titles.mjs')).href)
  const markdown = `# **Tema**
## Conceptos
### Normal
### Cortante
## 1.8 Otra parte
### 1.8.1 **Detalle**
#### Nivel cuatro
## 3 dimensiones
\`\`\`markdown
## Esto es un ejemplo de codigo
\`\`\`
<Definition title="Nota">

### Dentro del bloque

</Definition>
`
  const render = (contentMarkdown, headingPrefix) => renderToStaticMarkup(React.createElement(ContentRenderer, {
    document: { contentMarkdown }, headingPrefix,
  }))
  const html = render(markdown, '5.2')
  assert.match(html, /<h1 id="5-2-tema">5\.2 <strong>Tema<\/strong><\/h1>/)
  for (const text of ['5.2.1 Conceptos', '5.2.1.1 Normal', '5.2.1.2 Cortante', '5.2.2 Otra parte', '5.2.2.1 ', '5.2.2.1.1 Nivel cuatro', '5.2.3 3 dimensiones', '5.2.3.1 Dentro del bloque']) assert(html.includes(text), text)
  const toc = await getCourseHeadings(markdown, '5.2')
  assert.equal(toc.length, 7)
  assert(!toc.some(item => item.text.includes('codigo')))
  assert(!toc.some(item => item.level === 4))
  for (const item of toc) assert(html.includes(`id="${item.id}"`), `Missing heading anchor: ${item.id}`)
  assert.match(render('## Sin H1\n### Hijo\n## Siguiente\n### Otro', '03.01'), /3\.1\.2\.1 Otro/)
  assert.match(render('### Nivel omitido', '4.2'), /4\.2\.1\.1 Nivel omitido/)
  const unnumbered = render('# Examen\n## Problema\n## Problema', undefined)
  assert.match(unnumbered, /<h1 id="examen">Examen<\/h1>/)
  assert.match(unnumbered, /id="problema-1"/)
  const chapters = [{ number: '05', sections: [{ id: 'old-b', slug: '05-course/b' }, { id: 'old-a', slug: '05-course/a' }] }]
  assert.equal(findSubtopicNumber(chapters, '05', 'a'), '5.2')
  assert.equal(findSubtopicNumber(chapters, '5', '05-course/b'), '5.1')
  assert.equal(findSubtopicNumber(chapters, '05', 'missing'), undefined)
  assert.equal(findSubtopicNumber(chapters, '2026-1', 'a'), undefined)
  console.log('PASS: hierarchical headings, section order, preview rendering, code fences, formatting and matching index anchors.')
} finally {
  if (!temporary.startsWith(path.join(root, '.heading-tests-'))) throw new Error('Unexpected test directory')
  fs.rmSync(temporary, { recursive: true, force: true })
}
