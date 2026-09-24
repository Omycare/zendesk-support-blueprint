import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, collection, collectionGroup, setDoc, getDoc, getDocs, updateDoc, deleteDoc, writeBatch, serverTimestamp, Timestamp, query, where } from 'firebase/firestore';
import { createBackend } from '../src/backend.js';
let env;
const identities = {
  owner: { uid: 'owner', email: 'owner@example.test' },
  a: { uid: 'client-a', email: 'a@example.test' },
  b: { uid: 'client-b', email: 'b@example.test' }
};
function dbFor(role, verified = true) {
  const user = identities[role];
  return env.authenticatedContext(user.uid, { email: user.email, email_verified: verified }).firestore();
}
function adapter(role) {
  const user = identities[role];
  return createBackend(dbFor(role), { currentUser: { ...user, emailVerified: true } });
}
function data() { return { schemaVersion: 1, lang: 'fr', step: 0, sections: { company: { values: { name: 'Example' }, rows: [] } },
  extensions: {}, workspace: { driveFolderUrl: '', tabs: [] }, tracking: { trainingIncluded: false, trainingIds: [], meetings: [], tasks: [] } }; }
function project(name, email) { const now = Timestamp.now(); return { name, memberEmails: [email], revision: 1, createdBy: 'owner', createdAt: now,
  updatedAt: now, lastEventId: 'seed', data: data() }; }
