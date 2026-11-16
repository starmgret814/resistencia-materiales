import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const original = "# Prueba\n\nLas cargas transmitidas por los elementos y sus conexiones producen esfuerzos sobre las secciones y superficies de contacto. Para analizarlos, se relacionan las fuerzas internas resultantes con las áreas que las transmiten. Las expresiones de esta sección permiten calcular esfuerzos promedio; la distribución real puede variar dentro de cada área.\n## 1.2.1. Esfuerzo normal\n\nCuando un elemento está sometido a una carga axial, la fuerza interna actúa perpendicularmente a su sección transversal y produce esfuerzo normal. Si la fuerza axial resultante es $P$ y el área de la sección es $A$, el esfuerzo normal promedio es:\n\n$$\n\\sigma_{\\mathrm{prom}}=\\frac{P}{A}.\n$$\n\nEn una barra de armadura, por ejemplo, primero se determina la fuerza axial que soporta el miembro. Luego, al dividirla entre el área de su sección transversal, se obtiene el esfuerzo normal promedio. Si la carga tiende a alargar el elemento, el esfuerzo es de tensión; si tiende a acortarlo, es de compresión.\n\n<Image\n  src=\"https://res.cloudinary.com/dtjpmhekb/image/upload/v1793411265/rqpwnilohnehayh63rra.png\"\n  alt=\"Miembro de una armadura sometido a una fuerza axial; se muestra su sección transversal de área A y la distribución de fuerzas normales sobre ella.\"\n  caption=\"Figura 5. Fuerza axial y esfuerzo normal promedio en la sección de un miembro.\"\n/>\n\n## 1.2.2. Principio de Saint-Venant\n\nLa forma en que una carga se aplica puede afectar la distribución de esfuerzos en la zona cercana. Por ejemplo, si una fuerza axial $P$ actúa a una distancia $d$ del centro de una sección, su efecto puede representarse en el centro mediante la misma fuerza y un momento:\n\n<Tool id=\"mohr-esfuerzos\" />\n\n<Tool id=\"mohr-deformaciones\" />\n\n"
const compile = file => ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText
const revision = await import(`data:text/javascript;base64,${Buffer.from(compile('../lib/chapter-one-revision.ts')).toString('base64')}`)
const { matchesPreviousChapterOneRevision: matches } = revision
assert(await matches('01', 'xd', original))
assert(await matches('1', '01-esfuerzos-falla/xd', original.replace(/\n/g, '\r\n')))
assert(!await matches('02', 'xd', original))
assert(!await matches('01', 'seccion-nueva', original))
assert(!await matches('01', 'xd', original + '\nUn párrafo nuevo que debe conservarse.'))
const rewritten = fs.readFileSync(new URL('../src/content/resistencia/01-esfuerzos-falla/xd/index.mdx', import.meta.url), 'utf8')
assert(!await matches('01', 'xd', rewritten), 'Already updated content must never be replaced again')

let published, sourceReads = 0, sourceFails = false
const exports = {}
const source = fs.readFileSync(new URL('../lib/course-service.ts', import.meta.url), 'utf8')
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
vm.runInNewContext(code, {
  exports, console,
  require: name => ({
    '@/lib/firebase': { db: {} },
    'firebase/firestore': { doc: (_db, _collection, id) => id, getDoc: async () => ({ exists: () => Boolean(published), data: () => published }) },
    '@/lib/course-data': { chapters: [] },
    '@/lib/course-headings': { countCourseProblems: async () => 0 },
    '@/lib/chapter-one-revision': revision,
    '@/lib/project-markdown': { loadProjectMarkdown: async () => { sourceReads++; if (sourceFails) throw new Error('Unavailable'); return rewritten } },
  })[name],
})
const { getApprovedSubtopic } = exports
published = { title: 'Prueba', chapterId: '01', slug: 'xd', publishedContent: original, contentMarkdown: original + '\nBorrador más reciente.', status: 'draft' }
const unchanged = JSON.stringify(published)
assert.equal((await getApprovedSubtopic('01', 'xd')).contentMarkdown, rewritten, 'Old published text displays the rewritten MDX')
assert.equal(JSON.stringify(published), unchanged, 'Displaying a revision never writes over drafts or published fields')
published.publishedContent = original + '\nContenido publicado más reciente.'
assert.equal((await getApprovedSubtopic('01', 'xd')).contentMarkdown, published.publishedContent, 'A different published version always wins')
assert.equal(sourceReads, 1, 'Different revisions never load an override')
published.publishedContent = original
sourceFails = true
assert.equal((await getApprovedSubtopic('01', 'xd')).contentMarkdown, original, 'Unavailable project files leave the original published text intact')
published = null
assert.equal(await getApprovedSubtopic('01', 'xd'), null, 'Unpublished sections must stay unpublished')
console.log('PASS: Exact revision matching, preservation of edited drafts/publications, read-only source updates and safe failure handling.')
