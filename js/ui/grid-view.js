/*
 * 🧬 Breeding screen — the inside of the research labs: 🌰 the seed vault (Greenhouse) and
 * 🐣 the nursery (Ranch). Drag two identical seeds / young animals onto each other to merge
 * them into a higher level; the preview shows every gene chance before you let go.
 * Seeds and young animals arrive here from harvests, pens, the shop and blindboxes.
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
  const LAB = { vault: 'greenhouse', nursery: 'ranch' };

  let drag = null;
  let ghost = null;
  let preview = null;

  const GV = NOA.ui.screens.breed = {
    grid: 'vault',
    els: {},
    selected: -1,

    render(opts) {
      if (opts && opts.grid) GV.grid = opts.grid;
      if (GV.grid === 'nursery' && !NOA.labs.isOpen('ranch')) GV.grid = 'vault';
      GV.build();
    },

    build() {
      const root = document.getElementById('scr-breed');
      UI.clear(root);
      const e = GV.els = {};
      const grid = GV.grid;
      const lab = LAB[grid];
      const seg = h('div', { class: 'seg', role: 'tablist' });
      for (const id of ['vault', 'nursery']) {
        const open = id === 'vault' || NOA.labs.isOpen('ranch');
        seg.append(h('button', {
          type: 'button', role: 'tab', 'aria-pressed': id === grid ? 'true' : 'false', disabled: !open,
          on: { click: () => { NOA.audio.play('tap'); GV.grid = id; GV.build(); } }
        }, (id === 'vault' ? '🌰 ' : '🐣 ') + t('grid.' + id) + ' ', h('small', { class: 'num' }, NOA.grids.count(id) + '/' + NOA.grids.size(id))));
      }
      root.append(seg);

      const L = NOA.labs;
      const hybridReady = S().labs[lab].slots.filter((j) => j && NOA.time.now() >= j.end).length;
      e.lab = h('div', { class: 'lab-strip' },
        h('span', { class: 'ls-art' }, C().buildings[lab].emoji, h('b', null, String(L.level(lab)))),
        h('span', { class: 'ls-name' }, t('bld.' + lab), h('small', null, t('lab.' + lab + '.desc'))),
        UI.btn('⬆️', 'sm ghost', () => NOA.ui.labs.open(lab, 'upgrade'), { title: t('lab.tabUpgrade'), 'aria-label': t('lab.tabUpgrade') }),
        UI.btn('🧪' + (hybridReady ? ' ✨' : ''), hybridReady ? 'sm berry' : 'sm ghost', () => NOA.ui.labs.open(lab, 'hybrid'), { title: t('lab.tabHybrid'), 'aria-label': t('lab.tabHybrid') }));
      root.append(e.lab);

      const tip = h('p', { class: 'grid-tip' }, t('grid.hint'));
      if (grid === 'vault' && S().vault.pending.length) tip.append(' ', h('b', { class: 'ev' }, t('grid.pending', { n: S().vault.pending.length })));
      root.append(tip);

      const cols = B().storage.gridCols;
      e.board = h('div', { class: 'mgrid', style: { '--cols': String(cols) } });
      e.cells = [];
      for (let i = 0; i < NOA.grids.size(grid); i++) {
        const c = h('div', { class: 'cell', data: { drop: 'cell', index: String(i) } });
        e.cells.push(c);
        e.board.append(c);
      }
      root.append(e.board);

      e.sell = h('button', { type: 'button', class: 'sell-bin', data: { drop: 'sell' }, on: { click: () => UI.toast('🧺 ' + t('grid.sellBin') + ': ' + t('grid.dragHere')) } },
        h('span', { class: 'di' }, '🧺'), h('span', null, t('grid.sellBin')));
      e.bag = h('div', { class: 'bag', 'aria-label': t('farm.bag') });
      e.common = h('button', {
        type: 'button', class: 'sell-bin', title: t('grid.sellCommon'), 'aria-label': t('grid.sellCommon'),
        on: { click: () => GV.sellCommon() }
      }, h('span', { class: 'di' }, '🧹'), h('span', null, 'Lv1'));
      root.append(h('div', { class: 'dock' }, e.sell, e.bag, e.common));
      root.onpointerdown = onDown;
      GV.renderCells(true);
      GV.renderBag();
    },

    renderCells(force) {
      const e = GV.els;
      if (!e.cells || !e.board.isConnected) return;
      const cells = S()[GV.grid].cells;
      if (cells.length !== e.cells.length) { GV.build(); return; }
      for (let i = 0; i < e.cells.length; i++) {
        const it = cells[i];
        const sig = it ? [it.id, it.charm, it.locked, it.revealed, it.gene ? it.gene.id + it.gene.purity : ''].join('|') : '';
        if (force || e.cells[i]._sig !== sig) {
          UI.clear(e.cells[i]);
          if (it) {
            const art = UI.itemArt(it);
            art.dataset.drag = 'cell';
            art.dataset.index = String(i);
            art.id = 'gi-' + GV.grid + '-' + i;
            e.cells[i].append(art);
          }
          e.cells[i]._sig = sig;
        }
        e.cells[i].classList.toggle('selected', i === GV.selected);
      }
    },
    renderBag() {
      const e = GV.els;
      if (!e.bag) return;
      UI.clear(e.bag);
      for (const id of ['clover', 'stabilizer', 'stardust', 'loupe']) {
        const n = S().boosters[id] || 0;
        e.bag.append(h('div', {
          class: 'boost' + (n ? '' : ' empty'), data: { drag: 'bag', booster: id }, title: t('booster.' + id),
          role: 'button', tabindex: '0', 'aria-label': t('booster.' + id) + ' ×' + n
        }, C().boosters[id].emoji, h('b', null, String(n))));
      }
    },
    /** Called when the panels sheet changes: keep the selected cell highlighted */
    onSheet(key) {
      const m = key && key.match(/^item:(\w+):(\d+)/);
      GV.selected = m && m[1] === GV.grid ? Number(m[2]) : -1;
      if (UI.current === 'breed') GV.renderCells();
    },
    cellEl(i) { return GV.els.cells ? GV.els.cells[i] : null; },
    itemEl(i) { const c = GV.cellEl(i); return c ? c.firstChild : null; },

    sellCommon() {
      const r = NOA.grids.sellCommon(GV.grid, 2);
      if (!r.n) { NOA.audio.play('invalid'); UI.toast(t('grid.nothingToSell')); return; }
      NOA.audio.play('sell');
      const c = UI.center(GV.els.common);
      FX().flyTo(c, NOA.ui.hud.els.coins, '🪙', Math.min(8, 2 + r.n));
      UI.toast(t('grid.sold', { n: r.n, total: UI.num(r.total) }), 'good');
    },
    /** Sell with a confirmation for valuable breeds -> true when sold right away */
    sell(grid, index) {
      const it = S()[grid].cells[index];
      if (!it) return false;
      if (it.locked) { UI.toast(t('toast.locked')); return false; }
      const price = NOA.grids.salePrice(it);
      const go = () => {
        const p = NOA.grids.sell(grid, index);
        if (p == null) return;
        NOA.audio.play('sell');
        const from = GV.els.sell && GV.els.sell.isConnected ? GV.els.sell : null;
        const c = from ? UI.center(from) : { x: innerWidth / 2, y: innerHeight / 2 };
        if (from) FX().bump(from);
        FX().flyTo(c, NOA.ui.hud.els.coins, '🪙', Math.min(8, 2 + Math.floor(p / 40)));
        FX().float(c.x, c.y - 30, '+' + UI.num(p) + '🪙', 'big');
      };
      if (NOA.grids.needsConfirm(it)) {
        UI.modal({
          title: t('item.sell'),
          body: (b) => {
            b.append(h('div', { style: { width: '84px', height: '84px', margin: '0 auto' } }, UI.itemArt(it)),
              h('p', { style: { textAlign: 'center', fontWeight: '800' } }, I().name(it) + ' Lv' + it.level + ' → ' + UI.num(price) + '🪙'));
          },
          actions: [{ label: t('ui.cancel'), kind: 'ghost' }, { label: t('item.sell') + ' · ' + UI.num(price) + '🪙', kind: 'sun', onClick: go }]
        });
        return false;
      }
      go();
      return true;
    }
  };

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
      el: src, x0: e.clientX, y0: e.clientY, id: e.pointerId, moved: false, hover: null
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
    if (drag.kind === 'cell' && !S()[GV.grid].cells[drag.index]) return false;
    drag.moved = true;
    const r = drag.el.getBoundingClientRect();
    ghost = drag.el.cloneNode(true);
    ghost.classList.add('ghost');
    ghost.classList.remove('hint', 'fly-in', 'pop-in');
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
    const cells = S()[GV.grid].cells;
    if (drag.kind === 'cell') {
      const it = cells[drag.index];
      cells.forEach((o, i) => { if (i !== drag.index && I().canMerge(o, it)) out.push(GV.itemEl(i)); });
    } else if (drag.kind === 'bag') {
      cells.forEach((o, i) => { if (o && (drag.booster === 'loupe' ? !o.revealed : !o.charm)) out.push(GV.itemEl(i)); });
    }
    return out.filter(Boolean);
  }
  function highlight(on) {
    if (on) drag.targets = targetsFor();
    (drag.targets || []).forEach((el) => el.classList.toggle('hint', on));
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
    if (drag.kind === 'cell' && tgt.dataset.drop === 'cell') {
      const cells = S()[GV.grid].cells;
      const a = cells[+tgt.dataset.index], b = cells[drag.index];
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
    preview.style.left = Math.max(110, Math.min(innerWidth - 110, c.x)) + 'px';
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
    if (ok) { if (ghost) ghost.remove(); ghost = null; } else snapBack(d);
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
    const src = d.kind === 'cell' ? GV.itemEl(d.index) : d.el;
    if (!src || UI.reduced) { g.remove(); return; }
    const c = UI.center(src);
    g.classList.add('snap');
    g.style.left = c.x + 'px';
    g.style.top = c.y + 'px';
    g.style.transform = 'translate(-50%,-50%) scale(1)';
    setTimeout(() => g.remove(), 140);
  }

  function tap(d) {
    if (d.kind === 'bag') {
      NOA.audio.play('tap');
      UI.toast(C().boosters[d.booster].emoji + ' ' + t('booster.' + d.booster) + ': ' + t('booster.' + d.booster + '.desc'));
      return;
    }
    if (!S()[GV.grid].cells[d.index]) return;
    NOA.audio.play('tap');
    if (GV.selected === d.index && NOA.ui.panels.sheetOpen()) { NOA.ui.panels.closeSheet(); return; }
    NOA.ui.panels.itemSheet(GV.grid, d.index);
  }

  function drop(d, target) {
    const type = target.dataset.drop;
    const idx = target.dataset.index != null ? Number(target.dataset.index) : -1;
    const grid = GV.grid;
    if (d.kind === 'bag') return dropBooster(d.booster, type, idx, target);
    const from = d.index;
    const cells = S()[grid].cells;
    const it = cells[from];
    if (!it) return false;
    if (type === 'sell') return GV.sell(grid, from);
    if (type !== 'cell' || idx === from) return false;
    const other = cells[idx];
    if (!other) { NOA.grids.move(grid, from, idx); NOA.audio.play('drop'); return true; }
    if (I().canMerge(other, it)) return doMerge(from, idx);
    if (it.species === other.species && it.level === other.level) {
      UI.toast(it.locked || other.locked ? t('toast.locked') : t('toast.maxLevel'));
      return false;
    }
    if (it.species === other.species) UI.toast(t('toast.cantMerge'));
    NOA.grids.move(grid, from, idx);
    NOA.audio.play('drop');
    return true;
  }

  function dropBooster(id, type, idx, target) {
    if (type !== 'cell') { NOA.audio.play('invalid'); UI.toast(t('booster.wrongTarget')); return false; }
    const r = NOA.grids.applyBooster(GV.grid, id, idx);
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
      UI.toast(t('booster.used', { name: C().boosters[id].emoji + ' ' + t('booster.' + id) }), 'good');
    }
    return true;
  }

  /* ------------------------------------------------------------ merge feedback */
  function doMerge(from, to) {
    const res = NOA.grids.merge(GV.grid, from, to);
    if (!res) return false;
    const item = res.item;
    const c = UI.center(GV.cellEl(to));
    const art = GV.itemEl(to);
    if (art) art.classList.add('pop-in');
    const g = item.gene ? C().genes[item.gene.id] : null;
    const color = g ? g.color : '#8fdb6a';
    NOA.audio.play('merge', item.level, res.combo);
    NOA.audio.vibrate(12);
    FX().burst(c.x, c.y, { count: 12 + item.level * 4, colors: [color, '#ffffff', '#ffe680'], speed: 190 + item.level * 30, shapes: ['leaf', 'circle', 'star'] });
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
          FX().shake(GV.els.board);
          break;
        case 'purityUp':
          FX().float(c.x, c.y + 10, t('fx.purityUp', { n: f.purity }), 'gene', delay); delay += 0.2;
          NOA.audio.play('purity');
          break;
        case 'purityDown': FX().float(c.x, c.y + 10, t('fx.purityDown', { n: f.purity }), 'sad', delay); delay += 0.2; break;
        case 'geneLost': FX().float(c.x, c.y + 10, t('fx.geneLost'), 'sad', delay); delay += 0.2; NOA.audio.play('geneLost'); break;
        case 'purityCapped': UI.toast(t('fx.purityCapped')); break;
        case 'fusionLocked': UI.toast(t('fx.fusionLocked')); break;
        case 'fusionNeedsPurity': UI.toast(t('fx.fusionNeedsPurity')); break;
        case 'super': cinematic = 'super'; break;
        case 'fusion': if (cinematic !== 'super') cinematic = 'fusion'; break;
        case 'recessive': if (!cinematic) cinematic = 'recessive'; break;
        case 'awaken': if (!cinematic) cinematic = 'awaken'; break;
      }
    }
    if (cinematic && item.gene) setTimeout(() => FX().awaken(item, cinematic), 380);
    return true;
  }
})();
