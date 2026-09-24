import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { webcrypto } from 'node:crypto';
import { JSDOM } from 'jsdom';
import { sections, words, sources } from '../../frontend/content.js';
import { workbook } from '../../frontend/xlsx.js';
import { taskDefinitions, taskStates, freshTracking, normalizeTracking, metrics, safeTrainingURL } from '../../frontend/tracking-data.js';
import { bookingLinks, normalizeWorkspace, safeDriveFolderURL, safeDocumentURL } from '../dist/workspace-data.js';
import { extensionDefinitions, sourceMapping, normalizeExtensions } from '../dist/extensions.js';
import { createConversations } from '../src/conversations.js';
let dom, ctx, conversations, watched, sent;
const run = text => vm.runInContext(text, ctx);
const tick = () => new Promise(resolve => setImmediate(resolve));
beforeEach(() => {
  dom = new JSDOM('<div id="account-bar"></div><div id="app"></div>', { url: 'https://omycare-portal.web.app/' });
  globalThis.window = dom.window; globalThis.document = dom.window.document;
  dom.window.HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  dom.window.HTMLDialogElement.prototype.close = function () { this.open = false; };
  watched = []; sent = [];
  conversations = createConversations({
    watchThread(pid, bucket, target, next) { watched.push({ pid, bucket, target }); next({ messageCount: 1, status: 'open' }); return () => {}; },
    messagePage: async () => ({ messages: [{ id: 'one', authorEmail: 'a@example.test', text: '<img src=x onerror=alert(1)>', createdAt: '2026-09-24T10:00:00Z' }], cursor: null, hasMore: false }),
    markRead: async () => {}, sendMessage: async (...args) => { sent.push(args); },
    listThreads: async () => [], readReceipts: async () => ({}), exportConversations: async () => []
  });
  dom.window.BLUEPRINT_SHARED = true; dom.window.BLUEPRINT_FIREBASE = true;
  dom.window.BLUEPRINT_ON_RENDER = context => conversations.mount(context);
  dom.window.BLUEPRINT_API = async () => ({ revision: 2, changes: [] });
  ctx = vm.createContext({ window: dom.window, document: dom.window.document, localStorage: dom.window.localStorage,
    sections, words, sources, workbook, taskDefinitions, taskStates, freshTracking, normalizeTracking, metrics, safeTrainingURL,
    bookingLinks, normalizeWorkspace, safeDriveFolderURL, safeDocumentURL, extensionDefinitions, sourceMapping, normalizeExtensions,
    defaultCourses: [], console, structuredClone, TextEncoder, Blob, URL, crypto: webcrypto,
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0 });
  let code = fs.readFileSync('dist/app.js', 'utf8').replace(/^import .*;$/gm, '');
  code = code.replace(/^if\(shared\)\{\$\('#app'\)[^\n]+$/m, '// Automatic network bootstrap disabled in this DOM-only fixture.');
  vm.runInContext(code, ctx);
  run("state=fresh();cloud.id='a';cloud.ready=true;cloud.role='client';cloud.projects=[{id:'a',name:'Company A'}];pageView='questionnaire'");
});
afterEach(() => { conversations.close(); dom.window.close(); delete globalThis.window; delete globalThis.document; });
test('All questionnaire sections render in both languages with conversations', () => {
  for (const lang of ['fr', 'en']) for (let index = 0; index < sections.length; index++) {
    run(`state.lang='${lang}';state.step=${index};render()`);
    assert.equal(document.querySelector('h1').textContent, sections[index].title[lang]);
    assert.ok(document.querySelector('#project-conversations'));
    assert.equal(document.querySelector('#all-clients'), null);
  }
});
test('Row comment identifiers survive edits, row movement and JSON normalization', async () => {
  run("state.step=4;action('sample');render()");
  document.querySelector('[data-row="1"][data-col="0"]').nextElementSibling.click();
  await tick(); await tick();
  const original = watched.at(-1).target;
  assert.ok(original.startsWith('row:fields:'));
  conversations.close();
  run("state=validate(JSON.parse(JSON.stringify(state)));state.sections.fields.rows.splice(0,1);cloud.dirty=false;render()");
  document.querySelector('[data-row="0"][data-col="0"]').nextElementSibling.click();
  await tick(); await tick();
  assert.equal(watched.at(-1).target, original);
});
test('Conversation text is escaped and client UI cannot switch to internal notes', async () => {
  run('state.step=0;render()');
  document.querySelector('[data-field="name"]').nextElementSibling.click();
  await tick(); await tick();
  assert.equal(document.querySelector('.conversation-modal img'), null);
  assert.ok(document.querySelector('.conversation-message').textContent.includes('<img src=x'));
  assert.equal(document.querySelector('#switch-visibility'), null);
  document.querySelector('#message-text').value = 'A real reply';
  const form = document.querySelector('.conversation-compose');
  form.dispatchEvent(new dom.window.SubmitEvent('submit', { bubbles: true, cancelable: true, submitter: form.querySelector('button') }));
  await tick(); await tick();
  assert.equal(sent.length, 1); assert.equal(sent[0][1], 'threads'); assert.equal(sent[0][4], 'A real reply');
});
test('Administrator controls, eight meeting threads and named Zendesk access', () => {
  run("cloud.role='consultant';pageView='meetings';render()");
  assert.ok(document.querySelector('#all-clients'));
  assert.equal(document.querySelectorAll('.meeting .comment-button').length, 8);
  run("pageView='questionnaire';state.step=0;render()");
  assert.ok(document.querySelector('.accessbox').textContent.includes('stephanie@omycare.fr'));
  assert.equal(document.querySelector('[data-access="send"]'), null);
});
test('The published package omits the public training URLs and a periodic database polling loop', () => {
  const combined = ['app.js', 'course-catalog.js', 'firebase-entry.js'].map(name => fs.readFileSync('dist/' + name, 'utf8')).join('\n');
  assert.ok(!combined.includes('https://omycare.github.io/zendesk-agent-training/'));
  assert.ok(!combined.includes('https://omycare.github.io/zendesk-admin-training/'));
  assert.ok(!combined.includes("if(shared&&typeof window!=='undefined')setInterval"));
});
