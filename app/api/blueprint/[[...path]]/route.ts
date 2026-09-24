import { database, runtimeSecrets } from '@/db/raw';
import { normalizeTracking, safeTrainingURL } from '@/frontend/tracking-data.js';
import { normalizeExtensions } from '@/frontend/extensions.js';
import { defaultCourses } from '@/frontend/course-catalog.js';
import { sections } from '@/frontend/content.js';
import { normalizeWorkspace } from '@/frontend/workspace-data.js';
export const dynamic = 'force-dynamic';
const OWNER = 'stephanie@omycare.fr';
const response = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store', Vary: 'Cookie', 'X-Content-Type-Options': 'nosniff' } });
const protectedCourses: Record<string, string> = { 'omycare-agents': 'AGENT_TRAINING_CODE', 'omycare-admins': 'ADMIN_TRAINING_CODE' };
function cleanState(raw: any) {
  if (raw?.schemaVersion !== 1 || !raw.sections) throw Error('invalid');
  const result: any = { schemaVersion: 1, lang: raw.lang === 'en' ? 'en' : 'fr', step: 0, sections: {}, tracking: normalizeTracking(raw.tracking), extensions: normalizeExtensions(raw.extensions), workspace: normalizeWorkspace(raw.workspace) };
  for (const s of sections) {
    const x = raw.sections[s.id];
    if (!x || !Array.isArray(x.rows) || x.rows.length > 2000) throw Error('invalid');
    const v: any = { values: {}, rows: [], notes: String(x.notes || '').slice(0, 20000), reviewed: x.reviewed === true, deferred: x.deferred === true };
    for (const f of s.fields || []) v.values[f.key] = String(x.values?.[f.key] ?? '').slice(0, 20000);
    v.rows = x.rows.map((r: any) => Object.fromEntries((s.cols || []).map((f: any) => [f.key, String(r?.[f.key] ?? '').slice(0, 65536)])));
    result.sections[s.id] = v;
  }
  return result;
}
function diff(before: any, after: any) {
  const changes: string[] = [];
  if (JSON.stringify(before.workspace) !== JSON.stringify(after.workspace)) changes.push('workspace');
  for (const s of sections) if (JSON.stringify(before.sections[s.id]) !== JSON.stringify(after.sections[s.id])) changes.push(`document:${s.id}`);
  for (const t of after.tracking.tasks) {
    const old = before.tracking.tasks.find((r: any) => r.id === t.id);
    if (JSON.stringify(old) !== JSON.stringify(t)) changes.push(`task:${t.id}:${t.status}`);
  }
  after.tracking.meetings.forEach((m: any, i: number) => { if (JSON.stringify(m) !== JSON.stringify(before.tracking.meetings[i])) changes.push(`meeting:${m.id}:${m.done ? 'done' : 'planned'}`); });
  if (before.tracking.trainingIncluded !== after.tracking.trainingIncluded || JSON.stringify(before.tracking.trainingIds) !== JSON.stringify(after.tracking.trainingIds)) changes.push('training');
  if (JSON.stringify(before.extensions) !== JSON.stringify(after.extensions)) changes.push('document:details');
  if (before.tracking.summary !== after.tracking.summary) changes.push('summary');
  return changes;
}
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const unhex = (s: string) => Uint8Array.from(s.match(/../g) || [], x => parseInt(x, 16));
async function encryptionKey() {
  const secret = runtimeSecrets().CREDENTIAL_ENCRYPTION_KEY;
  if (!secret || !/^[a-f\d]{64}$/i.test(secret)) throw Error('encryption_not_configured');
  return crypto.subtle.importKey('raw', unhex(secret), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
async function sameCode(a: string, b: string) {
  const hash = async (s: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
  const [x, y] = await Promise.all([hash(a), hash(b)]);
  let mismatch = 0; for (let i = 0; i < x.length; i++) mismatch |= x[i] ^ y[i];
  return mismatch === 0;
}
async function handler(req: Request) {
  const user = req.headers.get('oai-authenticated-user-id');
  const email = (req.headers.get('oai-authenticated-user-email') || '').trim().toLowerCase();
  if (!user || !email) return response({ error: 'sign_in_required' }, 401);
  const owner = email === OWNER, url = new URL(req.url), parts = url.pathname.split('/').slice(3).filter(Boolean);
  if (req.method !== 'GET') {
    const origin = req.headers.get('origin');
    if ((origin && origin !== url.origin) || req.headers.get('sec-fetch-site') === 'cross-site') return response({ error: 'origin' }, 403);
  }
  try {
    const db = database(); let body: any = {};
    if (req.method !== 'GET') {
      const raw = await req.text(); if (raw.length > 1500000) return response({ error: 'too_large' }, 413);
      try { body = JSON.parse(raw); } catch { return response({ error: 'invalid_json' }, 400); }
    }
    const catalog = async () => {
      const row: any = await db.prepare('SELECT value,revision FROM blueprint_settings WHERE key=?').bind('training').first();
      return { resources: row ? JSON.parse(row.value) : defaultCourses, revision: row?.revision || 0, exists: !!row };
    };
    const audit = async (projectId: string, change: string) => db.prepare('INSERT INTO blueprint_events (project_id,at,actor,changes) VALUES (?,?,?,?)').bind(projectId, new Date().toISOString(), email, JSON.stringify([change])).run();
    if (parts[0] === 'session' && req.method === 'GET') return response({ role: owner ? 'consultant' : 'client', email });
    if (parts[0] === 'catalog') {
      if (!owner) return response({ error: 'forbidden' }, 403);
      const c = await catalog();
      if (req.method === 'GET') return response({ resources: c.resources, revision: c.revision });
      if (req.method !== 'PUT') return response({ error: 'method' }, 405);
      if (body.revision !== c.revision) return response({ error: 'conflict' }, 409);
      if (!Array.isArray(body.resources) || body.resources.length > 100) return response({ error: 'invalid' }, 400);
      const resources = [], seen = new Set();
      for (const r of body.resources) {
        const id = String(r.id || '').slice(0, 100);
        if (!/^[a-zA-Z0-9_-]+$/.test(id) || seen.has(id) || !safeTrainingURL(r.url) || !r.fr || !r.en) return response({ error: 'invalid_training' }, 400);
        seen.add(id); resources.push({ id, fr: String(r.fr).slice(0, 200), en: String(r.en).slice(0, 200), url: safeTrainingURL(r.url), requiresCode: !!protectedCourses[id] });
      }
      const write = c.exists ? await db.prepare('UPDATE blueprint_settings SET value=?,revision=revision+1 WHERE key=? AND revision=?').bind(JSON.stringify(resources), 'training', body.revision).run() : await db.prepare('INSERT OR IGNORE INTO blueprint_settings (key,value,revision) VALUES (?,?,1)').bind('training', JSON.stringify(resources)).run();
      if (!write.meta.changes) return response({ error: 'conflict' }, 409);
      return response({ resources, revision: c.revision + 1 });
    }
    if (parts[0] !== 'projects') return response({ error: 'not_found' }, 404);
    if (!parts[1]) {
      if (req.method === 'GET') {
        const result = owner ? await db.prepare('SELECT id,name,revision,updated_at FROM blueprint_projects ORDER BY updated_at DESC').all() : await db.prepare('SELECT p.id,p.name,p.revision,p.updated_at FROM blueprint_projects p JOIN blueprint_members m ON m.project_id=p.id WHERE m.email=? ORDER BY p.updated_at DESC').bind(email).all();
        return response({ projects: result.results });
      }
      if (req.method !== 'POST' || !owner) return response({ error: 'forbidden' }, 403);
      const data = cleanState(body.data), id = crypto.randomUUID(), now = new Date().toISOString();
      await db.batch([db.prepare('INSERT INTO blueprint_projects (id,name,data,revision,updated_at,last_mutation) VALUES (?,?,?,1,?,?)').bind(id, String(body.name || 'Nouveau projet').slice(0, 200), JSON.stringify(data), now, id), db.prepare('INSERT INTO blueprint_events (project_id,at,actor,changes) VALUES (?,?,?,?)').bind(id, now, email, JSON.stringify(['created']))]);
      return response({ id, revision: 1 }, 201);
    }
    const id = parts[1];
    if (!owner && !await db.prepare('SELECT email FROM blueprint_members WHERE project_id=? AND email=?').bind(id, email).first()) return response({ error: 'not_found' }, 404);
    const project: any = await db.prepare('SELECT * FROM blueprint_projects WHERE id=?').bind(id).first();
    if (!project) return response({ error: 'not_found' }, 404);
    if (parts[2] === 'members') {
      if (!owner) return response({ error: 'forbidden' }, 403);
      if (req.method === 'GET') return response({ members: (await db.prepare('SELECT email FROM blueprint_members WHERE project_id=?').bind(id).all()).results });
      const target = String(body.email || '').trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target) || target.length > 254 || target === OWNER) return response({ error: 'invalid_email' }, 400);
      if (req.method === 'POST') await db.prepare('INSERT OR IGNORE INTO blueprint_members (project_id,email) VALUES (?,?)').bind(id, target).run();
      else if (req.method === 'DELETE') await db.prepare('DELETE FROM blueprint_members WHERE project_id=? AND email=?').bind(id, target).run();
      else return response({ error: 'method' }, 405);
      return response({ ok: true });
    }
    const data = cleanState(JSON.parse(project.data));
    if (parts[2] === 'credentials') {
      const now = Date.now();
      await db.prepare('DELETE FROM blueprint_credentials WHERE project_id=? AND expires_at<=?').bind(id, now).run();
      if (req.method === 'GET') {
        const row: any = await db.prepare('SELECT expires_at FROM blueprint_credentials WHERE project_id=?').bind(id).first();
        return response({ pending: !!row, expiresAt: row?.expires_at || null });
      }
      if (parts[3] === 'reveal' && req.method === 'POST') {
        if (!owner) return response({ error: 'forbidden' }, 403);
        const key = await encryptionKey();
        const row: any = await db.prepare('DELETE FROM blueprint_credentials WHERE project_id=? AND expires_at>? RETURNING ciphertext,iv').bind(id, now).first();
        if (!row) return response({ error: 'no_credentials' }, 404);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unhex(row.iv), additionalData: new TextEncoder().encode(id) }, key, unhex(row.ciphertext));
        await audit(id, 'access:retrieved');
        return response(JSON.parse(new TextDecoder().decode(decrypted)));
      }
      if (parts[3]) return response({ error: 'not_found' }, 404);
      if (req.method === 'DELETE') { await db.prepare('DELETE FROM blueprint_credentials WHERE project_id=?').bind(id).run(); await audit(id, 'access:removed'); return response({ ok: true }); }
      if (req.method !== 'POST') return response({ error: 'method' }, 405);
      if (typeof body.username !== 'string' || typeof body.password !== 'string' || !body.username.trim() || !body.password || body.username.length > 512 || body.password.length > 2048) return response({ error: 'invalid_credentials' }, 400);
      const iv = crypto.getRandomValues(new Uint8Array(12)), key = await encryptionKey(), expiresAt = now + 7 * 86400000;
      const payload = new TextEncoder().encode(JSON.stringify({ username: body.username.trim(), password: body.password }));
      const ciphertext = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv, additionalData: new TextEncoder().encode(id) }, key, payload));
      await db.prepare('INSERT INTO blueprint_credentials (project_id,ciphertext,iv,expires_at) VALUES (?,?,?,?) ON CONFLICT(project_id) DO UPDATE SET ciphertext=excluded.ciphertext,iv=excluded.iv,expires_at=excluded.expires_at').bind(id, hex(ciphertext), hex(iv), expiresAt).run();
      await audit(id, 'access:received'); return response({ ok: true, expiresAt });
    }
    if (parts[2] === 'training') {
      if (req.method !== 'POST' || parts[4] !== 'unlock') return response({ error: 'method' }, 405);
      const resourceId = parts[3], c = await catalog(), r = c.resources.find((item: any) => item.id === resourceId);
      if (!r || !data.tracking.trainingIncluded || !data.tracking.trainingIds.includes(resourceId)) return response({ error: 'not_included' }, 403);
      if (!protectedCourses[resourceId]) return response({ url: r.url });
      const expected = runtimeSecrets()[protectedCourses[resourceId]];
      if (!expected) return response({ error: 'not_configured' }, 503);
      const now = Date.now(), attemptKey = JSON.stringify([user, resourceId]);
      const attempt: any = await db.prepare('INSERT INTO blueprint_attempts (key,count,reset_at) VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN reset_at<=? THEN 1 ELSE count+1 END,reset_at=CASE WHEN reset_at<=? THEN excluded.reset_at ELSE reset_at END RETURNING count').bind(attemptKey, now + 900000, now, now).first();
      if (attempt.count > 8) return response({ error: 'too_many_attempts' }, 429);
      if (typeof body.code !== 'string' || body.code.length > 128 || !await sameCode(body.code, expected)) return response({ error: 'incorrect_code' }, 403);
      return response({ url: r.url });
    }
    if (parts[2]) return response({ error: 'not_found' }, 404);
    if (req.method === 'GET') {
      const c = await catalog(), resources = c.resources;
      const visible = owner ? resources : data.tracking.trainingIncluded ? resources.filter((r: any) => data.tracking.trainingIds.includes(r.id)).map((r: any) => protectedCourses[r.id] ? { id: r.id, fr: r.fr, en: r.en, requiresCode: true } : r) : [];
      const events = await db.prepare('SELECT at,actor,changes FROM blueprint_events WHERE project_id=? ORDER BY id DESC LIMIT 100').bind(id).all();
      return response({ id, name: project.name, revision: project.revision, data, trainingResources: visible, events: events.results });
    }
    if (req.method !== 'PUT') return response({ error: 'method' }, 405);
    if (body.revision !== project.revision) return response({ error: 'conflict' }, 409);
    const next = cleanState(body.data);
    // Older clients must not erase the newly introduced workspace.
    if (!Object.prototype.hasOwnProperty.call(body.data, 'workspace')) next.workspace = data.workspace;
    if (!owner) { next.tracking = data.tracking; next.workspace.driveFolderUrl = data.workspace.driveFolderUrl; }
    const changes = diff(data, next); if (!changes.length) return response({ revision: project.revision });
    const revision = project.revision + 1, nonce = crypto.randomUUID(), now = new Date().toISOString();
    const result = await db.batch([db.prepare('UPDATE blueprint_projects SET name=?,data=?,revision=?,updated_at=?,last_mutation=? WHERE id=? AND revision=?').bind(String(next.sections.company.values.name || project.name).slice(0, 200), JSON.stringify(next), revision, now, nonce, id, project.revision), db.prepare('INSERT INTO blueprint_events (project_id,at,actor,changes) SELECT ?,?,?,? WHERE EXISTS (SELECT 1 FROM blueprint_projects WHERE id=? AND last_mutation=?)').bind(id, now, email, JSON.stringify(changes), id, nonce)]);
    if (!result[0].meta.changes) return response({ error: 'conflict' }, 409);
    return response({ revision, at: now, changes });
  } catch (error) {
    if (error instanceof Error && error.message === 'invalid') return response({ error: 'invalid_project' }, 400);
    console.error('Blueprint request failed'); return response({ error: 'unavailable' }, 503);
  }
}
export const GET = handler; export const POST = handler; export const PUT = handler; export const DELETE = handler;
