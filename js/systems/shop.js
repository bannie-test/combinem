/*
 * Shop: soft currency (🪙 Xu, earned in game) and hard currency (💎 Ngọc, from top-ups / rewards).
 * Real-money packs go through NOA.payment (js/systems/payment.js).
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;

  NOA.shop = {
    items() { return B().shop.items; },
    find(id) { return B().shop.items.find((x) => x.id === id) || null; },
    canBuy(id) {
      const it = NOA.shop.find(id);
      return !!it && NOA.res.canAfford(it.price);
    },
    buy(id) {
      const it = NOA.shop.find(id);
      if (!it) return { error: 'unknown' };
      if (it.grant.storage && NOA.state.storageCap >= B().board.storageMax) return { error: 'max' };
      if (!NOA.res.spend(it.price)) return { error: 'cost', currency: Object.keys(it.price)[0] };
      const granted = NOA.rewards.grant(it.grant, 'shop');
      NOA.events.emit('shop.bought', { id, granted });
      return { ok: true, granted };
    },
    exchange() {
      const ex = B().shop.exchange;
      if (!NOA.res.spend({ gems: ex.gems })) return { error: 'cost', currency: 'gems' };
      const granted = NOA.rewards.grant({ coins: ex.coins }, 'exchange');
      return { ok: true, granted };
    }
  };
})();
