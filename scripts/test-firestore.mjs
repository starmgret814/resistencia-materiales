import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import * as firestore from 'firebase/firestore';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

if (!process.env.FIRESTORE_EMULATOR_HOST) throw new Error('Run this test through Firebase emulators:exec.');
const [host, port] = process.env.FIRESTORE_EMULATOR_HOST.split(':');
const environment = await initializeTestEnvironment({
  projectId: 'demo-mc361-permissions',
  firestore: { host, port: Number(port), rules: fs.readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8') },
});
const account = (email) => environment.authenticatedContext(email, { email, email_verified: true }).firestore();
const admin = account('admin@example.invalid');
const editor = account('editor@example.invalid');
const anonymous = environment.unauthenticatedContext().firestore();
const structure = [
  { number: '01', title: 'One', sections: [{ id: '1.1', title: 'Topic', slug: '01-one/topic' }] },
  { number: '02', title: 'Two', sections: [] },
];
const draft = { chapterId: '01', slug: 'topic', title: 'Topic', contentMarkdown: '# Topic', authorEmail: 'editor@example.invalid', status: 'draft' };
function loadModule(file, dependencies = {}) {
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  // Use the host realm: the real Firestore SDK requires plain Object prototypes.
  const execute = vm.runInThisContext(`(function(exports, require, structuredClone) { ${code}\n })`, { filename: file });
  execute(exports, name => dependencies[name], structuredClone);
  return exports;
}
const courseData = loadModule('lib/course-data.ts', { './chapters.json': { default: structure } });
const schema = loadModule('lib/content-schema.ts');
const operations = loadModule('lib/course-structure.ts', { './course-data': courseData, './content-schema': schema });
const titles = loadModule('lib/course-titles.ts');
const storeFor = db => loadModule('lib/course-structure-store.ts', { 'firebase/firestore': firestore, './firebase': { db }, './course-data': courseData, './course-structure': operations, './course-titles': titles });
try {
  await environment.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'users', 'admin@example.invalid'), { role: 'admin', assignedChapters: [] });
    await setDoc(doc(db, 'users', 'editor@example.invalid'), { role: 'editor', assignedChapters: ['01'] });
    await setDoc(doc(db, 'users', 'victim@example.invalid'), { role: 'editor', assignedChapters: [] });
    await setDoc(doc(db, 'course', 'chapters'), { list: structure });
    await setDoc(doc(db, 'drafts', '01_topic'), draft);
  });
  await assertFails(getDoc(doc(anonymous, 'users', 'admin@example.invalid')));
  await assertFails(deleteDoc(doc(anonymous, 'users', 'victim@example.invalid')));
  await assertFails(deleteDoc(doc(editor, 'users', 'victim@example.invalid')));
  await assertFails(updateDoc(doc(editor, 'users', 'editor@example.invalid'), { role: 'admin' }));
  const exam = { period: '2026-1', type: 'parcial', title: 'Examen parcial', contentMarkdown: '## Problema 1\n\nCalcula el esfuerzo.' };
  const examRef = doc(admin, 'exams', 'test-exam');
  await assertFails(setDoc(doc(anonymous, 'exams', 'test-exam'), exam));
  await assertFails(setDoc(doc(editor, 'exams', 'test-exam'), exam));
  await assertSucceeds(setDoc(examRef, exam));
  await assertSucceeds(getDoc(doc(anonymous, 'exams', 'test-exam')));
  await assertSucceeds(getDocs(collection(anonymous, 'exams')));
  await assertSucceeds(updateDoc(examRef, { contentMarkdown: '# Contenido actualizado' }));
  await assertFails(updateDoc(doc(editor, 'exams', 'test-exam'), { title: 'Cambio no autorizado' }));
  await assertFails(updateDoc(examRef, { period: '2026-3' }));
  await assertFails(updateDoc(examRef, { type: 'otro' }));
  await assertFails(updateDoc(examRef, { title: '' }));
  await assertFails(updateDoc(examRef, { contentMarkdown: '' }));
  await assertFails(deleteDoc(doc(editor, 'exams', 'test-exam')));
  await assertSucceeds(deleteDoc(examRef));
  await assertSucceeds(setDoc(doc(admin, 'users', 'temporary@example.invalid'), { role: 'editor', assignedChapters: ['01'] }));
  await assertSucceeds(deleteDoc(doc(admin, 'users', 'temporary@example.invalid')));
  await assertSucceeds(getDoc(doc(editor, 'drafts', '01_missing')));
  await assertSucceeds(getDocs(query(collection(editor, 'drafts'), where('authorEmail', '==', 'editor@example.invalid'))));
  await assertSucceeds(updateDoc(doc(editor, 'drafts', '01_topic'), { title: 'Renamed', contentMarkdown: '# Renamed' }));
  await assertFails(updateDoc(doc(editor, 'drafts', '01_topic'), { status: 'approved' }));
  const changed = structuredClone(structure);
  changed[0].sections[0].title = 'Renamed';
  const rename = writeBatch(editor);
  rename.update(doc(editor, 'course', 'chapters'), { list: changed, editedChapterIndex: 0 });
  rename.update(doc(editor, 'drafts', '01_topic'), { title: 'Renamed', contentMarkdown: '# Renamed' });
  await assertSucceeds(rename.commit());
  changed[1].sections.push({ id: '2.1', title: 'Not assigned', slug: '02-two/not-assigned' });
  await assertFails(updateDoc(doc(editor, 'course', 'chapters'), { list: changed }));

  // Generic chapter permissions must keep working beyond the original catalog.
  const expanded = Array.from({ length: 40 }, (_, i) => ({ number: String(i + 1).padStart(2, '0'), title: `Chapter ${i + 1}`, sections: [] }));
  await assertSucceeds(updateDoc(doc(admin, 'course', 'chapters'), { list: expanded }));
  await assertSucceeds(updateDoc(doc(admin, 'users', 'editor@example.invalid'), { assignedChapters: ['27'] }));
  const assignedEdit = structuredClone(expanded);
  assignedEdit[26].sections.push({ id: '27.1', title: 'Assigned', slug: '27-chapter/assigned' });
  await assertSucceeds(updateDoc(doc(editor, 'course', 'chapters'), { list: assignedEdit, editedChapterIndex: 26 }));
  const unassignedEdit = structuredClone(assignedEdit);
  unassignedEdit[27].sections.push({ id: '28.1', title: 'Forbidden', slug: '28-chapter/forbidden' });
  await assertFails(updateDoc(doc(editor, 'course', 'chapters'), { list: unassignedEdit, editedChapterIndex: 26 }));
  const renamedChapter = structuredClone(assignedEdit);
  renamedChapter[26].title = 'Forbidden rename';
  await assertFails(updateDoc(doc(editor, 'course', 'chapters'), { list: renamedChapter, editedChapterIndex: 26 }));
  const reordered = structuredClone(assignedEdit);
  [reordered[0], reordered[1]] = [reordered[1], reordered[0]];
  await assertFails(updateDoc(doc(editor, 'course', 'chapters'), { list: reordered, editedChapterIndex: 26 }));
  await assertFails(updateDoc(doc(editor, 'course', 'chapters'), { list: assignedEdit, editedChapterIndex: -1 }));
  const archivedChapter = structuredClone(assignedEdit);
  archivedChapter[26].archived = true;
  await assertSucceeds(updateDoc(doc(admin, 'course', 'chapters'), { list: archivedChapter }));
  archivedChapter[26].sections.push({ id: '27.2', title: 'Archived', slug: '27-chapter/archived' });
  await assertFails(updateDoc(doc(editor, 'course', 'chapters'), { list: archivedChapter, editedChapterIndex: 26 }));

  // Exercise the actual service concurrently against the emulator, including SDK retries.
  await assertSucceeds(updateDoc(doc(admin, 'course', 'chapters'), { list: assignedEdit }));
  await storeFor(editor).changeCourseStructure({ email: 'editor@example.invalid', role: 'editor', assignedChapters: ['27'] }, { type: 'create-section', chapter: '27', title: 'Prueba previa' });
  console.log('PASS: real editor service creates catalog and draft atomically.');
  await Promise.all([
    storeFor(admin).changeCourseStructure({ email: 'admin@example.invalid', role: 'admin', assignedChapters: [] }, { type: 'rename-chapter', chapter: '01', title: 'Concurrent chapter rename' }),
    storeFor(editor).changeCourseStructure({ email: 'editor@example.invalid', role: 'editor', assignedChapters: ['27'] }, { type: 'create-section', chapter: '27', title: 'Sección concurrente' }),
  ]);
  const concurrent = (await getDoc(doc(admin, 'course', 'chapters'))).data().list;
  if (concurrent[0].title !== 'Concurrent chapter rename' || concurrent[26].sections.length !== 3) throw new Error('Concurrent transactions lost a course update.');
  await assertSucceeds(getDoc(doc(editor, 'drafts', '27_seccion-concurrente')));

  // Keep the exact same authenticated client after revoking permissions.
  await assertSucceeds(updateDoc(doc(admin, 'users', 'editor@example.invalid'), { assignedChapters: [] }));
  await assertFails(updateDoc(doc(editor, 'drafts', '01_topic'), { contentMarkdown: '# Unauthorized' }));
  await assertSucceeds(updateDoc(doc(admin, 'users', 'admin@example.invalid'), { role: 'editor', assignedChapters: [] }));
  await assertFails(deleteDoc(doc(admin, 'users', 'victim@example.invalid')));
  await assertFails(updateDoc(doc(admin, 'users', 'admin@example.invalid'), { role: 'admin' }));
  await environment.withSecurityRulesDisabled((context) => deleteDoc(doc(context.firestore(), 'users', 'editor@example.invalid')));
  await assertSucceeds(getDoc(doc(editor, 'users', 'editor@example.invalid'))); // deletion listener
  await assertSucceeds(getDoc(doc(editor, 'course', 'chapters'))); // public catalog remains readable
  await assertFails(setDoc(doc(editor, 'drafts', '01_new'), { ...draft, slug: 'new' }));
  console.log('PASS: Firestore blocks anonymous writes, self-promotion, unassigned chapters and existing sessions after role/access revocation.');
} finally {
  await environment.cleanup();
}
