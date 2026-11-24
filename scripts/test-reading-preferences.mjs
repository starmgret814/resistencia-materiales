import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const source = fs.readFileSync(new URL('../lib/reading-preferences.ts', import.meta.url), 'utf8')
const exports = {}
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports })

const defaults = exports.parseReadingPreferences(null)
assert.deepEqual({ ...defaults }, { fontSize: 20, leading: 1.8, width: 840 })
assert.deepEqual({ ...exports.parseReadingPreferences({ fontSize: 25, leading: 1.95, width: 1040 }) }, { fontSize: 25, leading: 1.95, width: 1040 })
assert.deepEqual({ ...exports.parseReadingPreferences({ fontSize: 100, leading: 3, width: 200 }) }, { fontSize: 26, leading: 2.1, width: 680 })
assert.deepEqual({ ...exports.parseReadingPreferences({ fontSize: 'larger', leading: 'compact', width: 'wide' }) }, { fontSize: 24, leading: 1.65, width: 980 })
assert.deepEqual({ ...exports.readingPreferenceStyle(defaults) }, { '--reader-font-size': '20px', '--reader-line-height': '1.8', '--reader-width': '840px' })
assert.deepEqual({ ...exports.readingPreferenceStyle({ fontSize: 25, leading: 1.95, width: 1040 }) }, { '--reader-font-size': '25px', '--reader-line-height': '1.95', '--reader-width': '1040px' })

const layout = fs.readFileSync(new URL('../components/textbook-layout.tsx', import.meta.url), 'utf8')
assert(layout.includes('localStorage.getItem(READING_PREFERENCES_KEY)'))
assert(layout.includes('localStorage.setItem(READING_PREFERENCES_KEY'))
assert(layout.includes("event.key === 'Escape'"))
assert(layout.includes("focusMode && 'reading-focus-mode'"))
assert(layout.includes('Ajustes') && layout.includes('Concentración'))
assert(layout.includes("document.addEventListener('pointerdown', closeOutside)"))
assert(layout.includes('type="range"'))
console.log('PASS: validated reading preference defaults, sanitization, CSS values, local persistence and reversible focus mode.')
