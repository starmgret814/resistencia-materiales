import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const root = path.resolve(import.meta.dirname, '..')
const temporary = fs.mkdtempSync(path.join(root, '.problem-tests-'))
function compile(file, name, replacements = []) {
  let source = fs.readFileSync(path.join(root, file), 'utf8')
  for (const [from, to] of replacements) source = source.replace(from, to)
  fs.writeFileSync(path.join(temporary, name), ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText)
}
try {
  compile('lib/remark-number-headings.ts', 'numbering.mjs')
  compile('lib/course-markdown.ts', 'markdown.mjs')
  compile('lib/interactive-tools.ts', 'tool-models.mjs')
  compile('lib/mohr-circle.ts', 'mohr-model.mjs')
  compile('components/mohr-plot.tsx', 'mohr-plot.mjs', [["'@/lib/mohr-circle'", "'./mohr-model.mjs'"]])
  compile('components/mohr-circle.tsx', 'mohr.mjs', [["'@/lib/mohr-circle'", "'./mohr-model.mjs'"], ["'@/components/mohr-plot'", "'./mohr-plot.mjs'"]])
  compile('components/interactive-tools.tsx', 'tools.mjs', [["'@/lib/interactive-tools'", "'./tool-models.mjs'"], ["'@/lib/mohr-circle'", "'./mohr-model.mjs'"], ["'@/components/mohr-circle'", "'./mohr.mjs'"]])
  compile('lib/course-headings.ts', 'headings.mjs', [["'./remark-number-headings'", "'./numbering.mjs'"], ["'./course-markdown'", "'./markdown.mjs'"]])
  compile('components/mdx-components.tsx', 'components.mjs', [
    [/import \{ cn \} from '[^']+'/, "const cn = (...values) => values.filter(Boolean).join(' ')"],
    [/import \{ useContentSlug \} from '[^']+'/, "const useContentSlug = () => '05-course/section'"],
  ])
  compile('components/content-renderer.tsx', 'renderer.mjs', [
    ["'@/components/interactive-tools'", "'./tools.mjs'"],
    ["'@/lib/remark-number-headings'", "'./numbering.mjs'"], ["'@/lib/course-markdown'", "'./markdown.mjs'"], ["'@/components/mdx-components'", "'./components.mjs'"],
  ])
  // Fake Firestore responses: these tests never connect to production.
  compile('lib/course-service.ts', 'service.mjs', [
    [/import \{ db \} from '[^']+';/, 'const db = {};'],
    [/import \{ doc, getDoc \} from 'firebase\/firestore';/, 'const doc = (_db, _collection, id) => id; const getDoc = async id => { const data = globalThis.testPublished[id]; if (data instanceof Error) throw data; return { exists: () => Boolean(data), data: () => data }; };'],
    [/import \{ chapters as defaultChapters, type Chapter, type Section \} from '[^']+';/, 'const defaultChapters = [];'],
    ["'@/lib/course-headings'", "'./headings.mjs'"],
  ])
  const { ContentRenderer } = await import(pathToFileURL(path.join(temporary, 'renderer.mjs')).href)
  const { countCourseProblems } = await import(pathToFileURL(path.join(temporary, 'headings.mjs')).href)
  const { getChapterProblemOffset } = await import(pathToFileURL(path.join(temporary, 'service.mjs')).href)
  const problem = '<Problem number={1} title="Área para un factor de seguridad de 3.20">\n\nEnunciado.\n\n</Problem>'
  const fake = `\`\`\`mdx\n${problem}\n\`\`\``
  assert.equal(await countCourseProblems(fake), 0)
  assert.equal(await countCourseProblems(`${fake}\n\n${problem}`), 1)
  assert.equal(await countCourseProblems('::::problem{title="Prueba"}\n\nTexto\n\n::::'), 1)
  const chapter = { number: '05', sections: [1, 2, 3, 4].map(n => ({ id: `5.${n}`, slug: `05-course/s${n}` })) }
  globalThis.testPublished = {
    '05_s1': { publishedContent: '# Introducción' },
    '05_s2': { publishedContent: problem, status: 'draft', contentMarkdown: `${problem}\n\n${problem}` },
    '05_s3': { status: 'pending_approval', contentMarkdown: problem },
  }
  assert.equal(await getChapterProblemOffset(chapter, 's2'), 0)
  assert.equal(await getChapterProblemOffset(chapter, 's4'), 1)
  const render = (contentMarkdown, problemOffset = 0, headingPrefix = '5.4') => renderToStaticMarkup(React.createElement(ContentRenderer, { document: { contentMarkdown }, headingPrefix, problemOffset }))
  let html = render(problem, 1)
  assert(html.includes('Problema 5.2: Área para un factor de seguridad de 3.20'))
  assert(!html.includes('Problem 1:'))
  html = render(`${problem}\n\n${problem}`, 1)
  assert(html.includes('Problema 5.3:'))
  const illustrated = '<Problem title="Enlace" image="diagrama.png" imageAlt="Diagrama del enlace" imagePosition="left" imageWidth="40%">\n\nCarga de 20 kN.\n\n<Solution>\n\nRespuesta: 200 MPa.\n\n</Solution>\n\n</Problem>'
  html = render(illustrated)
  assert(html.includes('problem-image-left'))
  assert(html.includes('--problem-image-width:40%'))
  assert(html.includes('/api/imagen/05-course/section/diagrama.png'))
  assert(html.includes('alt="Diagrama del enlace"'))
  assert(html.indexOf('<details') > html.indexOf('</figure></div></div>'), 'Solution must follow the statement/image grid')
  html = render('::::problem{title="Problem 1: Área 3.20"}\n\nTexto\n\n::::', 2)
  assert(html.includes('Problema 5.3: Área 3.20'))
  assert(!html.includes('Problem 1:'))
  html = render('<Example number={2} title="Factor 3.20">\n\nTexto\n\n</Example>')
  assert(html.includes('Ejemplo 2: Factor 3.20'))
  globalThis.testPublished['05_s2'] = new Error('Offline')
  await assert.rejects(getChapterProblemOffset(chapter, 's4'), /Offline/)
  console.log('PASS: chapter-wide numbering, published snapshots, code fences, clean titles and illustrated problems with full-width solutions.')
} finally {
  delete globalThis.testPublished
  if (!temporary.startsWith(path.join(root, '.problem-tests-'))) throw new Error('Unexpected test directory')
  fs.rmSync(temporary, { recursive: true, force: true })
}
