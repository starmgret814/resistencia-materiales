import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as jsx from 'react/jsx-runtime'
import * as icons from 'lucide-react'

function load(path, dependencies = {}, globals = {}) {
  const exports = {}
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } })
  vm.runInNewContext(outputText, { exports, require: name => dependencies[name], ...globals })
  return exports
}
const authoring = load('../lib/exam-authoring.ts', { './table-snippets': load('../lib/table-snippets.ts') })
const data = load('../lib/exam-data.ts')
const errors = load('../lib/exam-errors.ts')
const history = load('../lib/editor-history.ts')
const workspaceControls = load('../lib/workspace-controls.ts')
assert.equal(errors.examFailure({ code: 'firestore/permission-denied' }, 'load').code, 'permission-denied')
assert.match(errors.examFailure({ code: 'unavailable' }, 'load').message, /conectar/)
assert.equal(authoring.validateExamImport('examen.MDX', 100, '\uFEFF## Enunciado\r\n\r\n$\\sigma$\r\n'), '## Enunciado\n\n$\\sigma$')
for (const [name, bytes, content] of [['exam.pdf', 100, 'contenido'], ['exam.md', 1, ' '], ['exam.md', 5, '\0texto'], ['exam.md', 800001, 'texto'], ['exam.md', 200001, 'x'.repeat(200001)]]) {
  assert.throws(() => authoring.validateExamImport(name, bytes, content))
}
assert.equal(authoring.validateExamImport('exam.md', 200000, 'x'.repeat(200000)).length, 200000)

// Exercise the actual form handlers with a Monaco model and isolated Firebase calls.
// No requests are sent to the live database.
const hooks = [], effects = []
let index = 0, authChanged, allowConfirm = true, undoStops = 0, queryFailure = null
const writes = []
const react = {
  useState(initial) {
    const position = index++
    if (!(position in hooks)) hooks[position] = typeof initial === 'function' ? initial() : initial
    return [hooks[position], value => { hooks[position] = typeof value === 'function' ? value(hooks[position]) : value }]
  },
  useRef(initial) { const position = index++; return hooks[position] ??= { current: initial } },
  useMemo(factory) { index++; return factory() },
  useEffect(callback) { const position = index++; if (!(position in hooks)) { hooks[position] = true; effects.push(callback) } },
  lazy: () => 'lazy-component', Suspense: 'suspense',
}
const { default: Management } = load('../components/exam-management.tsx', {
  react, 'react/jsx-runtime': jsx, 'lucide-react': icons, '@/lib/firebase': { db: {}, auth: {} },
  '@/lib/exam-data': data, '@/lib/exam-authoring': authoring, '@/components/preview-error-boundary': { default: 'boundary' },
  '@/lib/exam-errors': errors,
  '@/lib/editor-history': history,
  '@/lib/workspace-controls': workspaceControls,
  '@/lib/workspace-guides': load('../lib/workspace-guides.ts'),
  '@/lib/local-draft': { localDraftKey: () => 'isolated-exam-test' },
  '@/lib/use-local-draft': { useLocalDraft: () => ({ pending: null, failed: false, savedAt: null, acknowledge() {} }) },
  '@/components/local-draft-notice': { LocalDraftStatus: 'local-status', LocalDraftNotice: 'local-notice' },
  'firebase/auth': { onAuthStateChanged: (_auth, callback) => { authChanged = callback; return () => {} } },
  'firebase/firestore': {
    collection: () => ({}), doc: (_collection, ...parts) => ({ id: parts.at(-1) || 'new-exam' }),
    getDocs: async () => { if (queryFailure) throw queryFailure; return { docs: [] } }, setDoc: async (reference, value) => writes.push({ reference, value }),
  },
}, { window: { addEventListener() {}, removeEventListener() {}, confirm: () => allowConfirm }, console })
function render() { index = 0; return Management() }
function find(node, predicate) {
  if (!node || typeof node !== 'object') return undefined
  if (predicate(node)) return node
  for (const child of [node.props?.children].flat(Infinity)) { const found = find(child, predicate); if (found) return found }
}
const settle = () => new Promise(resolve => setImmediate(resolve))
let tree = render()
effects.forEach(effect => effect())
authChanged({ email: 'admin@example.test' })
await settle()
tree = render()
let editorNode = find(tree, node => node.props?.language === 'markdown')
let text = editorNode.props.value
const model = { getFullModelRange: () => 'all', getValue: () => text }
const editor = {
  getModel: () => model, getSelection: () => 'selection', focus() {},
  pushUndoStop() { undoStops++ },
  executeEdits(_source, edits) { text = edits[0].text; editorNode.props.onChange(text) },
}
editorNode.props.onMount(editor)
tree = render()
async function importFile(name, content) {
  const input = find(tree, node => node.type === 'input' && node.props.type === 'file')
  input.props.onChange({ target: { files: [{ name, size: content.length, text: async () => content }], value: name } })
  await settle()
  tree = render()
}
const original = text
allowConfirm = false
await importFile('cancelado.md', '## Cancelado')
assert.equal(text, original, 'Canceling an import must preserve the current document')
allowConfirm = true
await importFile('incorrecto.pdf', 'No es Markdown')
assert.equal(text, original, 'An unsupported file must not replace the document')
const markdown = '## Indicaciones\n\n<Problem title="Carga axial">\n\nCalcula $\\sigma$.\n\n</Problem>'
await importFile('examen.md', markdown)
assert.equal(text, markdown)
assert.equal(undoStops, 2, 'Import must be one undoable edit')
assert.equal(writes.length, 0, 'Importing must never publish automatically')
assert.equal(find(tree, node => node.props?.language === 'markdown').props.value, markdown)
find(tree, node => node.type === 'input' && node.props.maxLength === 160).props.onChange({ target: { value: 'Práctica calificada 1' } })
tree = render()
await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} })
assert.equal(writes.length, 1, 'Only explicit publication writes to Firestore')
assert.equal(writes[0].value.contentMarkdown, markdown)
assert.equal(writes[0].value.title, 'Práctica calificada 1')
assert.ok(data.validExam(writes[0].value))
tree = render()
queryFailure = { code: 'permission-denied' }
find(tree, node => node.props?.['aria-label'] === 'Actualizar lista de evaluaciones').props.onClick()
await settle(); tree = render()
const loadAlert = find(tree, node => node.props?.role === 'alert')
assert.ok(loadAlert, 'The loader must report Firestore failures')
const textContent = node => typeof node === 'string' ? node : [node?.props?.children].flat(Infinity).filter(Boolean).map(textContent).join(' ')
assert.match(textContent(loadAlert), /permission-denied/)
assert.match(textContent(loadAlert), /reglas publicadas/)
assert.doesNotMatch(textContent(tree), /Aún no hay evaluaciones/, 'Permission errors must not look like an empty archive')
assert.equal(find(tree, node => node.props?.language === 'markdown').props.value, markdown, 'Loading errors must preserve the editor text')
await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} })
assert.equal(writes.length, 1, 'Publication stays disabled until the archive is reachable')
queryFailure = null
find(tree, node => node.props?.['aria-label'] === 'Actualizar lista de evaluaciones').props.onClick()
await settle(); tree = render()
assert.equal(find(tree, node => node.props?.role === 'alert'), undefined, 'A successful retry must clear the previous error')
assert.equal(find(tree, node => node.props?.language === 'markdown').props.value, markdown)
console.log('OK: import, explicit publication, permission errors, preserved text and successful retry.')
