import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as jose from 'jose';

// Use real JWT signatures with local keys and simulated Firestore responses.
// These tests never access or mutate the production database.
const { publicKey, privateKey } = await jose.generateKeyPair('RS256');
let role = 'admin';
let assigned = ['01'];
let dbStatus = 200;
let databaseReads = 0;
function loadModule(file, dependencies, globals = {}) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    .replaceAll('import.meta.env.PROD', 'false')
    .replace(/import\.meta\.glob\([^;\n]+\)/g, 'testPublishedFiles');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(code, {
    exports, require: (name) => dependencies[name], URL, Response,
    fetch: async () => {
      databaseReads++;
      return Response.json({ fields: {
        role: { stringValue: role },
        assignedChapters: { arrayValue: { values: assigned.map((stringValue) => ({ stringValue })) } },
      } }, { status: dbStatus });
    },
    ...globals,
  });
  return exports;
}
const session = loadModule('lib/server-session.ts', {
  jose: { ...jose, createRemoteJWKSet: () => publicKey },
});
const middleware = loadModule('src/middleware.ts', {
  'astro:middleware': { defineMiddleware: (handler) => handler },
  '@/lib/server-session': session,
});
const subchapters = loadModule('src/pages/api/subchapters.ts', {
  '@/lib/server-session': session,
  '@/lib/chapters.json': [],
  'fs/promises': {}, path: {},
});
const makeToken = (verified = true, expiration = '1h') => new jose.SignJWT({ email: 'test@example.invalid', email_verified: verified })
  .setProtectedHeader({ alg: 'RS256' }).setSubject('test-user')
  .setIssuer('https://securetoken.google.com/resistencia-materiales')
  .setAudience('resistencia-materiales').setIssuedAt().setExpirationTime(expiration).sign(privateKey);
const token = await makeToken();
assert.equal((await session.verifyWorkspaceSession(token)).role, 'admin');
role = 'editor';
assert.equal((await session.verifyWorkspaceSession(token)).role, 'editor', 'An existing token must use the current role.');
assert(session.canEditChapter(await session.verifyWorkspaceSession(token), '01'));
assigned = [];
assert(!session.canEditChapter(await session.verifyWorkspaceSession(token), '01'), 'Removed chapter permissions apply to existing tokens.');
dbStatus = 404;
await assert.rejects(session.verifyWorkspaceSession(token), (error) => error.status === 403);
dbStatus = 200;
await assert.rejects(session.verifyWorkspaceSession(await makeToken(false)), (error) => error.status === 401);
await assert.rejects(session.verifyWorkspaceSession(await makeToken(true, 1)), (error) => error.status === 401);
const parts = token.split('.');
parts[1] = Buffer.from(JSON.stringify({ email: 'other@example.invalid' })).toString('base64url');
await assert.rejects(session.verifyWorkspaceSession(parts.join('.')), (error) => error.status === 401);

async function request(path, idToken, legacyRole = 'admin') {
  let proceeded = false;
  const store = new Map([['session_token', JSON.stringify({ email: 'test@example.invalid', uid: 'test-user', role: legacyRole })]]);
  if (idToken) store.set('firebase_id_token', idToken);
  const url = new URL(path, 'http://localhost:4321');
  const result = await middleware.onRequest({
    url, request: new Request(url), locals: {},
    cookies: { get: (key) => store.has(key) ? { value: store.get(key) } : undefined, set: (key, value) => store.set(key, value), delete: (key) => store.delete(key) },
    redirect: (target) => new Response(null, { status: 302, headers: { Location: target } }),
  }, () => { proceeded = true; return new Response('allowed'); });
  return { result, proceeded };
}
for (const path of ['/api/users', '/api/publish', '/api/subchapters', '/api/editor-document', '/api/users/', '/api/publish/', '/api/subchapters/', '/api/editor-document/']) {
  const forged = await request(path);
  assert.equal(forged.result.status, 401);
  assert.equal(forged.proceeded, false, 'Unsigned role cookies must never authorize API mutations.');
}
const downgraded = await request('/api/users', token);
assert.equal(downgraded.result.status, 403);
assert.equal(downgraded.proceeded, false);
const editor = await request('/workspace-mc361/content/chapters/01/edit', token);
assert.equal(editor.result.status, 302);
assert.equal(editor.proceeded, false);
assert.equal((await request('/workspace-mc361/content/chapters/01/edit/', token)).proceeded, false);
for (const method of ['POST', 'PUT']) {
  const denied = await subchapters[method]({
    request: new Request('http://localhost:4321/api/subchapters', {
      method, headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapterNumber: '01', newSection: { title: 'Forbidden' }, sections: [] }),
    }),
    cookies: { get: () => ({ value: 'legacy-cookie' }) },
    locals: { session: { email: 'test@example.invalid', uid: 'test-user', role: 'editor', assignedChapters: [] } },
  });
  assert.equal(denied.status, 403, 'Subchapter operations must check current chapter assignments.');
}
dbStatus = 503;
const unavailable = await request('/api/users', token);
assert.equal(unavailable.result.status, 503);
assert.equal(unavailable.proceeded, false, 'Permission checks must fail closed when Firestore is unavailable.');
dbStatus = 200;
role = 'admin';
assert.equal((await request('/api/users', token)).proceeded, true);
assert(databaseReads >= 8, 'Current permissions must be read for each authenticated operation.');
console.log('PASS: live role/chapter revocation, deleted users, invalid/expired/forged tokens, protected mutations and fail-closed behavior.');

