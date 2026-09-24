const escape = text => String(text ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export function createConversations(backend) {
  let context = null, dialog = null, stop = null, restoreFocus = null, scope = 0;
  const tr = (fr, en) => context?.lang === 'en' ? en : fr;
  const titleOf = text => typeof text === 'object' ? text[context.lang] || text.en : String(text || '');
  function close() { scope++; stop?.(); stop = null; dialog?.close(); dialog?.remove(); dialog = null; restoreFocus?.focus?.(); }
  window.addEventListener('blueprint:access-lost', close);
  function modal(title, subtitle = '') {
    close(); restoreFocus = document.activeElement;
    dialog = document.createElement('dialog'); dialog.className = 'conversation-modal';
    dialog.innerHTML = `<div class="conversation-head"><div><h2>${escape(title)}</h2><p>${escape(subtitle)}</p></div><button class="conversation-close" aria-label="${tr('Fermer','Close')}">×</button></div><div class="conversation-content"></div>`;
    document.body.append(dialog); dialog.showModal();
    dialog.querySelector('.conversation-close').onclick = close;
    dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
    return dialog.querySelector('.conversation-content');
  }
  function fail(node, message) { if (node?.isConnected) node.textContent = message || tr('Impossible de charger ou enregistrer. Vérifiez votre accès et réessayez.','Could not load or save. Check your access and try again.'); }
  async function openThread(target, title, internal = false, projectId = context.projectId) {
    if (!projectId || !await context.flush()) return;
    const bucket = internal ? 'internalThreads' : 'threads';
    const panel = modal(title, internal ? tr('Note interne · OmyCare uniquement','Internal note · OmyCare only') : tr('Conversation partagée avec ce client','Conversation shared with this client'));
    const token = scope;
    panel.innerHTML = `${internal ? `<p class="internal-notice">${tr('Ces messages ne sont pas accessibles au client.','These messages are not accessible to the client.')}</p>` : ''}<div class="conversation-controls"><button id="thread-status" disabled>${tr('Chargement…','Loading…')}</button><button id="older-messages" hidden>${tr('Afficher les messages précédents','Show earlier messages')}</button>${context.canManage ? `<button id="switch-visibility">${internal ? tr('Conversation client','Client conversation') : tr('Notes internes','Internal notes')}</button>` : ''}</div><div id="thread-messages" aria-live="polite"></div><form class="conversation-compose"><label for="message-text">${tr('Votre message','Your message')}</label><textarea id="message-text" maxlength="6000" required></textarea><div class="actions"><button class="primary" type="submit">${tr('Envoyer','Send')}</button><small>${tr('Les messages gardent leur auteur et leur date.','Messages keep their author and date.')}</small></div></form><p class="error" id="conversation-error" role="status"></p>`;
    const error = panel.querySelector('#conversation-error'), list = panel.querySelector('#thread-messages');
    let cursor = null, messages = [], currentThread = null, paging = false, reloadPending = false, messageGeneration = 0;
    const draw = () => {
      list.innerHTML = messages.length ? messages.map(m => `<article class="conversation-message"><strong>${escape(m.authorEmail)}</strong><small> · ${escape(m.createdAt ? new Date(m.createdAt).toLocaleString(context.lang === 'en' ? 'en-GB' : 'fr-FR') : '')}</small><p>${escape(m.text)}</p></article>`).join('') : `<p class="conversation-empty">${tr('Commencez la conversation ici.','Start the conversation here.')}</p>`;
    };
    async function loadMessages(older = false) {
      if (scope !== token) return;
      if (paging) { reloadPending = true; return; }
      paging = true; const generation = ++messageGeneration;
      try {
        const page = await backend.messagePage(projectId, bucket, target, older ? cursor : null);
        if (scope !== token || generation !== messageGeneration) return;
        cursor = page.cursor; messages = older ? [...page.messages, ...messages] : page.messages;
        messages = [...new Map(messages.map(m => [m.id, m])).values()];
        panel.querySelector('#older-messages').hidden = !page.hasMore;
        draw();
        if (currentThread) await backend.markRead(projectId, bucket, target);
      } catch { fail(error); } finally { paging = false; if (reloadPending && scope === token) { reloadPending = false; loadMessages(); } }
    }
    panel.querySelector('#older-messages').onclick = () => loadMessages(true);
    panel.querySelector('#switch-visibility')?.addEventListener('click', () => {
      if (panel.querySelector('#message-text').value.trim() && !confirm(tr('Changer de conversation et effacer le brouillon ?','Switch conversation and discard the draft?'))) return;
      openThread(target, title, !internal, projectId);
    });
    panel.querySelector('#thread-status').onclick = async event => {
      if (!currentThread) return; event.target.disabled = true;
      try { await backend.setThreadStatus(projectId, bucket, target, currentThread.status === 'resolved' ? 'open' : 'resolved'); }
      catch { fail(error); event.target.disabled = false; }
    };
    panel.querySelector('form').onsubmit = async event => {
      event.preventDefault(); const input = panel.querySelector('#message-text'), value = input.value.trim();
      if (!value) return; const button = event.submitter; button.disabled = true; error.textContent = '';
      try { await backend.sendMessage(projectId, bucket, target, title, value); if (scope === token) { input.value = ''; await loadMessages(); } }
      catch { fail(error, tr('Message non envoyé. Votre texte est conservé pour réessayer.','Message not sent. Your text is kept so you can retry.')); }
      finally { if (button.isConnected) button.disabled = false; }
    };
    stop = backend.watchThread(projectId, bucket, target, async thread => {
      if (scope !== token) return;
      const changed = thread?.messageCount !== currentThread?.messageCount;
      currentThread = thread;
      const button = panel.querySelector('#thread-status'); button.disabled = !thread;
      button.textContent = thread?.status === 'resolved' ? tr('✓ Résolu · rouvrir','✓ Resolved · reopen') : tr('Marquer comme résolu','Mark as resolved');
      if (changed || !messages.length) await loadMessages();
    }, () => { if (scope === token) { fail(error); panel.querySelector('form').hidden = true; } });
    draw();
  }
  async function inbox(allProjects = false) {
    if (!context.projectId && !allProjects || !await context.flush()) return;
    const panel = modal(allProjects ? tr('Tous vos clients','All your clients') : tr('Conversations du projet','Project conversations'), tr('Les 100 conversations les plus récentes de chaque espace.','The 100 most recent conversations in each workspace.'));
    const token = scope;
    panel.innerHTML = `<div class="conversation-controls"><button id="refresh-inbox">${tr('Actualiser','Refresh')}</button>${!allProjects ? `<button id="general-conversation">${tr('Question générale','General question')}</button>` : ''}</div><p id="inbox-error" role="status"></p><div class="conversation-list"></div>`;
    panel.querySelector('#refresh-inbox').onclick = () => inbox(allProjects);
    panel.querySelector('#general-conversation')?.addEventListener('click', () => openThread('project', tr('Questions sur le projet','Project questions')));
    try {
      const projects = allProjects ? await backend.overview() : [{ id: context.projectId, name: context.projectName }];
      const groups = await Promise.all(projects.map(async project => {
        const [shared, internal, seen] = await Promise.all([backend.listThreads(project.id), context.canManage ? backend.listThreads(project.id, 'internalThreads') : [], backend.readReceipts(project.id)]);
        return { project, threads: [...shared, ...internal].map(thread => ({ ...thread, unread: thread.updatedAt > (seen[thread.bucket + '_' + thread.id] || '') })).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) };
      }));
      if (scope !== token) return;
      const list = panel.querySelector('.conversation-list'); list.replaceChildren();
      for (const { project, threads } of groups) {
        if (allProjects) {
          const row = document.createElement('div'); row.className = 'project-overview card';
          row.innerHTML = `<div><strong>${escape(project.name)}</strong><small>${project.reviewed} ${tr('étapes relues','stages reviewed')} · ${project.tasksDone} ${tr('tâches terminées','tasks done')} · ${project.meetingsDone}/8 ${tr('réunions','meetings')}</small></div><button>${tr('Ouvrir le projet','Open project')}</button>`;
          row.querySelector('button').onclick = async () => { close(); await context.openProject(project.id); };
          list.append(row);
        }
        for (const thread of threads) {
          const button = document.createElement('button'); button.className = 'conversation-item' + (thread.unread ? ' unread' : '');
          button.innerHTML = `${thread.unread ? '● ' : ''}${escape(thread.title)}<span>${thread.bucket === 'internalThreads' ? tr('Interne · ','Internal · ') : ''}${thread.status === 'resolved' ? tr('Résolu','Resolved') : tr('Ouvert','Open')} · ${thread.messageCount} ${tr('messages','messages')}</span>`;
          button.onclick = () => openThread(thread.target, (allProjects ? project.name + ' · ' : '') + thread.title, thread.bucket === 'internalThreads', project.id);
          list.append(button);
        }
        if (!threads.length) { const empty = document.createElement('p'); empty.className = 'muted'; empty.textContent = tr('Aucune conversation pour le moment.','No conversations yet.'); list.append(empty); }
      }
    } catch { if (scope === token) fail(panel.querySelector('#inbox-error')); }
  }
  function addButton(anchor, getTarget, label) {
    if (!anchor) return;
    const button = document.createElement('button'); button.type = 'button'; button.className = 'comment-button';
    button.textContent = '💬'; button.setAttribute('aria-label', tr('Commenter : ','Comment on: ') + label); button.title = button.getAttribute('aria-label');
    button.onclick = async () => { const target = getTarget(); await openThread(target, label); };
    anchor.insertAdjacentElement('afterend', button);
  }
  async function exportProject(button) {
    button.disabled = true;
    try {
      if (!await context.flush()) return;
      const conversations = await backend.exportConversations(context.projectId, context.canManage);
      const content = { format: 'omycare-project-backup', version: 1, exportedAt: new Date().toISOString(),
        projectId: context.projectId, data: context.snapshot(), includesInternal: context.canManage, conversations };
      const url = URL.createObjectURL(new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = 'omycare-project-with-conversations.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch { alert(tr('Export impossible. Réessayez sans fermer le projet.','Export failed. Please retry without closing the project.')); }
    finally { if (button.isConnected) button.disabled = false; }
  }
  function mount(next) {
    if (context?.projectId && context.projectId !== next.projectId) close();
    context = next;
    if (!context.projectId) return;
    const toolbar = document.createElement('div'); toolbar.className = 'conversation-tools';
    toolbar.innerHTML = `<button id="project-conversations">💬 ${tr('Conversations','Conversations')}</button>${context.canManage ? `<button id="all-clients">${tr('Tous les clients','All clients')}</button>` : ''}<button id="full-project-export">↓ ${tr('Dossier et conversations','Brief and conversations')}</button>`;
    document.querySelector('.workspace .pageheading')?.insertAdjacentElement('afterend', toolbar);
    toolbar.querySelector('#project-conversations').onclick = () => inbox();
    toolbar.querySelector('#all-clients')?.addEventListener('click', () => inbox(true));
    toolbar.querySelector('#full-project-export').onclick = e => exportProject(e.target);
    if (context.page === 'questionnaire') {
      const section = context.section;
      addButton(document.querySelector('.pageheading h1'), () => 'section:' + section.id, titleOf(section.title));
      document.querySelectorAll('[data-field]').forEach(input => {
        const field = section.fields.find(f => f.key === input.dataset.field);
        addButton(input, () => 'section:' + section.id + ':field:' + field.key, titleOf(field.label));
      });
      document.querySelectorAll('[data-row]').forEach(input => {
        const index = Number(input.dataset.row), col = section.cols[Number(input.dataset.col)];
        addButton(input, () => 'row:' + section.id + ':' + context.rowId('section', section.id, index) + ':' + col.key, titleOf(section.title) + ' · ' + titleOf(col.label) + ' · ' + (index + 1));
      });
      document.querySelectorAll('[data-ext]').forEach(input => {
        const ext = context.extensions.find(e => e.id === input.dataset.ext), index = Number(input.dataset.extRow), col = ext.cols[Number(input.dataset.extCol)];
        addButton(input, () => 'extension:' + ext.id + ':' + context.rowId('extension', ext.id, index) + ':' + col.key, titleOf(ext.title) + ' · ' + titleOf(col.label) + ' · ' + (index + 1));
      });
    }
    document.querySelectorAll('.task').forEach(task => {
      const id = task.querySelector('.tasktitle small')?.textContent;
      addButton(task.querySelector('.taskbody'), () => 'task:' + id, id + ' · ' + task.querySelector('.tasktitle')?.firstChild?.textContent);
    });
    document.querySelectorAll('.meeting').forEach(meeting => {
      const id = meeting.querySelector('[data-meeting]')?.dataset.meeting;
      addButton(meeting.querySelector('.cardhead'), () => 'meeting:' + id, tr('Réunion ','Meeting ') + id);
    });
    if (context.page === 'documents' && context.worktab) {
      addButton(document.querySelector('#worktab-notes'), () => 'workspace:' + context.worktab, tr('Atelier : ','Workspace: ') + document.querySelector('#worktab-title')?.value);
      document.querySelectorAll('[data-workrow]').forEach(input => {
        const index = Number(input.dataset.workrow), col = input.dataset.workcol;
        addButton(input, () => 'workrow:' + context.worktab + ':' + context.rowId('workspace', context.worktab, index) + ':' + col, tr('Table de travail','Working table') + ' · ' + (index + 1) + ' · ' + col);
      });
    }
  }
  return { mount, close };
}
