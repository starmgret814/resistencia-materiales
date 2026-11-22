import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(file, dependencies = {}) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(new URL(file, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in dependencies, name); return dependencies[name] }, structuredClone, console })
  return exports
}
const seed = [{ number: '01', title: 'Base', sections: [{ id: '1.1', title: 'Tema', slug: '01-base/tema' }] }]
const data = load('../lib/course-data.ts', { './chapters.json': { default: seed } })
const schema = load('../lib/content-schema.ts')
const structure = load('../lib/course-structure.ts', { './course-data': data, './content-schema': schema })
const titles = load('../lib/course-titles.ts')
const { applyCourseStructureAction: apply, canChangeCourseStructure: allowed } = structure
let catalog = structuredClone(seed)
for (let i = 0; i < 39; i++) catalog = apply(catalog, { type: 'create-chapter', title: `Capítulo ${i + 2}` }).chapters
assert.equal(catalog.length, 40, 'Chapter count must not be limited to the original course')
assert.equal(catalog.at(-1).number, '40')
assert.equal(seed.length, 1, 'Pure operations must never mutate their source')
const renamed = apply(catalog, { type: 'rename-chapter', chapter: '01', title: ' Nuevo nombre ' }).chapters
assert.equal(renamed[0].title, 'Nuevo nombre')
assert.equal(renamed[0].sections[0].slug, seed[0].sections[0].slug)
let archived = apply(renamed, { type: 'archive-chapter', chapter: '01' }).chapters
assert.equal(data.activeChapters(archived).length, 39)
assert.equal(archived[0].sections[0].slug, seed[0].sections[0].slug)
archived = apply(archived, { type: 'restore-chapter', chapter: '01' }).chapters
assert.equal(data.activeChapters(archived).length, 40)
assert.equal(apply(archived, { type: 'move-chapter', chapter: '40', direction: 'up' }).chapters[38].number, '40', 'Reordering preserves persistent chapter identities')
let sectionChange = apply(archived, { type: 'create-section', chapter: '01', title: 'Tema' })
assert.equal(sectionChange.section.slug, '01-base/tema-2', 'Repeated titles must produce unique destinations')
sectionChange = apply(sectionChange.chapters, { type: 'rename-section', chapter: '01', slug: 'tema-2', title: 'Otra denominación' })
assert.equal(sectionChange.section.slug, '01-base/tema-2', 'Renaming preserves existing links')
assert.equal(apply(sectionChange.chapters, { type: 'move-section', chapter: '01', slug: 'tema-2', direction: 'up' }).chapters[0].sections[0].title, 'Otra denominación')
assert.throws(() => apply(catalog, { type: 'create-chapter', title: ' ' }))
assert.throws(() => apply(catalog, { type: 'rename-section', chapter: '01', slug: 'missing', title: 'x' }))
const editor = { email: 'editor@example.test', role: 'editor', assignedChapters: ['40'] }
const admin = { email: 'admin@example.test', role: 'admin', assignedChapters: [] }
assert(allowed(editor, catalog, { type: 'create-section', chapter: '40', title: 'Tema' }))
assert(!allowed(editor, catalog, { type: 'rename-chapter', chapter: '40', title: 'x' }))
assert(!allowed(editor, catalog, { type: 'create-section', chapter: '01', title: 'x' }))
assert(!allowed(editor, apply(catalog, { type: 'archive-chapter', chapter: '40' }).chapters, { type: 'create-section', chapter: '40', title: 'x' }))
assert.deepEqual(data.activeChapters([]), [], 'An intentionally empty catalog must stay empty')
assert.equal(data.findSectionBySlug('01-base/tema', []), null, 'Routes cannot resurrect a removed section from the bundled catalog')
assert.equal(data.findSectionBySlug('01-base/tema', [{ ...seed[0], archived: true }]), null, 'Archived chapters must not appear in public navigation')
assert.equal(data.findSectionBySlug('tema-2', sectionChange.chapters).section.title, 'Otra denominación', 'Navigation uses dynamic titles and stable slugs')
assert.equal(data.findSectionBySlug('tema-2', sectionChange.chapters).previous.title, 'Tema')
assert.equal(data.findSectionBySlug('tema', [{ ...seed[0], sections: [seed[0].sections[0], { id: '1.2', title: 'Pendiente', slug: null }, sectionChange.section] }]).next.slug, '01-base/tema-2', 'Navigation skips unavailable destinations')

