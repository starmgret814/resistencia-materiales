import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(file, dependencies = {}, globals = {}) {
  const exports = {}
  const source = fs.readFileSync(new URL(file, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
  vm.runInNewContext(code, { exports, require: name => { assert.ok(name in dependencies, `Unexpected dependency: ${name}`); return dependencies[name] }, ...globals })
  return exports
}
const local = load('../lib/local-draft.ts')
const { LocalDraftBuffer, localDraftKey } = local
class MemoryStorage {
  data = new Map()
  writes = 0
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { this.writes++; this.data.set(key, value) }
  removeItem(key) { this.data.delete(key) }
}
const storage = new MemoryStorage()
const key = localDraftKey('writer@example.test', 'chapter', '01/tema')
const remote = { contentMarkdown: '# Tema\n\nVersión guardada.' }
const edited = { contentMarkdown: '# Tema\n\nTexto aún no enviado.' }
let buffer = new LocalDraftBuffer(storage, key, remote, () => 1234)
buffer.update(edited); buffer.flush()
assert.equal(storage.writes, 1)
buffer.flush()
assert.equal(storage.writes, 1, 'Identical content must not be written repeatedly')
assert.equal(new LocalDraftBuffer(storage, localDraftKey('another@example.test', 'chapter', '01/tema'), remote).pending, null)
assert.equal(new LocalDraftBuffer(storage, localDraftKey('writer@example.test', 'chapter', '02/tema'), remote).pending, null)
assert.equal(new LocalDraftBuffer(storage, localDraftKey('writer@example.test', 'exam', '01/tema'), remote).pending, null)
buffer = new LocalDraftBuffer(storage, key, remote)
assert.equal(buffer.pending.values.contentMarkdown, edited.contentMarkdown)
const recoverable = storage.getItem(key)
buffer.flush()
assert.equal(storage.getItem(key), recoverable, 'Loading remote content must not overwrite a recoverable copy')
assert.equal(buffer.recover().contentMarkdown, edited.contentMarkdown)
buffer.acknowledge(edited)
assert.equal(storage.getItem(key), null, 'Explicitly saving the same content clears the pending local copy')
buffer.update({ contentMarkdown: 'Edición posterior' }); buffer.flush()
buffer.acknowledge(edited)
assert.equal(JSON.parse(storage.getItem(key)).values.contentMarkdown, 'Edición posterior', 'Acknowledging an earlier save preserves newer edits')
buffer = new LocalDraftBuffer(storage, key, remote)
buffer.discard()
assert.equal(storage.getItem(key), null, 'Explicit discard keeps the loaded remote version')
const malformed = ['{', JSON.stringify({ version: 1, savedAt: 1, values: { unexpected: 'x' } }), JSON.stringify({ version: 9, savedAt: 1, values: edited })]
for (const raw of malformed) {
  storage.setItem(key, raw)
  assert.equal(new LocalDraftBuffer(storage, key, remote).pending, null)
}
storage.removeItem(key)
const idleTab = new LocalDraftBuffer(storage, key, remote)
const activeTab = new LocalDraftBuffer(storage, key, remote)
activeTab.update(edited); activeTab.flush(); idleTab.flush()
assert.equal(JSON.parse(storage.getItem(key)).values.contentMarkdown, edited.contentMarkdown, 'An unchanged tab cannot erase another tab\'s newer copy')
storage.removeItem(key)
const fullStorage = { getItem: () => null, setItem: () => { throw new Error('QuotaExceededError') }, removeItem() {} }
buffer = new LocalDraftBuffer(fullStorage, key, remote)
buffer.update(edited)
assert.doesNotThrow(() => buffer.flush())
assert.equal(buffer.failed, true, 'A full browser store reports failure without crashing the editor')

// Run the real hook's lifecycle, including delayed saves and immediate page exit.
function hookHarness(store) {
  const slots = [], queued = [], timers = new Map(), windowListeners = new Map(), documentListeners = new Map()
  let cursor = 0, timerId = 0
  const react = {
    useRef(value) { const n = cursor++; return slots[n] ??= { current: value } },
    useState(value) { const n = cursor++; if (!(n in slots)) slots[n] = value; return [slots[n], next => { slots[n] = typeof next === 'function' ? next(slots[n]) : next }] },
    useEffect(callback, dependencies) {
      const n = cursor++, previous = slots[n]
      if (previous && dependencies.every((value, i) => Object.is(value, previous.dependencies[i]))) return
      slots[n] = { dependencies, cleanup: previous?.cleanup }
      queued.push(() => { previous?.cleanup?.(); slots[n].cleanup = callback() })
    },
  }
  const window = { localStorage: store, setTimeout: callback => { timers.set(++timerId, callback); return timerId }, clearTimeout: id => timers.delete(id), addEventListener: (event, cb) => windowListeners.set(event, cb), removeEventListener: event => windowListeners.delete(event) }
  const document = { visibilityState: 'visible', addEventListener: (event, cb) => documentListeners.set(event, cb), removeEventListener: event => documentListeners.delete(event) }
  const { useLocalDraft } = load('../lib/use-local-draft.ts', { react, '@/lib/local-draft': local }, { window, document })
  return {
    render(values, ready = true, identity = key) { cursor = 0; const result = useLocalDraft(identity, values, ready); queued.splice(0).forEach(effect => effect()); return result },
    tick() { const callbacks = [...timers.values()]; timers.clear(); callbacks.forEach(callback => callback()) },
    exit() { windowListeners.get('pagehide')?.() },
    close() { slots.forEach(slot => slot?.cleanup?.()); assert.equal(windowListeners.size, 0); assert.equal(documentListeners.size, 0) },
  }
}
const tab = hookHarness(storage)
tab.render(remote, false)
assert.equal(storage.getItem(key), null, 'A document still loading cannot create a backup')
tab.render(remote); tab.render(edited); tab.tick()
assert.equal(JSON.parse(storage.getItem(key)).values.contentMarkdown, edited.contentMarkdown)
const lastKeystroke = { contentMarkdown: 'Última pulsación antes de cerrar' }
tab.render(lastKeystroke); tab.exit()
assert.equal(JSON.parse(storage.getItem(key)).values.contentMarkdown, lastKeystroke.contentMarkdown, 'Page exit flushes before the debounce timer runs')
tab.close()
const reopened = hookHarness(storage)
reopened.render(remote)
let state = reopened.render(remote)
assert.equal(state.pending.values.contentMarkdown, lastKeystroke.contentMarkdown)
reopened.tick()
assert.equal(JSON.parse(storage.getItem(key)).values.contentMarkdown, lastKeystroke.contentMarkdown)
const recovered = state.recover()
state = reopened.render(recovered)
assert.equal(state.pending, null)
state.acknowledge(recovered)
assert.equal(storage.getItem(key), null)
reopened.close()
const blocked = hookHarness({ getItem() { throw new Error('SecurityError') } })
blocked.render(remote)
assert.equal(blocked.render(remote).failed, true, 'Disabled localStorage must not crash the editor')
blocked.close()
console.log('PASS: browser-only recovery, account/document isolation, manual recovery, page exit, storage failures and cleanup after saving.')
