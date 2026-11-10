import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import React from 'react'
import * as jsx from 'react/jsx-runtime'
import { renderToStaticMarkup } from 'react-dom/server'
import * as icons from 'lucide-react'

const chapters = [{ number: '01', title: 'Esfuerzos', sections: [{ id: '1.1', title: 'Conceptos', slug: '01-esfuerzos/conceptos' }] }]
const admin = { email: 'test@example.invalid', role: 'admin', assignedChapters: [] }
const module = fs.readFileSync(new URL('../components/dashboard.tsx', import.meta.url), 'utf8')
const code = ts.transpileModule(module, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText
const timers = []
const storage = { getItem: () => { throw new Error('Storage disabled') }, setItem: () => { throw new Error('Storage disabled') } }
let reads = 0, writes = 0, notifications = [], resolveAuth
const never = new Promise(() => {})
const auth = { currentUser: null, authStateReady: () => new Promise(resolve => { resolveAuth = resolve }) }
const courseExports = {}
vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL('../lib/course-data.ts', import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: courseExports, require: () => ({ default: chapters }) })
const { isChapterList } = courseExports
assert(isChapterList(chapters))
assert(!isChapterList([{ ...chapters[0], sections: null }]))
assert(!isChapterList([{ ...chapters[0], sections: [{ id: '1.1', title: null, slug: 'topic' }] }]))
assert(!isChapterList([null]))
function load(react) {
  const exports = {}
  vm.runInNewContext(code, {
    exports, console: { error: error => notifications.push(error.message) },
    localStorage: storage, window: { setTimeout: callback => { timers.push(callback); return timers.length }, clearTimeout: () => {} },
    setTimeout: () => 0,
    require: name => ({
      react, 'react/jsx-runtime': jsx, 'lucide-react': icons,
      '@/lib/firebase': { db: {}, auth },
      '@/lib/workspace-api': { workspaceFetch: async () => { writes++ } },
      '@/lib/course-titles': { withSubtopicTitle: document => document },
      '@/lib/course-data': { chapters, isChapterList },
      'firebase/firestore': {
        doc: () => ({}), collection: () => ({}), query: value => value,
        getDoc: () => { reads++; return never }, getDocs: () => { reads++; return never },
        setDoc: async () => { writes++ }, deleteDoc: async () => { writes++ }, writeBatch: () => { writes++ },
      },
    })[name],
  })
  return exports.default
}
const Dashboard = load(React)
const html = renderToStaticMarkup(React.createElement(Dashboard, { session: admin }))
assert(html.includes('Esfuerzos'), 'The server response must contain the chapter list before Firebase loads')
assert(html.includes('Actualizando capítulos'))
assert.equal(reads, 0, 'Server rendering must not start client Firestore queries')
let values = [], cursor = 0, effects = []
const hooks = {
  useState(initial) { const i = cursor++; if (!(i in values)) values[i] = typeof initial === 'function' ? initial() : initial; return [values[i], value => { values[i] = typeof value === 'function' ? value(values[i]) : value }] },
  useRef(initial) { const i = cursor++; if (!(i in values)) values[i] = { current: initial }; return values[i] },
  useEffect(callback) { effects.push(callback) },
}
const ClientDashboard = load(hooks)
function render() { cursor = 0; effects = []; return ClientDashboard({ session: admin }) }
const asHtml = tree => renderToStaticMarkup(tree)
render()
const mountedEffects = [...effects]
const cleanup = mountedEffects.map(effect => effect())
assert.equal(reads, 0, 'Firestore must wait for Firebase authentication restoration')
auth.currentUser = { email: admin.email }
resolveAuth()
await new Promise(resolve => setImmediate(resolve))
assert.equal(reads, 1)
assert(asHtml(render()).includes('Esfuerzos'), 'An unresolved read must not hide the chapters')
timers[0]()
const timedOut = asHtml(render())
assert(timedOut.includes('Reintentar carga'))
assert(timedOut.includes('Esfuerzos'))
assert(!timedOut.includes('Actualizando capítulos'))
assert.equal(writes, 0)
assert.equal(notifications.length, 0, 'Unavailable browser storage must not crash the dashboard')
cleanup.forEach(callback => callback?.())
const empty = renderToStaticMarkup(React.createElement(Dashboard, { session: { ...admin, role: 'editor', assignedChapters: [] } }))
assert(empty.includes('no tiene capítulos asignados'))
assert(!empty.includes('Capítulo 01'), 'Editors without assignments must not gain chapter access')
console.log('PASS: immediate chapter rendering, auth restoration before reads, bounded loading, retry state, storage failures and assignment restrictions.')