before(async () => {
  globalThis.window = new EventTarget();
  env = await initializeTestEnvironment({ projectId: 'demo-omycare', firestore: { host: '127.0.0.1', port: 8080, rules: fs.readFileSync('firestore.rules', 'utf8') } });
});
beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async context => {
    const db = context.firestore();
    await Promise.all([
      setDoc(doc(db, 'administrators', 'owner'), { enabled: true }),
      setDoc(doc(db, 'projects', 'a'), project('Company A', identities.a.email)),
      setDoc(doc(db, 'projects', 'b'), project('Company B', identities.b.email))
    ]);
  });
});
after(async () => { await env?.cleanup(); });
test('Anonymous and unverified accounts cannot read client data', async () => {
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'projects', 'a')));
  await assertFails(getDoc(doc(dbFor('a', false), 'projects', 'a')));
});
test('Client A can read its project, but not B or the unfiltered collection', async () => {
  const db = dbFor('a');
  await assertSucceeds(getDoc(doc(db, 'projects', 'a')));
  await assertFails(getDoc(doc(db, 'projects', 'b')));
  await assertFails(getDocs(collection(db, 'projects')));
  const own = await assertSucceeds(getDocs(query(collection(db, 'projects'), where('memberEmails', 'array-contains', identities.a.email))));
  assert.deepEqual(own.docs.map(d => d.id), ['a']);
});
test('No self-promotion or membership elevation through raw writes', async () => {
  const db = dbFor('a');
  await assertFails(setDoc(doc(db, 'administrators', 'client-a'), { enabled: true }));
  await assertFails(updateDoc(doc(db, 'projects', 'b'), { memberEmails: [identities.a.email] }));
  await assertFails(updateDoc(doc(db, 'projects', 'a'), { memberEmails: [identities.a.email, identities.b.email] }));
});
test('Client saves answers through the real adapter and cannot change purchased scope', async () => {
  const api = adapter('a'); const input = data(); input.sections.company.values.name = 'Client answer'; input.tracking.trainingIncluded = true;
  const result = await api.api('projects/a', { method: 'PUT', body: JSON.stringify({ revision: 1, data: input }) });
  assert.equal(result.revision, 2);
  const stored = (await getDoc(doc(dbFor('a'), 'projects', 'a'))).data();
  assert.equal(stored.data.sections.company.values.name, 'Client answer');
  assert.equal(stored.data.tracking.trainingIncluded, false);
  await assert.rejects(api.api('projects/a', { method: 'PUT', body: JSON.stringify({ revision: 1, data: input }) }), e => e.status === 409);
});
test('Rules reject scope and folder tampering even with a correctly linked audit event', async () => {
  const db = dbFor('a');
  for (const update of [{ 'data.tracking.trainingIncluded': true }, { 'data.workspace.driveFolderUrl': 'https://drive.google.com/drive/folders/other' }]) {
    const batch = writeBatch(db), event = doc(collection(db, 'projects', 'a', 'events'));
    batch.update(doc(db, 'projects', 'a'), { ...update, revision: 2, updatedAt: serverTimestamp(), lastEventId: event.id });
    batch.set(event, { actor: identities.a.email, actorId: identities.a.uid, revision: 2, at: serverTimestamp(), changes: ['summary'] });
    await assertFails(batch.commit());
  }
});
test('Administrator creates projects and grants and revokes client access', async () => {
  const api = adapter('owner');
  const created = await api.api('projects', { method: 'POST', body: JSON.stringify({ name: 'New company', data: data() }) });
  await assertFails(getDoc(doc(dbFor('b'), 'projects', created.id)));
  await api.api(`projects/${created.id}/members`, { method: 'POST', body: JSON.stringify({ email: identities.b.email }) });
  await assertSucceeds(getDoc(doc(dbFor('b'), 'projects', created.id)));
  await api.api(`projects/${created.id}/members`, { method: 'DELETE', body: JSON.stringify({ email: identities.b.email }) });
  await assertFails(getDoc(doc(dbFor('b'), 'projects', created.id)));
});
test('Training links require project entitlement; catalog is administrator-only', async () => {
  const api = adapter('owner'), resources = [{ id: 'agents', fr: 'Agents', en: 'Agents', url: 'https://example.test/training' }];
  await api.api('catalog', { method: 'PUT', body: JSON.stringify({ revision: 0, resources }) });
  await assertFails(getDoc(doc(dbFor('a'), 'settings', 'catalog')));
  await assertFails(getDoc(doc(dbFor('a'), 'projects', 'a', 'training', 'agents')));
  const input = data(); input.tracking.trainingIncluded = true; input.tracking.trainingIds = ['agents'];
  await api.api('projects/a', { method: 'PUT', body: JSON.stringify({ revision: 1, data: input }) });
  await assertSucceeds(getDoc(doc(dbFor('a'), 'projects', 'a', 'training', 'agents')));
  await assertFails(getDoc(doc(dbFor('b'), 'projects', 'a', 'training', 'agents')));
  await api.api('catalog', { method: 'PUT', body: JSON.stringify({ revision: 1, resources: [{ ...resources[0], url: 'https://example.test/updated' }] }) });
  assert.equal((await getDoc(doc(dbFor('a'), 'projects', 'a', 'training', 'agents'))).data().url, 'https://example.test/updated');
});
test('Both participants can reply; author, timestamp and message history are immutable', async () => {
  const a = adapter('a'), owner = adapter('owner');
  await a.sendMessage('a', 'threads', 'field:company:name', 'Company name', '<script>Not executable</script>');
  await owner.sendMessage('a', 'threads', 'field:company:name', 'Company name', 'Confirmed');
  const result = await a.messagePage('a', 'threads', 'field:company:name');
  assert.equal(result.messages.length, 2);
  assert.equal(result.messages[0].authorId, identities.a.uid);
  const ref = doc(dbFor('a'), 'projects', 'a', 'threads', encodeURIComponent('field:company:name'), 'messages', result.messages[0].id);
  await assertFails(updateDoc(ref, { text: 'Changed' }));
  await assertFails(deleteDoc(ref));
  await assert.rejects(adapter('b').messagePage('a', 'threads', 'field:company:name'));
  await a.setThreadStatus('a', 'threads', 'field:company:name', 'resolved');
});
test('Forged authors and free-standing messages are rejected', async () => {
  const db = dbFor('a');
  await assertFails(setDoc(doc(db, 'projects', 'a', 'threads', 'fake', 'messages', 'fake'), {
    text: 'Fake', authorId: 'owner', authorEmail: identities.owner.email, createdAt: serverTimestamp()
  }));
});
test('Internal notes remain inaccessible to clients, including exports and global queries', async () => {
  const owner = adapter('owner'), a = adapter('a');
  await owner.sendMessage('a', 'internalThreads', 'project', 'Internal', 'Private OmyCare note');
  await assert.rejects(a.listThreads('a', 'internalThreads'));
  await assert.rejects(a.sendMessage('a', 'internalThreads', 'project', 'Fake internal', 'Attempt'));
  await assertFails(getDocs(collectionGroup(dbFor('a'), 'messages')));
  assert.equal((await a.exportConversations('a')).length, 0);
  await assert.rejects(a.exportConversations('a', true), e => e.status === 403);
  assert.equal((await owner.exportConversations('a', true))[0].messages[0].text, 'Private OmyCare note');
});
test('Read status is private to its account; revoked clients lose conversations', async () => {
  const a = adapter('a'), owner = adapter('owner');
  await a.sendMessage('a', 'threads', 'project', 'General', 'Hello');
  await a.markRead('a', 'threads', 'project');
  assert.ok((await a.readReceipts('a')).threads_project);
  await assertFails(getDoc(doc(dbFor('owner'), 'projects', 'a', 'readReceipts', identities.a.uid)));
  await owner.api('projects/a/members', { method: 'DELETE', body: JSON.stringify({ email: identities.a.email }) });
  await assert.rejects(a.messagePage('a', 'threads', 'project'));
});
