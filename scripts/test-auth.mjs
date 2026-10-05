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
function loadModule(file, dependencies) {
  const source = fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')
    .replaceAll('import.meta.env.PROD', 'false');
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
for (const path of ['/api/users', '/api/publish', '/api/subchapters', '/api/users/', '/api/publish/', '/api/subchapters/']) {
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
