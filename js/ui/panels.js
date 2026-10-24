/*
 * Panels: item info sheet, plot / pen sheets, storage, energy, daily login, level-up,
 * order details, secret discovered, generic reward popups.
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

  let sheet = null;
  let sheetFor = null;

  const PN = NOA.ui.panels = {
    sheetOpen() { return !!sheet; },
    closeSheet() {
      if (sheet) { sheet.remove(); sheet = null; }
      sheetFor = null;
      const fv = NOA.ui.screens.farm;
      if (fv && fv.selected !== -1) { fv.selected = -1; fv.renderBoard(); }
    },
    openSheet(content, key) {
      if (sheet) sheet.remove();
      sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': t('ui.close') },
        h('button', { type: 'button', class: 'btn-icon sh-x', 'aria-label': t('ui.close'), on: { click: PN.closeSheet } }, '✕'),
        content);
      sheetFor = key;
      document.body.append(sheet);
    },
    refreshSheet() {
      if (!sheetFor) return;
      if (sheetFor.type === 'item') {
        const it = S().board[sheetFor.index];
        if (!it || it.id !== sheetFor.id) PN.closeSheet();
        else PN.itemSheet(sheetFor.index, true);
      } else if (sheetFor.type === 'slot') PN.slotSheet(sheetFor.kind, sheetFor.index, true);
    },

    /* ------------------------------------------------------------ item sheet */
    statRows(it) {
      const rows = h('div', { class: 'stats' });
      const g = I().geneDef(it);
      const icons = { yield: '🌾', growth: '⏱️', quality: '⭐' };
      for (const s of I().STATS) {
        const base = it.stats[s];
        const bonus = I().geneBonus(it, s);
        const cap = 100;
        rows.append(h('div', { class: 'stat', style: g ? { '--gc': g.color } : null },
          h('span', { class: 'si' }, icons[s]),
          h('span', null, t('stat.' + s)),
          h('span', { class: 'bar' },
            h('i', { style: { width: Math.min(100, base / cap * 100) + '%' } }),
            bonus ? h('i', { class: 'bonus', style: { left: Math.min(100, base / cap * 100) + '%', width: Math.min(100 - base, bonus) / cap * 100 + '%' } }) : null),
          h('span', { class: 'sv num' }, String(base), bonus ? h('small', null, ' +' + bonus) : null)));
      }
      return rows;
    },
    geneLine(it) {
      const g = I().geneDef(it);
      if (g) {
        return h('div', { class: 'gene-line on', style: { '--gc': g.color } },
          h('span', null, '🧬 ' + g.emoji + ' ' + t('gene.' + it.gene.id)),
          h('span', { class: 'pur' }, I().purityText(it.gene.purity)),
          h('span', { class: 'muted tiny' }, t('gene.tier' + g.tier) + ' · ' + t('gene.favor', { stat: t(g.favor === 'all' ? 'stat.all' : 'stat.' + g.favor) })),
          I().isSuper(it) ? h('b', null, '👑 ' + t('item.super')) : null);
      }
      let carrierText = t('item.noGene');
      if (it.revealed) carrierText += ' · ' + (it.carrier ? t('item.carrier', { gene: C().genes[it.carrier].emoji + ' ' + t('gene.' + it.carrier) }) : t('item.noCarrier'));
      return h('div', { class: 'gene-line' }, '🧬 ' + carrierText);
    },
    itemSheet(index, keep) {
      const it = S().board[index];
      if (!it) return;
      const fv = NOA.ui.screens.farm;
      fv.selected = index;
      fv.renderBoard();
      const body = h('div');
      const kindKey = it.kind === 'seed' ? 'kind.seed' : it.kind === 'animal' ? 'kind.animal' : it.kind === 'product' ? 'kind.product' : 'kind.generator';
      let sub = t(kindKey);
      if (I().isBreed(it)) sub += ' · ' + t('fam.' + I().family(it)) + ' · ' + t('ui.lv', { n: it.level }) + (C().species[it.species].hybrid ? ' · ' + t('item.hybrid') : '');
      if (it.kind === 'product') sub += ' · ' + t('item.stars', { n: it.stars || 1 });
      body.append(h('div', { class: 'sh-head' },
        h('div', { class: 'sh-art' }, UI.itemArt(it)),
        h('div', null, h('div', { class: 'sh-name' }, I().name(it)), h('div', { class: 'sh-sub' }, sub))));

      if (it.kind === 'generator') {
        body.append(h('div', { class: 'sh-meta' },
          h('div', null, t('item.tapGen', { n: B().generators[it.generator].energy })),
          h('div', null, t(it.generator === 'seedSack' ? 'item.genSeed' : 'item.genAnimal'))));
        PN.openSheet(body, { type: 'item', index, id: it.id });
        return;
      }
      if (I().isBreed(it)) {
        body.append(PN.statRows(it), h('div', { style: { marginTop: '8px' } }, PN.geneLine(it)));
        const meta = h('div', { class: 'sh-meta' });
        const est = NOA.farm.estimateUnits(it);
        const tm = UI.dur(NOA.farm.growMs(it));
        meta.append(h('div', null, (it.kind === 'seed' ? '🌾 ' + t('item.harvestEst', { n: est, t: tm }) : '🥚 ' + t('item.cycleEst', { n: est, t: tm }))));
        if (it.kind === 'animal') meta.append(h('div', null, '🍽️ ' + t('item.eats', { list: (C().species[it.species].feed || []).map((f) => C().species[f].emoji + ' ' + t('species.' + f)).join(', ') })));
        if (it.charm) meta.append(h('div', null, t('item.charm', { name: C().boosters[it.charm].emoji + ' ' + t('booster.' + it.charm) })));
        if (!it.revealed && NOA.FEATURES.recessiveGenes && !it.gene) meta.append(h('div', null, t('item.hiddenCarrier')));
        if (I().isMaxed(it)) meta.append(h('div', null, '🏆 ' + t('item.maxed')));
        body.append(meta);
      }
      if (it.kind === 'product') {
        if (it.gene) body.append(h('div', { style: { marginTop: '8px' } }, PN.geneLine(it)));
        const sp = C().products[it.product].species;
        const eaters = Object.keys(C().species).filter((id) => (C().species[id].feed || []).indexOf(sp) >= 0 && !C().species[id].hybrid);
        if (eaters.length) body.append(h('div', { class: 'sh-meta' }, '🍽️ ' + t('item.feedHint', { animal: eaters.map((e) => C().species[e].emoji).join(' ') })));
      }
      body.append(h('div', { class: 'sh-meta' }, h('div', null, '🪙 ' + t('item.price') + ': ' + UI.num(NOA.board.salePrice(it)))));

      const acts = h('div', { class: 'sh-actions' });
      if (it.kind === 'seed') {
        const free = S().plots.findIndex((p) => !p.seed);
        acts.append(UI.btn('🌱 ' + t('item.plant'), 'sm leaf', () => {
          if (free < 0) { UI.toast(t('toast.plotBusy')); return; }
          NOA.farm.plant(free, index);
          NOA.audio.play('plant');
          PN.closeSheet();
        }, { disabled: free < 0 || it.locked }));
      }
      if (it.kind === 'animal') {
        const free = S().pens.findIndex((p) => !p.animal);
        acts.append(UI.btn('🏡 ' + t('item.toPen'), 'sm leaf', () => {
          NOA.farm.placeAnimal(free, index);
          NOA.audio.play('plant');
          PN.closeSheet();
        }, { disabled: free < 0 || it.locked }));
      }
      acts.append(UI.btn('🧺 ' + t('item.sell'), 'sm sun', () => { PN.closeSheet(); NOA.ui.screens.farm.sell(index); }, { disabled: it.locked }));
      acts.append(UI.btn((it.locked ? '🔓 ' + t('item.unlock') : '🔒 ' + t('item.lock')), 'sm ghost', () => { NOA.board.toggleLock(index); NOA.audio.play('tap'); PN.itemSheet(index); }));
      acts.append(UI.btn('📦 ' + t('item.toStorage'), 'sm ghost', () => {
        if (!NOA.board.toStorage(index)) UI.toast(t('toast.storageFull'), 'warn');
        PN.closeSheet();
      }, { disabled: S().storage.length >= S().storageCap }));
      if (I().isBreed(it) && !it.charm) {
        for (const id of ['clover', 'stabilizer', 'stardust']) {
          const n = S().boosters[id] || 0;
          if (n > 0) acts.append(UI.btn(t('item.attach', { emoji: C().boosters[id].emoji }) + ' (' + n + ')', 'sm ghost', () => {
            const r = NOA.board.applyBooster(id, index);
            if (r.ok) { NOA.audio.play('unlock'); UI.toast(t('booster.used', { name: C().boosters[id].emoji + ' ' + t('booster.' + id) }), 'good'); }
            PN.itemSheet(index);
          }));
        }
      }
      if (I().isBreed(it) && !it.revealed && (S().boosters.loupe || 0) > 0) {
        acts.append(UI.btn('🔍 (' + S().boosters.loupe + ')', 'sm ghost', () => {
          const r = NOA.board.applyBooster('loupe', index);
          if (r.ok) UI.toast(t('booster.revealed', { result: r.carrier ? t('item.carrier', { gene: C().genes[r.carrier].emoji + ' ' + t('gene.' + r.carrier) }) : t('item.noCarrier') }));
          PN.itemSheet(index);
        }));
      }
      // extension point: features add their own actions (see js/systems/essence.js)
      const extra = NOA.hooks.run('item.actions', [], it, index);
      extra.forEach((a) => acts.append(UI.btn(a.label, 'sm ' + (a.kind || 'ghost'), () => { a.run(); PN.closeSheet(); })));
      body.append(acts);
      PN.openSheet(body, { type: 'item', index, id: it.id });
    },

    /* ------------------------------------------------------------ plot / pen sheet */
    slotSheet(kind, index) {
      const slot = kind === 'plot' ? S().plots[index] : S().pens[index];
      const it = kind === 'plot' ? slot.seed : slot.animal;
      if (!it) return;
      const body = h('div');
      body.append(h('div', { class: 'sh-head' },
        h('div', { class: 'sh-art' }, UI.itemArt(it)),
        h('div', null, h('div', { class: 'sh-name' }, I().name(it)),
          h('div', { class: 'sh-sub' }, (kind === 'plot' ? t('farm.plot') + ' ' + (index + 1) : t('farm.penInfo', { n: index + 1 })) + ' · ' + t('ui.lv', { n: it.level })))));
      body.append(PN.statRows(it), h('div', { style: { marginTop: '8px' } }, PN.geneLine(it)));
      const meta = h('div', { class: 'sh-meta' });
      if (slot.end) meta.append(h('div', null, '⏳ ' + (NOA.farm.isReady(slot) ? t('ui.ready') : t('ui.left', { t: UI.dur(slot.end - NOA.time.now()) }))));
      if (kind === 'pen') {
        meta.append(h('div', null, '🍽️ ' + t('farm.feed', { n: slot.feed }) + ' · ' + t('item.eats', { list: (C().species[it.species].feed || []).map((f) => C().species[f].emoji).join(' ') })));
      }
      meta.append(h('div', null, '🌾 ' + t(kind === 'plot' ? 'item.harvestEst' : 'item.cycleEst', { n: NOA.farm.estimateUnits(it), t: UI.dur(NOA.farm.growMs(it)) })));
      body.append(meta);
      const acts = h('div', { class: 'sh-actions' });
      if (slot.end && !NOA.farm.isReady(slot)) {
        acts.append(UI.btn(t('farm.tonic', { n: S().boosters.tonic || 0 }), 'sm sun', () => {
          if (NOA.farm.tonic(kind, index)) { NOA.audio.play('purity'); PN.closeSheet(); }
          else UI.toast(t('booster.none', { name: t('booster.tonic') }));
        }, { disabled: !(S().boosters.tonic > 0) }));
      }
      if (kind === 'pen') {
        acts.append(UI.btn('↩️ ' + t('farm.removeAnimal'), 'sm ghost', () => {
          if (!NOA.farm.removeAnimal(index)) UI.toast(t('toast.boardFull'), 'warn');
          PN.closeSheet();
        }));
      }
      body.append(acts);
      PN.openSheet(body, { type: 'slot', kind, index });
    },

    /* ------------------------------------------------------------ storage */
    storageModal() {
      UI.modal({
        title: '📦 ' + t('farm.storage') + ' ' + S().storage.length + '/' + S().storageCap,
        body: (b, m) => {
          const render = () => {
            UI.clear(b);
            if (!S().storage.length) { b.append(h('p', { class: 'muted', style: { textAlign: 'center' } }, t('ui.empty'))); return; }
            const grid = h('div', { class: 'pick-grid' });
            S().storage.forEach((it, i) => {
              grid.append(h('button', {
                type: 'button', class: 'pick', title: I().name(it),
                on: {
                  click: () => {
                    if (NOA.board.takeFromStorage(i) < 0) { UI.toast(t('toast.boardFull'), 'warn'); return; }
                    NOA.audio.play('drop');
                    render();
                  }
                }
              }, UI.itemArt(it)));
            });
            b.append(grid);
          };
          render();
        }
      });
    },

    /* ------------------------------------------------------------ energy */
    energyModal() {
      const shopIds = ['energy_small', 'energy_50'];
      UI.modal({
        title: '⚡ ' + t('res.energy'),
        body: (b) => {
          const ms = NOA.res.energyNextMs();
          b.append(h('p', { style: { textAlign: 'center', fontWeight: '800', fontSize: '18px' } },
            UI.num(S().res.energy) + ' / ' + NOA.res.energyMax() + (ms ? '  ·  +1 ' + UI.dur(ms) : '  ·  ' + t('hud.energyFull'))));
          const grid = h('div', { class: 'shop-grid' });
          shopIds.forEach((id) => grid.append(NOA.ui.screens.shop.itemCard(NOA.shop.find(id))));
          b.append(grid);
        }
      });
    },

    /* ------------------------------------------------------------ daily login */
    loginModal(auto) {
      const days = B().login.days;
      const idx = NOA.rewards.login.dayIndex();
      const can = NOA.rewards.login.canClaim();
      UI.modal({
        title: '📅 ' + t('login.title'),
        body: (b) => {
          const grid = h('div', { class: 'login-grid' });
          // after claiming day 7 the index wraps to 0, so the whole week shows as claimed today
          const doneCount = can ? idx : (idx === 0 && S().login.claimed > 0 ? days.length : idx);
          days.forEach((d, i) => {
            const prev = UI.rewardPreview(d);
            const done = i < doneCount;
            const today = can && i === idx;
            grid.append(h('div', { class: 'lday' + (done ? ' done' : '') + (today ? ' today' : '') + (i === days.length - 1 ? ' big' : '') },
              h('span', null, t('login.day', { n: i + 1 })),
              h('span', { class: 'le' }, prev.map((p) => p.icon).join('')),
              h('small', null, prev.map((p) => '+' + UI.compact(p.n)).join(' ')),
              done ? h('small', null, '✓ ' + t('login.claimed')) : today ? h('small', null, t('login.today')) : null));
          });
          b.append(grid);
          if (!can) b.append(h('p', { class: 'muted', style: { textAlign: 'center' } }, t('login.tomorrow')));
        },
        actions: can ? [{
          label: t('ui.claim'), kind: 'leaf', onClick: () => {
            const r = NOA.rewards.login.claim();
            if (!r) return;
            NOA.audio.play('levelUp');
            NOA.ui.fx.confetti(innerWidth / 2, innerHeight * 0.4, 60);
            PN.rewardsToast(r.granted);
            NOA.ui.hud.update();
          }
        }] : [{ label: t('ui.ok'), kind: 'ghost' }]
      });
      void auto;
    },
    rewardsToast(entries) {
      if (!entries || !entries.length) return;
      UI.toast(entries.map((e) => e.icon + ' +' + UI.num(e.n)).join('   '), 'good');
      const hud = NOA.ui.hud.els;
      const c = { x: innerWidth / 2, y: innerHeight * 0.45 };
      entries.forEach((e) => {
        if (e.icon === '🪙') NOA.ui.fx.flyTo(c, hud.coins, '🪙', 6);
        if (e.icon === '💎') NOA.ui.fx.flyTo(c, hud.gems, '💎', 4);
        if (e.icon === '⚡') NOA.ui.fx.flyTo(c, hud.energy, '⚡', 4);
      });
    },

    /* ------------------------------------------------------------ level up (queued) */
    _levelQueue: [],
    levelUp(e) {
      PN._levelQueue.push(e);
      if (PN._levelQueue.length === 1) PN._showLevel();
    },
    _showLevel() {
      const e = PN._levelQueue[0];
      if (!e) return;
      NOA.audio.play('levelUp');
      NOA.audio.vibrate([20, 40, 20, 40, 60]);
      NOA.ui.fx.confetti(innerWidth / 2, innerHeight * 0.35, 90);
      UI.modal({
        title: t('level.title', { n: e.level }),
        body: (b) => {
          b.append(h('div', { class: 'levelup-num' }, String(e.level)));
          b.append(h('h3', { style: { textAlign: 'center' } }, t('level.rewards')), UI.rewardChips(e.granted));
          const list = [];
          e.unlocks.species.forEach((id) => list.push([C().species[id].emoji, t('species.' + id)]));
          e.unlocks.features.forEach((f) => list.push(['✨', t('unlock.' + f)]));
          if (e.unlocks.plots) list.push(['🟫', t('unlock.plot')]);
          if (e.unlocks.pens) list.push(['🏡', t('unlock.pen')]);
          if (list.length) {
            b.append(h('h3', { style: { textAlign: 'center' } }, t('level.unlocks')),
              h('div', { class: 'unlock-list' }, list.map(([ic, tx]) => h('div', null, h('span', { style: { fontSize: '20px' } }, ic), tx))));
          }
        },
        actions: [{ label: t('ui.claim'), kind: 'leaf' }],
        onClose: () => {
          PN._levelQueue.shift();
          NOA.ui.hud.update();
          NOA.ui.renderTabs();
          if (NOA.ui.current === 'farm') NOA.ui.screens.farm.renderField();
          if (PN._levelQueue.length) setTimeout(PN._showLevel, 250);
        }
      });
    },

    /* ------------------------------------------------------------ order details */
    orderModal(o) {
      const fresh = S().orders.find((x) => x.id === o.id);
      if (!fresh) return;
      const avail = NOA.orders.availability(fresh);
      const est = NOA.orders.estimate(fresh);
      UI.modal({
        title: C().npcs[fresh.npc].emoji + ' ' + t('npc.' + fresh.npc),
        body: (b) => {
          if (fresh.vip) b.append(h('p', { class: 'notice' }, '✨ ' + t('order.vip')));
          if (fresh.earth) b.append(h('p', { class: 'notice' }, '🌍 ' + t('order.earth') + ' · ' + t('sky.earth', { n: S().earth })));
          fresh.lines.forEach((l, i) => {
            const p = C().products[l.product];
            const have = Math.min(l.count, l.filled + avail[i]);
            b.append(h('div', { class: 'gene-line' + (have >= l.count ? ' on' : ''), style: { '--gc': '#9be37a' } },
              h('span', { style: { fontSize: '22px' } }, p.emoji),
              h('span', null, t('product.' + l.product) + ' · ' + have + '/' + l.count),
              l.needGene ? h('span', { class: 'muted' }, '🧬 ' + t('order.needGene')) : null,
              l.minStars ? h('span', { class: 'muted' }, t('order.minStars', { n: l.minStars })) : null));
          });
          b.append(h('p', { style: { textAlign: 'center', fontWeight: '800' } }, t('order.reward') + ': 🪙' + UI.num(est.coins) + ' · ⭐' + est.xp + ' XP'));
        },
        actions: [
          { label: '⟳ ' + t('order.swap'), kind: 'ghost', disabled: !NOA.orders.canSwap(fresh), onClick: () => NOA.orders.swap(fresh.id) },
          {
            label: t('order.deliver'), kind: 'leaf', disabled: !NOA.orders.canDeliver(fresh), onClick: () => {
              const r = NOA.orders.deliver(fresh.id);
              if (r && r.complete) NOA.ui.screens.farm.celebrateOrder({ x: innerWidth / 2, y: innerHeight / 2 }, r.reward);
            }
          }
        ]
      });
    },

    /* ------------------------------------------------------------ secret discovered */
    secret(e) {
      NOA.audio.play('secret');
      NOA.ui.fx.confetti(innerWidth / 2, innerHeight * 0.4, 50);
      UI.modal({
        title: '🔮 ' + t('secret.unlocked'),
        body: (b) => {
          b.append(h('div', { style: { fontSize: '56px', textAlign: 'center', lineHeight: '1.1' } }, C().secrets[e.id].icon),
            h('h3', { style: { textAlign: 'center', fontSize: '20px' } }, t('secret.' + e.id + '.title')),
            h('p', { style: { textAlign: 'center' } }, t('secret.' + e.id + '.desc')));
          if (e.granted && e.granted.length) b.append(UI.rewardChips(e.granted));
        },
        actions: [{ label: t('ui.ok'), kind: 'leaf' }]
      });
    }
  };
})();
