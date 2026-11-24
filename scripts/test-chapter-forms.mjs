import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as jsx from 'react/jsx-runtime'
import * as icons from 'lucide-react'

function load(path, dependencies = {}) {
  const exports = {}
  const code = ts.transpileModule(fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
  vm.runInNewContext(code, { exports, require: name => { assert(name in dependencies, `Missing dependency: ${name}`); return dependencies[name] }, structuredClone })
  return exports
}
const data = load('lib/course-data.ts', { './chapters.json': { default: [] } })
const schema = load('lib/content-schema.ts')
const structure = load('lib/course-structure.ts', { './course-data': data, './content-schema': schema })
const styles = load('lib/workspace-controls.ts')
let values = [], cursor = 0
const hooks = {
  useId: () => 'chapter-form-test',
  useState(initial) { const index = cursor++; if (!(index in values)) values[index] = initial; return [values[index], value => { values[index] = typeof value === 'function' ? value(values[index]) : value }] },
  useRef(initial) { const index = cursor++; if (!(index in values)) values[index] = { current: initial }; return values[index] },
}
const controls = load('components/course-structure-controls.tsx', {
  react: hooks, 'react/jsx-runtime': jsx, 'lucide-react': icons,
  '@/lib/course-structure': structure, '@/lib/workspace-controls': styles,
})
function elements(node) {
  if (!node || typeof node !== 'object') return []
  if (Array.isArray(node)) return node.flatMap(elements)
  return [node, ...elements(node.props?.children)]
}

let saves = [], result = false, focusCount = 0, opens = 0, closes = 0
const outer = controls.CourseStructureControls({ busy: false, archived: false, onToggleArchived() {}, onApply: async action => { saves.push(action); if (result instanceof Error) throw result; return result } })
let titleElement = elements(outer).find(element => typeof element.type === 'function')
assert(titleElement, 'The real create dialog must be present')
function render() { cursor = 0; return titleElement.type(titleElement.props) }
function field(tree) { return elements(tree).find(element => element.type === 'input') }
function form(tree) { return elements(tree).find(element => element.type === 'form') }
async function submit(tree) { await form(tree).props.onSubmit({ preventDefault() {} }) }
function change(tree, text) { field(tree).props.onChange({ target: { value: text } }); return render() }
let tree = render()
field(tree).ref.current = { focus() { focusCount++ } }
elements(tree).find(element => element.type === 'dialog').ref.current = { showModal() { opens++ }, close() { closes++ } }
elements(tree).find(element => element.type === 'button').props.onClick()
tree = render()
assert.equal(opens, 1)
assert.equal(focusCount, 1)
assert.equal(form(tree).props.noValidate, true, 'Errors should appear inline instead of browser popups')
assert(elements(tree).some(element => element.type === 'label' && element.props.htmlFor === field(tree).props.id), 'The visible label must identify the actual input')
await submit(tree)
tree = render()
assert.equal(saves.length, 0, 'An empty title cannot reach the save operation')
assert.equal(field(tree).props['aria-invalid'], true)
assert.equal(field(tree).props.placeholder, 'Escribe un título.', 'Empty-title feedback appears inside the input')
assert.equal(field(tree).props.value, '', 'The error message must never become the actual title')
assert.equal(focusCount, 2, 'Invalid submission returns focus to the field')
assert(elements(tree).some(element => element.props?.role === 'alert' && element.props.id === 'chapter-form-test-field-error'))
assert(elements(tree).some(element => element.props?.id === 'chapter-form-test-field-error' && element.props.className === 'sr-only'), 'The inside-field error remains available to assistive technology without adding another visible line')
tree = change(tree, '   ')
await submit(tree)
assert.equal(saves.length, 0, 'Whitespace-only titles are invalid')
assert.equal(field(render()).props.value, '', 'Whitespace-only submission clears the value so its error placeholder remains visible')
assert.equal(field(render()).props.placeholder, 'Escribe un título.')
tree = change(render(), 'x'.repeat(structure.COURSE_TITLE_MAX_LENGTH + 1))
await submit(tree)
assert.equal(saves.length, 0, 'Overlong titles cannot reach the save operation')
tree = change(render(), '  Nuevo tema  ')
assert.equal(field(tree).props['aria-invalid'], undefined, 'Correcting a title clears its field error')
assert.equal(field(tree).props.placeholder, undefined, 'Typing a valid title removes the inside-field error')
await submit(tree)
tree = render()
assert.equal(saves[0].title, 'Nuevo tema', 'Save receives the normalized title')
assert.equal(field(tree).props.value, '  Nuevo tema  ', 'A rejected save preserves the entered text')
assert.equal(field(tree).props['aria-invalid'], undefined, 'A connection or permissions failure must not mark valid text as invalid')
assert.equal(closes, 0, 'A failed save keeps the dialog open')
assert(field(tree).props['aria-describedby'].includes('chapter-form-test-save-error'))
result = new Error('Connection unavailable')
await submit(tree)
assert.equal(closes, 0, 'Thrown save failures remain recoverable')
result = true
await submit(render())
assert.equal(closes, 1, 'Retry closes the dialog only after successful saving')
values = []; cursor = 0
const renameOuter = controls.ChapterActions({ chapter: { number: '14', title: 'Título anterior', sections: [] }, first: false, last: true, busy: false, onApply: async action => { saves.push(action); return result } })
titleElement = elements(renameOuter).find(element => typeof element.type === 'function')
values = []; cursor = 0
tree = render()
field(tree).ref.current = { focus() { focusCount++ } }
elements(tree).find(element => element.type === 'dialog').ref.current = { close() { closes++ } }
assert.equal(field(tree).props.value, 'Título anterior', 'Rename starts with the current title')
tree = change(tree, 'Título nuevo')
let finishSave
result = new Promise(resolve => { finishSave = resolve })
const beforeSave = saves.length
const pendingSave = submit(tree)
await submit(tree)
assert.equal(saves.length, beforeSave + 1, 'Repeated submission cannot send a duplicate save while one is pending')
assert.equal(saves.at(-1).type, 'rename-chapter')
assert.equal(saves.at(-1).chapter, '14')
finishSave(true)
await pendingSave
console.log('PASS: inline title errors, label associations, invalid focus, no invalid writes, preserved text on save failure and successful retry.')