// The transaction adapter uses isolated storage, never a production database.
const records = new Map([['course/chapters', { list: catalog }]])
let commits = 0
const sdk = {
  doc: (_db, ...parts) => ({ id: parts.at(-1), path: parts.join('/') }),
  getDoc: async ref => snapshot(ref),
  getDocFromServer: async ref => snapshot(ref),
  runTransaction: async (_db, callback) => {
    const pending = []
    const result = await callback({ get: async ref => snapshot(ref), set: (ref, value, options) => pending.push(['set', ref.path, value, options]), update: (ref, value) => pending.push(['set', ref.path, value, { merge: true }]), delete: ref => pending.push(['delete', ref.path]) })
    for (const [operation, path, value, options] of pending) {
      if (operation === 'delete') records.delete(path)
      else records.set(path, structuredClone({ ...(options?.merge ? records.get(path) : {}), ...value }))
    }
    commits++
    return result
  },
}
function snapshot(ref) { const value = records.get(ref.path); return { exists: () => value !== undefined, data: () => structuredClone(value) } }
const store = load('../lib/course-structure-store.ts', { 'firebase/firestore': sdk, './firebase': { db: {} }, './course-data': { ...data, chapters: seed }, './course-structure': structure, './course-titles': titles })
assert.equal((await store.loadCourseCatalog()).length, 40)
records.set('course/chapters', { list: [] })
assert.equal((await store.loadCourseCatalog()).length, 0, 'An empty saved catalog cannot be replaced by the initial seed')
records.set('course/chapters', { list: catalog })
await store.changeCourseStructure(editor, { type: 'create-section', chapter: '40', title: 'Creado desde el panel' })
assert.equal(records.get('course/chapters').editedChapterIndex, 39)
assert.equal(records.get('drafts/40_creado-desde-el-panel').title, 'Creado desde el panel')
const before = commits
await assert.rejects(store.changeCourseStructure(editor, { type: 'create-chapter', title: 'No permitido' }))
assert.equal(commits, before, 'Unauthorized operations cannot commit anything')
records.set('drafts/40_creado-desde-el-panel', { ...records.get('drafts/40_creado-desde-el-panel'), status: 'approved', publishedContent: '# Publicado', publishedTitle: 'Publicado' })
await assert.rejects(store.changeCourseStructure(editor, { type: 'remove-section', chapter: '40', slug: 'creado-desde-el-panel' }))
assert.equal(records.get('course/chapters').list.at(-1).sections.length, 1, 'A failed removal must not partially remove the catalog entry')
await store.changeCourseStructure(admin, { type: 'archive-chapter', chapter: '40' })
assert.ok(records.has('drafts/40_creado-desde-el-panel'), 'Archiving must never delete any content')
await store.changeCourseStructure(admin, { type: 'restore-chapter', chapter: '40' })
await store.changeCourseStructure(editor, { type: 'rename-section', chapter: '40', slug: 'creado-desde-el-panel', title: 'Título actualizado' })
assert.equal(records.get('drafts/40_creado-desde-el-panel').publishedTitle, 'Publicado', 'A content editor cannot change publication metadata')
records.set('course/chapters', { list: 'invalid' })
await assert.rejects(store.changeCourseStructure(admin, { type: 'create-chapter', title: 'No sobrescribir' }))
console.log('PASS: dynamic chapters, stable routes, archiving, unique sections, permissions and atomic course mutations.')
