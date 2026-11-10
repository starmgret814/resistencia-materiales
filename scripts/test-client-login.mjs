import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'
import * as jsx from 'react/jsx-runtime'

function load(file, require, globals = {}) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText
  const exports = {}
  vm.runInNewContext(code, { exports, require, Error, AbortSignal, ...globals })
  return exports
}
let response = () => Response.json({ success: true })
let calls = 0
const login = load('lib/client-login.ts', () => {}, { fetch: async (_url, options) => {
  calls++
  assert.equal(options.method, 'POST')
  assert.equal(options.credentials, 'same-origin')
  assert.equal(JSON.parse(options.body).idToken, 'test-token')
  return response()
} })
await login.establishLoginSession('test-token')
response = () => Response.json({ error: 'Acceso revocado' }, { status: 403 })
await assert.rejects(login.establishLoginSession('test-token'), error => error instanceof login.LoginSessionError && error.status === 403 && error.message === 'Acceso revocado')
response = () => new Response('<html>Unavailable</html>', { status: 503 })
await assert.rejects(login.establishLoginSession('test-token'), error => error.status === 503)
response = () => { throw new Error('Offline') }
await assert.rejects(login.establishLoginSession('test-token'), /conectar con la plataforma/)
response = () => Response.json({ unexpected: true })
await assert.rejects(login.establishLoginSession('test-token'), /inesperada/)
assert(login.loginErrorMessage({ code: 'auth/popup-blocked' }, 'localhost').includes('ventanas emergentes'))
assert(login.loginErrorMessage({ code: 'auth/unauthorized-domain' }, 'localhost').includes('localhost'))
assert(login.loginErrorMessage({ code: 'auth/internal-error' }, 'localhost').includes('apis.google.com'))

// Exercise the real form: Firebase notifies its observer during popup sign-in.
// That used to trigger a second simultaneous POST /api/auth/signin.
let values = [], cursor = 0, effects = [], observer, navigations = 0, signedOut = 0
let popupFailure = null
const user = { uid: 'test-user', getIdToken: async () => 'test-token' }
const react = {
  useState(initial) { const i = cursor++; if (!(i in values)) values[i] = initial; return [values[i], value => { values[i] = value }] },
  useRef(initial) { const i = cursor++; if (!(i in values)) values[i] = { current: initial }; return values[i] },
  useEffect(callback) { effects.push(callback) },
}
const auth = { signOut: async () => { signedOut++ } }
const firebase = {
  GoogleAuthProvider: class { setCustomParameters() {} },
  signInWithPopup: async () => {
    if (popupFailure) throw popupFailure
    await observer(user)
    return { user }
  },
  onAuthStateChanged: (_auth, callback) => { observer = callback; return () => {} },
}
const form = load('components/login-form.tsx', name => ({ react, 'react/jsx-runtime': jsx, '@/lib/firebase': { auth }, 'firebase/auth': firebase, '@/lib/client-login': login })[name], {
  window: { location: { hostname: 'localhost', assign: () => { navigations++ } } },
})
function findButton(node) {
  if (!node || typeof node !== 'object') return
  if (node.type === 'button') return node
  for (const child of [node.props?.children].flat(Infinity)) { const found = findButton(child); if (found) return found }
}
function render() { cursor = 0; return findButton(form.default()) }
render()
effects[0]()
response = () => Response.json({ success: true })
calls = 0
await render().props.onClick()
assert.equal(calls, 1, 'Popup and auth-state observer must share a single session exchange')
assert.equal(navigations, 1)
await observer(user)
assert.equal(calls, 1, 'Late observer notifications must not submit an already completed login again')
response = () => Response.json({ error: 'Cuenta sin acceso' }, { status: 403 })
await render().props.onClick()
assert.equal(signedOut, 1)
assert.equal(navigations, 1, 'Denied accounts must never navigate to the workspace')
response = () => Response.json({ error: 'Temporalmente no disponible' }, { status: 503 })
await render().props.onClick()
assert.equal(signedOut, 1, 'A temporary server failure must not revoke the Google session')
assert.equal(render().props.disabled, false, 'The button must be usable again after a failure')
popupFailure = { code: 'auth/popup-blocked' }
const previousCalls = calls
await render().props.onClick()
assert.equal(calls, previousCalls)
assert.equal(render().props.disabled, false)
console.log('PASS: single session exchange, late observer events, denied accounts, retryable errors and actionable Google error messages.')
