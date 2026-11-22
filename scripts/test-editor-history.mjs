import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const exports = {}
const source = fs.readFileSync(new URL('../lib/editor-history.ts', import.meta.url), 'utf8')
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports })
const { replaceEditorText, insertEditorText } = exports
let text = 'Texto original', stopped = 0, restored = 0
const undo = [], redo = []
const editor = {
  getModel: () => ({ getValue: () => text, getFullModelRange: () => 'all' }),
  getSelection: () => 'selection', saveViewState: () => ({ cursor: 5 }), restoreViewState: () => restored++,
  pushUndoStop: () => stopped++, focus() {},
  // executeEdits is Monaco's documented undo-preserving API.
  executeEdits: (_source, edits) => { undo.push(text); redo.length = 0; text = edits[0].text },
  setValue: () => { throw new Error('setValue would reset the undo stack') },
}
assert.equal(replaceEditorText(editor, text), false)
assert.equal(stopped, 0, 'React echoes cannot create extra edits or undo boundaries')
replaceEditorText(editor, 'Copia recuperada')
assert.equal(stopped, 2)
assert.equal(restored, 1)
redo.push(text); text = undo.pop()
assert.equal(text, 'Texto original', 'The previous text remains available to undo')
undo.push(text); text = redo.pop()
assert.equal(text, 'Copia recuperada')
insertEditorText(editor, '<Formula>…</Formula>')
assert.equal(stopped, 4, 'Each toolbar action is a separate undoable operation')
replaceEditorText(editor, '# Nombre actualizado', 'rename', true)
assert.equal(restored, 2)
const content = fs.readFileSync(new URL('../components/content-editor.tsx', import.meta.url), 'utf8')
assert.ok(!content.includes('!previewExpanded && <section'), 'Expanding preview must not unmount the editor')
const wrapper = fs.readFileSync(new URL('../components/markdown-editor.tsx', import.meta.url), 'utf8')
assert.ok(wrapper.includes('defaultValue={value}'))
assert.ok(!wrapper.includes('setValue('), 'Read-only synchronization must preserve the existing undo stack')
console.log('PASS: undo boundaries, recoverable replacements, view preservation and persistent editor mounting.')
