// Per-project workspaces. File bytes remain in the client's Google Drive folder.
export const bookingLinks = Object.freeze({
  meeting: 'https://cal.com/stephaniebuquet',
  'omycare-agents': 'https://cal.com/stephaniebuquet/agent-formation',
  'omycare-admins': 'https://cal.com/stephaniebuquet/admin-formation'
});

const text = (value, max) => String(value ?? '').slice(0, max);
const id = value => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);
export function safeDocumentURL(value) {
  try {
    const u = new URL(String(value));
    return u.protocol === 'https:' && !u.username && !u.password && u.href.length <= 2048 ? u.href : '';
  } catch { return ''; }
}

export function safeDriveFolderURL(value) {
  try {
    const u = new URL(String(value));
    if (u.protocol !== 'https:' || u.hostname !== 'drive.google.com' || u.port || u.username || u.password) return '';
    if (!/^\/drive\/(?:u\/\d+\/)?folders\/[a-zA-Z0-9_-]+\/?$/.test(u.pathname)) return '';
    // Preserve resource keys for folders that require them; discard tracking parameters.
    const key = u.searchParams.get('resourcekey');
    const clean = new URL('https://drive.google.com/drive/folders/' + u.pathname.split('/').filter(Boolean).at(-1));
    if (key && /^[a-zA-Z0-9_-]+$/.test(key)) clean.searchParams.set('resourcekey', key);
    return clean.href;
  } catch { return ''; }
}

export function normalizeWorkspace(raw) {
  const seen = new Set();
  const tabs = (Array.isArray(raw?.tabs) ? raw.tabs : []).filter(tab => {
    if (!tab || !id(tab.id) || seen.has(tab.id)) return false;
    seen.add(tab.id); return true;
  }).slice(0, 40).map(tab => ({
    id: tab.id,
    title: text(tab.title, 120),
    notes: text(tab.notes, 12000),
    archived: tab.archived === true,
    rows: (Array.isArray(tab.rows) ? tab.rows : []).slice(0, 100).map(row => ({
      item: text(row?.item, 300), detail: text(row?.detail, 2000),
      status: ['todo', 'in_progress', 'done'].includes(row?.status) ? row.status : 'todo'
    })),
    documents: (Array.isArray(tab.documents) ? tab.documents : []).slice(0, 100).map(doc => ({
      title: text(doc?.title, 200), url: safeDocumentURL(doc?.url)
    })).filter(doc => doc.title && doc.url)
  }));
  return { driveFolderUrl: safeDriveFolderURL(raw?.driveFolderUrl), tabs };
}
