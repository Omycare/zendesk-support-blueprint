import { collection, doc, getDoc, getDocs, query, where, orderBy, limit, startAfter, runTransaction,
  serverTimestamp, onSnapshot, setDoc, updateDoc } from 'firebase/firestore';
import { courses, emailKey, projectData, prepareClientData, requestError, changesSince, threadKey } from './model.js';

const iso = value => value?.toDate?.().toISOString() || '';
export function createBackend(db, auth) {
  let unsubscribe = null, activeProject = null, activeRevision = null;
  const identity = () => {
    const user = auth.currentUser;
    if (!user?.emailVerified) throw requestError('verified-login-required', 401);
    return { uid: user.uid, email: emailKey(user.email) };
  };
  const projectRef = id => doc(db, 'projects', id);
  async function session() {
    const user = identity(), snapshot = await getDoc(doc(db, 'administrators', user.uid));
    return { ...user, role: snapshot.exists() && snapshot.data().enabled === true ? 'consultant' : 'client' };
  }
  async function requireAdmin() {
    if ((await session()).role !== 'consultant') throw requestError('forbidden', 403);
  }
  async function listProjects() {
    const user = await session();
    const ref = collection(db, 'projects');
    const result = await getDocs(user.role === 'consultant' ? ref : query(ref, where('memberEmails', 'array-contains', user.email)));
    return { projects: result.docs.map(d => ({ id: d.id, name: d.data().name })).sort((a, b) => a.name.localeCompare(b.name)) };
  }
  async function catalog() {
    await requireAdmin();
    const snapshot = await getDoc(doc(db, 'settings', 'catalog'));
    return snapshot.exists() ? snapshot.data() : { revision: 0, resources: [
      { id: 'omycare-agents', fr: 'Formation des agents', en: 'Agent training', url: '', requiresCode: false },
      { id: 'omycare-admins', fr: 'Formation des administrateurs', en: 'Administrator training', url: '', requiresCode: false }
    ] };
  }
  function event(tx, id, revision, changes, eventRef) {
    const user = identity();
    tx.set(eventRef, { actor: user.email, actorId: user.uid, at: serverTimestamp(), revision, changes });
  }
  function syncCourses(tx, id, project, resources, removedIds = []) {
    for (const course of resources) tx.set(doc(db, 'projects', id, 'training', course.id), course);
    for (const key of removedIds) if (!resources.some(r => r.id === key)) tx.delete(doc(db, 'projects', id, 'training', key));
  }
  async function createProject(body) {
    await requireAdmin();
    const data = projectData(body.data), name = String(body.name || '').trim().slice(0, 200);
    if (!name) throw requestError('invalid-name');
    const ref = doc(collection(db, 'projects')), eventRef = doc(collection(ref, 'events'));
    await runTransaction(db, async tx => {
      const c = await tx.get(doc(db, 'settings', 'catalog'));
      tx.set(ref, { name, data, memberEmails: [], revision: 1, createdBy: identity().uid,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(), lastEventId: eventRef.id });
      event(tx, ref.id, 1, ['created'], eventRef);
      syncCourses(tx, ref.id, data, c.exists() ? c.data().resources : []);
    });
    return { id: ref.id, revision: 1 };
  }
  async function updateProject(id, body) {
    const user = await session(), ref = projectRef(id), eventRef = doc(collection(ref, 'events'));
    return runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw requestError('project-missing', 404);
      const current = snapshot.data();
      if (current.revision !== body.revision) throw requestError('revision-conflict', 409);
      const data = user.role === 'consultant' ? projectData(body.data) : prepareClientData(body.data, current.data);
      const revision = current.revision + 1, changes = changesSince(current.data, data);
      tx.update(ref, { data, revision, updatedAt: serverTimestamp(), lastEventId: eventRef.id });
      event(tx, id, revision, changes, eventRef);
      return { revision, changes };
    });
  }
  async function updateMembers(id, body, remove) {
    await requireAdmin();
    const email = emailKey(body.email), ref = projectRef(id), eventRef = doc(collection(ref, 'events'));
    return runTransaction(db, async tx => {
      const snapshot = await tx.get(ref);
      if (!snapshot.exists()) throw requestError('project-missing', 404);
      const p = snapshot.data();
      const members = remove ? p.memberEmails.filter(e => e !== email) : [...new Set([...p.memberEmails, email])];
      if (members.length > 50) throw requestError('too-many-members');
      const revision = p.revision + 1;
      tx.update(ref, { memberEmails: members, revision, updatedAt: serverTimestamp(), lastEventId: eventRef.id });
      event(tx, id, revision, ['members'], eventRef);
      return { revision };
    });
  }
  async function updateCatalog(body) {
    await requireAdmin();
    const resources = courses(body.resources), projects = await getDocs(collection(db, 'projects'));
    return runTransaction(db, async tx => {
      const ref = doc(db, 'settings', 'catalog'), current = await tx.get(ref);
      const before = current.exists() ? current.data() : { revision: 0, resources: [] };
      if (before.revision !== body.revision) throw requestError('revision-conflict', 409);
      const entries = await Promise.all(projects.docs.map(p => tx.get(p.ref)));
      const removed = before.resources.filter(r => !resources.some(next => next.id === r.id)).map(r => r.id);
      if ((resources.length + removed.length) * entries.length + 1 > 450) throw requestError('catalog-batch-too-large');
      const revision = before.revision + 1;
      tx.set(ref, { revision, resources });
      for (const p of entries) if (p.exists()) syncCourses(tx, p.id, p.data().data, resources, removed);
      return { revision, resources };
    });
  }
  async function getProject(id) {
    const snapshot = await getDoc(projectRef(id));
    if (!snapshot.exists()) throw requestError('project-missing', 404);
    const p = snapshot.data();
    const events = await getDocs(query(collection(db, 'projects', id, 'events'), orderBy('at', 'desc'), limit(12)));
    let trainingResources = [];
    if (p.data.tracking.trainingIncluded) {
      const snapshots = await Promise.all(p.data.tracking.trainingIds.map(key => getDoc(doc(db, 'projects', id, 'training', key))));
      trainingResources = snapshots.filter(s => s.exists()).map(s => s.data());
    }
    if (activeProject !== id) watchProject(id, p.revision);
    return { id, name: p.name, data: p.data, revision: p.revision, trainingResources,
      events: events.docs.map(e => ({ ...e.data(), at: iso(e.data().at) })) };
  }
  function watchProject(id, revision) {
    unsubscribe?.(); activeProject = id; activeRevision = revision;
    unsubscribe = onSnapshot(projectRef(id), snapshot => {
      if (snapshot.metadata.hasPendingWrites) return;
      if (!snapshot.exists()) { window.dispatchEvent(new Event('blueprint:access-lost')); return; }
      const next = snapshot.data().revision;
      if (next !== activeRevision) {
        activeRevision = next;
        window.dispatchEvent(new CustomEvent('blueprint:remote-change', { detail: { id, revision: next } }));
      }
    }, () => { unsubscribe?.(); activeProject = null; window.dispatchEvent(new Event('blueprint:access-lost')); });
  }
  async function api(path, options = {}) {
    identity();
    const method = options.method || 'GET', parts = path.split('/'), body = options.body ? JSON.parse(options.body) : {};
    try {
      if (path === 'session') return await session();
      if (path === 'projects') return method === 'POST' ? await createProject(body) : await listProjects();
      if (path === 'catalog') return method === 'PUT' ? await updateCatalog(body) : await catalog();
      if (parts[0] === 'projects' && parts[1]) {
        const id = parts[1];
        if (parts.length === 2) return method === 'PUT' ? await updateProject(id, body) : await getProject(id);
        if (parts[2] === 'members') {
          await requireAdmin();
          if (method !== 'GET') return await updateMembers(id, body, method === 'DELETE');
          const p = await getDoc(projectRef(id));
          return { members: p.data().memberEmails.map(email => ({ email })) };
        }
        if (parts[2] === 'credentials' && method === 'GET') return { pending: false, unsupported: true };
      }
      throw requestError('unsupported-operation', 501);
    } catch (error) {
      if (error.code === 'permission-denied') error.status = 403;
      throw error;
    }
  }

  function threadRef(pid, bucket, key) {
    if (!['threads', 'internalThreads'].includes(bucket)) throw requestError('invalid-visibility');
    return doc(db, 'projects', pid, bucket, threadKey(key));
  }
  async function sendMessage(pid, bucket, target, title, rawText) {
    const text = String(rawText).trim();
    if (!text || text.length > 6000) throw requestError('invalid-message');
    const user = identity(), ref = threadRef(pid, bucket, target), message = doc(collection(ref, 'messages'));
    await runTransaction(db, async tx => {
      const snapshot = await tx.get(ref), previous = snapshot.exists() ? snapshot.data() : null;
      if (previous) tx.update(ref, { messageCount: previous.messageCount + 1, lastMessageId: message.id,
        status: 'open', updatedAt: serverTimestamp() });
      else tx.set(ref, { target, title: String(title).slice(0, 240), status: 'open', createdBy: user.uid,
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(), messageCount: 1, lastMessageId: message.id });
      tx.set(message, { text, authorId: user.uid, authorEmail: user.email, createdAt: serverTimestamp() });
    });
  }
  async function setThreadStatus(pid, bucket, target, status) {
    if (!['open', 'resolved'].includes(status)) throw requestError('invalid-status');
    await updateDoc(threadRef(pid, bucket, target), { status, updatedAt: serverTimestamp() });
  }
  async function listThreads(pid, bucket = 'threads') {
    const result = await getDocs(query(collection(db, 'projects', pid, bucket), orderBy('updatedAt', 'desc'), limit(100)));
    return result.docs.map(d => ({ ...d.data(), id: d.id, bucket, updatedAt: iso(d.data().updatedAt) }));
  }
  async function messagePage(pid, bucket, target, after = null) {
    const constraints = [orderBy('createdAt', 'desc'), ...(after ? [startAfter(after)] : []), limit(50)];
    const result = await getDocs(query(collection(threadRef(pid, bucket, target), 'messages'), ...constraints));
    return { messages: result.docs.map(d => ({ ...d.data(), id: d.id, createdAt: iso(d.data().createdAt) })).reverse(),
      cursor: result.docs.at(-1) || null, hasMore: result.size === 50 };
  }
  function watchThread(pid, bucket, target, next, fail) {
    return onSnapshot(threadRef(pid, bucket, target), snapshot => {
      if (!snapshot.metadata.hasPendingWrites) next(snapshot.exists() ? snapshot.data() : null);
    }, fail);
  }
  async function markRead(pid, bucket, target) {
    await setDoc(doc(db, 'projects', pid, 'readReceipts', identity().uid), {
      seen: { [bucket + '_' + threadKey(target)]: serverTimestamp() }, updatedAt: serverTimestamp()
    }, { merge: true });
  }
  async function readReceipts(pid) {
    const snapshot = await getDoc(doc(db, 'projects', pid, 'readReceipts', identity().uid));
    return snapshot.exists() ? Object.fromEntries(Object.entries(snapshot.data().seen).map(([k, v]) => [k, iso(v)])) : {};
  }
  async function overview() {
    await requireAdmin();
    const snapshots = await getDocs(collection(db, 'projects'));
    return snapshots.docs.map(p => {
      const data = p.data();
      return { id: p.id, name: data.name, updatedAt: iso(data.updatedAt),
        reviewed: Object.values(data.data.sections).filter(s => s.reviewed).length,
        tasksDone: data.data.tracking.tasks.filter(t => t.status === 'done').length,
        meetingsDone: data.data.tracking.meetings.filter(m => m.done).length };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }
  async function exportConversations(pid, includeInternal = false) {
    if (includeInternal) await requireAdmin();
    const all = [];
    for (const bucket of includeInternal ? ['threads', 'internalThreads'] : ['threads']) {
      const threads = await getDocs(collection(db, 'projects', pid, bucket));
      for (const thread of threads.docs) {
        const messages = await getDocs(query(collection(thread.ref, 'messages'), orderBy('createdAt')));
        all.push({ ...thread.data(), id: thread.id, visibility: bucket === 'threads' ? 'shared' : 'internal',
          createdAt: iso(thread.data().createdAt), updatedAt: iso(thread.data().updatedAt),
          messages: messages.docs.map(m => ({ ...m.data(), id: m.id, createdAt: iso(m.data().createdAt) })) });
      }
    }
    return all;
  }
  return { api, session, listProjects, listThreads, sendMessage, setThreadStatus, messagePage, watchThread,
    markRead, readReceipts, overview, exportConversations, stop: () => { unsubscribe?.(); unsubscribe = null; activeProject = null; } };
}
