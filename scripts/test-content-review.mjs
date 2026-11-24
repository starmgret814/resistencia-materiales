import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import { webcrypto } from 'node:crypto'
import ts from 'typescript'
import * as jsx from 'react/jsx-runtime'
import * as icons from 'lucide-react'

function load(file, dependencies = {}, globals = {}) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  vm.runInNewContext(code, { exports, require: name => dependencies[name], crypto: webcrypto, TextEncoder, Response, URLSearchParams, AbortController, console: { ...console, error() {} }, ...globals })
  return exports
}
const review = load('lib/content-review.ts')
const diffSettings = load('lib/content-review-editor.ts')
const { default: WorkspaceSwitch } = load('components/workspace-switch.tsx', { 'react/jsx-runtime': jsx })
function diffHarness() {
  const before = [], after = [], settings = []
  let layouts = 0
  const restorations = []
  const pane = (side, options, line, left) => ({ updateOptions: value => options.push(value), getVisibleRanges: () => [{ startLineNumber: line }], getScrollLeft: () => left, getModel: () => ({ getLineCount: () => 100 }), revealLineNearTop: value => restorations.push({ side, line: value }), setScrollLeft: value => restorations.push({ side, left: value }) })
  const original = pane('original', before, 12, 10), modified = pane('modified', after, 16, 20)
  const editor = { updateOptions: value => settings.push(value), getOriginalEditor: () => original, getModifiedEditor: () => modified, layout: () => layouts++, getLineChanges: () => [], onDidUpdateDiff: () => ({ dispose() {} }), onDidDispose() {} }
  return { editor, before, after, settings, restorations, layouts: () => layouts }
}
for (const wrap of [true, false]) {
  const diff = diffHarness()
  diffSettings.configureReviewDiff(diff.editor, true, wrap)
  assert.equal(JSON.stringify(diff.before[0]), JSON.stringify(diff.after[0]), 'Both source panes receive exactly the same layout options')
  assert.equal(diff.before[0].wordWrap, wrap ? 'on' : 'off')
  assert.equal(diff.before[0].wordWrapOverride2, wrap ? 'on' : 'off')
  assert.equal(diff.settings[0].diffWordWrap, wrap ? 'on' : 'off')
  assert.equal(diff.settings[0].splitViewDefaultRatio, .5)
  assert.equal(diff.before[0].scrollbar.horizontal, 'auto')
  assert.equal(diff.layouts(), 1)
}
const lineChanges = [{ originalStartLineNumber: 2, originalEndLineNumber: 2, modifiedStartLineNumber: 2, modifiedEndLineNumber: 2, charChanges: [{ originalStartLineNumber: 2, originalStartColumn: 3, originalEndLineNumber: 2, originalEndColumn: 7, modifiedStartLineNumber: 2, modifiedStartColumn: 3, modifiedEndLineNumber: 2, modifiedEndColumn: 8 }] }]
assert.equal(diffSettings.reviewSourceDecorations(lineChanges, 'original')[0].options.className, 'review-source-removed')
assert.equal(diffSettings.reviewSourceDecorations(lineChanges, 'modified')[1].options.inlineClassName, 'review-source-added-text')
const addition = [{ originalStartLineNumber: 1, originalEndLineNumber: 0, modifiedStartLineNumber: 2, modifiedEndLineNumber: 4 }]
assert.equal(diffSettings.reviewSourceDecorations(addition, 'original').length, 0, 'An addition cannot mark an unchanged original line as removed')
assert.equal(diffSettings.reviewSourceDecorations(addition, 'modified').length, 1)
const deletion = [{ originalStartLineNumber: 2, originalEndLineNumber: 4, modifiedStartLineNumber: 1, modifiedEndLineNumber: 0 }]
assert.equal(diffSettings.reviewSourceDecorations(deletion, 'modified').length, 0)
assert.equal(diffSettings.reviewSourceDecorations([], 'modified').length, 0)
const scrollDiff = diffHarness()
diffSettings.restoreReviewScroll(scrollDiff.editor.getModifiedEditor(), { line: 500, left: -2 })
assert.equal(scrollDiff.restorations[0].line, 100, 'Positions are clamped after loading a shorter revision')
assert.equal(scrollDiff.restorations[1].left, 0)

