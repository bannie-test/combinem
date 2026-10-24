/*
 * 📦 Barn screen: every product and material as stacks (stars / gene variants are separate),
 * shared capacity with upgrades, tap a stack to sell or see what it is used for.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const UI = NOA.ui;
  const h = (...a) => UI.h(...a);
  const t = (k, p) => NOA.t(k, p);
  const S = () => NOA.state;
  const B = () => NOA.BALANCE;
  const I = () => NOA.items;

  const BV = NOA.ui.screens.barn = {
    render() {
      const root = document.getElementById('scr-barn');
      UI.clear(root);
      const BN = NOA.barn;
      const used = BN.used(), cap = BN.cap();
      const head = h('section', { class: 'panel barn-head' },
        h('div', { class: 'panel-title' }, h('span', null, '📦 ' + t('bld.barn')), h('span', { class: 'num' + (used >= cap ? ' warn-t' : '') }, t('barn.cap', { used, cap }))),
        h('div', { class: 'cap-meter' + (used >= cap ? ' full' : '') }, h('i', { style: { width: Math.min(100, used / cap * 100) + '%' } })));
      if (BN.canUpgrade()) {
        const cost = BN.upgradeCost();
        head.append(UI.btn(t('barn.upgrade', { n: B().storage.barnUpgrade.step, cost: UI.num(cost) + '🪙' }), NOA.res.canAfford({ coins: cost }) ? 'sm leaf' : 'sm ghost', () => {
          const r = BN.upgrade();
          if (r.ok) { NOA.audio.play('unlock'); NOA.ui.fx.confetti(innerWidth / 2, innerHeight * 0.3, 40); }
          else { NOA.audio.play('invalid'); UI.toast(t('toast.notEnough', { name: t('res.coins') }), 'warn'); }
        }));
      } else head.append(h('p', { class: 'muted tiny' }, t('barn.max')));
      root.append(head);

      const groups = { goods: [], processed: [], materials: [] };
      Object.keys(BN.items()).forEach((key) => {
        const p = I().parseKey(key);
        if (I().isMaterial(p.pid)) groups.materials.push(key);
        else if (I().tierOf(p.pid) > 1) groups.processed.push(key);
        else groups.goods.push(key);
      });
      if (!used) root.append(h('p', { class: 'notice' }, t('barn.empty')));
      for (const g of ['goods', 'processed', 'materials']) {
        if (!groups[g].length) continue;
        groups[g].sort((a, b) => a.localeCompare(b));
        root.append(h('h3', { class: 'lab-sub' }, t('barn.' + g)));
        const grid = h('div', { class: 'stack-grid' });
        groups[g].forEach((key) => {
          const p = I().parseKey(key);
          const n = BN.items()[key];
          grid.append(h('button', {
            type: 'button', class: 'stack', 'aria-label': I().goodName(p.pid, p.gene) + ' ×' + n,
            on: { click: () => { NOA.audio.play('tap'); NOA.ui.panels.goodSheet(key); } }
          }, UI.goodArt(p.pid, p.stars, p.gene), h('b', { class: 'num' }, '×' + n), h('small', null, I().goodName(p.pid))));
        });
        root.append(grid);
      }
    }
  };
})();
