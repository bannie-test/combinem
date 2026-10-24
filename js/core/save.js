/*
 * Save system with a swappable storage adapter.
 * Default adapter: localStorage (wrapped in try/catch) with an in-memory fallback.
 * A cloud save only needs a new adapter with get/set/remove (see docs/GDD.md, "Mở rộng").
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const KEY = 'noa-farm-save-v2';

  const memory = {};
  const memoryAdapter = {
    id: 'memory',
    get(k) { return memory[k] != null ? memory[k] : null; },
    set(k, v) { memory[k] = v; },
    remove(k) { delete memory[k]; }
  };
  const localAdapter = {
    id: 'local',
    get(k) { try { return globalThis.localStorage.getItem(k); } catch (e) { return memoryAdapter.get(k); } },
    set(k, v) { try { globalThis.localStorage.setItem(k, v); } catch (e) { memoryAdapter.set(k, v); } },
    remove(k) { try { globalThis.localStorage.removeItem(k); } catch (e) { memoryAdapter.remove(k); } }
  };

  let timer = null;

  NOA.save = {
    adapter: (function () {
      try { return globalThis.localStorage ? localAdapter : memoryAdapter; } catch (e) { return memoryAdapter; }
    })(),
    /** Version -> function(state) upgrading a save from version-1 to version */
    migrations: {
      // 2: (s) => { s.newField = 0; return s; }
    },
    setAdapter(adapter) { this.adapter = adapter; },
    load() {
      const raw = this.adapter.get(KEY);
      if (!raw) return null;
      try {
        let s = JSON.parse(raw);
        const target = NOA.BALANCE.meta.saveVersion;
        while ((s.v || 1) < target) {
          const next = (s.v || 1) + 1;
          if (this.migrations[next]) s = this.migrations[next](s);
          s.v = next;
        }
        return s;
      } catch (e) {
        console.warn('[NOA save] could not parse save, starting fresh', e);
        return null;
      }
    },
    write() {
      if (!NOA.state) return;
      try { this.adapter.set(KEY, JSON.stringify(NOA.state)); } catch (e) { console.warn('[NOA save]', e); }
    },
    schedule() {
      clearTimeout(timer);
      timer = setTimeout(() => NOA.save.write(), 400);
    },
    clear() { this.adapter.remove(KEY); },
    exportString() { return JSON.stringify(NOA.state); }
  };
})();