function independentPaneHarness(side) {
  const slots = [], effects = [], scrolls = [], decorations = [], restores = []
  let cursor = 0, listener = null, topLine = 1, left = 0
  const react = {
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useEffect(effect, dependencies) { const i = cursor++; if (!slots[i] || dependencies.some((value, index) => value !== slots[i].dependencies[index])) { slots[i]?.cleanup?.(); slots[i] = { dependencies }; effects.push(() => { slots[i].cleanup = effect() }) } },
  }
  const { default: Pane } = load('components/review-source-pane.tsx', { react, 'react/jsx-runtime': jsx, '@monaco-editor/react': { default: 'standalone-editor' }, '@/lib/markdown-editor-theme': {}, '@/lib/content-review-editor': diffSettings })
  const editor = {
    createDecorationsCollection(initial) { decorations.push(initial); return { set: value => decorations.push(value) } },
    getVisibleRanges: () => [{ startLineNumber: topLine }], getScrollLeft: () => left,
    getModel: () => ({ getLineCount: () => 80 }), revealLineNearTop: line => restores.push(line), setScrollLeft() {},
    onDidScrollChange(callback) { listener = callback; return { dispose() { listener = null } } },
  }
  return {
    render(changes = lineChanges) { cursor = 0; const tree = Pane({ side, value: 'readonly text', path: `${side}.md`, changes, wrap: true, position: { line: 10, left: 0 }, onScroll: value => scrolls.push(value) }); effects.splice(0).forEach(effect => effect()); return tree },
    mount(tree) { tree.props.children.props.onMount(editor) },
    scroll(line, horizontal) { topLine = line; left = horizontal; listener?.() },
    close() { slots.forEach(slot => slot?.cleanup?.()); assert.equal(listener, null) },
    scrolls, decorations, restores,
  }
}
const beforePane = independentPaneHarness('original'), afterPane = independentPaneHarness('modified')
const beforeTree = beforePane.render(), afterTree = afterPane.render()
assert.equal(beforeTree.props.children.props.options.readOnly, true)
assert.notEqual(beforeTree.props.children.props.path, afterTree.props.children.props.path)
beforePane.mount(beforeTree); afterPane.mount(afterTree)
beforePane.scroll(30, 12)
assert.equal(beforePane.scrolls.at(-1).line, 30)
assert.equal(afterPane.scrolls.length, 0, 'Scrolling the original standalone pane cannot move the modified pane')
afterPane.scroll(50, 6)
assert.equal(beforePane.scrolls.length, 1)
assert.equal(afterPane.scrolls.at(-1).line, 50)
beforePane.render([])
assert.equal(beforePane.decorations.at(-1).length, 0, 'Updated diff ranges remove stale highlighting')
assert.equal(beforePane.restores.length, 1, 'Highlight updates do not reset independent scroll positions')
beforePane.close(); afterPane.close()
const candidate = { schemaVersion: 2, chapterId: '01', slug: 'normal', title: 'Esfuerzo normal', contentMarkdown: '# Esfuerzo normal\n\nNuevo texto $\\sigma = P/A$.' }
const record = { ...candidate, authorEmail: 'author@example.invalid', status: 'pending_approval', updatedAt: '2026-11-22T10:00:00Z', publishedTitle: candidate.title, publishedContent: '# Esfuerzo normal\n\nTexto publicado.', publishedAt: '2026-11-21T10:00:00Z' }
const revision = await review.contentReviewRevision(record)
assert.match(revision, /^[a-f0-9]{64}$/)
assert.equal(revision, await review.contentReviewRevision(Object.fromEntries(Object.entries(record).reverse())))
for (const field of ['contentMarkdown', 'publishedContent', 'publishedTitle', 'title', 'updatedAt', 'status']) assert.notEqual(revision, await review.contentReviewRevision({ ...record, [field]: 'changed' }), field)
assert.notEqual(await review.contentReviewRevision(null), await review.contentReviewRevision({}))
assert(review.reviewHasChanges(null, candidate))
assert(!review.reviewHasChanges(candidate, { ...candidate, contentMarkdown: candidate.contentMarkdown.replace(/\n/g, '\r\n') }))
assert(review.reviewHasChanges(candidate, { ...candidate, contentMarkdown: candidate.contentMarkdown + ' ' }), 'Whitespace changes remain reviewable')
assert(review.reviewHasChanges(candidate, { ...candidate, title: 'Otro título' }))

