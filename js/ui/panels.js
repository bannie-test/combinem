/*
 * Panels: the bottom sheet used by the farm map (seed picker, field, pen, workshop, bee-ship),
 * breed / barn-goods info sheets, and the daily gift, level-up and secret pop-ups.
 * Sheets rebuild themselves from a builder function, so they stay live while the farm runs.
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

  let sheet = null;
  let sheetBody = null;
  let sheetKey = null;
  let sheetBuild = null;

  const goodsList = (ids) => ids.map((id) => I().goodEmoji(id) + ' ' + I().goodName(id)).join(', ');
  const timer = (until) => h('b', { class: 'num', data: { until: String(until) } }, UI.dur(until - NOA.time.now()));
  const bar = (from, to) => h('span', { class: 'pbar' }, h('i', { data: { from: String(from), to: String(to) }, style: { width: (U01((NOA.time.now() - from) / Math.max(1, to - from)) * 100) + '%' } }));
  const U01 = (v) => Math.max(0, Math.min(1, v));
  const notEnough = (name) => UI.toast(t('toast.notEnough', { name }), 'warn');

  const PN = NOA.ui.panels = {
    /* ================================================================ sheet */
    sheetOpen() { return !!sheet; },
    sheetKey() { return sheetKey; },
    showSheet(key, build) {
      const body = h('div', { class: 'sh-body' });
      if (build(body) === false) { PN.closeSheet(); return; }
      if (!sheet) {
        sheet = h('div', { class: 'sheet', role: 'dialog', 'aria-label': t('ui.close') },
          h('button', { type: 'button', class: 'btn-icon sh-x', 'aria-label': t('ui.close'), on: { click: () => { NOA.audio.play('close'); PN.closeSheet(); } } }, '✕'));
        document.body.append(sheet);
      }
      const scroll = sheetKey === key && sheetBody ? sheet.scrollTop : 0;
      if (sheetBody) sheetBody.replaceWith(body);
      else sheet.append(body);
      sheetBody = body;
      sheet.scrollTop = scroll;
      if (sheetKey !== key) { const prev = sheetKey; sheetKey = key; onKeyChange(prev, key); }
      sheetBuild = build;
    },
    closeSheet() {
      if (!sheet) return;
      sheet.remove();
      const prev = sheetKey;
      sheet = sheetBody = sheetKey = sheetBuild = null;
      onKeyChange(prev, null);
    },
    /** Rebuild the open sheet (optionally only when its key starts with a prefix) */
    refreshSheet(prefix) {
      if (!sheet || !sheetBuild) return;
      if (prefix && !sheetKey.startsWith(prefix)) return;
      PN.showSheet(sheetKey, sheetBuild);
    },
    tick() {
      if (!sheet) return;
      const now = NOA.time.now();
      let expired = false;
      sheet.querySelectorAll('[data-until]').forEach((el) => {
        const left = Number(el.dataset.until) - now;
        if (left <= 0) expired = true;
        el.textContent = UI.dur(left);
      });
      sheet.querySelectorAll('.pbar i[data-to]').forEach((el) => {
        const a = Number(el.dataset.from), b = Number(el.dataset.to);
        el.style.width = (U01((now - a) / Math.max(1, b - a)) * 100) + '%';
      });
      if (expired) PN.refreshSheet();
    },

    /* ================================================================ shared bits */
    statRows(it) {
      const rows = h('div', { class: 'stats' });
      const g = I().geneDef(it);
      const icons = { yield: '🌾', growth: '⏱️', quality: '⭐' };
      for (const s of I().STATS) {
        const base = it.stats[s];
        const bonus = I().geneBonus(it, s);
        rows.append(h('div', { class: 'stat', style: g ? { '--gc': g.color } : null },
          h('span', { class: 'si' }, icons[s]),
          h('span', null, t('stat.' + s)),
          h('span', { class: 'bar' },
            h('i', { style: { width: Math.min(100, base) + '%' } }),
            bonus ? h('i', { class: 'bonus', style: { left: Math.min(100, base) + '%', width: Math.min(100 - base, bonus) + '%' } }) : null),
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
    /** What a breed produces: yield, time, next generation, byproduct, feed */
    breedMeta(it) {
      const meta = h('div', { class: 'sh-meta' });
      const sp = C().species[it.species];
      const est = NOA.farm.estimateUnits(it);
      const tm = UI.dur(NOA.farm.growMs(it));
      const childLv = Math.max(1, it.level - B().harvest.seeds.levelDrop);
      if (it.kind === 'seed') {
        meta.append(h('div', null, '🌾 ' + t('item.harvestEst', { n: est, t: tm })));
        const sc = B().harvest.seeds;
        const n = (sc.countByLevel[it.level] || 1) + sc.extraChance + I().stat(it, 'yield') * sc.extraPerYieldPoint;
        meta.append(h('div', null, '🌰 ' + t('item.seedsEst', { n: (Math.round(n * 10) / 10).toLocaleString(NOA.i18n.locale()), lv: childLv })));
        if (sp.byproduct) meta.append(h('div', null, C().materials[sp.byproduct].emoji + ' ' + t('codex.byproduct', { list: t('material.' + sp.byproduct) })));
      } else {
        meta.append(h('div', null, '🧺 ' + t('item.cycleEst', { n: est, t: tm })));
        const lv = B().livestock;
        meta.append(h('div', null, '🐣 ' + t('item.youngEst', { p: UI.pct(lv.offspringChance + lv.offspringPerLevel * it.level), lv: childLv })));
        meta.append(h('div', null, '🍽️ ' + t('item.eats', { list: goodsList(sp.feed || []) })));
        if (sp.manure) meta.append(h('div', null, '💩 ' + t('material.manure')));
      }
      if (it.charm) meta.append(h('div', null, t('item.charm', { name: C().boosters[it.charm].emoji + ' ' + t('booster.' + it.charm) })));
      if (!it.revealed && NOA.FEATURES.recessiveGenes && !it.gene) meta.append(h('div', null, t('item.hiddenCarrier')));
      if (I().isMaxed(it)) meta.append(h('div', null, '🏆 ' + t('item.maxed')));
      return meta;
    },
    head(art, name, sub) {
      return h('div', { class: 'sh-head' }, h('div', { class: 'sh-art' }, art), h('div', null, h('div', { class: 'sh-name' }, name), sub ? h('div', { class: 'sh-sub' }, sub) : null));
    },

    /* ================================================================ fields */
    seedPicker(bed, idx) {
      PN.showSheet('picker:' + bed + ':' + idx, (b) => {
        const plot = S().fields[bed][idx];
        if (!plot || plot.seed) return false;
        b.append(h('div', { class: 'sh-title' }, (bed === 'crop' ? '🌱 ' + t('picker.title') : '🌸 ' + t('picker.titleFlower')) + ' · ' + t('farm.plot') + ' ' + (idx + 1)));
        const manure = NOA.barn.count('manure');
        b.append(h('div', { class: 'sh-actions' },
          plot.fert ? h('span', { class: 'ev' }, '💩 ' + t('plot.fert'))
            : UI.btn(t('plot.fertilize', { n: manure }), 'sm ghost', () => {
              const r = NOA.farm.fertilize(bed, idx);
              if (r.ok) NOA.audio.play('plant');
              else notEnough(t('material.manure'));
            }, { disabled: !manure }),
          UI.btn('🛒 ' + t('picker.buy'), 'sm ghost', () => UI.show('shop', { tab: 'breeds' }))));
        const cells = S().vault.cells;
        const list = [];
        cells.forEach((it, i) => { if (NOA.farm.plotFits(bed, it) && !it.locked) list.push(i); });
        list.sort((a, c) => (!!cells[c].gene - !!cells[a].gene) || (cells[c].level - cells[a].level) || (I().statTotal(cells[c]) - I().statTotal(cells[a])));
        if (!list.length) { b.append(h('p', { class: 'notice' }, t('picker.empty'))); return true; }
        const grid = h('div', { class: 'pick-grid' });
        list.forEach((i) => {
          const it = cells[i];
          grid.append(h('button', {
            type: 'button', class: 'pick', title: I().name(it) + ' Lv' + it.level, 'aria-label': I().name(it) + ' Lv' + it.level,
            on: { click: () => PN.plantFromPicker(bed, idx, i) }
          }, UI.itemArt(it), h('small', { class: 'pick-t' }, UI.dur(NOA.farm.growMs(it)))));
        });
        b.append(grid);
        return true;
      });
    },
    plantFromPicker(bed, idx, vaultIdx) {
      const it = S().vault.cells[vaultIdx];
      if (!NOA.farm.plant(bed, idx, vaultIdx)) { NOA.audio.play('invalid'); return; }
      NOA.audio.play('plant');
      NOA.audio.vibrate(8);
      const el = document.getElementById('plot-' + bed + '-' + idx);
      if (el) {
        const c = UI.center(el);
        FX().burst(c.x, c.y, { count: 12, colors: ['#8a5a37', '#c08a5f', '#5cbb49'], shapes: ['circle', 'leaf'], speed: 150 });
        FX().float(c.x, c.y - 10, I().emoji(it) + ' Lv' + it.level, 'good');
      }
      const next = S().fields[bed].findIndex((p) => !p.seed);
      const more = S().vault.cells.some((x) => NOA.farm.plotFits(bed, x) && !x.locked);
      if (next >= 0 && more) PN.seedPicker(bed, next);
      else PN.closeSheet();
    },
    plotSheet(bed, idx) {
      PN.showSheet('plot:' + bed + ':' + idx, (b) => {
        const plot = S().fields[bed][idx];
        if (!plot || !plot.seed || NOA.farm.isReady(plot)) return false;
        const it = plot.seed;
        b.append(PN.head(UI.itemArt(it), I().name(it), t('farm.plot') + ' ' + (idx + 1) + ' · ' + t('ui.lv', { n: it.level })));
        b.append(h('div', { class: 'grow-row' }, '⏳ ', timer(plot.end), bar(plot.start, plot.end)));
        b.append(PN.statRows(it), h('div', { style: { marginTop: '8px' } }, PN.geneLine(it)), PN.breedMeta(it));
        const manure = NOA.barn.count('manure');
        b.append(h('div', { class: 'sh-actions' },
          UI.btn(t('farm.tonic', { n: S().boosters.tonic || 0 }), 'sm sun', () => {
            if (NOA.farm.tonicPlot(bed, idx)) { NOA.audio.play('purity'); PN.closeSheet(); }
            else UI.toast(t('booster.none', { name: t('booster.tonic') }));
          }, { disabled: !(S().boosters.tonic > 0) }),
          plot.fert ? h('span', { class: 'ev' }, '💩 ' + t('plot.fert'))
            : UI.btn(t('plot.fertilize', { n: manure }), 'sm ghost', () => {
              if (NOA.farm.fertilize(bed, idx).ok) { NOA.audio.play('plant'); PN.refreshSheet(); }
            }, { disabled: !manure })));
        return true;
      });
    },

    /* ================================================================ pens */
    penPanel(penId) {
      PN.showSheet('pen:' + penId, (b) => {
        const pen = S().pens[penId];
        const def = C().buildings[penId];
        const species = NOA.farm.penSpecies(penId).filter((sp) => !C().species[sp].hybrid);
        const feeds = [...new Set(species.flatMap((sp) => C().species[sp].feed || []))];
        b.append(h('div', { class: 'sh-title' }, def.emoji + ' ' + t('bld.' + penId) + ' · ' + t('pen.slots', { n: pen.slots.filter(Boolean).length, max: pen.slots.length })));
        b.append(h('p', { class: 'muted tiny' }, t('pen.eats', { list: feeds.map((f) => I().goodEmoji(f) + ' ' + I().goodName(f) + ' (' + t('ui.have', { n: NOA.barn.count(f) }) + ')').join(', ') })));
        const list = h('div', { class: 'slot-list' });
        const now = NOA.time.now();
        pen.slots.forEach((slot, i) => {
          if (!slot) {
            list.append(h('button', { type: 'button', class: 'slot-row empty', on: { click: () => PN.animalPicker(penId) } }, h('span', { class: 'sr-art' }, '＋'), h('span', null, t('pen.add'))));
            return;
          }
          const a = slot.animal;
          let state;
          if (!slot.end) state = h('span', { class: 'sr-state hungry' }, '🍽️ ' + t('pen.hungry'));
          else if (now >= slot.end) state = h('span', { class: 'sr-state ready' }, '✋ ' + t('pen.ready'));
          else state = h('span', { class: 'sr-state' }, '⏳ ', timer(slot.end), bar(slot.start, slot.end));
          list.append(h('div', { class: 'slot-row' },
            h('span', { class: 'sr-art' }, UI.itemArt(a)),
            h('span', { class: 'sr-name' }, I().name(a) + ' Lv' + a.level, state),
            !slot.end || now < slot.end ? h('button', {
              type: 'button', class: 'btn-icon', title: t('pen.back'), 'aria-label': t('pen.back'),
              on: { click: () => { if (!NOA.farm.removeAnimal(penId, i)) UI.toast(t('grid.full', { grid: t('grid.nursery') }), 'warn'); else NOA.audio.play('drop'); } }
            }, '↩') : null));
        });
        b.append(list);
        const ready = NOA.farm.readyCount(penId);
        const hungry = pen.slots.filter((s) => NOA.farm.hungry(s)).length;
        const cost = NOA.farm.nextSlotCost(penId);
        b.append(h('div', { class: 'sh-actions' },
          UI.btn('🍽️ ' + t('pen.feedAll'), hungry ? 'sm leaf' : 'sm ghost', () => {
            const r = NOA.farm.feedAll(penId);
            if (r.fed) {
              NOA.audio.play('plant');
              const el = document.getElementById('bld-' + penId);
              if (el) { const c = UI.center(el); FX().float(c.x, c.y, t('pen.fed', { n: r.fed }), 'good'); }
            }
            if (r.missing.length) { NOA.audio.play('invalid'); UI.toast(t('pen.noFeed', { list: goodsList(r.missing) }), 'warn'); }
          }, { disabled: !hungry }),
          UI.btn('✋ ' + t('pen.collect') + (ready ? ' (' + ready + ')' : ''), ready ? 'sm sun' : 'sm ghost', () => NOA.ui.screens.farm.collectPen(penId), { disabled: !ready }),
          UI.btn('🧃 ' + (S().boosters.tonic || 0), 'sm ghost', () => {
            if (NOA.farm.tonicPen(penId)) NOA.audio.play('purity');
            else UI.toast(t('booster.' + (S().boosters.tonic ? 'tonic.desc' : 'none'), { name: t('booster.tonic') }));
          }, { disabled: !(S().boosters.tonic > 0), title: t('booster.tonic') }),
          cost != null ? UI.btn(t('pen.addSlot', { cost: UI.num(cost) + '🪙' }), 'sm ghost', () => {
            const r = NOA.farm.unlockSlot(penId);
            if (r.ok) NOA.audio.play('unlock');
            else notEnough(t('res.coins'));
          }) : null));
        return true;
      });
    },
    animalPicker(penId) {
      const cells = S().nursery.cells;
      const list = [];
      cells.forEach((it, i) => { if (NOA.farm.penFits(penId, it) && !it.locked) list.push(i); });
      UI.modal({
        title: t('pen.add'),
        body: (b, m) => {
          if (!list.length) {
            b.append(h('p', { class: 'notice' }, t('pen.noAnimal')), UI.btn('🛒 ' + t('shop.breeds'), 'ghost', () => { m.close(); UI.show('shop', { tab: 'breeds' }); }));
            return;
          }
          const grid = h('div', { class: 'pick-grid' });
          list.forEach((i) => grid.append(h('button', {
            type: 'button', class: 'pick', title: I().name(cells[i]), 'aria-label': I().name(cells[i]) + ' Lv' + cells[i].level,
            on: {
              click: () => {
                const r = NOA.farm.placeAnimal(penId, i);
                if (r.ok) { NOA.audio.play('plant'); m.close(); }
                else UI.toast(t('grid.noPen', { pen: t('bld.' + penId) }), 'warn');
              }
            }
          }, UI.itemArt(cells[i]))));
          b.append(grid);
        }
      });
    },

    /* ================================================================ workshops */
    factoryPanel(bId) {
      PN.showSheet('factory:' + bId, (b) => {
        const P = NOA.production;
        const def = C().buildings[bId];
        const q = P.queue(bId);
        const slots = P.slots(bId);
        const now = NOA.time.now();
        b.append(h('div', { class: 'sh-title' }, def.emoji + ' ' + t('bld.' + bId) + ' · ' + t('prod.queue', { n: q.length, max: slots })));
        const strip = h('div', { class: 'queue' });
        for (let i = 0; i < slots; i++) {
          const j = q[i];
          if (!j) { strip.append(h('span', { class: 'qslot empty' })); continue; }
          const ready = now >= j.end;
          const running = !ready && now >= j.start;
          strip.append(h('span', { class: 'qslot' + (ready ? ' ready' : running ? ' run' : ' wait') },
            UI.goodArt(j.pid, j.stars, j.gene),
            ready ? h('small', null, '✓') : running ? h('small', null, timer(j.end)) : h('small', null, t('prod.waiting'))));
        }
        const cost = P.nextSlotCost(bId);
        if (cost != null) strip.append(h('button', { type: 'button', class: 'qslot add', title: t('prod.addSlot', { cost: UI.num(cost) + '🪙' }), on: { click: () => { if (P.unlockSlot(bId).ok) NOA.audio.play('unlock'); else notEnough(t('res.coins')); } } }, '＋', h('small', null, UI.compact(cost) + '🪙')));
        b.append(strip);
        const run = q.find((j) => now >= j.start && now < j.end);
        if (run) b.append(h('div', { class: 'grow-row' }, I().goodEmoji(run.pid) + ' ', timer(run.end), bar(run.start, run.end)));
        const readyN = P.readyJobs(bId).length;
        const acts = h('div', { class: 'sh-actions' });
        if (readyN) acts.append(UI.btn('✋ ' + t('prod.collect') + ' (' + readyN + ')', 'sm sun', () => NOA.ui.screens.farm.collectFactory(bId)));
        if (run) acts.append(UI.btn('🧃 ' + (S().boosters.tonic || 0), 'sm ghost', () => { if (P.tonic(bId)) NOA.audio.play('purity'); }, { disabled: !(S().boosters.tonic > 0), title: t('booster.tonic') }));
        if (acts.children.length) b.append(acts);

        const list = h('div', { class: 'recipes' });
        P.recipesFor(bId).forEach((pid) => {
          const r = B().recipes[pid];
          const open = P.recipeUnlocked(pid);
          const inputs = Object.keys(r.inputs).map((id) => {
            const have = NOA.barn.count(id);
            return h('span', { class: 'inp' + (have >= r.inputs[id] ? ' ok' : ''), title: I().goodName(id) },
              I().goodEmoji(id), h('b', { class: 'num' }, have + '/' + r.inputs[id]));
          });
          const can = open && P.canStart(pid);
          list.append(h('div', { class: 'recipe' + (open ? '' : ' locked') },
            h('span', { class: 'rc-art' }, UI.goodArt(pid, 1, null)),
            h('span', { class: 'rc-main' },
              h('span', { class: 'rc-name' }, I().goodName(pid)),
              h('span', { class: 'rc-in' }, inputs),
              h('span', { class: 'rc-meta' }, '⏱ ' + UI.dur(P.jobMs(pid)) + ' · 🪙 ' + UI.num(I().productValue(pid, 1, null)))),
            open ? UI.btn(t('prod.make'), can ? 'sm leaf' : 'sm ghost', () => PN.startJob(bId, pid), { disabled: !can })
              : h('span', { class: 'muted tiny' }, '🔒 ' + t('prod.recipeLocked'))));
        });
        b.append(list);
        return true;
      });
    },
    startJob(bId, pid) {
      const r = NOA.production.start(pid);
      if (r.ok) {
        NOA.audio.play('swoosh');
        UI.toast(t('prod.started', { name: I().goodEmoji(pid) + ' ' + I().goodName(pid) }));
        return;
      }
      NOA.audio.play('invalid');
      UI.toast(r.error === 'queue' ? t('prod.full') : t('prod.missing'), 'warn');
    },

    /* ================================================================ bee-ship */
    shipPanel() {
      PN.showSheet('ship', (b) => {
        const SH = NOA.ship;
        b.append(h('div', { class: 'sh-title' }, '🚀 ' + t('unlock.ship')));
        if (!SH.open()) { b.append(h('p', { class: 'notice' }, t('ship.locked', { level: B().unlocks.ship }))); return true; }
        if (!SH.docked()) {
          b.append(h('p', { class: 'notice' }, '✈️ ', t('ship.away', { t: '' }), timer(S().ship.until)));
          b.append(h('p', { class: 'muted', style: { fontStyle: 'italic' } }, t('ship.letter')));
          return true;
        }
        b.append(h('div', { class: 'grow-row' }, '⏳ ' + t('ship.docked', { t: '' }), timer(S().ship.until)));
        const list = h('div', { class: 'slot-list' });
        S().ship.crates.forEach((c, i) => {
          const have = NOA.barn.count(c.product);
          list.append(h('div', { class: 'slot-row' + (c.filled ? ' done' : '') },
            h('span', { class: 'sr-art' }, UI.goodArt(c.product, 1, null)),
            h('span', { class: 'sr-name' }, t('ship.crate', { n: i + 1 }) + ': ' + I().goodName(c.product) + ' ×' + c.count,
              h('span', { class: 'sr-state' }, c.filled ? '✅ ' + t('ship.filled') : t('ui.have', { n: have }) + ' · 🪙≈' + UI.num(Math.round(SH.crateValue(c))))),
            c.filled ? null : UI.btn(t('ship.fill'), SH.canFill(i) ? 'sm leaf' : 'sm ghost', () => {
              const r = SH.fill(i);
              if (!r) { NOA.audio.play('invalid'); UI.toast(t('prod.missing'), 'warn'); return; }
              NOA.audio.play('coin');
              const el = document.getElementById('bld-dock');
              const c2 = el ? UI.center(el) : { x: innerWidth / 2, y: innerHeight / 2 };
              FX().flyTo(c2, NOA.ui.hud.els.coins, '🪙', 4);
              FX().float(c2.x, c2.y - 10, '+' + UI.num(r.coins) + '🪙', 'big');
            }, { disabled: !SH.canFill(i) })));
        });
        b.append(list);
        b.append(h('p', { class: 'muted tiny' }, t('ship.bonus', { gems: B().ship.allBonus.gems, rp: B().ship.allBonus.rp, earth: B().ship.earthProgress })));
        b.append(h('div', { class: 'sh-actions' }, UI.btn('🚀 ' + t('ship.depart'), SH.allFilled() ? 'sm berry' : 'sm ghost', () => {
          const go = () => {
            const r = SH.depart();
            if (!r) return;
            NOA.audio.play(r.full ? 'levelUp' : 'swoosh');
            if (r.full) {
              FX().confetti(innerWidth / 2, innerHeight * 0.4, 70);
              UI.toast(t('ship.departedFull', { n: B().ship.earthProgress }), 'good');
              PN.rewardsToast(r.granted);
            } else UI.toast(t('ship.departed'));
          };
          if (SH.allFilled()) go();
          else UI.modal({ title: t('ship.depart'), body: h('p', { style: { textAlign: 'center' } }, t('ship.leaveEarly')), actions: [{ label: t('ui.cancel'), kind: 'ghost' }, { label: t('ui.confirm'), kind: 'berry', onClick: go }] });
        })));
        return true;
      });
    },

    /* ================================================================ barn goods */
    goodSheet(key) {
      PN.showSheet('good:' + key, (b) => {
        const n = NOA.barn.items()[key] || 0;
        if (!n) return false;
        const p = I().parseKey(key);
        const mat = I().isMaterial(p.pid);
        const sub = [mat ? t('barn.materials') : t('tier.n', { n: I().tierOf(p.pid) })];
        if (!mat) sub.push(t('item.stars', { n: p.stars }));
        b.append(PN.head(UI.goodArt(p.pid, p.stars, p.gene), I().goodName(p.pid, p.gene) + ' ×' + n, sub.join(' · ')));
        if (p.gene) {
          const g = C().genes[p.gene.id];
          b.append(h('div', { class: 'gene-line on', style: { '--gc': g.color } }, '🧬 ' + g.emoji + ' ' + t('gene.' + p.gene.id), h('span', { class: 'pur' }, I().purityText(p.gene.purity))));
        }
        const meta = h('div', { class: 'sh-meta' });
        if (mat) meta.append(h('div', null, t('material.' + p.pid + '.desc')));
        const usedIn = Object.keys(B().recipes).filter((r) => B().recipes[r].inputs[p.pid]);
        if (usedIn.length) meta.append(h('div', null, '🏭 ' + t('codex.usedIn', { list: goodsList(usedIn) })));
        const eaters = Object.keys(C().species).filter((sp) => !C().species[sp].hybrid && (C().species[sp].feed || []).indexOf(p.pid) >= 0);
        if (eaters.length) meta.append(h('div', null, '🍽️ ' + t('barn.eatenBy', { list: eaters.map((sp) => C().species[sp].emoji + ' ' + t('species.' + sp)).join(', ') })));
        meta.append(h('div', null, '🪙 ' + t('item.price') + ': ' + UI.num(NOA.barn.quote(key, 1))));
        b.append(meta);
        const sell = (k) => {
          const r = NOA.barn.sell(key, k);
          if (!r) return;
          NOA.audio.play('sell');
          const c = sheet ? UI.center(sheet) : { x: innerWidth / 2, y: innerHeight / 2 };
          FX().flyTo(c, NOA.ui.hud.els.coins, '🪙', Math.min(8, 2 + Math.floor(r.total / 40)));
          FX().float(c.x, c.y - 40, '+' + UI.num(r.total) + '🪙', 'big');
        };
        b.append(h('div', { class: 'sh-actions' },
          UI.btn(t('barn.sell1') + ' · ' + UI.num(NOA.barn.quote(key, 1)) + '🪙', 'sm sun', () => sell(1)),
          n > 1 ? UI.btn(t('barn.sellAll') + ' · ' + UI.num(NOA.barn.quote(key, n)) + '🪙', 'sm ghost', () => {
            UI.modal({
              title: t('barn.sellAll'),
              body: h('p', { style: { textAlign: 'center', fontWeight: '800' } }, I().goodEmoji(p.pid) + ' ' + I().goodName(p.pid, p.gene) + ' ×' + n + ' → ' + UI.num(NOA.barn.quote(key, n)) + '🪙'),
              actions: [{ label: t('ui.cancel'), kind: 'ghost' }, { label: t('ui.confirm'), kind: 'sun', onClick: () => sell(n) }]
            });
          }) : null));
        return true;
      });
    },

    /* ================================================================ breeds in the vault / nursery */
    itemSheet(grid, index) {
      const first = S()[grid].cells[index];
      if (!first) return;
      const id = first.id;
      PN.showSheet('item:' + grid + ':' + index, (b) => {
        const it = S()[grid].cells[index];
        if (!it || it.id !== id) return false;
        const sp = C().species[it.species];
        let sub = t(it.kind === 'seed' ? 'kind.seed' : 'kind.animal') + ' · ' + t('ui.lv', { n: it.level }) + (sp.hybrid ? ' · ' + t('item.hybrid') : '');
        b.append(PN.head(UI.itemArt(it), I().name(it), sub));
        b.append(PN.statRows(it), h('div', { style: { marginTop: '8px' } }, PN.geneLine(it)), PN.breedMeta(it));
        b.append(h('div', { class: 'sh-meta' }, h('div', null, '🪙 ' + t('item.price') + ': ' + UI.num(NOA.grids.salePrice(it)))));
        const acts = h('div', { class: 'sh-actions' });
        if (it.kind === 'seed') {
          const bed = sp.bed;
          const free = S().fields[bed].findIndex((p) => !p.seed);
          acts.append(UI.btn('🌱 ' + t('grid.plant'), 'sm leaf', () => {
            if (free < 0) { UI.toast(t('grid.noPlot'), 'warn'); return; }
            if (NOA.farm.plant(bed, free, index)) {
              NOA.audio.play('plant');
              UI.toast(t('picker.planted', { name: I().name(it) + ' Lv' + it.level }) + ' · ' + t('zone.' + bed) + ' ' + (free + 1), 'good');
              PN.closeSheet();
            }
          }, { disabled: free < 0 || it.locked }));
        } else {
          const pen = sp.pen;
          const free = S().pens[pen] && NOA.farm.penOpen(pen) ? S().pens[pen].slots.indexOf(null) : -1;
          acts.append(UI.btn('🏡 ' + t('grid.toPen'), 'sm leaf', () => {
            const r = NOA.farm.placeAnimal(pen, index);
            if (r.ok) { NOA.audio.play('plant'); UI.toast(I().name(it) + ' → ' + t('bld.' + pen), 'good'); PN.closeSheet(); }
            else UI.toast(t('grid.noPen', { pen: t('bld.' + pen) }), 'warn');
          }, { disabled: free < 0 || it.locked }));
        }
        acts.append(UI.btn('🧺 ' + t('item.sell'), 'sm sun', () => { PN.closeSheet(); NOA.ui.screens.breed.sell(grid, index); }, { disabled: it.locked }));
        acts.append(UI.btn(it.locked ? '🔓 ' + t('item.unlock') : '🔒 ' + t('item.lock'), 'sm ghost', () => { NOA.grids.toggleLock(grid, index); NOA.audio.play('tap'); }));
        if (!it.charm) {
          for (const bid of ['clover', 'stabilizer', 'stardust']) {
            const n = S().boosters[bid] || 0;
            if (n > 0) acts.append(UI.btn(t('item.attach', { emoji: C().boosters[bid].emoji }) + ' (' + n + ')', 'sm ghost', () => {
              const r = NOA.grids.applyBooster(grid, bid, index);
              if (r.ok) { NOA.audio.play('unlock'); UI.toast(t('booster.used', { name: C().boosters[bid].emoji + ' ' + t('booster.' + bid) }), 'good'); }
            }));
          }
        }
        if (!it.revealed && (S().boosters.loupe || 0) > 0) {
          acts.append(UI.btn('🔍 (' + S().boosters.loupe + ')', 'sm ghost', () => {
            const r = NOA.grids.applyBooster(grid, 'loupe', index);
            if (r.ok) UI.toast(t('booster.revealed', { result: r.carrier ? t('item.carrier', { gene: C().genes[r.carrier].emoji + ' ' + t('gene.' + r.carrier) }) : t('item.noCarrier') }));
          }));
        }
        // extension point: features add their own actions (see js/systems/essence.js)
        const extra = NOA.hooks.run('item.actions', [], it, { grid, index });
        extra.forEach((a) => acts.append(UI.btn(a.label, 'sm ' + (a.kind || 'ghost'), () => { a.run(); PN.closeSheet(); })));
        b.append(acts);
        return true;
      });
    },

    /* ================================================================ daily login */
    loginModal() {
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
            FX().confetti(innerWidth / 2, innerHeight * 0.4, 60);
            PN.rewardsToast(r.granted);
            NOA.ui.hud.update();
          }
        }] : [{ label: t('ui.ok'), kind: 'ghost' }]
      });
    },
    rewardsToast(entries) {
      if (!entries || !entries.length) return;
      UI.toast(entries.map((e) => e.icon + ' +' + UI.num(e.n)).join('   '), 'good');
      const hud = NOA.ui.hud.els;
      const c = { x: innerWidth / 2, y: innerHeight * 0.45 };
      entries.forEach((e) => {
        if (e.icon === '🪙') FX().flyTo(c, hud.coins, '🪙', 6);
        if (e.icon === '💎') FX().flyTo(c, hud.gems, '💎', 4);
        if (e.key && (e.key.startsWith('material.') || e.key.startsWith('product.'))) FX().flyTo(c, UI.tabEl('barn'), e.icon, 3);
        if (e.item) FX().flyTo(c, UI.tabEl('breed'), e.icon, 1);
      });
    },

    /* ================================================================ level up (queued) */
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
      FX().confetti(innerWidth / 2, innerHeight * 0.35, 90);
      UI.modal({
        title: t('level.title', { n: e.level }),
        body: (b) => {
          b.append(h('div', { class: 'levelup-num' }, String(e.level)));
          b.append(h('h3', { style: { textAlign: 'center' } }, t('level.rewards')), UI.rewardChips(e.granted));
          const list = [];
          e.unlocks.species.forEach((id) => list.push([C().species[id].emoji, t('species.' + id)]));
          e.unlocks.buildings.forEach((id) => list.push([C().buildings[id].emoji, t('bld.' + id)]));
          e.unlocks.features.forEach((f) => list.push(['✨', t('unlock.' + f)]));
          if (e.unlocks.plots) list.push(['🟫', t('unlock.plot')]);
          if (e.unlocks.flowerBeds) list.push(['🌸', t('unlock.flowerBed')]);
          if (list.length) {
            b.append(h('h3', { style: { textAlign: 'center' } }, t('level.unlocks')),
              h('div', { class: 'unlock-list' }, list.map(([ic, tx]) => h('div', null, h('span', { style: { fontSize: '20px' } }, ic), tx))));
          }
        },
        actions: [{ label: t('ui.claim'), kind: 'leaf' }],
        onClose: () => {
          PN._levelQueue.shift();
          NOA.ui.hud.update();
          UI.renderTabs();
          if (NOA.ui.screens.farm) NOA.ui.screens.farm.updateAll();
          if (PN._levelQueue.length) setTimeout(PN._showLevel, 250);
        }
      });
    },

    /* ================================================================ secret discovered */
    secret(e) {
      NOA.audio.play('secret');
      FX().confetti(innerWidth / 2, innerHeight * 0.4, 50);
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

  /** Highlight the field the seed picker is planting into */
  function onKeyChange(prev, next) {
    const mark = (key, on) => {
      if (!key || !key.startsWith('picker:')) return;
      const [, bed, idx] = key.split(':');
      const el = document.getElementById('plot-' + bed + '-' + idx);
      if (el) el.classList.toggle('picking', on);
      if (on && el && NOA.ui.screens.farm) NOA.ui.screens.farm.reveal(el, true);
    };
    mark(prev, false);
    mark(next, true);
    if (NOA.ui.screens.breed && NOA.ui.screens.breed.onSheet) NOA.ui.screens.breed.onSheet(next);
  }
})();