// Exercise the real editor endpoint without touching production Firebase.
const titles = loadModule('lib/course-titles.ts', {});
const schema = loadModule('lib/content-schema.ts', {});
const course = [{ number: '01', title: 'Chapter', sections: [{ id: '1.1', title: 'Current title', slug: '01-one/topic' }] }];
function field(value) {
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return { integerValue: String(value) };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(field) } };
  return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([key, item]) => [key, field(item)])) } };
}
let savedDraft = { ...schema.starterDocument, chapterId: '01', slug: 'topic', title: 'Old title', contentMarkdown: '# Old title\n\nSaved body', authorEmail: 'test@example.invalid' };
let draftStatus = 200;
let reads = 0;
let release;
let gate = new Promise(resolve => { release = resolve; });
const editorRoute = loadModule('src/pages/api/editor-document.ts', {
  '@/lib/server-session': session, '@/lib/course-data': { chapters: course },
  '@/lib/course-titles': titles, '@/lib/content-schema': schema,
}, {
  performance, AbortSignal, console: { error: () => {} },
  testPublishedFiles: { '/src/content/resistencia/01-one/topic/index.mdx': async () => '# Published\n\nPublished body' },
  fetch: async (url, options) => {
    reads++;
    assert.equal(options.headers.Authorization, `Bearer ${token}`);
    assert.equal(options.cache, 'no-store');
    await gate;
    const isDraft = url.includes('/drafts/');
    return Response.json(isDraft ? field(savedDraft).mapValue : field({ list: course }).mapValue,
      { status: isDraft ? draftStatus : 200 });
  },
});
const currentEditor = { email: 'test@example.invalid', uid: 'test-user', role: 'editor', assignedChapters: ['01'] };
function readEditor(currentSession = currentEditor, slug = 'topic') {
  const url = new URL(`http://localhost:4321/api/editor-document?chapter=01&slug=${encodeURIComponent(slug)}`);
  return editorRoute.GET({ url, request: new Request(url), locals: { session: currentSession }, cookies: { get: () => ({ value: token }) } });
}
assert.equal((await readEditor(null)).status, 403);
assert.equal((await readEditor({ ...currentEditor, assignedChapters: [] })).status, 403);
assert.equal(reads, 0, 'Unauthorized requests must not read any documents.');
const pendingRead = readEditor();
assert.equal(reads, 2, 'Course and draft reads must start concurrently.');
release();
const loaded = await pendingRead;
assert.equal(loaded.status, 200);
assert.equal(loaded.headers.get('cache-control'), 'no-store');
assert(loaded.headers.has('server-timing'));
assert.equal((await loaded.json()).document.contentMarkdown, '# Current title\n\nSaved body');
draftStatus = 404;
assert.equal((await (await readEditor()).json()).document.contentMarkdown, '# Current title\n\nPublished body');
assert.equal((await readEditor(currentEditor, 'missing')).status, 404);
draftStatus = 403;
assert.equal((await readEditor()).status, 503, 'Denied reads must not open an empty document.');
draftStatus = 200;
savedDraft = { ...savedDraft, authorEmail: 'someone-else@example.invalid' };
assert.equal((await readEditor()).status, 403);
console.log('PASS: parallel editor loading, current titles, published fallback, private drafts and failed-read protection.');
