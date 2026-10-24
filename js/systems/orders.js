/*
 * 📋 Order board (Hay Day truck orders): customers ask for raw and processed goods from the barn.
 * Rewards scale with the real value of what you deliver, so better stars / genes pay more.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;
  const U = NOA.util;
  const I = () => NOA.items;

  const lastByLevel = (list, level) => {
    let pick = list[0];
    for (const e of list) if (level >= e.level) pick = e;
    return pick;
  };

  const O = NOA.orders = {
    /** Goods the player can currently obtain, grouped by tier */
    available() {
      const out = { 1: [], 2: [], 3: [] };
      for (const id in C().species) {
        const sp = C().species[id];
        if (sp.hybrid || !NOA.progress.speciesUnlocked(id)) continue;
        if (sp.bed === 'flower' && !NOA.progress.isUnlocked('flowers')) continue;
        out[1].push(sp.products[0]);
      }
      for (const pid in B().recipes) {
        if (NOA.production.recipeUnlocked(pid)) out[I().tierOf(pid)].push(pid);
      }
      return out;
    },
    pickGoods(tierWeights, n, exclude) {
      const avail = O.available();
      const lines = [];
      const used = new Set(exclude || []);
      for (let i = 0; i < n; i++) {
        const w = {};
        [1, 2, 3].forEach((t) => { if (avail[t].some((p) => !used.has(p))) w[t] = tierWeights[t - 1]; });
        const tier = Number(U.pickWeighted(w));
        if (!tier) break;
        const pool = avail[tier].filter((p) => !used.has(p));
        const pid = U.pick(pool);
        used.add(pid);
        lines.push({ product: pid, tier });
      }
      return lines;
    },
    generate() {
      const o = B().orders;
      const lvl = S().level;
      const isVip = lvl >= o.vip.unlockLevel && U.chance(o.vip.chance);
      const nLines = isVip ? 1 : U.randInt(1, lastByLevel(o.linesByLevel, lvl).max);
      const tw = lastByLevel(o.tierWeightsByLevel, lvl).weights;
      const picks = O.pickGoods(isVip ? [tw[0], tw[1], 0] : tw, nLines);
      const lines = picks.map((p) => {
        const r = o.countByTier[p.tier];
        const line = { product: p.product, count: isVip ? 1 : U.randInt(r[0], r[1]), filled: 0, minStars: 0, needGene: false };
        if (isVip) {
          if (U.chance(o.vip.requireGeneChance)) line.needGene = true;
          else line.minStars = o.vip.minStars;
        }
        return line;
      });
      const npcs = Object.keys(C().npcs).filter((id) => !C().npcs[id].vip && !C().npcs[id].earth);
      return NOA.hooks.run('order.generated', {
        id: U.uid('o'),
        npc: isVip ? 'traveler' : U.pick(npcs),
        vip: isVip,
        lines,
        createdAt: NOA.time.now()
      });
    },
    fill() {
      const s = S();
      let added = false;
      while (s.orders.length < B().orders.slots) {
        const o = O.generate();
        if (!o.lines.length) break;
        s.orders.push(o);
        added = true;
      }
      if (added) { NOA.events.emit('orders.changed', {}); NOA.save.schedule(); }
    },
    req(line) { return { minStars: line.minStars || 0, needGene: !!line.needGene }; },
    availability(order) {
      return order.lines.map((l) => Math.min(l.count, NOA.barn.count(l.product, O.req(l))));
    },
    canDeliver(order) { return order.lines.every((l) => NOA.barn.has(l.product, l.count, O.req(l))); },
    deliver(orderId) {
      const order = S().orders.find((o) => o.id === orderId);
      if (!order || !O.canDeliver(order)) return null;
      let value = 0;
      for (const l of order.lines) {
        const taken = NOA.barn.take(l.product, l.count, O.req(l));
        taken.forEach((t) => { value += t.value * t.n; });
        l.filled = l.count;
      }
      return O.complete(order, value);
    },
    estimate(order) {
      let v = 0;
      for (const l of order.lines) {
        const gene = l.needGene ? { id: Object.keys(B().gene.spawnWeights[O.familyOf(l.product)])[0], purity: 1 } : null;
        v += I().productValue(l.product, Math.max(1, l.minStars || 1), gene) * l.count;
      }
      return O.rewardFor(order, v);
    },
    familyOf(pid) { return C().species[I().productSpecies(pid)].family; },
    rewardFor(order, value) {
      const o = B().orders;
      const coins = Math.round(value * o.rewardMult * (order.vip ? o.vip.rewardMult : 1) * NOA.mods.value('coins.mult', 1, {}));
      return { coins, xp: Math.max(o.minXP, Math.round(coins * o.xpPerCoin)) };
    },
    complete(order, value) {
      const o = B().orders;
      const est = O.estimate(order);
      const r = O.rewardFor(order, value);
      const reward = { coins: Math.max(r.coins, est.coins) };
      const xp = Math.max(r.xp, est.xp);
      if (order.vip) {
        reward.rp = U.randInt(o.vip.rpRange[0], o.vip.rpRange[1]);
        if (U.chance(o.vip.gemChance)) reward.gems = U.randInt(o.vip.gemRange[0], o.vip.gemRange[1]);
      }
      const s = S();
      s.orders = s.orders.filter((x) => x.id !== order.id);
      s.orderRefillAt = NOA.time.now() + NOA.time.dur(o.refillDelaySec);
      s.stats.orders += 1;
      const granted = NOA.rewards.grant(reward, 'order');
      NOA.progress.addXP(xp);
      NOA.events.emit('order.complete', { order, reward: Object.assign({ xp }, reward), granted });
      NOA.events.emit('orders.changed', {});
      NOA.save.schedule();
      return { complete: true, reward: Object.assign({ xp }, reward) };
    },
    canSwap() { return NOA.time.now() >= S().orderSwapAt; },
    swap(orderId) {
      const s = S();
      const i = s.orders.findIndex((o) => o.id === orderId);
      if (i < 0 || !O.canSwap()) return false;
      s.orders[i] = O.generate();
      s.orderSwapAt = NOA.time.now() + NOA.time.dur(B().orders.swapCooldownSec);
      NOA.events.emit('orders.changed', {});
      NOA.save.schedule();
      return true;
    },
    tick() {
      if (S().orders.length < B().orders.slots && NOA.time.now() >= S().orderRefillAt) O.fill();
    }
  };
})();