let source = structuredClone(record), readFailure = false, writes = [], transactionCalls = 0, concurrentRetry = false
const firestore = {
  doc: (_db, _collection, id) => id,
  getDoc: async () => { if (readFailure) throw new Error('offline'); return { exists: () => source !== null, data: () => structuredClone(source) } },
  getDocFromServer: async () => firestore.getDoc(),
  runTransaction: async (_db, callback) => {
    transactionCalls++
    let staged = []
    const transaction = { get: () => firestore.getDoc(), set: (reference, data, options) => staged.push({ reference, data, options }) }
    await callback(transaction)
    if (concurrentRetry) {
      concurrentRetry = false
      source = { ...source, contentMarkdown: 'A later editor contribution', updatedAt: 'newer' }
      staged = []
      await callback(transaction)
    }
    writes.push(...staged)
  },
}
const service = load('lib/course-service.ts', {
  '@/lib/firebase': { db: {} }, 'firebase/firestore': firestore,
  '@/lib/course-data': { chapters: [] }, '@/lib/course-headings': { countCourseProblems: () => 0 },
  '@/lib/chapter-one-revision': { matchesPreviousChapterOneRevision: async (_chapter, _slug, text) => text === 'legacy published text' },
  '@/lib/project-markdown': { loadProjectMarkdown: async () => 'effective project text seen on the public page' },
})
assert.equal((await service.getApprovedSubtopic('01', 'normal')).contentMarkdown, record.publishedContent, 'Read the published copy, never the pending draft')
source = { ...record, publishedContent: undefined, status: 'approved' }
assert.equal((await service.getApprovedSubtopic('01', 'normal')).contentMarkdown, record.contentMarkdown, 'Support approvals saved before publishedContent existed')
source = { ...record, publishedContent: 'legacy published text' }
assert.equal((await service.getApprovedSubtopic('01', 'normal')).contentMarkdown, 'effective project text seen on the public page', 'Use the exact effective public rendering')
source = { ...record, publishedContent: undefined, status: 'draft' }
assert.equal(await service.getApprovedSubtopic('01', 'normal'), null, 'An unpublished draft is not a published version')

let catalogFailure = false
const catalog = [{ number: '01', title: 'Esfuerzos', sections: [{ id: '1.1', title: candidate.title, slug: '01-esfuerzos/normal' }] }]
const route = load('src/pages/api/content-review.ts', {
  '@/lib/firebase': { db: {} }, 'firebase/firestore': firestore,
  '@/lib/course-structure-store': { loadCourseCatalog: async server => { assert.equal(server, true); if (catalogFailure) throw new Error('offline'); return catalog } },
  '@/lib/course-service': { ...service, getChapterProblemOffset: async () => 2 },
  '@/lib/content-review': review,
  '@/lib/course-structure': { shortSectionSlug: section => section.slug?.split('/').pop() || section.id },
  '@/lib/course-titles': { findSubtopicNumber: () => '1.1', withSubtopicTitle: (document, title) => ({ ...document, title }) },
})
const get = (role = 'admin', slug = 'normal') => route.GET({ locals: { session: role ? { role } : null }, url: new URL(`http://localhost/api/content-review?chapter=01&slug=${slug}`) })
assert.equal((await get(null)).status, 403)
assert.equal((await get('editor')).status, 403)
assert.equal((await get('admin', 'absent')).status, 404)
source = structuredClone(record)
const response = await get()
assert.equal(response.status, 200)
assert.match(response.headers.get('cache-control'), /private, no-store/)
const baseline = await response.json()
assert(review.isContentReviewBaseline(baseline))
assert.equal(baseline.published.contentMarkdown, record.publishedContent)
assert.equal(baseline.draft.contentMarkdown, candidate.contentMarkdown)
assert.equal(baseline.problemOffset, 2)
assert(!JSON.stringify(baseline).includes(record.authorEmail), 'Do not expose contributor emails in comparison payloads')
source = { ...record, status: 'draft', publishedContent: undefined }
assert.equal((await (await get()).json()).published, null)
source = null
const newSection = await (await get()).json()
assert.equal(newSection.published, null)
assert.equal(newSection.draft, null)
readFailure = true
assert.equal((await get()).status, 503, 'An unavailable publication cannot masquerade as a new empty page')
readFailure = false; catalogFailure = true
assert.equal((await get()).status, 503)
catalogFailure = false
assert(review.sameReviewBaseline(baseline, structuredClone(baseline)))
for (const update of [{ revision: 'f'.repeat(64) }, { sectionTitle: 'Changed' }, { problemOffset: 3 }, { published: null }]) assert(!review.sameReviewBaseline(baseline, { ...baseline, ...update }))
assert(!review.isContentReviewBaseline({ ...baseline, revision: 'invalid' }))
assert(!review.isContentReviewBaseline({ ...baseline, draft: {} }))

