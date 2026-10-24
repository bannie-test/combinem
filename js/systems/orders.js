/*
 * Orders (Township-style board): customers ask for processed products.
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
    unlockedSpecies() {
      const out = [];
      for (const id in C().species) {
        const sp = C().species[id];
        if (!sp.hybrid && B().species[id].unlockLevel <= S().level) out.push(id);
      }
      return out;
    },
    generate() {
      const o = B().orders;
      const lvl = S().level;
      const isVip = lvl >= o.vip.unlockLevel && U.chance(o.vip.chance);
      const isEarth = !isVip && lvl >= o.earth.unlockLevel && U.chance(o.earth.chance);
      const maxLines = lastByLevel(o.linesByLevel, lvl).max;
      const nLines = isVip ? 1 : U.randInt(1, maxLines);
      const tierW = lastByLevel(o.tierWeightsByLevel, lvl).weights;
      const pool = U.shuffle(O.unlockedSpecies().slice());
      const lines = [];
      for (let i = 0; i < nLines && i < pool.length; i++) {
        const sp = pool[i];
        const tw = { 1: tierW[0], 2: tierW[1], 3: tierW[2] };
        let tier = Number(U.pickWeighted(tw)) || 1;
        if (isVip) tier = Math.min(tier, 2);
        const line = {
          product: C().species[sp].products[tier - 1],
          count: isVip ? 1 : U.randInt(o.countRange[0], tier === 3 ? 1 : o.countRange[1]),
          filled: 0,
          minStars: 0,
          needGene: false
        };
        if (isVip) {
          if (U.chance(o.vip.requireGeneChance)) line.needGene = true;
          else line.minStars = o.vip.minStars;
        }
        lines.push(line);
      }
      const npcs = Object.keys(C().npcs).filter((id) => !C().npcs[id].vip && !C().npcs[id].earth);
      return {
        id: U.uid('o'),
        npc: isVip ? 'traveler' : isEarth ? 'na' : U.pick(npcs),
        vip: isVip,
        earth: isEarth,
        lines,
        value: 0,
        createdAt: NOA.time.now()
      };
    },
    fill() {
      const s = S();
      let added = false;
      while (s.orders.length < B().orders.slots) { s.orders.push(O.generate()); added = true; }
      if (added) { NOA.events.emit('orders.changed', {}); NOA.save.schedule(); }
    },
    matches(item, line) {
      if (!item || item.kind !== 'product' || item.locked || item.product !== line.product) return false;
      if (line.minStars && (item.stars || 1) < line.minStars) return false;
      if (line.needGene && !item.gene) return false;
      return true;
    },
    /** For each unfilled line, the cheapest matching board items. null if not enough. */
    plan(order) {
      const used = new Set();
      const picks = [];
      for (const line of order.lines) {
        const need = line.count - line.filled;
        if (need <= 0) continue;
        const cands = [];
        S().board.forEach((it, i) => { if (!used.has(i) && O.matches(it, line)) cands.push(i); });
        cands.sort((x, y) => I().value(S().board[x]) - I().value(S().board[y]));
        if (cands.length < need) return null;
        for (let k = 0; k < need; k++) { used.add(cands[k]); picks.push({ line, index: cands[k] }); }
      }
      return picks;
    },
    /** Per line: how many matching items the board holds right now (for checkmarks) */
    availability(order) {
      return order.lines.map((line) => {
        let n = 0;
        S().board.forEach((it) => { if (O.matches(it, line)) n += 1; });
        return Math.min(line.count - line.filled, n);
      });
    },
    canDeliver(order) { return !!O.plan(order); },
    deliver(orderId) {
      const order = S().orders.find((o) => o.id === orderId);
      if (!order) return null;
      const picks = O.plan(order);
      if (!picks) return null;
      const indices = [];
      for (const p of picks) {
        const it = S().board[p.index];
        order.value += I().value(it);
        p.line.filled += 1;
        S().board[p.index] = null;
        indices.push(p.index);
      }
      NOA.board.changed({ removed: indices });
      return O.complete(order, indices);
    },
    /** Drag a single product onto an order card */
    deliverItem(orderId, boardIdx) {
      const order = S().orders.find((o) => o.id === orderId);
      const it = S().board[boardIdx];
      if (!order || !it) return null;
      const line = order.lines.find((l) => l.filled < l.count && O.matches(it, l));
      if (!line) return null;
      line.filled += 1;
      order.value += I().value(it);
      S().board[boardIdx] = null;
      NOA.board.changed({ removed: [boardIdx] });
      if (order.lines.every((l) => l.filled >= l.count)) return O.complete(order, [boardIdx]);
      NOA.events.emit('orders.changed', {});
      return { partial: true };
    },
    estimate(order) {
      let v = 0;
      for (const line of order.lines) {
        const gene = line.needGene ? { id: O.anyGeneFor(line.product), purity: 1 } : null;
        v += I().productValue(line.product, Math.max(1, line.minStars || 1), gene) * line.count;
      }
      return O.rewardFor(order, v);
    },
    anyGeneFor(productId) {
      const fam = C().species[C().products[productId].species].family;
      return Object.keys(B().gene.spawnWeights[fam])[0];
    },
    rewardFor(order, value) {
      const o = B().orders;
      const coins = Math.round(value * o.rewardMult * (order.vip ? o.vip.rewardMult : 1) * NOA.mods.value('coins.mult', 1, {}));
      return { coins, xp: Math.max(o.minXP, Math.round(coins * o.xpPerCoin)) };
    },
    complete(order, indices) {
      const o = B().orders;
      const est = O.estimate(order);
      const r = O.rewardFor(order, order.value);
      const reward = { coins: Math.max(r.coins, est.coins), xp: Math.max(r.xp, est.xp) };
      if (order.vip) {
        reward.rp = U.randInt(o.vip.rpRange[0], o.vip.rpRange[1]);
        if (U.chance(o.vip.gemChance)) reward.gems = U.randInt(o.vip.gemRange[0], o.vip.gemRange[1]);
      }
      if (order.earth) reward.rp = (reward.rp || 0) + o.earth.rp;
      const s = S();
      s.orders = s.orders.filter((x) => x.id !== order.id);
      s.orderRefillAt = NOA.time.now() + NOA.time.dur(o.refillDelaySec);
      s.stats.orders += 1;
      const xp = reward.xp;
      delete reward.xp;
      const granted = NOA.rewards.grant(reward, 'order');
      if (order.earth) {
        s.earth = Math.min(B().world.earth.maxProgress, s.earth + o.earth.progress);
        NOA.events.emit('earth.changed', { earth: s.earth });
      }
      NOA.progress.addXP(xp);
      NOA.events.emit('order.complete', { order, reward: Object.assign({ xp }, reward), granted, indices });
      NOA.events.emit('orders.changed', {});
      NOA.save.schedule();
      return { complete: true, reward: Object.assign({ xp }, reward) };
    },
    canSwap(order) { return order.lines.every((l) => l.filled === 0) && NOA.time.now() >= S().orderSwapAt; },
    swap(orderId) {
      const s = S();
      const i = s.orders.findIndex((o) => o.id === orderId);
      if (i < 0 || !O.canSwap(s.orders[i])) return false;
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
