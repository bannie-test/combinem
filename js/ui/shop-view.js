/*
 * Shop screen (also the market stall and the wish tree on the map):
 *   🎁 blindboxes · 🌱 seeds & young animals (Lv1) · 🧰 supplies & luck items (🪙 coins or 💎 gems)
 *   💎 gem packs (real money via NOA.payment, not live yet) · 🎀 offers (starter pack, monthly card).
 * Payment links/config: config/payment.js.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const UI = NOA.ui;
  const h = (...a) => UI.h(...a);
  const t = (k, p) => NOA.t(k, p);
  const S = () => NOA.state;
  const B = () => NOA.BALANCE;

  const ICON = {
    manure_5: '💩', straw_10: '🧹', pollen_10: '🌼', clover_1: '🍀', clover_5: '🍀', stabilizer_1: '🧪', stardust_1: '✨',
    tonic_3: '🧃', loupe_1: '🔍', vault_6: '🌰', nursery_3: '🐣', ticket_star: '🎟️'
  };
  const TABS = [['gacha', '🎁'], ['breeds', '🌱'], ['items', '🧰'], ['gems', '💎'], ['offers', '🎀']];
  const PACK_ICON = { gems_60: '💎', gems_330: '💰', gems_700: '🧰', gems_1500: '👑', starter_pack: '🎒', monthly_card: '📆' };

  let tab = 'gacha';

  const SV = NOA.ui.screens.shop = {
    tab(name) { tab = name; SV.render(); },
    render(opts) {
      if (opts && opts.tab) tab = opts.tab;
      const root = document.getElementById('scr-shop');
      UI.clear(root);
      const seg = h('div', { class: 'seg', role: 'tablist' });
      TABS.forEach(([id, ic]) => {
        seg.append(h('button', { type: 'button', role: 'tab', 'aria-pressed': tab === id ? 'true' : 'false', on: { click: () => { NOA.audio.play('tap'); SV.tab(id); } } }, ic + ' ' + t('shop.tab.' + id)));
      });
      root.append(seg);
      const on = seg.querySelector('[aria-pressed="true"]');
      if (on) on.scrollIntoView({ block: 'nearest', inline: 'nearest' });
      if (tab === 'gacha') NOA.ui.gacha.renderInto(root);
      else if (tab === 'breeds') SV.renderBreeds(root);
      else if (tab === 'items') SV.renderItems(root);
      else if (tab === 'gems') SV.renderGems(root);
      else SV.renderOffers(root);
    },
    current() { return tab; },

    itemCard(it) {
      const cur = Object.keys(it.price)[0];
      const can = NOA.shop.canBuy(it.id);
      return h('div', { class: 'sitem' },
        h('span', { class: 'si' }, ICON[it.id] || '🎁'),
        h('span', { class: 'sn' }, t('shopitem.' + it.id)),
        it.grant.boosters ? h('span', { class: 'sd' }, t('booster.' + Object.keys(it.grant.boosters)[0] + '.desc'))
          : it.grant.materials ? h('span', { class: 'sd' }, t('material.' + Object.keys(it.grant.materials)[0] + '.desc')) : null,
        UI.btn(UI.cost(it.price), cur === 'gems' ? 'sm sky' : 'sm sun', (ev) => {
          const r = NOA.shop.buy(it.id);
          if (r.ok) {
            NOA.audio.play('coin');
            const c = UI.center(ev.currentTarget);
            NOA.ui.fx.burst(c.x, c.y, { count: 16, colors: ['#ffd84d', '#ffffff', '#56c1ff'], shapes: ['star'], speed: 200 });
            UI.toast(t('shop.bought') + ' ' + r.granted.map((g) => g.icon + '+' + g.n).join(' '), 'good');
            NOA.ui.hud.update();
            SV.render();
          } else {
            NOA.audio.play('invalid');
            UI.toast(r.error === 'max' ? t('ui.max') : t('toast.notEnough', { name: t('res.' + (r.currency || cur)) }), 'warn');
          }
        }, { disabled: !can }));
    },

    renderBreeds(root) {
      root.append(h('p', { class: 'muted tiny' }, t('shop.breedsNote')));
      const grid = h('div', { class: 'shop-grid' });
      NOA.shop.breedsForSale().forEach((sp) => {
        const def = NOA.CONTENT.species[sp];
        const price = NOA.shop.breedPrice(sp);
        const grid2 = def.family === 'plant' ? 'vault' : 'nursery';
        const where = def.family === 'plant' ? t('zone.' + def.bed) : t('bld.' + def.pen);
        grid.append(h('div', { class: 'sitem' },
          h('span', { class: 'si' }, def.emoji),
          h('span', { class: 'sn' }, def.family === 'plant' ? t('item.seedName', { species: t('species.' + sp) }) : t('species.' + sp)),
          h('span', { class: 'sd' }, 'Lv1 · ' + where),
          UI.btn(UI.num(price) + '🪙', 'sm sun', (ev) => {
            const r = NOA.shop.buyBreed(sp);
            if (r.ok) {
              NOA.audio.play('coin');
              const c = UI.center(ev.currentTarget);
              NOA.ui.fx.burst(c.x, c.y, { count: 12, colors: ['#9be37a', '#ffffff', '#ffd84d'], shapes: ['leaf', 'star'], speed: 180 });
              NOA.ui.fx.flyTo(c, UI.tabEl('breed'), def.emoji, 1);
              NOA.ui.hud.update();
              SV.render();
            } else {
              NOA.audio.play('invalid');
              UI.toast(r.error === 'room' ? t('shop.noRoom', { grid: t('grid.' + grid2) }) : t('toast.notEnough', { name: t('res.coins') }), 'warn');
            }
          }, { disabled: !NOA.res.canAfford({ coins: price }) || !NOA.grids.hasRoom(grid2) })));
      });
      root.append(grid);
    },

    renderItems(root) {
      const grid = h('div', { class: 'shop-grid' });
      NOA.shop.items().forEach((it) => grid.append(SV.itemCard(it)));
      const ex = B().shop.exchange;
      grid.append(h('div', { class: 'sitem' },
        h('span', { class: 'si' }, '🔁'),
        h('span', { class: 'sn' }, t('shop.exchange')),
        h('span', { class: 'sd' }, t('shop.exchangeDesc', { gems: ex.gems, coins: UI.num(ex.coins) })),
        UI.btn(UI.cost({ gems: ex.gems }), 'sm sky', () => {
          const r = NOA.shop.exchange();
          if (r.ok) { NOA.audio.play('coin'); NOA.ui.hud.update(); SV.render(); }
          else { NOA.audio.play('invalid'); UI.toast(t('toast.notEnough', { name: t('res.gems') }), 'warn'); }
        }, { disabled: S().res.gems < ex.gems })));
      root.append(grid);
    },

    payNotice() {
      if (NOA.payment.provider() === 'mock') return h('p', { class: 'notice' }, '🧪 ' + t('shop.payMock'));
      if (!NOA.payment.isLive()) return h('p', { class: 'notice' }, '🔒 ' + t('shop.payOff') + '. ' + t('shop.payOffNote'));
      return null;
    },
    packCard(p) {
      const live = NOA.payment.isLive();
      const available = NOA.payment.available(p);
      const btn = UI.btn(available ? NOA.payment.priceText(p) : t('shop.owned'), live ? 'sm leaf' : 'sm ghost', async (ev) => {
        const b = ev.currentTarget;
        b.disabled = true;
        const r = await NOA.payment.purchase(p.sku);
        b.disabled = false;
        if (r.ok) {
          NOA.audio.play('levelUp');
          NOA.ui.fx.confetti(innerWidth / 2, innerHeight * 0.4, 70);
          UI.toast(t('toast.purchaseOk'), 'good');
          NOA.ui.panels.rewardsToast(r.granted);
          SV.render();
        } else if (r.code === 'disabled') {
          NOA.audio.play('tap');
          UI.toast(t('toast.purchaseOff', { sku: p.sku }));
        } else {
          NOA.audio.play('invalid');
          UI.toast(t('toast.purchaseFail', { code: r.code }), 'warn');
        }
      }, { disabled: !available });
      return h('div', { class: 'sitem gems' },
        p.bonus ? h('span', { class: 'ribbon' }, t('shop.bonus', { n: p.bonus })) : !live ? h('span', { class: 'ribbon' }, t('ui.comingSoon')) : null,
        h('span', { class: 'si' }, PACK_ICON[p.sku] || '💎'),
        h('span', { class: 'sn' }, t('pay.' + p.sku)),
        h('span', { class: 'sd' }, p.grant.gems && !p.daily && p.type === 'consumable' ? UI.num(p.grant.gems + (p.bonus || 0)) + ' 💎' : t('pay.' + p.sku + '.desc')),
        btn);
    },
    renderGems(root) {
      const n = SV.payNotice();
      if (n) root.append(n);
      const grid = h('div', { class: 'shop-grid' });
      NOA.payment.products().filter((p) => p.type === 'consumable').forEach((p) => grid.append(SV.packCard(p)));
      root.append(grid, SV.footer());
    },
    renderOffers(root) {
      const n = SV.payNotice();
      if (n) root.append(n);
      if (NOA.payment.monthly.active()) {
        const days = Math.ceil((S().purchases.monthlyUntil - NOA.time.now()) / NOA.time.DAY);
        root.append(h('div', { class: 'panel' },
          h('div', { class: 'panel-title' }, h('span', null, '📆 ' + t('shop.monthlyActive', { d: days }))),
          UI.btn(t('shop.monthlyClaim'), 'leaf block', () => {
            const g = NOA.payment.monthly.claim();
            if (g) { NOA.audio.play('coin'); NOA.ui.panels.rewardsToast(g); SV.render(); NOA.ui.renderTabs(); }
          }, { disabled: !NOA.payment.monthly.canClaim() })));
      }
      const grid = h('div', { class: 'shop-grid' });
      NOA.payment.products().filter((p) => p.type !== 'consumable').forEach((p) => grid.append(SV.packCard(p)));
      root.append(grid, SV.footer());
    },
    footer() {
      const L = NOA.PAYMENT.links;
      return h('div', { class: 'panel' },
        h('div', { class: 'links' },
          h('a', { href: L.terms, target: '_blank', rel: 'noopener' }, t('shop.terms')),
          h('a', { href: L.privacy, target: '_blank', rel: 'noopener' }, t('shop.privacy')),
          h('span', { class: 'muted' }, t('shop.support', { mail: L.support }))),
        h('div', { style: { marginTop: '10px' } }, UI.btn(t('shop.restore'), 'sm ghost', async () => {
          const r = await NOA.payment.restore();
          UI.toast(r.ok ? t('toast.purchaseOk') : t('toast.purchaseOff', { sku: 'restore' }));
        })));
    }
  };
})();
