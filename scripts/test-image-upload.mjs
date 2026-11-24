import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

function load(file, dependencies = {}, globals = {}) {
  const exports = {}
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText, { exports, require(name) { assert(name in dependencies, `Unexpected import: ${name}`); return dependencies[name] }, ...globals })
  return exports
}
const url = 'https://res.cloudinary.com/example/image/upload/diagram.svg'
let response = Response.json({ secure_url: url }), networkError = false
const requests = []
const { uploadCourseImage } = load('lib/image-upload.ts', {}, {
  FormData, URL,
  fetch: async (endpoint, options) => {
    requests.push({ endpoint, options })
    if (networkError) throw new Error('offline')
    return response
  },
})
const file = new File(['<svg/>'], 'esquema.svg', { type: 'image/svg+xml' })
assert.equal(await uploadCourseImage(file), url)
assert.equal(requests[0].options.method, 'POST')
assert.equal(requests[0].options.body.get('file').name, 'esquema.svg')
assert.equal(requests[0].options.body.get('upload_preset'), 'resistencia-materiales-imagenes')
response = Response.json({ error: { message: 'Archivo rechazado' } }, { status: 400 })
await assert.rejects(uploadCourseImage(file), /Archivo rechazado/)
response = Response.json({ secure_url: url }, { status: 500 })
await assert.rejects(uploadCourseImage(file), /No se pudo subir/)
response = new Response('invalid JSON')
await assert.rejects(uploadCourseImage(file), /No se pudo subir/)
response = Response.json({ secure_url: 'http://example.invalid/image.svg' })
await assert.rejects(uploadCourseImage(file), /seguro/)
response = Response.json({ secure_url: 'not-a-url' })
await assert.rejects(uploadCourseImage(file), /válido/)
networkError = true
await assert.rejects(uploadCourseImage(file), /conexión/)
networkError = false
const count = requests.length
await assert.rejects(uploadCourseImage(new File([], 'empty.png', { type: 'image/png' })), /vacío/)
await assert.rejects(uploadCourseImage(new File(['text'], 'archivo.txt', { type: 'text/plain' })), /imagen/)
assert.equal(requests.length, count, 'Invalid files must be rejected before upload.')
response = Response.json({ secure_url: url })
assert.equal(await uploadCourseImage(file), url, 'A failed upload can be retried.')
console.log('PASS: simulated uploads, validation, HTTP/network failures and retry. No external uploads were made.')
