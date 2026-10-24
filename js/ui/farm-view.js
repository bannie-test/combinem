/*
 * Farm screen: orders row, fields & pens, the merge board, the dock (sell / bag / storage)
 * and all drag & drop interactions with their merge feedback.
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

  let drag = null;
  let ghost = null;
  let preview = null;

  const FV = NOA.ui.screens.farm = {
    els: {},
    selected: -1,

    render() {
      if (!FV.els.board || !FV.els.board.isConnected || FV._lang !== NOA.i18n.lang) { FV.build(); FV._lang = NOA.i18n.lang; }
      FV.renderOrders();
      FV.renderField();
      FV.renderBoard(true);
      FV.renderDock();
      if (NOA.ui.story) NOA.ui.story.applyFocus();
    },

    build() {
      const root = document.getElementById('scr-farm');
      UI.clear(root);
      const e = FV.els;
      e.orders = h('div', { class: 'hscroll', id: 'orders', 'aria-label': t('farm.orders') });
      e.field = h('div', { class: 'hscroll', id: 'field', 'aria-label': t('farm.field') });
      e.board = h('div', { class: 'board', id: 'board', style: { '--cols': String(B().board.cols), '--rows': String(B().board.rows) } });
      e.cells = [];
      for (let i = 0; i < B().board.cols * B().board.rows; i++) {
        const c = h('div', { class: 'cell', data: { drop: 'cell', index: String(i) } });
        e.cells.push(c);
        e.board.append(c);
      }
      e.sell = h('button', { type: 'button', class: 'sell-bin', data: { drop: 'sell' }, on: { click: () => UI.toast('🧺 ' + t('farm.sell') + ': ' + t('toast.boardFull').split('.')[0]) } },
        h('span', { class: 'di' }, '🧺'), h('span', null, t('farm.sell')));
      e.bag = h('div', { class: 'bag', 'aria-label': t('farm.bag') });
      e.store = h('button', { type: 'button', class: 'store-btn', data: { drop: 'storage' }, on: { click: () => NOA.ui.panels.storageModal() } },
        h('span', { class: 'di' }, '📦'), h('span', { class: 'num' }, ''));
      e.dock = h('div', { class: 'dock' }, e.sell, e.bag, e.store);
      e.wrap = h('div', { class: 'board-wrap' }, e.board);
      root.append(e.orders, e.field, e.wrap, e.dock);
      root.addEventListener('pointerdown', onDown);
      // keep the whole board on screen: fit it to the space left between the field row and the dock
      if (globalThis.ResizeObserver) {
        if (FV._ro) FV._ro.disconnect();
        FV._ro = new ResizeObserver(() => FV.fitBoard());
        FV._ro.observe(e.wrap);
      }
      requestAnimationFrame(() => FV.fitBoard());
    },

    fitBoard() {
      const e = FV.els;
      if (!e.wrap || !e.wrap.isConnected) return;
      const r = e.wrap.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const cols = B().board.cols;
      const w = Math.floor(Math.min(r.width, r.height * cols / B().board.rows));
      e.board.style.setProperty('--bw', w + 'px');
      // emoji size follows the cell size (board padding 7px + 3px border each side, 4px gaps)
      const cell = (w - 20 - 4 * (cols - 1)) / cols;
      e.board.style.setProperty('--board-sz', Math.max(18, Math.round(cell * 0.64)) + 'px');
    },

    /* ------------------------------------------------------------ orders */
    renderOrders() {
      const box = FV.els.orders;
      if (!box) return;
      UI.clear(box);
      for (const o of S().orders) box.append(orderCard(o));
      if (S().orders.length < B().orders.slots) box.append(h('div', { class: 'o-wait' }, '⏳ ' + t('order.waiting')));
    },

    /* ------------------------------------------------------------ field */
    renderField() {
      const box = FV.els.field;
      if (!box) return;
      UI.clear(box);
      S().plots.forEach((p, i) => box.append(plotTile(p, i)));
      if (S().plots.length < B().farm.plotsMax) box.append(buyTile('plot'));
      S().pens.forEach((p, i) => box.append(penTile(p, i)));
      if (S().pens.length < B().farm.pensMax) box.append(buyTile('pen'));
    },

    /* ------------------------------------------------------------ board */
    renderBoard(force) {
      const cells = FV.els.cells;
      if (!cells) return;
      const board = S().board;
      for (let i = 0; i < cells.length; i++) {
        const it = board[i];
        const sig = it ? [it.id, it.charm, it.locked, it.revealed, it.gene ? it.gene.id + it.gene.purity : ''].join('|') : '';
        if (force || cells[i]._sig !== sig) {
          UI.clear(cells[i]);
          if (it) {
            const art = UI.itemArt(it);
            art.dataset.drag = 'board';
            art.dataset.index = String(i);
            if (it.kind === 'generator') { art.classList.add('idle'); art.id = 'gen-' + it.generator; }
            cells[i].append(art);
          }
          cells[i]._sig = sig;
        }
        cells[i].classList.toggle('selected', i === FV.selected);
      }
      FV.renderDock();
    },

    renderDock() {
      const e = FV.els;
      if (!e.bag) return;
      UI.clear(e.bag);
      for (const id in C().boosters) {
        const n = S().boosters[id] || 0;
        e.bag.append(h('div', {
          class: 'boost' + (n ? '' : ' empty'),
          data: { drag: 'bag', booster: id },
          title: t('booster.' + id),
          role: 'button',
          'aria-label': t('booster.' + id) + ' ×' + n
        }, C().boosters[id].emoji, h('b', null, String(n))));
      }
      e.store.querySelector('.num').textContent = S().storage.length + '/' + S().storageCap;
    },

    cellEl(i) { return FV.els.cells ? FV.els.cells[i] : null; },
    itemEl(i) { const c = FV.cellEl(i); return c ? c.firstChild : null; },

    /** Animate an item flying into a cell from a screen point */
    flyIn(index, from) {
      const el = FV.itemEl(index);
      if (!el || UI.reduced) return;
      const c = UI.center(FV.cellEl(index));
      el.style.setProperty('--fx', (from.x - c.x) + 'px');
      el.style.setProperty('--fy', (from.y - c.y) + 'px');
      el.classList.add('fly-in');
      setTimeout(() => el.classList.remove('fly-in'), 650);
    },

    /** Animate a batch of placements ({ index, where }) out of a source element */
    deliverPlaced(placed, fromEl) {
      const from = UI.center(fromEl);
      let stored = 0;
      placed.forEach((p, k) => {
        if (p.where === 'board') setTimeout(() => FV.flyIn(p.index, from), k * 60);
        else stored += 1;
      });
      if (stored) UI.toast(t('toast.toStorage', { n: stored }));
    },

    tick() {
      if (!FV.els.field || NOA.ui.current !== 'farm') return;
      FV.els.field.querySelectorAll('.slot[data-drop]').forEach((el) => {
        const i = Number(el.dataset.index);
        const slot = el.dataset.drop === 'plot' ? S().plots[i] : S().pens[i];
        if (!slot || !slot.end || NOA.farm.isReady(slot)) return;
        const ring = el.querySelector('.ring');
        if (ring) ring.style.setProperty('--p', String(NOA.farm.progress(slot)));
        const lab = el.querySelector('.sl');
        if (lab) lab.textContent = UI.dur(slot.end - NOA.time.now());
        const se = el.querySelector('.se.stage');
        if (se) se.textContent = stageEmoji(slot);
      });
    },

    select(i) {
      FV.selected = i;
      FV.renderBoard();
    }
  };

  /* ================================================================ builders */
  function stageEmoji(plot) {
    const p = NOA.farm.progress(plot);
    if (p < 0.34) return '🌱';
    if (p < 0.75) return '🌿';
    return C().species[plot.seed.species].emoji;
  }

  function orderCard(o) {
    const avail = NOA.orders.availability(o);
    const ready = NOA.orders.canDeliver(o);
    const est = NOA.orders.estimate(o);
    const npc = C().npcs[o.npc];
    const lines = o.lines.map((l, i) => {
      const have = Math.min(l.count, l.filled + avail[i]);
      const p = C().products[l.product];
      return h('span', { class: 'o-line' + (have >= l.count ? ' ok' : '') + (l.filled >= l.count ? ' done' : ''), title: t('product.' + l.product) },
        h('span', { class: 'oe' }, p.emoji),
        have + '/' + l.count,
        l.needGene ? h('span', { class: 'req' }, '🧬') : l.minStars ? h('span', { class: 'req' }, l.minStars + '★') : null);
    });
    const deliverBtn = UI.btn(t('order.deliver'), 'sm leaf', (ev) => { ev.stopPropagation(); deliver(o, card); });
    const swapBtn = NOA.orders.canSwap(o)
      ? h('button', { type: 'button', class: 'btn-icon', 'aria-label': t('order.swap'), title: t('order.swap'), on: { click: (ev) => { ev.stopPropagation(); NOA.audio.play('swoosh'); NOA.orders.swap(o.id); } } }, '⟳')
      : null;
    const card = h('div', {
      class: 'order' + (o.vip ? ' vip' : '') + (o.earth ? ' earth' : '') + (ready ? ' ready' : ''),
      data: { drop: 'order', id: o.id },
      role: 'group',
      'aria-label': t('npc.' + o.npc),
      on: { click: () => NOA.ui.panels.orderModal(o) }
    },
      o.vip ? h('span', { class: 'o-tag' }, '✨ ' + t('order.vip')) : o.earth ? h('span', { class: 'o-tag' }, '🌍') : null,
      h('div', { class: 'o-head' }, h('span', { class: 'o-npc' }, npc.emoji), h('span', { class: 'o-name' }, t('npc.' + o.npc))),
      h('div', { class: 'o-lines' }, lines),
      h('div', { class: 'o-foot' }, h('span', { class: 'o-rew num' }, '🪙' + UI.compact(est.coins)), ready ? deliverBtn : swapBtn));
    return card;
  }

  function deliver(o, card) {
    const c = UI.center(card);
    const r = NOA.orders.deliver(o.id);
    if (!r) { NOA.audio.play('invalid'); return; }
    celebrateOrder(c, r.reward);
  }
  function celebrateOrder(c, reward) {
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
  FV.celebrateOrder = celebrateOrder;

  function plotTile(p, i) {
    const ready = NOA.farm.isReady(p);
    const g = p.seed && p.seed.gene ? C().genes[p.seed.gene.id] : null;
    const el = h('button', {
      type: 'button',
      class: 'slot slot--plot' + (ready ? ' ready' : '') + (g ? ' has-gene' : ''),
      data: { drop: 'plot', index: String(i) },
      style: g ? { '--gc': g.color } : null,
      'aria-label': t('farm.plot') + ' ' + (i + 1)
    });
    if (!p.seed) {
      el.append(h('span', { class: 'se small', style: { opacity: '0.4' } }, '🌱'), h('span', { class: 'sl' }, t('farm.emptyPlot')));
    } else if (ready) {
      el.append(h('span', { class: 'se' }, C().species[p.seed.species].emoji),
        h('span', { class: 'sl' }, p.out && p.out.length ? t('farm.harvest') + ' ×' + p.out.length : t('farm.harvest')));
    } else {
      el.append(h('span', { class: 'se stage' }, stageEmoji(p)),
        h('span', { class: 'ring', style: { '--p': String(NOA.farm.progress(p)) } }),
        h('span', { class: 'sl num' }, UI.dur(p.end - NOA.time.now())));
    }
    el.addEventListener('click', () => {
      NOA.audio.unlock();
      if (drag) return;
      if (NOA.farm.isReady(p)) {
        const res = NOA.farm.harvest(i);
        if (!res) return;
        NOA.audio.play('harvest');
        NOA.audio.vibrate(15);
        const c = UI.center(el);
        FX().burst(c.x, c.y, { count: 22, colors: ['#5cbb49', '#9be37a', '#ffd36b', '#c08a5f'], shapes: ['leaf', 'circle'], speed: 240 });
        FV.deliverPlaced(res.placed, el);
        if (res.remaining) UI.toast(t('toast.harvestLeft', { n: res.remaining }), 'warn');
      } else if (p.seed) {
        NOA.ui.panels.slotSheet('plot', i);
      } else {
        NOA.audio.play('tap');
        NOA.ui.hud.say(t('tut.plant'), 5000);
      }
    });
    return el;
  }

  function penTile(p, i) {
    const ready = NOA.farm.isReady(p);
    const a = p.animal;
    const g = a && a.gene ? C().genes[a.gene.id] : null;
    const hungry = a && !p.end && p.feed < 1;
    const el = h('button', {
      type: 'button',
      class: 'slot slot--pen' + (ready ? ' ready' : '') + (g ? ' has-gene' : '') + (hungry ? ' hungry' : ''),
      data: { drop: 'pen', index: String(i) },
      style: g ? { '--gc': g.color } : null,
      'aria-label': t('farm.penInfo', { n: i + 1 })
    });
    if (!a) {
      el.append(h('span', { class: 'se small', style: { opacity: '0.4' } }, '🐾'), h('span', { class: 'sl' }, t('farm.emptyPen')));
    } else {
      const feedIcons = (C().species[a.species].feed || []).map((f) => C().species[f].emoji).join('');
      el.append(h('span', { class: 'se' }, C().species[a.species].emoji), h('span', { class: 'feed num' }, feedIcons + '×' + p.feed));
      if (ready) {
        const prod = C().products[C().species[C().species[a.species].hybrid ? C().species[a.species].hybrid[0] : a.species].products[0]];
        el.append(h('span', { class: 'bubble-prod' }, prod.emoji), h('span', { class: 'sl' }, t('farm.collect')));
      } else if (p.end) {
        el.append(h('span', { class: 'ring', style: { '--p': String(NOA.farm.progress(p)) } }), h('span', { class: 'sl num' }, UI.dur(p.end - NOA.time.now())));
      } else {
        el.append(h('span', { class: 'sl' }, t('farm.hungry', { list: feedIcons })));
      }
    }
    el.addEventListener('click', () => {
      NOA.audio.unlock();
      if (drag) return;
      if (NOA.farm.isReady(p)) {
        const res = NOA.farm.collect(i);
        if (!res) return;
        NOA.audio.play('harvest');
        const c = UI.center(el);
        FX().burst(c.x, c.y, { count: 18, colors: ['#fff6d6', '#ffd36b', '#ffffff'], speed: 220 });
        FV.deliverPlaced(res.placed, el);
        if (res.remaining) UI.toast(t('toast.harvestLeft', { n: res.remaining }), 'warn');
      } else if (a) {
        NOA.ui.panels.slotSheet('pen', i);
      } else {
        NOA.audio.play('tap');
        NOA.ui.hud.say(t('tut.animal'), 5000);
      }
    });
    return el;
  }

  function buyTile(type) {
    const f = B().farm;
    const i = type === 'plot' ? S().plots.length : S().pens.length;
    const req = type === 'plot' ? f.plotLevelReq[i] : f.penLevelReq[i];
    const cost = type === 'plot' ? f.plotCost[i] : f.penCost[i];
    const locked = S().level < req;
    const el = h('button', { type: 'button', class: 'slot slot--buy' },
      locked ? '🔒 ' + t('ui.lv', { n: req }) : '＋ ' + (type === 'plot' ? t('farm.buyPlot') : t('farm.buyPen')) + '\n' + UI.num(cost) + '🪙');
    el.style.whiteSpace = 'pre-line';
    el.addEventListener('click', () => {
      if (locked) { UI.toast(t('toast.levelReq', { level: req })); return; }
      UI.modal({
        title: type === 'plot' ? t('farm.buyPlot') : t('farm.buyPen'),
        body: h('p', { style: { textAlign: 'center', fontWeight: '700' } }, (type === 'plot' ? '🟫' : '🏡') + ' ' + UI.num(cost) + '🪙'),
        actions: [
          { label: t('ui.cancel'), kind: 'ghost' },
          {
            label: t('ui.confirm'), kind: 'leaf', onClick: () => {
              const r = type === 'plot' ? NOA.farm.unlockPlot() : NOA.farm.unlockPen();
              if (r.ok) { NOA.audio.play('unlock'); FX().confetti(innerWidth / 2, innerHeight / 2, 40); }
              else UI.toast(r.error === 'coins' ? t('toast.notEnough', { name: t('res.coins') }) : t('toast.levelReq', { level: r.level }), 'warn');
            }
          }
        ]
      });
    });
    return el;
  }

  /* ================================================================ drag & drop */
  function onDown(e) {
    NOA.ui.hud.noteInput();
    const src = e.target.closest('[data-drag]');
    if (!src || drag) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    NOA.audio.unlock();
    drag = {
      kind: src.dataset.drag,
      index: src.dataset.index != null ? Number(src.dataset.index) : -1,
      booster: src.dataset.booster || null,
      el: src,
      x0: e.clientX,
      y0: e.clientY,
      id: e.pointerId,
      moved: false,
      hover: null
    };
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0, dy = e.clientY - drag.y0;
    if (!drag.moved) {
      if (dx * dx + dy * dy < 64) return;
      if (!startDrag()) { cleanup(); return; }
    }
    e.preventDefault();
    ghost.style.left = e.clientX + 'px';
    ghost.style.top = e.clientY + 'px';
    hoverAt(e.clientX, e.clientY);
  }

  function startDrag() {
    if (drag.kind === 'bag' && !(S().boosters[drag.booster] > 0)) return false;
    if (drag.kind === 'board') {
      const it = S().board[drag.index];
      if (!it) return false;
    }
    drag.moved = true;
    const r = drag.el.getBoundingClientRect();
    ghost = drag.el.cloneNode(true);
    ghost.classList.add('ghost');
    ghost.classList.remove('hint', 'idle', 'fly-in', 'pop-in');
    ghost.removeAttribute('id');
    ghost.style.width = r.width + 'px';
    ghost.style.height = r.height + 'px';
    ghost.style.left = drag.x0 + 'px';
    ghost.style.top = drag.y0 + 'px';
    document.body.append(ghost);
    drag.el.classList.add('dragging');
    NOA.ui.panels.closeSheet();
    highlight(true);
    NOA.audio.play('pick');
    NOA.audio.vibrate(8);
    return true;
  }

  function targetsFor() {
    const out = [];
    const board = S().board;
    if (drag.kind === 'board') {
      const it = board[drag.index];
      board.forEach((o, i) => { if (i !== drag.index && I().canMerge(o, it)) out.push(FV.itemEl(i)); });
      if (it.kind === 'seed') FV.els.field.querySelectorAll('[data-drop="plot"]').forEach((el) => { if (!S().plots[+el.dataset.index].seed) out.push(el); });
      if (it.kind === 'animal') FV.els.field.querySelectorAll('[data-drop="pen"]').forEach((el) => { if (!S().pens[+el.dataset.index].animal) out.push(el); });
      if (it.kind === 'product') {
        FV.els.field.querySelectorAll('[data-drop="pen"]').forEach((el) => { if (NOA.farm.canFeed(S().pens[+el.dataset.index], it)) out.push(el); });
        FV.els.orders.querySelectorAll('[data-drop="order"]').forEach((el) => {
          const o = S().orders.find((x) => x.id === el.dataset.id);
          if (o && o.lines.some((l) => l.filled < l.count && NOA.orders.matches(it, l))) out.push(el);
        });
      }
    } else if (drag.kind === 'bag') {
      const def = C().boosters[drag.booster];
      if (def.target === 'breed') board.forEach((o, i) => { if (I().isBreed(o) && (drag.booster === 'loupe' ? !o.revealed : !o.charm)) out.push(FV.itemEl(i)); });
      else FV.els.field.querySelectorAll('.slot[data-drop]').forEach((el) => {
        const s = el.dataset.drop === 'plot' ? S().plots[+el.dataset.index] : S().pens[+el.dataset.index];
        if (s && s.end && !NOA.farm.isReady(s)) out.push(el);
      });
    }
    return out.filter(Boolean);
  }
  function highlight(on) {
    if (on) drag.targets = targetsFor();
    (drag.targets || []).forEach((el) => el.classList.toggle(el.classList.contains('art') ? 'hint' : 'target', on));
  }

  function hoverAt(x, y) {
    const under = document.elementFromPoint(x, y);
    const tgt = under ? under.closest('[data-drop]') : null;
    if (tgt === drag.hover) return;
    if (drag.hover) drag.hover.classList.remove('hover', 'hover-merge');
    drag.hover = tgt;
    hidePreview();
    if (!tgt) return;
    let merge = false;
    if (drag.kind === 'board' && tgt.dataset.drop === 'cell') {
      const a = S().board[+tgt.dataset.index], b = S().board[drag.index];
      merge = I().canMerge(a, b);
      if (merge) showPreview(tgt, NOA.genetics.preview(a, b));
    }
    tgt.classList.add(merge ? 'hover-merge' : 'hover');
  }

  function showPreview(cell, rows) {
    if (!rows.length) return;
    const c = UI.center(cell);
    preview = h('div', { class: 'preview', role: 'tooltip' }, rows.map((r) =>
      h('div', { class: 'pr' + (r.p == null ? ' lock' : '') }, h('span', null, t(r.k, r.params)), r.p != null ? h('b', null, UI.pct(r.p)) : null)));
    const x = Math.max(110, Math.min(innerWidth - 110, c.x));
    preview.style.left = x + 'px';
    preview.style.top = (c.y - c.h / 2) + 'px';
    document.body.append(preview);
    const pr = preview.getBoundingClientRect();
    if (pr.top < 8) preview.style.top = (c.y + c.h / 2 + pr.height + 16) + 'px';
  }
  function hidePreview() { if (preview) { preview.remove(); preview = null; } }

  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    removeListeners();
    if (!d.moved) { drag = null; tap(d); return; }
    const target = d.hover;
    if (target) target.classList.remove('hover', 'hover-merge');
    hidePreview();
    highlight(false);
    drag = null;
    let ok = false;
    try { ok = target ? drop(d, target) : false; } catch (err) { console.error(err); ok = false; }
    if (d.el) d.el.classList.remove('dragging');
    if (ok) { if (ghost) ghost.remove(); ghost = null; }
    else snapBack(d);
  }
  function onCancel() {
    if (!drag) return;
    const d = drag;
    removeListeners();
    if (d.hover) d.hover.classList.remove('hover', 'hover-merge');
    hidePreview();
    if (d.moved) highlight(false);
    drag = null;
    if (d.el) d.el.classList.remove('dragging');
    if (ghost) { ghost.remove(); ghost = null; }
  }
  function cleanup() { removeListeners(); drag = null; }
  function removeListeners() {
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
  }
  function snapBack(d) {
    const g = ghost;
    ghost = null;
    if (!g) return;
    NOA.audio.play('drop');
    const src = d.kind === 'board' ? FV.itemEl(d.index) : d.el;
    if (!src || UI.reduced) { g.remove(); return; }
    const c = UI.center(src);
    g.classList.add('snap');
    g.style.left = c.x + 'px';
    g.style.top = c.y + 'px';
    g.style.transform = 'translate(-50%,-50%) scale(1)';
    setTimeout(() => g.remove(), 140);
  }

  /* ------------------------------------------------------------ taps */
  function tap(d) {
    if (d.kind === 'bag') {
      NOA.audio.play('tap');
      UI.toast(C().boosters[d.booster].emoji + ' ' + t('booster.' + d.booster) + ': ' + t('booster.' + d.booster + '.desc'));
      return;
    }
    const it = S().board[d.index];
    if (!it) return;
    if (it.kind === 'generator') { spawnFrom(d.index); return; }
    NOA.audio.play('tap');
    if (FV.selected === d.index && NOA.ui.panels.sheetOpen()) { NOA.ui.panels.closeSheet(); return; }
    NOA.ui.panels.itemSheet(d.index);
  }

  function spawnFrom(i) {
    const res = NOA.board.spawn(i);
    if (res.error === 'energy') {
      NOA.audio.play('invalid');
      FX().shake(NOA.ui.hud.els.energy);
      UI.toast(t('toast.noEnergy'), 'warn');
      return;
    }
    if (res.error === 'full') { NOA.audio.play('invalid'); UI.toast(t('toast.boardFull'), 'warn'); FX().shake(FV.els.board); return; }
    if (res.error) return;
    const gc = UI.center(FV.cellEl(i));
    FX().bump(FV.itemEl(i));
    NOA.audio.play('spawn');
    NOA.audio.vibrate(6);
    FV.flyIn(res.index, gc);
    FX().burst(gc.x, gc.y - 10, { count: 8, colors: ['#ffffff', '#ffe680'], speed: 140, size: 5 });
    NOA.ui.hud.update();
  }

  /* ------------------------------------------------------------ drops */
  function drop(d, target) {
    const type = target.dataset.drop;
    const idx = target.dataset.index != null ? Number(target.dataset.index) : -1;
    if (d.kind === 'bag') return dropBooster(d.booster, type, idx, target);
    const from = d.index;
    const it = S().board[from];
    if (!it) return false;
    switch (type) {
      case 'cell': {
        if (idx === from) return false;
        const other = S().board[idx];
        if (!other) { NOA.board.move(from, idx); NOA.audio.play('drop'); return true; }
        if (I().canMerge(other, it)) return doMerge(from, idx);
        const sameSpecies = I().isBreed(it) && I().isBreed(other) && it.species === other.species;
        const sameProduct = it.kind === 'product' && other.kind === 'product' && it.product === other.product;
        if ((sameSpecies && it.level === other.level) || sameProduct) {
          if (it.locked || other.locked) UI.toast(t('toast.locked'));
          else UI.toast(t('toast.maxLevel'));
          return false;
        }
        if (sameSpecies) UI.toast(t('toast.cantMerge'));
        NOA.board.move(from, idx);
        NOA.audio.play('drop');
        return true;
      }
      case 'plot': {
        const plot = S().plots[idx];
        if (it.kind !== 'seed') { NOA.audio.play('invalid'); UI.toast(t('toast.needSeed')); return false; }
        if (plot.seed) { NOA.audio.play('invalid'); UI.toast(t('toast.plotBusy')); return false; }
        if (it.locked) { UI.toast(t('toast.locked')); return false; }
        NOA.farm.plant(idx, from);
        NOA.audio.play('plant');
        const c = UI.center(FV.els.field.querySelector('[data-drop="plot"][data-index="' + idx + '"]') || target);
        FX().burst(c.x, c.y, { count: 14, colors: ['#8a5a37', '#c08a5f', '#5cbb49'], shapes: ['circle', 'leaf'], speed: 160 });
        return true;
      }
      case 'pen': {
        const pen = S().pens[idx];
        if (it.kind === 'animal') {
          if (pen.animal) { NOA.audio.play('invalid'); UI.toast(t('toast.penBusy')); return false; }
          if (it.locked) { UI.toast(t('toast.locked')); return false; }
          NOA.farm.placeAnimal(idx, from);
          NOA.audio.play('plant');
          return true;
        }
        if (it.kind === 'product' && pen.animal) {
          if (NOA.farm.canFeed(pen, it)) {
            const units = B().product.tierUnits[C().products[it.product].tier];
            NOA.farm.feed(idx, from);
            NOA.audio.play('plant');
            const c = UI.center(FV.els.field.querySelector('[data-drop="pen"][data-index="' + idx + '"]') || target);
            FX().float(c.x, c.y - 20, '+' + units + ' 🍽️', 'good');
            return true;
          }
          NOA.audio.play('invalid');
          UI.toast(pen.feed >= B().farm.feedCapacity ? t('toast.feedFull') : t('toast.wrongFeed', { animal: I().speciesName(pen.animal.species) }));
          return false;
        }
        NOA.audio.play('invalid');
        UI.toast(t('toast.needAnimal'));
        return false;
      }
      case 'order': {
        const c = UI.center(target);
        const r = NOA.orders.deliverItem(target.dataset.id, from);
        if (!r) { NOA.audio.play('invalid'); UI.toast(t('toast.orderNoMatch')); return false; }
        if (r.complete) celebrateOrder(c, r.reward);
        else { NOA.audio.play('coin'); FX().burst(c.x, c.y, { count: 10, colors: ['#ffd36b', '#ffffff'], speed: 150 }); }
        return true;
      }
      case 'sell':
        return sellFlow(from);
      case 'storage': {
        if (it.kind === 'generator') return false;
        if (!NOA.board.toStorage(from)) { UI.toast(t('toast.storageFull'), 'warn'); return false; }
        NOA.audio.play('drop');
        FX().bump(FV.els.store);
        return true;
      }
    }
    return false;
  }

  function dropBooster(id, type, idx, target) {
    const def = C().boosters[id];
    if (def.target === 'breed') {
      if (type !== 'cell') { NOA.audio.play('invalid'); UI.toast(t('booster.wrongTarget')); return false; }
      const r = NOA.board.applyBooster(id, idx);
      if (r.error) {
        NOA.audio.play('invalid');
        UI.toast(r.error === 'charmed' ? t('booster.charmed') : r.error === 'none' ? t('booster.none', { name: t('booster.' + id) }) : t('booster.wrongTarget'));
        return false;
      }
      const c = UI.center(target);
      NOA.audio.play('unlock');
      FX().burst(c.x, c.y, { count: 16, colors: ['#9be37a', '#ffffff', '#ffd84d'], shapes: ['star'], speed: 180 });
      if (id === 'loupe') {
        UI.toast(t('booster.revealed', { result: r.carrier ? t('item.carrier', { gene: C().genes[r.carrier].emoji + ' ' + t('gene.' + r.carrier) }) : t('item.noCarrier') }));
      } else {
        UI.toast(t('booster.used', { name: def.emoji + ' ' + t('booster.' + id) }), 'good');
      }
      return true;
    }
    if (type === 'plot' || type === 'pen') {
      if (NOA.farm.tonic(type, idx)) {
        const c = UI.center(target);
        NOA.audio.play('purity');
        FX().burst(c.x, c.y, { count: 18, colors: ['#ffb84d', '#ffffff', '#9be37a'], speed: 200 });
        return true;
      }
    }
    NOA.audio.play('invalid');
    UI.toast(t('booster.' + id + '.desc'));
    return false;
  }

  function sellFlow(index) {
    const it = S().board[index];
    if (!it || it.kind === 'generator') return false;
    if (it.locked) { UI.toast(t('toast.locked')); return false; }
    const price = NOA.board.salePrice(it);
    if (NOA.board.needsConfirm(it)) {
      UI.modal({
        title: t('item.sell'),
        body: (b) => {
          b.append(h('div', { style: { width: '84px', height: '84px', margin: '0 auto' } }, UI.itemArt(it)),
            h('p', { style: { textAlign: 'center', fontWeight: '800' } }, I().name(it) + ' → ' + UI.num(price) + '🪙'));
        },
        actions: [
          { label: t('ui.cancel'), kind: 'ghost' },
          { label: t('item.sell') + ' · ' + UI.num(price) + '🪙', kind: 'sun', onClick: () => doSell(index) }
        ]
      });
      return false;
    }
    doSell(index);
    return true;
  }
  function doSell(index) {
    const price = NOA.board.sell(index);
    if (price == null) return;
    const c = UI.center(FV.els.sell);
    NOA.audio.play('sell');
    FX().bump(FV.els.sell);
    FX().flyTo(c, NOA.ui.hud.els.coins, '🪙', Math.min(8, 2 + Math.floor(price / 40)));
    FX().float(c.x, c.y - 30, '+' + UI.num(price) + '🪙', 'big');
  }
  FV.sell = sellFlow;

  /* ------------------------------------------------------------ merge feedback */
  function doMerge(from, to) {
    const res = NOA.board.merge(from, to);
    if (!res) return false;
    const item = res.item;
    const cell = FV.cellEl(to);
    const c = UI.center(cell);
    const art = FV.itemEl(to);
    if (art) art.classList.add('pop-in');
    const lvl = I().isBreed(item) ? item.level : C().products[item.product].tier;
    const g = item.gene ? C().genes[item.gene.id] : null;
    const color = g ? g.color : I().isBreed(item) ? '#8fdb6a' : '#ffd36b';
    NOA.audio.play('merge', lvl, res.combo);
    NOA.audio.vibrate(12);
    FX().burst(c.x, c.y, { count: 12 + lvl * 4, colors: [color, '#ffffff', '#ffe680'], speed: 190 + lvl * 30, shapes: I().isBreed(item) ? ['leaf', 'circle', 'star'] : ['star', 'circle'] });
    FX().ring(c.x, c.y, color);
    if (res.combo >= 2) FX().float(c.x, c.y - 30, t('fx.combo', { n: res.combo }), 'good');

    let cinematic = null;
    let delay = 0.1;
    for (const f of res.fx) {
      switch (f.type) {
        case 'breakthrough':
          FX().float(c.x, c.y, t('fx.breakthrough', { level: f.level }), 'big', delay); delay += 0.2;
          NOA.audio.play('breakthrough');
          FX().flash('#fff6c2');
          FX().shake(FV.els.board);
          break;
        case 'purityUp':
          FX().float(c.x, c.y + 10, t('fx.purityUp', { n: f.purity }), 'gene', delay); delay += 0.2;
          NOA.audio.play('purity');
          break;
        case 'purityDown': FX().float(c.x, c.y + 10, t('fx.purityDown', { n: f.purity }), 'sad', delay); delay += 0.2; break;
        case 'geneLost': FX().float(c.x, c.y + 10, t('fx.geneLost'), 'sad', delay); delay += 0.2; NOA.audio.play('geneLost'); break;
        case 'starUp': FX().float(c.x, c.y + 10, t('fx.starUp'), 'good', delay); delay += 0.2; break;
        case 'purityCapped': UI.toast(t('fx.purityCapped')); break;
        case 'fusionLocked': UI.toast(t('fx.fusionLocked')); break;
        case 'fusionNeedsPurity': UI.toast(t('fx.fusionNeedsPurity')); break;
        case 'super': cinematic = 'super'; break;
        case 'fusion': if (cinematic !== 'super') cinematic = 'fusion'; break;
        case 'recessive': if (!cinematic) cinematic = 'recessive'; break;
        case 'awaken': if (!cinematic) cinematic = 'awaken'; break;
      }
    }
    if (cinematic && item.gene) {
      setTimeout(() => NOA.ui.fx.awaken(item, cinematic), 380);
    }
    return true;
  }
})();
