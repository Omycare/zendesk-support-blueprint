export const MAX_PROJECT_BYTES = 480_000;
export function requestError(code, status = 400) {
  return Object.assign(new Error(code), { code, status });
}
export function emailKey(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s/@]+@[^\s/@]+\.[^\s/@]+$/.test(email) || email.length > 254) throw requestError('invalid-email');
  return email;
}
export function projectData(value) {
  if (!value || value.schemaVersion !== 1 || !value.sections || !value.tracking || !value.workspace) throw requestError('invalid-project');
  const data = structuredClone(value);
  delete data.exportedAt;
  if (new TextEncoder().encode(JSON.stringify(data)).length > MAX_PROJECT_BYTES) throw requestError('project-too-large', 413);
  return data;
}
export function prepareClientData(incoming, current) {
  const data = projectData(incoming);
  data.tracking = structuredClone(current.tracking);
  data.workspace.driveFolderUrl = current.workspace.driveFolderUrl;
  return data;
}
export function courses(value) {
  if (!Array.isArray(value) || value.length > 20) throw requestError('invalid-catalog');
  const ids = new Set();
  return value.map(item => {
    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(item.id) || ids.has(item.id)) throw requestError('invalid-course-id');
    ids.add(item.id);
    let url; try { url = new URL(item.url); } catch { throw requestError('invalid-course-url'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 2048) throw requestError('invalid-course-url');
    const fr = String(item.fr || '').trim().slice(0, 200), en = String(item.en || '').trim().slice(0, 200);
    if (!fr || !en) throw requestError('invalid-course-title');
    return { id: item.id, fr, en, url: url.href, requiresCode: false };
  });
}
export function changesSince(before, after) {
  if (!before) return ['created'];
  const changed = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
  const result = [];
  for (const [id, section] of Object.entries(after.sections)) if (changed(before.sections[id], section)) result.push('document:' + id);
  if (changed(before.extensions, after.extensions)) result.push('document:extensions');
  if (changed(before.workspace, after.workspace)) result.push('workspace');
  for (const task of after.tracking.tasks || []) if (changed((before.tracking.tasks || []).find(t => t.id === task.id), task)) result.push('task:' + task.id + ':' + task.status);
  for (const meeting of after.tracking.meetings || []) if (changed((before.tracking.meetings || []).find(t => t.id === meeting.id), meeting)) result.push('meeting:' + meeting.id + ':' + (meeting.done ? 'done' : 'updated'));
  if (changed(before.tracking.trainingIds, after.tracking.trainingIds) || before.tracking.trainingIncluded !== after.tracking.trainingIncluded) result.push('training');
  return result.length ? result.slice(0, 60) : ['summary'];
}
export function threadKey(target) {
  const text = String(target || '');
  if (!text || text.length > 220 || /[\x00-\x1f]/.test(text)) throw requestError('invalid-thread');
  return encodeURIComponent(text);
}