const publication = load('lib/content-publication.ts', { './firebase': { db: {} }, 'firebase/firestore': firestore, './content-review': review })
const admin = { email: 'admin@example.invalid', role: 'admin' }
source = structuredClone(record); writes = []
await publication.publishReviewedContent(candidate, revision, admin)
assert.equal(writes.length, 1)
assert.equal(writes[0].data.publishedContent, candidate.contentMarkdown)
assert.equal(writes[0].data.authorEmail, record.authorEmail)
assert.equal(writes[0].data.publishedBy, admin.email)
assert.equal(writes[0].data.status, 'approved')
writes = []; const calls = transactionCalls
await assert.rejects(publication.publishReviewedContent(candidate, revision, { ...admin, role: 'editor' }), /administrador/)
assert.equal(transactionCalls, calls)
await assert.rejects(publication.publishReviewedContent({ ...candidate, contentMarkdown: ' ' }, revision, admin), /vacío/)
source = { ...record, contentMarkdown: 'new remote text' }
await assert.rejects(publication.publishReviewedContent(candidate, revision, admin), /cambió/)
assert.equal(writes.length, 0)
source = structuredClone(record); concurrentRetry = true
await assert.rejects(publication.publishReviewedContent(candidate, revision, admin), /cambió/)
assert.equal(writes.length, 0, 'A transaction retry after another edit cannot approve an obsolete review')
source = null
await publication.publishReviewedContent(candidate, await review.contentReviewRevision(null), admin)
assert.equal(writes[0].data.authorEmail, admin.email)
writes = []; source = { ...record, status: 'approved', publishedContent: undefined }
await publication.saveDraftPreservingPublication({ ...candidate, contentMarkdown: 'Next proposal' }, 'pending_approval', { email: record.authorEmail, role: 'editor' })
assert.equal(writes[0].data.publishedContent, record.contentMarkdown, 'Saving an old approved document preserves its previous public content')
assert.equal(writes[0].data.contentMarkdown, 'Next proposal')
source = structuredClone(record); writes = []
await publication.saveDraftPreservingPublication({ ...candidate, publishedContent: 'stale public copy from an earlier load', publishedBy: 'stale identity', status: 'approved' }, 'draft', admin)
assert(!('publishedContent' in writes[0].data), 'Normal draft saves leave the existing public snapshot untouched')
assert(!('publishedBy' in writes[0].data), 'Loaded publication metadata cannot be copied back accidentally')
assert.equal(writes[0].data.authorEmail, record.authorEmail)

