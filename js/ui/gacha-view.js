/*
 * Blindbox screen + the opening show:
 *   tap → box shakes (glow escalates white → blue → purple → gold → pink, honest to the roll)
 *   → lid flies off with a burst → cards rise and flip (single) or a 2×5 grid flips in sequence (×10).
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

  const RC = { common: '#e9f0e6', rare: '#3ea8f4', epic: '#a560f0', legendary: '#ffb21f', mythic: '#ff58a6' };
  const order = () => B().gacha.rarityOrder;
  const sleep = (ms) => new Promise((r) => setTimeout(r, UI.reduced ? Math.min(ms, 60) : ms));

  const giftBox = (id, extraCls) => h('div', { class: 'gbox gbox--' + id + (extraCls ? ' ' + extraCls : '') },
    h('div', { class: 'gb-body' }, h('span', { class: 'gb-emblem' }, C().boxes[id].emoji)),
    h('div', { class: 'gb-lid' }, h('div', { class: 'gb-bow' })));

  const GV = NOA.ui.screens.gacha = {
    render() {
      const root = document.getElementById('scr-gacha');
      UI.clear(root);
      root.append(h('div', { class: 'tickets-bar' },
        Object.keys(B().gacha.boxes).map((id) => h('span', { class: 'ev' }, '🎟️ ' + t('ticket.' + B().gacha.boxes[id].ticket) + ' ×' + (S().tickets[B().gacha.boxes[id].ticket] || 0)))));
      Object.keys(B().gacha.boxes).forEach((id) => root.append(GV.boxCard(id)));
      root.append(h('p', { class: 'notice' }, '🔎 ' + t('box.ratesNote', { rarity: t('rarity.' + B().gacha.boxes.sprout.multi.guaranteeMinRarity) })));
    },

    boxCard(id) {
      const unlocked = NOA.gacha.isUnlocked(id);
      const box = B().gacha.boxes[id];
      const lockLv = B().unlocks[C().boxes[id].unlock];
      const costLabel = (n) => {
        const c = NOA.gacha.cost(id, n);
        return UI.cost(c);
      };
      const pity = NOA.gacha.pityLeft(id).map((p) => h('div', { class: 'pity-line' },
        h('span', { class: 'rh-dot', style: { background: RC[p.rarity] } }), t('box.pity', { rarity: t('rarity.' + p.rarity), n: p.left })));
      const card = h('section', { class: 'panel box-card' + (unlocked ? '' : ' locked-panel'), 'data-lock': unlocked ? null : '🔒 ' + t('box.locked', { level: lockLv }) },
        giftBox(id),
        h('div', { class: 'box-info' },
          h('h3', null, t('box.' + id)),
          h('p', null, t('box.' + id + '.desc')),
          pity,
          h('div', { class: 'box-btns' },
            UI.btn(t('box.open1') + ' · ' + costLabel(1), 'sm berry', () => GV.open(id, 1), { disabled: !unlocked }),
            UI.btn(t('box.open10') + ' · ' + costLabel(box.multi.count), 'sm sun', () => GV.open(id, box.multi.count), { disabled: !unlocked }),
            UI.btn(t('ui.rates'), 'sm ghost', () => GV.ratesModal(id)))));
      return card;
    },

    open(id, count) {
      NOA.audio.unlock();
      const can = NOA.gacha.canOpen(id, count);
      if (!can.ok) {
        NOA.audio.play('invalid');
        if (can.reason === 'room') UI.toast(t('box.needRoom'), 'warn');
        else if (can.reason === 'locked') UI.toast(t('box.locked', { level: B().unlocks[C().boxes[id].unlock] }));
        else UI.toast(t('toast.notEnough', { name: can.cost && can.cost.gems ? t('res.gems') : t('res.coins') }), 'warn');
        return;
      }
      const res = NOA.gacha.open(id, count);
      if (!res.ok) return;
      NOA.ui.hud.update();
      GV.stage(id, count, res.results);
    },

    /* ------------------------------------------------------------ the show */
    async stage(id, count, results) {
      const best = Math.max(...results.map((r) => order().indexOf(r.rarity)));
      const ov = h('div', { class: 'gstage', role: 'dialog', 'aria-label': t('box.' + id) });
      const setRC = (r) => ov.style.setProperty('--rc', RC[r]);
      setRC('common');
      let skipped = false;
      const skipBtn = UI.btn(t('ui.skip'), 'sm ghost', () => { skipped = true; });
      skipBtn.classList.add('gs-skip');
      const box = giftBox(id, 'gs-box');
      const hint = h('div', { class: 'gs-hint' }, t('box.tap'));
      const center = h('div', { class: 'gs-center' }, box, hint);
      const cards = h('div', { class: 'gs-cards' + (count > 1 ? ' many' : '') });
      const actions = h('div', { class: 'gs-actions' });
      ov.append(h('div', { class: 'gs-bg' }), h('div', { class: 'gs-rays' }), h('div', { class: 'gs-glow' }), skipBtn, center, cards, actions);
      document.getElementById('overlays').append(ov);
      NOA.audio.play('open');

      // 1) anticipation: wait for the tap
      await new Promise((resolve) => {
        let done = false;
        const go = () => { if (done) return; done = true; ov.removeEventListener('click', go); resolve(); };
        ov.addEventListener('click', go);
        skipBtn.addEventListener('click', go);
      });
      hint.remove();
      ov.classList.add('charging');

      // 2) shakes with an honest rarity escalation
      const steps = 3 + Math.max(0, best - 2);
      let shown = 0;
      for (let s = 0; s < steps && !skipped; s++) {
        const r = Math.min(best, s);
        box.classList.remove('s1', 's2', 's3');
        void box.offsetWidth;
        box.classList.add('s' + Math.min(3, s + 1));
        setRC(order()[r]);
        NOA.audio.play('boxShake', s);
        if (r > shown || s === 0) { NOA.audio.play('boxTease', r); shown = r; }
        NOA.audio.vibrate(15 + s * 10);
        const c = UI.center(box);
        NOA.ui.fx.burst(c.x, c.y, { count: 8 + s * 4, colors: [RC[order()[r]], '#ffffff'], shapes: ['star'], speed: 160 + s * 40, size: 5 });
        await sleep(560 + s * 70);
      }
      setRC(order()[best]);

      // 3) burst
      ov.classList.add('burst');
      box.classList.remove('s1', 's2', 's3');
      box.classList.add('open');
      NOA.audio.play('boxBurst', best);
      NOA.audio.vibrate(best >= 3 ? [40, 30, 80] : 30);
      NOA.ui.fx.flash(RC[order()[best]]);
      const c = UI.center(box);
      NOA.ui.fx.burst(c.x, c.y, { count: 40 + best * 18, colors: [RC[order()[best]], '#ffffff', '#ffe27a'], shapes: ['star', 'circle'], speed: 420 + best * 60, life: 1.2 });
      if (best >= 3) NOA.ui.fx.confetti(c.x, c.y, 90);
      if (best >= 2) NOA.ui.fx.shake(ov);
      await sleep(skipped ? 120 : 520);
      center.remove();
      skipBtn.remove();

      // 4) reveal
      if (count === 1) {
        const r = results[0];
        ov.insertBefore(h('div', { class: 'gs-title' }, t('rarity.' + r.rarity) + '!'), cards);
        const card = GV.card(r);
        card.classList.add('rise');
        cards.append(card);
        await sleep(skipped ? 50 : 380);
        card.classList.add('flipped');
        NOA.audio.play('reveal', order().indexOf(r.rarity));
      } else {
        const els = results.map((r) => GV.card(r));
        els.forEach((el, i) => { el.classList.add('rise'); el.style.animationDelay = (i * 0.04) + 's'; cards.append(el); });
        await sleep(skipped ? 50 : 520);
        for (let i = 0; i < els.length; i++) {
          const ri = order().indexOf(results[i].rarity);
          els[i].classList.add('flipped');
          NOA.audio.play(ri >= 3 ? 'reveal' : 'flip', ri);
          if (ri >= 3) {
            const cc = UI.center(els[i]);
            NOA.ui.fx.burst(cc.x, cc.y, { count: 30, colors: [RC[results[i].rarity], '#ffffff'], shapes: ['star'], speed: 260 });
          }
          await sleep(skipped ? 20 : ri >= 3 ? 420 : 170);
        }
      }

      // 5) actions
      const close = () => {
        ov.classList.add('closing');
        ov.style.animation = 'fadeOut .25s ease forwards';
        setTimeout(() => ov.remove(), 260);
        const stored = results.filter((r) => r.where && r.where.where === 'storage').length;
        if (stored) UI.toast(t('toast.toStorage', { n: stored }));
        GV.render();
        NOA.ui.hud.update();
        NOA.ui.renderTabs();
      };
      actions.append(
        UI.btn(t('box.again') + ' · ' + UI.cost(NOA.gacha.cost(id, count)), 'berry', () => { close(); setTimeout(() => GV.open(id, count), 280); }),
        UI.btn(t('box.done'), 'leaf', close));
    },

    card(r) {
      let art, name, sub, desc = '';
      if (r.type === 'item') {
        art = UI.itemArt(r.item);
        name = I().name(r.item);
        sub = t(r.item.kind === 'seed' ? 'kind.seed' : 'kind.animal') + ' · ' + t('ui.lv', { n: r.item.level });
        if (r.item.gene) {
          const g = C().genes[r.item.gene.id];
          sub += ' · ' + g.emoji + ' ' + I().purityText(r.item.gene.purity);
          desc = t('gene.' + r.item.gene.id + '.desc');
        } else {
          desc = '🌾 ' + I().stat(r.item, 'yield') + '  ⏱️ ' + I().stat(r.item, 'growth') + '  ⭐ ' + I().stat(r.item, 'quality');
        }
      } else if (r.type === 'booster') {
        art = h('div', { class: 'art' }, h('span', { class: 'emo' }, C().boosters[r.id].emoji));
        name = t('booster.' + r.id) + ' ×' + r.qty;
        sub = t('farm.bag');
        desc = t('booster.' + r.id + '.desc');
      } else if (r.type === 'currency') {
        const e = r.entries[0] || { icon: '🪙', n: 0 };
        art = h('div', { class: 'art' }, h('span', { class: 'emo' }, e.icon));
        name = '+' + UI.num(e.n) + ' ' + (e.key ? t(e.key) : '');
        sub = '';
      } else if (r.type === 'mascot') {
        const m = C().mascots[r.id];
        art = h('div', { class: 'art' }, h('span', { class: 'emo' }, m.emoji));
        name = t('mascot.' + r.id);
        sub = t('mascot.' + m.type) + (m.type === 'temp' ? ' · ' + r.res.minutes + "'" : ' · ' + '★'.repeat(r.res.stars));
        if (r.res.overflowGems) sub += ' · +' + r.res.overflowGems + '💎';
        desc = t('mascot.' + r.id + '.desc');
      } else {
        art = h('div', { class: 'art' });
        name = '…';
        sub = '';
      }
      return h('div', { class: 'gcard r-' + r.rarity },
        h('div', { class: 'gc-inner' },
          h('div', { class: 'gc-back' }, '?'),
          h('div', { class: 'gc-front' },
            h('div', { class: 'gc-banner' }, t('rarity.' + r.rarity)),
            h('div', { class: 'gc-art' }, art),
            h('div', { class: 'gc-name' }, name),
            sub ? h('div', { class: 'gc-sub' }, sub) : null,
            desc ? h('div', { class: 'gc-desc' }, desc) : null,
            r.isNew ? h('span', { class: 'gc-new' }, t('ui.new')) : null)));
    },

    ratesModal(id) {
      const rates = NOA.gacha.rates(id);
      const box = B().gacha.boxes[id];
      UI.modal({
        title: t('box.ratesTitle', { box: t('box.' + id) }),
        body: (b) => {
          const tb = h('table', { class: 'rate-table' });
          rates.forEach((r) => {
            tb.append(h('tr', { class: 'rh' },
              h('td', null, h('span', { class: 'rh-dot', style: { background: RC[r.rarity] } }), t('rarity.' + r.rarity)),
              h('td', { class: 'p' }, UI.pct(r.p))));
            r.entries.forEach((e) => tb.append(h('tr', null, h('td', null, '· ' + t('reward.' + e.rewardId)), h('td', { class: 'p' }, UI.pct(e.p)))));
          });
          b.append(h('div', { style: { overflowX: 'auto' } }, tb));
          const pity = Object.keys(box.pity || {}).map((r) => t('box.pity', { rarity: t('rarity.' + r), n: box.pity[r] })).join(' · ');
          if (pity) b.append(h('p', { class: 'notice' }, pity));
          b.append(h('p', { class: 'muted tiny' }, t('box.ratesNote', { rarity: t('rarity.' + box.multi.guaranteeMinRarity) })));
        }
      });
    }
  };
})();
