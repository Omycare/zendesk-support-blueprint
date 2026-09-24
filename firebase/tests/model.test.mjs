import test from 'node:test';
import assert from 'node:assert/strict';
import { emailKey, projectData, prepareClientData, courses, changesSince, threadKey } from '../src/model.js';
const fixture = () => ({ schemaVersion: 1, lang: 'fr', step: 0, sections: { company: { values: { name: 'Example' }, rows: [] } },
  extensions: {}, workspace: { driveFolderUrl: 'https://drive.google.com/drive/folders/example', tabs: [] },
  tracking: { trainingIncluded: false, trainingIds: [], meetings: [], tasks: [], summary: '' } });
test('Client imports retain consultant-owned scope and folder', () => {
  const saved = fixture(), incoming = fixture(); incoming.tracking.trainingIncluded = true;
  incoming.workspace.driveFolderUrl = 'https://drive.google.com/drive/folders/wrong';
  incoming.sections.company.values.name = 'Edited';
  const result = prepareClientData(incoming, saved);
  assert.deepEqual(result.tracking, saved.tracking);
  assert.equal(result.workspace.driveFolderUrl, saved.workspace.driveFolderUrl);
  assert.equal(result.sections.company.values.name, 'Edited');
});
test('Reject malformed data, oversized dossiers, unsafe training links and duplicate IDs', () => {
  assert.throws(() => projectData({ schemaVersion: 2 }));
  const tooBig = fixture(); tooBig.sections.company.values.large = 'é'.repeat(250000);
  assert.throws(() => projectData(tooBig), e => e.status === 413);
  assert.throws(() => courses([{ id: 'one', fr: 'FR', en: 'EN', url: 'javascript:alert(1)' }]));
  assert.throws(() => courses([{ id: 'one', fr: 'FR', en: 'EN', url: 'https://user:password@example.test/' }]));
  assert.throws(() => courses(Array(2).fill({ id: 'one', fr: 'FR', en: 'EN', url: 'https://example.test/' })));
});
test('Stable conversation keys and normalized membership addresses', () => {
  assert.equal(emailKey(' CLIENT@Example.test '), 'client@example.test');
  assert.throws(() => emailKey('not-an-address'));
  assert.equal(threadKey('row:fields:uuid-1:fr'), 'row%3Afields%3Auuid-1%3Afr');
  const a = fixture(), b = fixture(); b.workspace.tabs.push({ id: 'new' });
  assert.ok(changesSince(a, b).includes('workspace'));
});