// Exercise the actual review UI handlers without Monaco CDN, accounts or live database writes.
function uiHarness(initialBaseline) {
  const slots = [], effects = []
  let cursor = 0, currentCandidate = structuredClone(candidate), nextBaseline = initialBaseline, loadFailure = null, publishFailure = null, pendingPublish = null
  let loads = 0, publications = 0, closes = 0, reloads = 0
  const react = {
    useState(initial) { const i = cursor++; if (!(i in slots)) slots[i] = initial; return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value }] },
    useRef(initial) { const i = cursor++; return slots[i] ??= { current: initial } },
    useId() { cursor++; return 'review-test' },
    useEffect(effect, dependencies) { const i = cursor++; if (!slots[i] || dependencies.some((value, index) => value !== slots[i].dependencies[index])) { slots[i]?.cleanup?.(); slots[i] = { dependencies }; effects.push(() => { slots[i].cleanup = effect() }) } },
    lazy: () => 'content-renderer', Suspense: 'suspense',
  }
  const { default: Review } = load('components/content-review.tsx', {
    react, 'react/jsx-runtime': jsx, '@monaco-editor/react': { DiffEditor: 'diff-editor' }, 'lucide-react': icons,
    '@/lib/content-review': review,
    '@/lib/content-review-client': { loadContentReview: async () => { loads++; if (loadFailure) throw loadFailure; return nextBaseline } },
    '@/lib/markdown-editor-theme': {}, '@/lib/workspace-controls': load('lib/workspace-controls.ts'),
    '@/components/workspace-switch': { default: WorkspaceSwitch },
    '@/lib/content-review-editor': diffSettings, '@/lib/content-context': { ContentProvider: 'content-provider' },
    '@/components/review-source-pane': { default: 'independent-pane' },
    '@/components/preview-error-boundary': { default: 'boundary' },
  }, { window: { matchMedia: () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) } })
  const props = { candidate: currentCandidate, onClose: () => closes++, onPublish: async () => { publications++; if (publishFailure) throw publishFailure; if (pendingPublish) await pendingPublish }, onReloadDraft: document => { reloads++; currentCandidate = document } }
  function render() { cursor = 0; props.candidate = currentCandidate; const tree = Review(props); effects.splice(0).forEach(effect => effect()); return tree }
  return { render, setBaseline: value => { nextBaseline = value }, failLoad: value => { loadFailure = value }, failPublish: value => { publishFailure = value }, holdPublish: () => { let finish; pendingPublish = new Promise(resolve => { finish = resolve }); return finish }, counts: () => ({ loads, publications, closes, reloads }) }
}
function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined
  if (node.type === WorkspaceSwitch) return find(WorkspaceSwitch(node.props), predicate)
  if (predicate(node)) return node
  for (const child of [node.props?.children].flat(Infinity)) { const found = find(child, predicate); if (found) return found }
}
const button = (tree, label) => find(tree, node => node.type === 'button' && [node.props.children].flat().includes(label))
const settle = () => new Promise(resolve => setImmediate(resolve))
const ui = uiHarness(baseline)
assert(button(ui.render(), 'Aprobar y publicar').props.disabled)
await settle()
let tree = ui.render()
assert.equal(ui.counts().publications, 0, 'Opening the review never publishes')
assert.equal(tree.type, 'section', 'Review is a normal workspace view, not a dialog overlay')
assert.equal(find(tree, node => node.props?.['aria-modal']), undefined)
assert(find(tree, node => node.props?.title === 'Publicado · antes' && node.props.document === baseline.published), 'The rendered page comparison is the default review')
assert(find(tree, node => node.props?.title === 'Propuesta · después'))
button(tree, 'Cambios resaltados').props.onClick(); tree = ui.render()
const diff = find(tree, node => node.type === 'diff-editor')
assert.equal(diff.props.original, record.publishedContent)
assert.equal(diff.props.modified, candidate.contentMarkdown)
assert.equal(diff.props.options.readOnly, true)
assert.equal(diff.props.options.originalEditable, false)
const mountedDiff = diffHarness()
find(tree, node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ target: { checked: false } })
tree = ui.render()
// The CDN may finish mounting after the user toggles wrapping. Use the latest choice.
diff.props.onMount(mountedDiff.editor)
assert.equal(mountedDiff.before.at(-1).wordWrap, 'off')
assert.equal(mountedDiff.after.at(-1).wordWrap, 'off')
find(tree, node => node.type === 'input' && node.props.type === 'checkbox').props.onChange({ target: { checked: true } })
tree = ui.render()
assert.equal(mountedDiff.before.at(-1).wordWrap, 'on')
assert.equal(mountedDiff.after.at(-1).wordWrap, 'on')
const synchronize = () => find(tree, node => node.type === 'input' && node.props['aria-label'] === 'Sincronizar desplazamiento')
assert.equal(synchronize().props.checked, true, 'Scroll is synchronized by default')
synchronize().props.onChange({ target: { checked: false } }); tree = ui.render()
assert(find(tree, node => node.type === 'independent-pane' && node.props.side === 'original'))
const independentAfter = find(tree, node => node.type === 'independent-pane' && node.props.side === 'modified')
assert.equal(independentAfter.props.position.line, 16, 'Independent mode starts near the current native view')
assert(find(tree, node => node.props?.['aria-hidden'] === true), 'The native diff engine is hidden from interaction in independent mode')
independentAfter.props.onScroll({ line: 40, left: 18 })
synchronize().props.onChange({ target: { checked: true } }); tree = ui.render()
assert.equal(find(tree, node => node.type === 'independent-pane'), undefined)
assert(mountedDiff.restorations.some(item => item.side === 'modified' && item.line === 40), 'Resynchronizing follows the last independently scrolled pane')
button(tree, 'Vista de la página').props.onClick(); tree = ui.render()
assert(find(tree, node => node.props?.title === 'Publicado · antes' && node.props.document === baseline.published))
assert(find(tree, node => node.props?.title === 'Propuesta · después'))
ui.failPublish(new Error(review.REVIEW_CONFLICT_MESSAGE))
button(tree, 'Aprobar y publicar').props.onClick(); await settle(); tree = ui.render()
assert(button(tree, 'Aprobar y publicar').props.disabled)
ui.setBaseline({ ...baseline, revision: 'f'.repeat(64), draft: { ...candidate, contentMarkdown: 'New remote proposal' } })
button(tree, 'Actualizar comparación').props.onClick(); ui.render(); await settle(); tree = ui.render()
assert(button(tree, 'Aprobar y publicar').props.disabled, 'Refreshing a changed draft cannot approve the old local proposal')
button(tree, 'Cargar borrador actual').props.onClick(); tree = ui.render()
assert.equal(ui.counts().reloads, 1)
assert.equal(button(tree, 'Aprobar y publicar').props.disabled, false)
ui.failPublish(null)
button(tree, 'Aprobar y publicar').props.onClick(); await settle(); tree = ui.render()
assert.equal(ui.counts().publications, 2)
button(tree, 'Volver al editor').props.onClick()
assert.equal(ui.counts().closes, 1)
const empty = uiHarness(newSection); empty.render(); await settle(); tree = empty.render()
button(tree, 'Cambios resaltados').props.onClick(); tree = empty.render()
assert.equal(find(tree, node => node.type === 'diff-editor').props.original, '')
const failed = uiHarness(baseline); failed.failLoad(new Error('offline')); failed.render(); await settle(); tree = failed.render()
assert(button(tree, 'Aprobar y publicar').props.disabled)
assert.equal(find(tree, node => node.type === 'diff-editor'), undefined, 'Failure must not show a fabricated empty publication')
const repeated = uiHarness(baseline); repeated.render(); await settle(); tree = repeated.render()
const finish = repeated.holdPublish()
button(tree, 'Aprobar y publicar').props.onClick(); button(tree, 'Aprobar y publicar').props.onClick()
assert.equal(repeated.counts().publications, 1, 'Double clicks cannot publish twice')
finish(); await settle()

