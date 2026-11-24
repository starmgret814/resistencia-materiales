import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import ts from 'typescript'

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const exports = {}
vm.runInNewContext(ts.transpileModule(read('lib/workspace-guides.ts'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { exports })
const { ADMIN_GUIDE, COLLABORATOR_GUIDE, workspaceGuide } = exports

assert.equal(workspaceGuide('admin').href, ADMIN_GUIDE)
for (const role of ['editor', undefined, '', 'unknown']) {
  assert.equal(workspaceGuide(role).href, COLLABORATOR_GUIDE, 'Only an admin session should receive the administration guide link.')
}

// Guard the public documentation against accidentally reintroducing private instructions.
const admin = read('GUIA_ADMINISTRADORES.md')
for (const path of ['GUIA_COLABORADORES.md', 'src/pages/guia-colaboradores.astro']) {
  const publicGuide = read(path)
  for (const privateAnchor of ['guia-revision-cambios', 'guia-gestion-capitulos', 'guia-examenes', 'guia-examenes-permisos']) {
    assert(!publicGuide.includes(privateAnchor), `${path} must not contain the private administration section ${privateAnchor}.`)
    assert(admin.includes(`id="${privateAnchor}"`), `The moved instructions for ${privateAnchor} must remain available to administrators.`)
  }
  for (const instruction of ['Aprobar y publicar', 'Publicar evaluación', 'firestore.rules', 'firebase-tools deploy']) {
    assert(!publicGuide.includes(instruction), `${path} must not expose administration-only instructions.`)
  }
  for (const sharedAnchor of ['guia-formulas', 'guia-problemas', 'guia-tablas', 'guia-herramientas', 'guia-respaldo', 'guia-subtemas']) {
    assert(publicGuide.includes(`id="${sharedAnchor}"`), `The collaborator instructions for ${sharedAnchor} must remain available.`)
  }
  assert(publicGuide.includes('Solicitar Revisión'), 'Contributors still need the submission workflow.')
}
for (const target of admin.matchAll(/\]\(#([^\s)]+)\)/g)) {
  assert(admin.includes(`id="${target[1]}"`), `Broken administration guide anchor: ${target[1]}`)
}

// Optional smoke check against the running Astro server; no login or database writes.
if (process.argv.includes('--http')) {
  const origin = process.env.MC361_DEV_URL || 'http://localhost:4321'
  const response = await fetch(`${origin}${COLLABORATOR_GUIDE}`)
  assert.equal(response.status, 200)
  const html = await response.text()
  assert(html.includes('Novedades para colaboradores'))
  for (const forbidden of ['guia-revision-cambios', 'guia-gestion-capitulos', 'guia-examenes-permisos', 'Aprobar y publicar']) {
    assert(!html.includes(forbidden), `The public HTML must not include ${forbidden}.`)
  }
  for (const path of [ADMIN_GUIDE, `${ADMIN_GUIDE}/`]) {
    const denied = await fetch(`${origin}${path}`, { redirect: 'manual' })
    assert.equal(denied.status, 302)
    assert.equal(new URL(denied.headers.get('location'), origin).pathname, '/workspace-mc361/login')
    assert(!(await denied.text()).includes('Novedades de administración'))
  }
  console.log('PASS: public guide HTTP output and anonymous access denied for the private guide.')
}
if (process.argv.includes('--build')) {
  const staticRoot = new URL('../.vercel/output/static/', import.meta.url)
  assert(fs.existsSync(staticRoot), 'Run npm run build before checking the deployment artifacts.')
  assert(!fs.existsSync(new URL(`.${ADMIN_GUIDE}/index.html`, staticRoot)), 'The administration guide must never be prerendered as public HTML.')
  function inspect(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const file = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory)
      if (entry.isDirectory()) inspect(file)
      else if (/\.(html|js|json|map|md)$/.test(entry.name)) {
        const content = fs.readFileSync(file, 'utf8')
        for (const privateContent of ['Novedades de administración', 'guia-colaboradores-acceso']) {
          assert(!content.includes(privateContent), `Private guide content leaked into ${file.pathname}`)
        }
      }
    }
  }
  inspect(staticRoot)
  const publicHtml = fs.readFileSync(new URL('guia-colaboradores/index.html', staticRoot), 'utf8')
  assert(!publicHtml.includes('guia-revision-cambios'))
  assert(!publicHtml.includes('guia-examenes-permisos'))
  assert(publicHtml.includes('guia-formulas'))
  console.log('PASS: the production static assets contain no private guide body or prerendered administration page.')
}
console.log('PASS: role-specific guide links, separated audiences, retained contributor instructions and administration anchors.')
