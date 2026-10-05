import fs from 'node:fs';
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
  await assertSucceeds(setDoc(doc(admin, 'users', 'temporary@example.invalid'), { role: 'editor', assignedChapters: ['01'] }));
  await assertSucceeds(deleteDoc(doc(admin, 'users', 'temporary@example.invalid')));
  await assertSucceeds(getDoc(doc(editor, 'drafts', '01_missing')));
  await assertSucceeds(getDocs(query(collection(editor, 'drafts'), where('authorEmail', '==', 'editor@example.invalid'))));
  await assertSucceeds(updateDoc(doc(editor, 'drafts', '01_topic'), { title: 'Renamed', contentMarkdown: '# Renamed' }));
  await assertFails(updateDoc(doc(editor, 'drafts', '01_topic'), { status: 'approved' }));
  const changed = structuredClone(structure);
  changed[0].sections[0].title = 'Renamed';
  const rename = writeBatch(editor);
  rename.update(doc(editor, 'course', 'chapters'), { list: changed });
  rename.update(doc(editor, 'drafts', '01_topic'), { title: 'Renamed', contentMarkdown: '# Renamed' });
  await assertSucceeds(rename.commit());
  changed[1].sections.push({ id: '2.1', title: 'Not assigned', slug: '02-two/not-assigned' });
  await assertFails(updateDoc(doc(editor, 'course', 'chapters'), { list: changed }));

  // Keep the exact same authenticated client after revoking permissions.
  await assertSucceeds(updateDoc(doc(admin, 'users', 'editor@example.invalid'), { assignedChapters: [] }));
  await assertFails(updateDoc(doc(editor, 'drafts', '01_topic'), { contentMarkdown: '# Unauthorized' }));
  await assertSucceeds(updateDoc(doc(admin, 'users', 'admin@example.invalid'), { role: 'editor', assignedChapters: [] }));
  await assertFails(deleteDoc(doc(admin, 'users', 'victim@example.invalid')));
  await assertFails(updateDoc(doc(admin, 'users', 'admin@example.invalid'), { role: 'admin' }));
  await environment.withSecurityRulesDisabled((context) => deleteDoc(doc(context.firestore(), 'users', 'editor@example.invalid')));
  await assertSucceeds(getDoc(doc(editor, 'users', 'editor@example.invalid'))); // deletion listener
  await assertFails(getDoc(doc(editor, 'course', 'chapters')));
  await assertFails(setDoc(doc(editor, 'drafts', '01_new'), { ...draft, slug: 'new' }));
  console.log('PASS: Firestore blocks anonymous writes, self-promotion, unassigned chapters and existing sessions after role/access revocation.');
} finally {
  await environment.cleanup();
}
