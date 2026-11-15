import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(path, dependencies = {}, globals = {}) {
  const exports = {}
  const source = fs.readFileSync(new URL(path, import.meta.url), 'utf8')
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } })
  vm.runInNewContext(outputText, { exports, require: name => dependencies[name], ...globals })
  return exports
}

const { searchCourse } = load('../lib/course-search.ts')
const chapters = [{ number: '04', title: 'Transformación de esfuerzos', sections: [
  { id: '4.1', title: 'Círculo de Mohr', slug: '04/mohr' },
  { id: '4.2', title: 'Deformaciones', slug: '04/deformaciones' },
  { id: '4.3', title: 'Pendiente', slug: null },
] }]
assert.equal(searchCourse(chapters, ' CIRCULO   esfuerzos ')[0]?.slug, '04/mohr', 'Match accent-free terms across the title and chapter')
assert.equal(searchCourse(chapters, '4.2')[0]?.title, 'Deformaciones', 'Section numbers are searchable')
assert.equal(searchCourse(chapters, '').length, 2, 'Unavailable destinations must not enter the results')
assert.equal(searchCourse(chapters, 'ausente').length, 0)
assert.equal(searchCourse([], 'mohr').length, 0)
assert.equal(searchCourse([{ ...chapters[0], sections: [{ id: '4.4', title: 'Tema recién publicado', slug: '04/nuevo' }] }], 'publicado')[0]?.slug, '04/nuevo', 'Search must use the supplied live chapters')

let effect, cleanup
const listeners = new Map()
class Element {
  tabIndex = 0
  inert = false
  isConnected = true
  parentElement = null
  children = []
  constructor(name) { this.name = name }
  hasAttribute(name) { return name === 'data-modal-backdrop' && this.name === 'backdrop' }
  getClientRects() { return [1] }
  closest() { return this.inert ? this : null }
  contains(element) { return this.children.includes(element) }
  querySelectorAll() { return this.children }
  querySelector() { return this.children[0] }
  focus() { document.activeElement = this }
}
const body = new Element('body')
body.style = { overflow: 'auto' }
const trigger = new Element('trigger')
const modal = new Element('modal')
const background = new Element('background')
const alreadyInert = new Element('already inert')
alreadyInert.inert = true
const backdrop = new Element('backdrop')
const first = new Element('input'), last = new Element('close')
body.children = [modal, background, backdrop, alreadyInert]
body.children.forEach(element => { element.parentElement = body })
const unavailable = new Element('unavailable destination')
unavailable.tabIndex = -1
modal.children = [first, last, unavailable]
const document = { body, activeElement: trigger, addEventListener: (name, callback) => listeners.set(name, callback), removeEventListener: name => listeners.delete(name) }
let closed = false
const { useModalFocus } = load('../lib/use-modal-focus.ts', { react: { useEffect: callback => { effect = callback }, useRef: value => ({ current: value }) } }, { document, HTMLElement: Element })
useModalFocus(true, { current: modal }, () => { closed = true })
cleanup = effect()
assert.equal(document.activeElement, first, 'Open overlays focus their first control')
assert.equal(body.style.overflow, 'hidden', 'Background scrolling is locked')
assert.equal(background.inert, true, 'Background controls cannot receive focus')
assert.equal(backdrop.inert, false, 'The backdrop remains available to dismiss the overlay')
const key = listeners.get('keydown')
let prevented = false
last.focus()
key({ key: 'Tab', shiftKey: false, preventDefault: () => { prevented = true } })
assert(prevented)
assert.equal(document.activeElement, first, 'Tab wraps within the modal')
key({ key: 'Tab', shiftKey: true, preventDefault() {} })
assert.equal(document.activeElement, last, 'Shift+Tab wraps backwards')
key({ key: 'Escape', preventDefault() {} })
assert(closed, 'Escape closes the overlay')
cleanup()
assert.equal(document.activeElement, trigger, 'Closing restores focus to the trigger')
assert.equal(background.inert, false)
assert.equal(alreadyInert.inert, true, 'Pre-existing inert state is preserved')
assert.equal(body.style.overflow, 'auto')
assert.equal(listeners.size, 0)
console.log('PASS: Live course search, accent-insensitive terms, valid destinations, modal keyboard focus, Escape and background restoration.')
