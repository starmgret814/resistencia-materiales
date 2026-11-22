import assert from 'node:assert/strict'
import config from '../astro.config.mjs'

// Exercise the real integration: validation/build cannot invalidate dev files.
const integration = config.integrations.find(item => item.name === 'mc361:isolated-vite-cache')
assert(integration, 'Development must use an isolated dependency cache')
const cacheDirectories = []
for (const command of ['dev', 'sync', 'build', 'preview']) {
  await integration.hooks['astro:config:setup']({ command, updateConfig: value => cacheDirectories.push(value.vite.cacheDir) })
}
assert.equal(new Set(cacheDirectories).size, 4, 'Each Astro command must own its dependency cache')
for (const dependency of ['react', 'react-dom/client', 'firebase/app', 'firebase/auth', 'firebase/firestore']) {
  assert(config.vite.optimizeDeps.include.includes(dependency), `Shared client dependency must be prepared before navigation: ${dependency}`)
}

// Read-only smoke test against a running local server; no login or course writes.
const origin = process.env.MC361_DEV_URL || 'http://localhost:4321'
assert(['localhost', '127.0.0.1', '[::1]'].includes(new URL(origin).hostname), 'This test is for a local development server')
const seen = new Set()
async function checkModule(path, followImports = false) {
  if (seen.has(path)) return
  seen.add(path)
  const response = await fetch(new URL(path, origin), { signal: AbortSignal.timeout(15000) })
  assert(response.ok, `Client module ${path} returned HTTP ${response.status}; its screen cannot hydrate`)
  const source = await response.text()
  assert(!response.headers.get('content-type')?.includes('text/html'), `Client module ${path} returned HTML instead of JavaScript`)
  if (followImports) {
    const imports = [...source.matchAll(/(?:from\s*|import\s*)["'](\/[^"']+)["']/g)].map(match => match[1])
    for (const dependency of imports) await checkModule(dependency, dependency === '/lib/firebase.ts')
  }
}
await checkModule('/components/dashboard.tsx', true)
console.log(`PASS: isolated caches, shared prebundling and ${seen.size} local dashboard modules return usable responses.`)
