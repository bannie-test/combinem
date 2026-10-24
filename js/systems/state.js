/*
 * Game state shape, resources (coins / gems / energy / research points) and XP / levels.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const S = () => NOA.state;

  NOA.newState = function (lang) {
    const b = B();
    const now = NOA.time ? Date.now() : 0;
    const cells = b.board.cols * b.board.rows;
    const state = {
      v: b.meta.saveVersion,
      createdAt: now,
      lang: lang || 'vi',
      farmName: '',
      res: { coins: 500, gems: 30, energy: b.energy.start, rp: 0, energyAt: now },
      xp: 0,
      level: 1,
      tickets: { sprout: 0, star: 0 },
      boosters: { clover: 1, stabilizer: 0, stardust: 0, tonic: 1, loupe: 0 },
      board: new Array(cells).fill(null),
      storage: [],
      storageCap: b.board.storageStart,
      plots: [],
      pens: [],
      orders: [],
      orderRefillAt: 0,
      orderSwapAt: 0,
      labs: { greenhouse: { level: 1, slots: [] }, ranch: { level: 1, slots: [] } },
      mascots: { owned: {}, temp: {}, shrine: new Array(b.mascots.shrineSlots).fill(null) },
      discovered: { species: {}, genes: {}, hybrids: {}, products: {}, mascots: {}, maxLevel: {} },
      essence: {},
      secrets: {},
      flags: {},
      login: { lastDay: null, claimed: 0 },
      gacha: {},
      market: { day: null, sold: {} },
      earth: 0,
      tutorial: { step: 0, counts: {}, done: false },
      settings: { sfx: true, music: true, haptics: true },
      dev: { offsetMs: 0, timeScale: null, force: {}, payProvider: null, features: {} },
      ledger: [],
      purchases: { owned: {}, monthlyUntil: 0, monthlyLastDay: null },
      stats: { merges: 0, harvests: 0, orders: 0, genesAwakened: 0, opens: 0, maxCombo: 0 },
      seen: { intro: false }
    };
    for (let i = 0; i < b.farm.plotsStart; i++) state.plots.push({ seed: null, start: 0, end: 0, out: [] });
    for (let i = 0; i < b.farm.pensStart; i++) state.pens.push({ animal: null, feed: 0, start: 0, end: 0, out: [] });
    for (const id in b.gacha.boxes) state.gacha[id] = { opened: 0, since: {} };
    return state;
  };

  /** Place the two generators and starter items (called once for a new game). */
  NOA.seedNewGame = function () {
    const b = B();
    const cols = b.board.cols, rows = b.board.rows;
    const s = S();
    s.board[(rows - 1) * cols] = NOA.items.newGenerator('seedSack');
    s.board[(rows - 1) * cols + cols - 1] = NOA.items.newGenerator('incubator');
    for (const id in NOA.CONTENT.species) {
      const sp = NOA.CONTENT.species[id];
      if (!sp.hybrid && b.species[id].unlockLevel <= 1) s.discovered.species[id] = true;
    }
  };

  /* ------------------------------------------------------------ resources */
  NOA.res = {
    get(k) { return S().res[k] || 0; },
    energyMax() { return Math.round(NOA.mods.value('energy.max', B().energy.max, {})); },
    add(k, n) {
      if (!n) return;
      const r = S().res;
      if (k === 'energy') {
        const max = NOA.res.energyMax();
        if (r.energy >= max && n > 0) r.energyAt = NOA.time.now();
      }
      r[k] = Math.max(0, (r[k] || 0) + n);
      NOA.events.emit('res.changed', { k, n });
      NOA.save.schedule();
    },
    canAfford(cost) {
      if (!cost) return true;
      for (const k in cost) {
        if (k === 'tickets') {
          for (const t in cost.tickets) if ((S().tickets[t] || 0) < cost.tickets[t]) return false;
        } else if ((S().res[k] || 0) < cost[k]) return false;
      }
      return true;
    },
    spend(cost) {
      if (!NOA.res.canAfford(cost)) return false;
      for (const k in cost) {
        if (k === 'tickets') {
          for (const t in cost.tickets) S().tickets[t] -= cost.tickets[t];
          NOA.events.emit('res.changed', { k: 'tickets' });
        } else {
          if (k === 'energy' && S().res.energy >= NOA.res.energyMax()) S().res.energyAt = NOA.time.now();
          S().res[k] -= cost[k];
          NOA.events.emit('res.changed', { k, n: -cost[k] });
        }
      }
      NOA.save.schedule();
      return true;
    },
    /** Regenerate energy from elapsed time (works offline too). */
    tickEnergy() {
      const r = S().res;
      const max = NOA.res.energyMax();
      const now = NOA.time.now();
      if (r.energy >= max) { r.energyAt = now; return; }
      const regenMs = NOA.time.dur(B().energy.regenSeconds) / NOA.mods.value('energy.regenMult', 1, {});
      const elapsed = now - (r.energyAt || now);
      if (elapsed >= regenMs) {
        const gained = Math.floor(elapsed / regenMs);
        r.energy = Math.min(max, r.energy + gained);
        r.energyAt = r.energy >= max ? now : r.energyAt + gained * regenMs;
        NOA.events.emit('res.changed', { k: 'energy', n: gained });
      }
    },
    energyNextMs() {
      const r = S().res;
      if (r.energy >= NOA.res.energyMax()) return 0;
      const regenMs = NOA.time.dur(B().energy.regenSeconds) / NOA.mods.value('energy.regenMult', 1, {});
      return Math.max(0, regenMs - (NOA.time.now() - r.energyAt));
    }
  };

  /* ------------------------------------------------------------ XP & level */
  NOA.progress = {
    xpToNext(level) {
      const t = B().level.xpToNext;
      if (level < t.length) return t[level];
      return t[t.length - 1] + (level - t.length + 1) * B().level.xpGrowthAfterTable;
    },
    addXP(n) {
      if (!n || n <= 0) return;
      const s = S();
      s.xp += Math.round(n);
      while (s.level < B().level.maxLevel && s.xp >= NOA.progress.xpToNext(s.level)) {
        s.xp -= NOA.progress.xpToNext(s.level);
        s.level += 1;
        const reward = NOA.rewards.levelReward(s.level);
        const granted = NOA.rewards.grant(reward, 'level');
        const unlocks = NOA.progress.unlocksAt(s.level);
        unlocks.species.forEach((id) => { s.discovered.species[id] = true; });
        NOA.events.emit('level.up', { level: s.level, granted, unlocks });
      }
      NOA.events.emit('xp.changed', { n });
      NOA.save.schedule();
    },
    unlocksAt(level) {
      const out = { species: [], features: [], plots: 0, pens: 0 };
      const b = B();
      for (const id in NOA.CONTENT.species) {
        const eco = b.species[id];
        if (!NOA.CONTENT.species[id].hybrid && eco.unlockLevel === level) out.species.push(id);
      }
      for (const f in b.unlocks) if (b.unlocks[f] === level) out.features.push(f);
      out.plots = b.farm.plotLevelReq.filter((l, i) => l === level && i >= b.farm.plotsStart).length;
      out.pens = b.farm.penLevelReq.filter((l, i) => l === level && i >= b.farm.pensStart).length;
      return out;
    },
    isUnlocked(feature) {
      const lv = B().unlocks[feature];
      return lv == null || S().level >= lv;
    }
  };
})();
