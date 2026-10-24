/*
 * Core: namespace, utilities, seeded RNG, event bus, hooks (extension points)
 * and the modifier registry every rate lookup goes through.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';

  /* ------------------------------------------------------------ utilities */
  const U = NOA.util = {
    clamp(v, a, b) { return Math.max(a, Math.min(b, v)); },
    lerp(a, b, t) { return a + (b - a) * t; },
    sum(arr) { let s = 0; for (const v of arr) s += v; return s; },
    randInt(min, max) { return min + Math.floor(NOA.rng.random() * (max - min + 1)); },
    randFloat(min, max) { return min + NOA.rng.random() * (max - min); },
    chance(p) { return NOA.rng.random() < p; },
    pick(arr) { return arr[Math.floor(NOA.rng.random() * arr.length)]; },
    /** weights: { key: weight } -> key (null if every weight is 0) */
    pickWeighted(weights) {
      let total = 0;
      for (const k in weights) total += Math.max(0, weights[k] || 0);
      if (total <= 0) return null;
      let r = NOA.rng.random() * total;
      for (const k in weights) {
        const w = Math.max(0, weights[k] || 0);
        if (r < w) return k;
        r -= w;
      }
      return Object.keys(weights).pop();
    },
    shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(NOA.rng.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    },
    uid(prefix) {
      U._uid = (U._uid || 0) + 1;
      return (prefix || 'i') + Date.now().toString(36) + U._uid.toString(36) + Math.floor(Math.random() * 1296).toString(36);
    },
    clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); },
    isObj(o) { return o && typeof o === 'object' && !Array.isArray(o); },
    deepMerge(target, src) {
      for (const k in src) {
        if (U.isObj(src[k]) && U.isObj(target[k])) U.deepMerge(target[k], src[k]);
        else target[k] = U.clone(src[k]);
      }
      return target;
    },
    pad2(n) { return String(n).padStart(2, '0'); },
    /** ms -> "0:42", "12:05", "1:02:03" */
    fmtDuration(ms) {
      const s = Math.max(0, Math.ceil(ms / 1000));
      const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
      return h > 0 ? h + ':' + U.pad2(m) + ':' + U.pad2(sec) : m + ':' + U.pad2(sec);
    },
    pct(p, digits) {
      const v = p * 100;
      const d = digits != null ? digits : (v < 1 && v > 0 ? 2 : v < 10 ? 1 : 0);
      return (Math.round(v * Math.pow(10, d)) / Math.pow(10, d)).toLocaleString(NOA.i18n ? NOA.i18n.locale() : 'vi-VN') + '%';
    }
  };

  /* ------------------------------------------------------------ seeded RNG (mulberry32) */
  NOA.rng = {
    _s: (Date.now() ^ 0x9e3779b9) >>> 0,
    seed(s) { this._s = (s >>> 0) || 1; },
    random() {
      let t = (this._s += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    /** Deterministic value in [0,1) for a key (weather slots etc.) */
    hash(n) {
      let t = (n >>> 0) + 0x6d2b79f5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
  };

  /* ------------------------------------------------------------ event bus */
  const listeners = {};
  NOA.events = {
    on(name, fn) {
      (listeners[name] = listeners[name] || []).push(fn);
      return () => { listeners[name] = (listeners[name] || []).filter((f) => f !== fn); };
    },
    emit(name, payload) {
      for (const fn of (listeners[name] || []).slice()) {
        try { fn(payload); } catch (e) { console.error('[NOA event ' + name + ']', e); }
      }
      for (const fn of (listeners['*'] || []).slice()) {
        try { fn(name, payload); } catch (e) { console.error(e); }
      }
    }
  };

  /* ------------------------------------------------------------ hooks (filters for extensions) */
  const hooks = {};
  NOA.hooks = {
    /** Register a filter: fn(value, ...args) -> new value */
    add(name, fn, priority) {
      (hooks[name] = hooks[name] || []).push({ fn, p: priority || 10 });
      hooks[name].sort((a, b) => a.p - b.p);
    },
    run(name, value, ...args) {
      for (const h of hooks[name] || []) {
        try {
          const out = h.fn(value, ...args);
          if (out !== undefined) value = out;
        } catch (e) { console.error('[NOA hook ' + name + ']', e); }
      }
      return value;
    }
  };

  /* ------------------------------------------------------------ modifiers
   * Every tunable rate is read through NOA.mods so labs, mascots, boosters,
   * world events and future features can stack bonuses without touching the
   * systems.  A provider returns [{ key, add?, mult?, src, params? }].
   * A modifier with key "gene.keep" also applies to "gene.keep.sameGene".
   */
  const providers = [];
  NOA.mods = {
    register(id, fn) {
      const i = providers.findIndex((p) => p.id === id);
      if (i >= 0) providers.splice(i, 1);
      providers.push({ id, fn });
    },
    collect(key, ctx) {
      const out = [];
      for (const p of providers) {
        let list;
        try { list = p.fn(ctx || {}) || []; } catch (e) { console.error('[NOA mods ' + p.id + ']', e); list = []; }
        for (const m of list) {
          if (m.key === key || key.startsWith(m.key + '.')) out.push(m);
        }
      }
      return out;
    },
    value(key, base, ctx) {
      let add = 0, mult = 1;
      for (const m of NOA.mods.collect(key, ctx)) {
        if (m.add) add += m.add;
        if (m.mult != null) mult *= m.mult;
      }
      return (base + add) * mult;
    },
    chance(key, base, ctx) {
      return U.clamp(NOA.mods.value(key, base, ctx), 0, NOA.BALANCE.merge.maxChance);
    },
    breakdown(key, base, ctx) {
      return { base, entries: NOA.mods.collect(key, ctx), total: NOA.mods.value(key, base, ctx) };
    }
  };
})();
