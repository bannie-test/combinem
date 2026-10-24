/*
 * 🚀 Tàu Ong Vàng (Township-train style): the bee-ship docks with crates for Earth (little Na in
 * Hanoi Dome). Fill every crate before it leaves for coins, gems and Earth revival progress.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const S = () => NOA.state;
  const U = NOA.util;
  const I = () => NOA.items;

  const SH = NOA.ship = {
    open() { return NOA.progress.isUnlocked('ship'); },
    st() { return S().ship; },
    docked() { return SH.st().state === 'docked'; },
    left() { return Math.max(0, SH.st().until - NOA.time.now()); },
    allFilled() { return SH.st().crates.length > 0 && SH.st().crates.every((c) => c.filled); },
    dock() {
      const cfg = B().ship;
      const picks = NOA.orders.pickGoods([cfg.tierWeights[0], cfg.tierWeights[1], cfg.tierWeights[2]], cfg.crates);
      const s = SH.st();
      s.state = 'docked';
      s.until = NOA.time.now() + NOA.time.dur(cfg.dockMinutes * 60);
      s.crates = picks.map((p) => ({ product: p.product, count: U.randInt(cfg.countRange[0], cfg.countRange[1]) - (p.tier > 1 ? 1 : 0), filled: false }));
      s.crates.forEach((c) => { c.count = Math.max(1, c.count); });
      NOA.events.emit('ship.changed', { state: 'docked' });
      NOA.save.schedule();
    },
    canFill(i) {
      const c = SH.st().crates[i];
      return !!c && !c.filled && NOA.barn.has(c.product, c.count);
    },
    fill(i) {
      const c = SH.st().crates[i];
      if (!SH.docked() || !SH.canFill(i)) return null;
      const taken = NOA.barn.take(c.product, c.count);
      let value = 0;
      taken.forEach((t) => { value += t.value * t.n; });
      c.filled = true;
      const coins = Math.round(value * B().ship.rewardMult * NOA.mods.value('coins.mult', 1, {}));
      const granted = NOA.rewards.grant({ coins }, 'ship');
      NOA.progress.addXP(Math.round(coins * B().orders.xpPerCoin));
      NOA.events.emit('ship.changed', { filled: i });
      return { coins, granted };
    },
    /** Leave now (or when time runs out). A full ship pays the bonus and moves Earth forward. */
    depart() {
      const s = SH.st();
      if (!SH.docked()) return null;
      const cfg = B().ship;
      let result = { full: false };
      if (SH.allFilled()) {
        const granted = NOA.rewards.grant(cfg.allBonus, 'ship');
        S().earth = Math.min(B().world.earth.maxProgress, S().earth + cfg.earthProgress);
        S().stats.ships = (S().stats.ships || 0) + 1;
        NOA.events.emit('earth.changed', { earth: S().earth });
        result = { full: true, granted };
      }
      s.state = 'away';
      s.until = NOA.time.now() + NOA.time.dur(cfg.awayMinutes * 60);
      s.crates = [];
      s.trips += 1;
      NOA.events.emit('ship.departed', result);
      NOA.events.emit('ship.changed', { state: 'away' });
      NOA.save.schedule();
      return result;
    },
    tick() {
      if (!SH.open()) return;
      const s = SH.st();
      if (s.state === 'away' && NOA.time.now() >= s.until) SH.dock();
      else if (s.state === 'docked' && NOA.time.now() >= s.until) SH.depart();
    },
    crateValue(c) { return I().productValue(c.product, 1, null) * c.count * B().ship.rewardMult; }
  };
})();
