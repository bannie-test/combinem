/*
 * Shop: soft currency (🪙 Xu, earned in game) and hard currency (💎 Ngọc, from top-ups / rewards).
 * Sells Lv1 seeds / young animals of unlocked species, farm supplies and luck items.
 * Real-money packs go through NOA.payment (js/systems/payment.js).
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;

  const SP = NOA.shop = {
    items() { return B().shop.items; },
    find(id) { return B().shop.items.find((x) => x.id === id) || null; },
    canBuy(id) {
      const it = SP.find(id);
      return !!it && NOA.res.canAfford(it.price) && !SP.maxed(it);
    },
    maxed(it) {
      if (it.grant.vault) return S().vault.cells.length >= B().storage.vaultMax;
      if (it.grant.nursery) return S().nursery.cells.length >= B().storage.nurseryMax;
      return false;
    },
    buy(id) {
      const it = SP.find(id);
      if (!it) return { error: 'unknown' };
      if (SP.maxed(it)) return { error: 'max' };
      if (!NOA.res.spend(it.price)) return { error: 'cost', currency: Object.keys(it.price)[0] };
      const granted = NOA.rewards.grant(it.grant, 'shop');
      NOA.events.emit('shop.bought', { id, granted });
      return { ok: true, granted };
    },

    /* ------------------------------------------------------------ seeds & young animals */
    breedsForSale() {
      return Object.keys(C().species).filter((id) => {
        const sp = C().species[id];
        if (sp.hybrid || !NOA.progress.speciesUnlocked(id)) return false;
        if (sp.bed === 'flower' && !NOA.progress.isUnlocked('flowers')) return false;
        return true;
      });
    },
    breedPrice(species) {
      const eco = B().species[species];
      return eco.seedPrice || eco.buyPrice || 0;
    },
    buyBreed(species) {
      const grid = C().species[species].family === 'plant' ? 'vault' : 'nursery';
      if (!NOA.grids.hasRoom(grid)) return { error: 'room', grid };
      if (!NOA.res.spend({ coins: SP.breedPrice(species) })) return { error: 'cost', currency: 'coins' };
      const item = NOA.items.newBreed(species, 1);
      NOA.grids.place(item);
      NOA.events.emit('shop.bought', { species });
      return { ok: true, item };
    },

    exchange() {
      const ex = B().shop.exchange;
      if (!NOA.res.spend({ gems: ex.gems })) return { error: 'cost', currency: 'gems' };
      const granted = NOA.rewards.grant({ coins: ex.coins }, 'exchange');
      return { ok: true, granted };
    }
  };
})();
