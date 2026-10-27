/* Local-only storage helpers for versioned SEW simulation runs. */
(function (root, factory) {
  const archive = factory();
  if (typeof module === 'object' && module.exports) module.exports = archive;
  if (root) root.SEWRunArchive = archive;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'sew-run', VERSION = 1, STORAGE_KEY = 'sew.runArchive.v1';
  function canonical(value) {
    if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
    if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
    return JSON.stringify(value);
  }
  function checksum(value) {
    const text = canonical(value); let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) { hash ^= text.charCodeAt(i); hash = Math.imul(hash, 0x01000193); }
    return (hash >>> 0).toString(16).padStart(8, '0');
  }
  function validateRun(run) {
    if (!run || typeof run !== 'object' || Array.isArray(run)) throw new TypeError('Run must be a JSON object.');
    if (run.model !== 'CIP equation demonstration v1') throw new TypeError('Unsupported SEW run model.');
    if (!Number.isInteger(run.seed) || run.seed < 1 || run.seed > 0xffffffff) throw new TypeError('Run seed is invalid.');
    if (!run.assumptions || !run.candidate || !run.calibration) throw new TypeError('Run is missing required simulation fields.');
    return run;
  }
  function envelope(run, createdAt) {
    validateRun(run);
    const record = { format: FORMAT, version: VERSION, createdAt: createdAt || new Date().toISOString(), run };
    return Object.assign(record, { checksum: checksum(record) });
  }
  function parse(text) {
    let record;
    try { record = JSON.parse(text); } catch (_) { throw new TypeError('Archive is not valid JSON.'); }
    if (!record || record.format !== FORMAT || record.version !== VERSION) throw new TypeError('Unsupported archive format or version.');
    if (typeof record.createdAt !== 'string' || Number.isNaN(Date.parse(record.createdAt))) throw new TypeError('Archive timestamp is invalid.');
    if (typeof record.checksum !== 'string') throw new TypeError('Archive checksum is missing.');
    const { checksum: supplied, ...body } = record;
    if (checksum(body) !== supplied) throw new TypeError('Archive integrity check failed.');
    validateRun(record.run); return record;
  }
  function createStore(storage) {
    if (!storage || typeof storage.getItem !== 'function' || typeof storage.setItem !== 'function') throw new TypeError('A browser storage object is required.');
    function readAll() {
      const raw = storage.getItem(STORAGE_KEY); if (!raw) return [];
      let rows; try { rows = JSON.parse(raw); } catch (_) { throw new TypeError('Saved local archive is unreadable.'); }
      if (!Array.isArray(rows)) throw new TypeError('Saved local archive has an invalid structure.');
      return rows.map(row => parse(JSON.stringify(row)));
    }
    return {
      list: readAll,
      save(run) { const row = envelope(run), rows = readAll(); rows.unshift(row); storage.setItem(STORAGE_KEY, JSON.stringify(rows)); return row; },
      remove(createdAt) { const rows = readAll(), index = rows.findIndex(row => row.createdAt === createdAt); if (index < 0) return false; rows.splice(index, 1); storage.setItem(STORAGE_KEY, JSON.stringify(rows)); return true; },
      import(text) { const row = parse(text), rows = readAll(); if (!rows.some(existing => existing.checksum === row.checksum)) { rows.unshift(row); storage.setItem(STORAGE_KEY, JSON.stringify(rows)); } return row; },
      export(row) { return JSON.stringify(parse(JSON.stringify(row)), null, 2); }
    };
  }
  return { FORMAT, VERSION, STORAGE_KEY, checksum, envelope, parse, validateRun, createStore };
});
