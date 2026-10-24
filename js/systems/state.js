/*
 * Game state shape (v2: farm map with zones), resources (coins / gems / research points) and XP / levels.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;

  const plot = (bed) => ({ bed, seed: null, start: 0, end: 0, fert: false });

  NOA.newState = function (lang) {
    const b = B();
    const now = Date.now();
    const state = {
      v: b.meta.saveVersion,
      createdAt: now,
      lang: lang || 'vi',
      farmName: '',
      res: { coins: 400, gems: 30, rp: 0 },
      xp: 0,
      level: 1,
      tickets: { sprout: 0, star: 0 },
      boosters: { clover: 1, stabilizer: 0, stardust: 0, tonic: 2, loupe: 0 },
      barn: { items: {}, upgrades: 0 },
      vault: { cells: new Array(b.storage.vaultStart).fill(null), pending: [] },
      nursery: { cells: new Array(b.storage.nurseryStart).fill(null) },
      fields: { crop: [], flower: [] },
      pens: {},
      factories: {},
      orders: [],
      orderRefillAt: 0,
      orderSwapAt: 0,
      ship: { state: 'away', until: 0, crates: [], trips: 0 },
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
      stats: { merges: 0, breedMerges: 0, harvests: 0, orders: 0, genesAwakened: 0, opens: 0, maxCombo: 0, crafted: 0, ships: 0 },
      seen: { intro: false },
      camera: null
    };
    for (const bed of ['crop', 'flower']) {
      for (let i = 0; i < b.fields[bed].start; i++) state.fields[bed].push(plot(bed));
    }
    for (const id in b.livestock.pens) state.pens[id] = { slots: new Array(b.livestock.pens[id].slotsStart).fill(null) };
    for (const id in b.production.buildings) state.factories[id] = { slots: b.production.buildings[id].slotsStart, queue: [] };
    for (const id in b.gacha.boxes) state.gacha[id] = { opened: 0, since: {} };
    return state;
  };
  NOA.newPlot = plot;

  /** Starter kit for a brand-new farm */
  NOA.seedNewGame = function () {
    const s = S();
    const put = (grid, item) => { const i = s[grid].cells.indexOf(null); if (i >= 0) s[grid].cells[i] = item; };
    ['rice', 'rice', 'rice', 'tomato', 'tomato'].forEach((sp) => put('vault', NOA.items.newBreed(sp, 1)));
    put('nursery', NOA.items.newBreed('chicken', 1));
    NOA.barn.add('rice_1', 3);
    for (const id in C().species) {
      const sp = C().species[id];
      if (!sp.hybrid && B().species[id].unlockLevel <= 1) s.discovered.species[id] = true;
    }
  };

  /* ------------------------------------------------------------ resources */
  NOA.res = {
    get(k) { return S().res[k] || 0; },
    add(k, n) {
      if (!n) return;
      const r = S().res;
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
          S().res[k] -= cost[k];
          NOA.events.emit('res.changed', { k, n: -cost[k] });
        }
      }
      NOA.save.schedule();
      return true;
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
        if (NOA.farm) NOA.farm.grantFreePlots();
        NOA.events.emit('level.up', { level: s.level, granted, unlocks });
      }
      NOA.events.emit('xp.changed', { n });
      NOA.save.schedule();
    },
    unlocksAt(level) {
      const out = { species: [], features: [], buildings: [], plots: 0, flowerBeds: 0 };
      const b = B();
      for (const id in NOA.CONTENT.species) {
        const eco = b.species[id];
        if (!NOA.CONTENT.species[id].hybrid && eco.unlockLevel === level) out.species.push(id);
      }
      for (const f in b.unlocks) if (b.unlocks[f] === level) out.features.push(f);
      for (const id in b.production.buildings) if (b.production.buildings[id].unlockLevel === level && level > 1) out.buildings.push(id);
      out.plots = b.fields.crop.levelReq.filter((l, i) => l === level && i >= b.fields.crop.start).length;
      out.flowerBeds = b.fields.flower.levelReq.filter((l, i) => l === level && i >= b.fields.flower.start).length;
      return out;
    },
    isUnlocked(feature) {
      const lv = B().unlocks[feature];
      return lv == null || S().level >= lv;
    },
    speciesUnlocked(id) {
      const sp = NOA.CONTENT.species[id];
      if (sp.hybrid) return !!S().discovered.hybrids[id];
      return B().species[id].unlockLevel <= S().level;
    }
  };
})();