// Exercise the real editor -> review -> guarded publication wiring as well.
const parentSlots = [], parentEffects = []
let parentCursor = 0, currentRemoteBaseline = baseline, parentWrites = 0, backups = 0, acknowledgements = 0, expectedPublicationText = candidate.contentMarkdown
let uploadCalls = 0, uploadFailure = false, heldUpload = null
const uploadedImage = 'https://res.cloudinary.com/example/image/upload/diagram.svg'
const parentReact = {
  useState(initial) { const i = parentCursor++; if (!(i in parentSlots)) parentSlots[i] = typeof initial === 'function' ? initial() : initial; return [parentSlots[i], value => { parentSlots[i] = typeof value === 'function' ? value(parentSlots[i]) : value }] },
  useRef(initial) { const i = parentCursor++; return parentSlots[i] ??= { current: initial } },
  useMemo(factory) { parentCursor++; return factory() },
  useDeferredValue: value => value,
  useId() { parentCursor++; return 'editor-review-test' },
  useEffect(effect, dependencies) { const i = parentCursor++; if (!parentSlots[i] || dependencies.some((value, index) => value !== parentSlots[i].dependencies[index])) { parentSlots[i]?.cleanup?.(); parentSlots[i] = { dependencies }; parentEffects.push(() => { parentSlots[i].cleanup = effect() }) } },
  lazy: factory => factory.toString().includes('content-review') ? 'content-review' : 'content-renderer', Suspense: 'suspense',
}
const { default: ContentEditor } = load('components/content-editor.tsx', {
  react: parentReact, 'react/jsx-runtime': jsx, 'lucide-react': icons,
  '@/lib/firebase': { db: {} }, 'firebase/firestore': { doc: () => '01_normal', getDoc: async () => ({ exists: () => true, data: () => structuredClone(record) }) },
  '@/lib/workspace-api': { workspaceFetch: async () => { backups++; return new Response('{}') } },
  '@/lib/workspace-controls': load('lib/workspace-controls.ts'),
  '@/lib/workspace-guides': load('lib/workspace-guides.ts'),
  '@/lib/table-snippets': load('lib/table-snippets.ts'),
  '@/lib/image-upload': { uploadCourseImage: async () => { uploadCalls++; if (heldUpload) return heldUpload; if (uploadFailure) throw new Error('La imagen no se pudo subir'); return uploadedImage } },
  '@/lib/content-review-client': { loadContentReview: async () => { if (currentRemoteBaseline instanceof Error) throw currentRemoteBaseline; return currentRemoteBaseline } },
  '@/lib/content-review': review,
  '@/lib/content-publication': { publishReviewedContent: async document => { parentWrites++; assert.equal(document.contentMarkdown, expectedPublicationText) }, saveDraftPreservingPublication: async () => {} },
  '@/lib/content-schema': load('lib/content-schema.ts'),
  '@/lib/course-data': { chapters: catalog }, '@/lib/course-structure-store': { loadCourseCatalog: async () => catalog },
  '@/lib/course-titles': load('lib/course-titles.ts'),
  '@/lib/chapter-one-revision': { matchesPreviousChapterOneRevision: async () => false },
  '@/lib/use-local-draft': { useLocalDraft: () => ({ pending: null, failed: false, savedAt: null, acknowledge() { acknowledgements++ } }) },
  '@/lib/local-draft': { localDraftKey: () => 'isolated-review' },
  '@/components/local-draft-notice': { LocalDraftStatus: 'local-status', LocalDraftNotice: 'local-notice' },
  '@/components/markdown-editor': { default: 'markdown-editor' }, '@/lib/markdown-editor-theme': {},
  '@/lib/editor-history': load('lib/editor-history.ts'), '@/components/preview-error-boundary': { default: 'boundary' },
}, { structuredClone, window: { location: { search: '?from=requests' } }, setTimeout: () => 1, fetch: async () => Response.json({ offset: 2 }) })
function renderParent(role = 'admin') { parentCursor = 0; const result = ContentEditor({ session: { ...admin, role }, initialChapter: '01', initialSlug: 'normal' }); parentEffects.splice(0).forEach(effect => effect()); return result }
renderParent(); await settle(); renderParent(); await settle(); tree = renderParent()
let reviewWindow = find(tree, node => node.type === 'content-review')
assert(reviewWindow, 'Requests open the comparison automatically after loading the draft')
assert.equal(parentWrites, 0)
assert.equal(backups, 0, 'Opening a request does not write to Firestore or GitHub')
assert.equal(button(tree, 'Aprobar y Publicar'), undefined, 'The old direct-publication action is gone')
const editorBefore = find(tree, node => node.type === 'markdown-editor')
assert(editorBefore, 'The editor stays mounted while its view is hidden')
assert(find(tree, node => node.props?.hidden === true), 'The editor is hidden during full-width review')
currentRemoteBaseline = { ...baseline, revision: 'c'.repeat(64) }
await assert.rejects(reviewWindow.props.onPublish(candidate, baseline), /cambió/)
assert.equal(parentWrites, 0)
assert.equal(backups, 0, 'A stale review must never start the GitHub backup')
reviewWindow.props.onClose(); tree = renderParent()
assert(button(tree, 'Revisar cambios'))
assert(button(tree, 'Publicar'), 'Direct publication remains an independent action')
assert.equal(find(tree, node => node.type === 'markdown-editor').props.documentId, editorBefore.props.documentId)
button(tree, 'Revisar cambios').props.onClick(); tree = renderParent()
assert(find(tree, node => node.type === 'content-review'))
assert.equal(parentWrites, 0)
find(tree, node => node.type === 'content-review').props.onClose(); tree = renderParent()
currentRemoteBaseline = new Error('offline')
button(tree, 'Publicar').props.onClick(); await settle(); tree = renderParent()
assert.equal(parentWrites, 0, 'Direct publication still fails safely when the current server version cannot load')
assert.equal(find(tree, node => node.type === 'content-review'), undefined, 'Direct publication does not open the review')
currentRemoteBaseline = baseline
button(tree, 'Publicar').props.onClick(); button(tree, 'Publicar').props.onClick(); await settle(); tree = renderParent()
assert.equal(parentWrites, 1, 'Direct publication publishes once without opening a comparison')
assert.equal(backups, 1)
assert.equal(find(tree, node => node.type === 'content-review'), undefined)

