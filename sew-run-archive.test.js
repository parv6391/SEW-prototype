const test = require('node:test');
const assert = require('node:assert/strict');
const archive = require('./sew-run-archive.js');
function run() { return { model: 'CIP equation demonstration v1', seed: 123, assumptions: {}, candidate: {}, calibration: {} }; }
function storage() { const data = new Map(); return { getItem: k => data.get(k) || null, setItem: (k,v) => data.set(k,v) }; }
test('versioned run export imports and verifies', () => {
  const store = archive.createStore(storage()), saved = store.save(run());
  const restored = archive.parse(store.export(saved));
  assert.equal(restored.format, 'sew-run'); assert.equal(restored.version, 1); assert.deepEqual(restored.run, run());
});
test('corruption and unsupported format fail closed', () => {
  const row = archive.envelope(run(), '2026-10-27T00:00:00.000Z');
  assert.throws(() => archive.parse(JSON.stringify({ ...row, run: { ...row.run, seed: 9 } })), /integrity check failed/);
  assert.throws(() => archive.parse('{'), /valid JSON/);
  assert.throws(() => archive.parse(JSON.stringify({ ...row, version: 2 })), /Unsupported archive/);
});
test('import is idempotent and deletion is explicit', () => {
  const store = archive.createStore(storage()), row = archive.envelope(run(), '2026-10-27T00:00:00.000Z');
  store.import(JSON.stringify(row)); store.import(JSON.stringify(row)); assert.equal(store.list().length, 1);
  assert.equal(store.remove(row.createdAt), true); assert.equal(store.list().length, 0);
});
test('invalid run is never saved', () => {
  const store = archive.createStore(storage()); assert.throws(() => store.save({ model: 'other', seed: 1 }));
  assert.equal(store.list().length, 0);
});
