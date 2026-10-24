/*
 * 📋 Orders screen (the order board in the home yard): customers ask for raw and processed goods
 * from the barn. Also shows the 🚀 bee-ship at the dock.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const UI = NOA.ui;
  const h = (...a) => UI.h(...a);
  const t = (k, p) => NOA.t(k, p);
  const S = () => NOA.state;
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const I = () => NOA.items;
  const FX = () => NOA.ui.fx;

  const OV = NOA.ui.screens.orders = {
    render() {
      const root = document.getElementById('scr-orders');
      UI.clear(root);
      const swapLeft = S().orderSwapAt - NOA.time.now();
      root.append(h('div', { class: 'row-title' },
        h('span', null, '📋 ' + t('bld.orders')),
        swapLeft > 0 ? h('span', { class: 'muted' }, '⟳ ', h('b', { class: 'num', data: { until: String(S().orderSwapAt) } }, UI.dur(swapLeft))) : null));
      const grid = h('div', { class: 'orders-grid' });
      S().orders.forEach((o) => grid.append(card(o)));
      for (let i = S().orders.length; i < B().orders.slots; i++) grid.append(h('div', { class: 'o-wait' }, '⏳ ' + t('order.waiting')));
      root.append(grid);
      if (NOA.ship.open()) root.append(shipCard());
      else root.append(h('p', { class: 'notice' }, '🚀 ' + t('ship.locked', { level: B().unlocks.ship })));
    },
    /** live timers; a finished countdown (swap cooldown, ship) re-renders the screen once */
    tick() {
      if (UI.current !== 'orders') return;
      const now = NOA.time.now();
      let expired = false;
      document.querySelectorAll('#scr-orders [data-until]').forEach((el) => {
        const left = Number(el.dataset.until) - now;
        if (left <= 0) expired = true;
        el.textContent = UI.dur(left);
      });
      if (expired && now - (OV._last || 0) > 1000) { OV._last = now; OV.render(); }
    },
    celebrate(c, reward) {
      NOA.audio.play('order');
      NOA.audio.vibrate([10, 30, 10]);
      FX().confetti(c.x, c.y, 40);
      const hud = NOA.ui.hud.els;
      FX().flyTo(c, hud.coins, '🪙', 3 + Math.min(7, Math.floor(reward.coins / 60)));
      if (reward.gems) FX().flyTo(c, hud.gems, '💎', 3);
      FX().float(c.x, c.y - 10, '+' + UI.num(reward.coins) + '🪙', 'big');
      FX().float(c.x, c.y + 18, '+' + reward.xp + ' XP', 'good', 0.15);
      if (reward.rp) FX().float(c.x, c.y + 44, '+' + reward.rp + '🔬', '', 0.3);
    }
  };

  function card(o) {
    const avail = NOA.orders.availability(o);
    const ready = NOA.orders.canDeliver(o);
    const est = NOA.orders.estimate(o);
    const npc = C().npcs[o.npc];
    const el = h('div', { class: 'order' + (o.vip ? ' vip' : '') + (ready ? ' ready' : ''), id: 'order-' + o.id, role: 'group', 'aria-label': t('npc.' + o.npc) });
    const lines = o.lines.map((l, i) => {
      const have = avail[i];
      return h('div', { class: 'o-line' + (have >= l.count ? ' ok' : ''), title: I().goodName(l.product) },
        h('span', { class: 'oe' }, UI.goodArt(l.product, l.minStars || 1, null, { badges: false })),
        h('span', { class: 'on' }, I().goodName(l.product),
          l.needGene ? h('small', null, ' 🧬 ' + t('order.needGene')) : l.minStars ? h('small', null, ' ' + t('order.minStars', { n: l.minStars })) : null),
        h('b', { class: 'num' }, Math.min(have, l.count) + '/' + l.count));
    });
    const deliver = UI.btn(t('order.deliver'), ready ? 'sm leaf' : 'sm ghost', () => {
      const c = UI.center(el);
      const r = NOA.orders.deliver(o.id);
      if (!r) { NOA.audio.play('invalid'); UI.toast(t('prod.missing'), 'warn'); return; }
      OV.celebrate(c, r.reward);
    }, { disabled: !ready });
    const swap = h('button', {
      type: 'button', class: 'btn-icon', 'aria-label': t('order.swap'), title: t('order.swap'), disabled: !NOA.orders.canSwap(),
      on: { click: () => { NOA.audio.play('swoosh'); NOA.orders.swap(o.id); } }
    }, '⟳');
    UI.append(el, [
      o.vip ? h('span', { class: 'o-tag' }, '✨ ' + t('order.vip')) : null,
      h('div', { class: 'o-head' }, h('span', { class: 'o-npc' }, npc.emoji), h('span', { class: 'o-name' }, t('npc.' + o.npc))),
      h('div', { class: 'o-lines' }, lines),
      h('div', { class: 'o-rew num' }, '🪙 ' + UI.num(est.coins) + '  ·  ' + est.xp + ' XP'),
      h('div', { class: 'o-foot' }, swap, deliver)]);
    return el;
  }

  function shipCard() {
    const SH = NOA.ship;
    const docked = SH.docked();
    const box = h('section', { class: 'panel ship-card' },
      h('div', { class: 'panel-title' }, h('span', null, '🚀 ' + t('unlock.ship')), h('span', { class: 'muted' }, docked ? '⏳ ' : '✈️ ', h('b', { class: 'num', data: { until: String(S().ship.until) } }, UI.dur(SH.left())))));
    if (docked) {
      box.append(h('div', { class: 'crates-row' }, S().ship.crates.map((c) => h('span', { class: 'crate' + (c.filled ? ' filled' : SH.canFill(S().ship.crates.indexOf(c)) ? ' can' : '') },
        c.filled ? '✅' : I().goodEmoji(c.product), h('small', null, c.filled ? '' : '×' + c.count)))));
    } else {
      box.append(h('p', { class: 'muted tiny' }, t('ship.letter')));
    }
    box.append(h('p', { class: 'muted tiny' }, t('sky.earth', { n: S().earth })), UI.btn('🚀 ' + t('ship.open'), 'sm sky', () => {
      UI.show('farm');
      const el = document.getElementById('bld-dock');
      if (el) NOA.ui.screens.farm.reveal(el);
      NOA.ui.panels.shipPanel();
    }));
    return box;
  }
})();