// A fresh editor instance checks publication from the separate review view.
parentSlots.forEach(slot => slot?.cleanup?.()); parentSlots.length = 0; parentEffects.length = 0
parentWrites = 0; backups = 0; acknowledgements = 0; expectedPublicationText = candidate.contentMarkdown + '\nAdmin correction'
renderParent(); await settle(); renderParent(); await settle(); tree = renderParent()
reviewWindow = find(tree, node => node.type === 'content-review')
await reviewWindow.props.onPublish({ ...candidate, contentMarkdown: candidate.contentMarkdown + '\nAdmin correction' }, baseline)
assert.equal(parentWrites, 1, 'Explicit confirmation publishes the exact reviewed text, including admin corrections')
assert.equal(backups, 1)
assert.equal(acknowledgements, 1)
tree = renderParent()
assert.equal(find(tree, node => node.type === 'content-review'), undefined, 'Successful publication closes the review')
tree = renderParent('editor')
assert.equal(find(tree, node => node.type === 'content-review'), undefined, 'Editors do not receive the approval dialog')
assert(button(tree, 'Solicitar Revisión'))
assert.equal(button(tree, 'Publicar'), undefined, 'Editors cannot use direct publication')

// The actual image toolbar inserts either the raw URL or the existing image
// block at the editor selection without triggering draft/publication writes.
const input = find(tree, node => node.type === 'input' && node.props.type === 'file')
const selectionAtCursor = { startLineNumber: 1, startColumn: 7, endLineNumber: 1, endColumn: 7 }
let picked = 0, imageEdits = 0, undoStops = 0, inserted = '', cursorSelection = selectionAtCursor, lastEditRange, editorReadOnly
input.ref.current = { value: 'selected.svg', click() { picked++ } }
const markdown = find(tree, node => node.type === 'markdown-editor')
let editorMarkdown = markdown.props.value
markdown.props.onMount({
  getSelection: () => cursorSelection, setSelection(selection) { cursorSelection = selection },
  getModel: () => ({ getValueInRange: () => '', isDisposed: () => false }),
  pushUndoStop() { undoStops++ }, executeEdits(_source, edits) {
    imageEdits++; lastEditRange = edits[0].range; inserted = edits[0].text; editorMarkdown += edits[0].text; markdown.props.onChange(editorMarkdown)
  }, focus() {}, updateOptions(options) { editorReadOnly = options.readOnly },
}, { editor: { setTheme() {} } })
const linkButton = value => find(value, node => node.props?.['aria-label'] === 'Subir imagen e insertar enlace')
const fileChange = () => find(renderParent('editor'), node => node.type === 'input' && node.props.type === 'file').props.onChange
const textBeforeUpload = markdown.props.value, writesBeforeUpload = parentWrites, backupsBeforeUpload = backups
linkButton(tree).props.onClick()
assert.equal(picked, 1)
await fileChange()({ target: { files: [] } })
assert.equal(uploadCalls, 0, 'Canceling file selection cannot upload or insert anything.')
linkButton(renderParent('editor')).props.onClick()
let releaseUpload
heldUpload = new Promise(resolve => { releaseUpload = resolve })
const pendingUpload = fileChange()({ target: { files: [{ name: 'selected.svg' }] } })
tree = renderParent('editor')
assert(linkButton(tree).props.disabled)
await fileChange()({ target: { files: [{ name: 'duplicate.svg' }] } })
assert.equal(uploadCalls, 1, 'Concurrent file events must not upload twice.')
assert.equal(find(tree, node => node.type === 'markdown-editor').props.options.readOnly, true, 'The editor keeps the saved insertion position stable during upload.')
releaseUpload(uploadedImage); await pendingUpload; heldUpload = null
tree = renderParent('editor')
assert.equal(imageEdits, 1)
assert.equal(inserted, uploadedImage, 'The URL is inserted as plain text at the captured editor selection.')
assert.equal(lastEditRange, selectionAtCursor, 'The insertion uses the position saved when the upload button was clicked.')
assert.equal(typeof editorReadOnly, 'boolean', 'Monaco read-only state is updated before applying the saved-range edit.')
assert.equal(find(tree, node => node.type === 'markdown-editor').props.value, `${textBeforeUpload}${uploadedImage}`)
assert.equal(button(tree, 'Copiar enlace'), undefined, 'The upload does not show a copy action.')
assert.equal(input.ref.current.value, '')
assert.equal(parentWrites, writesBeforeUpload)
assert.equal(backups, backupsBeforeUpload)
uploadFailure = true
await fileChange()({ target: { files: [{ name: 'failed.svg' }] } })
tree = renderParent('editor')
assert(!linkButton(tree).props.disabled)
assert.equal(imageEdits, 1, 'A failed upload does not modify the editor.')
uploadFailure = false
find(tree, node => node.props?.['aria-label'] === 'Imagen').props.onClick()
await fileChange()({ target: { files: [{ name: 'insert.svg' }] } })
assert.equal(imageEdits, 2)
assert.equal(undoStops, 4, 'Both URL and image-block insertions remain undoable editor operations.')
assert(inserted.includes(`<Image src="${uploadedImage}"`))
assert(!inserted.includes('<Table'))
console.log('PASS: image-link toolbar, cancellation, duplicate blocking, URL insertion at cursor, failed retry and undoable image insertion.')
console.log('PASS: synchronized/independent readonly scrolling, retained diff highlighting, position restoration, equal pane layout, full-width review, direct publication and atomic conflict protection. All writes are isolated test doubles.')
