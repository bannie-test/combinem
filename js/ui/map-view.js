/*
 * 🌾 Farm map (Hay Day / Township style): one pannable, zoomable world split into clearly separated
 * zones — home yard & market, crop fields, flower garden, research labs, livestock pens, workshops
 * and the bee-ship dock. Fields, pens and buildings are objects on the map, not menu icons.
 *
 *   drag            pan (with inertia)        pinch / ctrl+wheel   zoom
 *   tap empty field seed picker               drag across ripe fields  ✂️ swipe harvest
 *   tap pen         collect when ready, otherwise the pen panel
 *   tap building    its panel / screen
 * Layout data (zones, positions) lives in config/content.js → map.
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
  const MAP = () => C().map;

  const ZONE_ICON = { home: '🏡', crop: '🌾', flower: '🌸', research: '🔬', livestock: '🐄', workshop: '🏭', dock: '🚀' };
  const INSET_TOP = 66;     // room for Bean + the sky widget over the top of the map
  const INSET_BOTTOM = 46;  // room for the zone bar
  const MAX_Z = 1.7;

  const cam = { x: 0, y: 0, z: 1, vw: 0, vh: 0, minZ: 0.5, anim: 0 };
  const ptrs = new Map();
  let gesture = null;
  let suppressClick = false;
  let saveTimer = 0;
  const px = (r) => ({ left: r.x + 'px', top: r.y + 'px', width: r.w + 'px', height: r.h + 'px' });
  /** screen y the camera centres on: the middle of the map area left free by the overlays */
  const focusY = () => (cam.vh + INSET_TOP - INSET_BOTTOM) / 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  const MV = NOA.ui.screens.farm = {
    els: {},

    render() {
      if (!MV.els.vp || !MV.els.vp.isConnected || MV._lang !== NOA.i18n.lang) { MV.build(); MV._lang = NOA.i18n.lang; }
      MV.updateAll();
      MV.resize();
    },

    /* ================================================================ build */
    build() {
      const root = document.getElementById('scr-farm');
      UI.clear(root);
      const e = MV.els = {};
      const m = MAP();
      e.world = h('div', { class: 'map-world', style: { width: m.width + 'px', height: m.height + 'px' } }, h('div', { class: 'map-ground' }));
      m.zones.forEach((z) => {
        e.world.append(h('div', { class: 'zone zone--' + z.ground + ' zone-' + z.id, id: 'zone-' + z.id, style: px(z) },
          h('div', { class: 'zone-sign' }, h('span', { class: 'zi' }, ZONE_ICON[z.id]), h('span', null, t('zone.' + z.id)))));
      });
      e.world.append(h('div', { class: 'pond', style: px(m.pond) }, h('span', { class: 'lily' }, '🪷'), h('span', { class: 'duck' }, '🦆')));
      m.deco.forEach((d) => e.world.append(h('span', { class: 'deco', 'aria-hidden': 'true', style: { left: d.x + 'px', top: d.y + 'px', 'font-size': d.s + 'px' } }, d.e)));

      e.plots = { crop: [], flower: [] };
      for (const bed of ['crop', 'flower']) {
        const L = m.plots[bed];
        for (let i = 0; i < B().fields[bed].max; i++) {
          const col = i % L.cols, row = Math.floor(i / L.cols);
          const el = h('button', {
            type: 'button', class: 'plot plot--' + bed, id: 'plot-' + bed + '-' + i, data: { bed, i: String(i) },
            style: { left: (L.x + col * (L.w + L.gap)) + 'px', top: (L.y + row * (L.h + L.gap)) + 'px', width: L.w + 'px', height: L.h + 'px' },
            on: { click: () => MV.onPlot(bed, i) }
          });
          e.plots[bed].push(el);
          e.world.append(el);
        }
      }
      e.blds = {};
      for (const id in m.buildings) {
        const def = C().buildings[id];
        const el = h('button', {
          type: 'button', class: 'bld bld--' + def.kind, id: 'bld-' + id, data: { b: id },
          style: Object.assign(px(m.buildings[id]), { '--roof': def.roof }),
          on: { click: () => MV.onBuilding(id) }
        });
        e.blds[id] = el;
        e.world.append(el);
      }

      e.ui = h('div', { class: 'map-ui' });
      e.shade = h('div', { class: 'map-shade', 'aria-hidden': 'true' });
      e.vp = h('div', { class: 'map-vp', 'aria-label': t('tab.farm') }, e.world, e.shade, e.ui);
      root.append(e.vp);
      NOA.ui.hud.mountOverlay(e.ui);

      // zone bar + zoom
      e.zoneBar = h('div', { class: 'zone-bar' },
        h('div', { class: 'zone-chips' }, m.zones.map((z) => h('button', {
          type: 'button', class: 'zchip', 'aria-label': t('zone.' + z.id), title: t('zone.' + z.id),
          on: { click: () => { NOA.audio.play('tap'); MV.flyToZone(z.id); } }
        }, h('span', null, ZONE_ICON[z.id]), h('small', null, t('zone.' + z.id))))),
        h('div', { class: 'zoom-ctl' },
          h('button', { type: 'button', class: 'btn-icon', 'aria-label': t('map.zoomOut'), title: t('map.zoomOut'), on: { click: () => MV.zoomBy(1 / 1.25) } }, '－'),
          h('button', { type: 'button', class: 'btn-icon', 'aria-label': t('map.zoomIn'), title: t('map.zoomIn'), on: { click: () => MV.zoomBy(1.25) } }, '＋')));
      e.ui.append(e.zoneBar);

      e.vp.addEventListener('pointerdown', onDown);
      e.vp.addEventListener('wheel', onWheel, { passive: false });
      e.vp.addEventListener('click', (ev) => { if (suppressClick) { ev.stopPropagation(); ev.preventDefault(); } }, true);
      e.world.addEventListener('focusin', (ev) => {
        let kb = false;
        try { kb = ev.target.matches(':focus-visible'); } catch (err) { kb = false; }
        if (kb && !gesture) MV.reveal(ev.target, true);
      });
      if (globalThis.ResizeObserver) {
        if (MV._ro) MV._ro.disconnect();
        MV._ro = new ResizeObserver(() => MV.resize());
        MV._ro.observe(e.vp);
      }
      cam.ready = false;
      MV.setSky(NOA.world.sky());
    },

    /* ================================================================ camera */
    resize() {
      const e = MV.els;
      if (!e.vp || !e.vp.isConnected) return;
      const r = e.vp.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const m = MAP();
      const oldCenter = cam.ready ? MV.worldAt(cam.vw / 2, focusY()) : null;
      cam.vw = r.width;
      cam.vh = r.height;
      cam.minZ = Math.min(1, cam.vw / m.width);
      if (!cam.ready) {
        cam.ready = true;
        const saved = S().camera;
        cam.z = clamp(saved && saved.z ? saved.z : cam.minZ, cam.minZ, MAX_Z);
        if (saved && saved.cx != null) MV.centerOn(saved.cx, saved.cy, cam.z);
        else { cam.x = (cam.vw - m.width * cam.z) / 2; cam.y = INSET_TOP; }
      } else {
        cam.z = clamp(cam.z, cam.minZ, MAX_Z);
        if (oldCenter) MV.centerOn(oldCenter.x, oldCenter.y, cam.z);
      }
      MV.applyCam();
    },
    worldAt(sx, sy) { return { x: (sx - cam.x) / cam.z, y: (sy - cam.y) / cam.z }; },
    clampCam() {
      const m = MAP();
      const ww = m.width * cam.z, wh = m.height * cam.z;
      if (ww <= cam.vw) cam.x = (cam.vw - ww) / 2;
      else cam.x = clamp(cam.x, cam.vw - ww, 0);
      const minY = cam.vh - INSET_BOTTOM - wh, maxY = INSET_TOP;
      cam.y = minY > maxY ? maxY : clamp(cam.y, minY, maxY);
    },
    applyCam() {
      MV.clampCam();
      const w = MV.els.world;
      if (!w) return;
      w.style.transform = 'translate3d(' + cam.x.toFixed(2) + 'px,' + cam.y.toFixed(2) + 'px,0) scale(' + cam.z.toFixed(4) + ')';
      w.style.setProperty('--z', cam.z.toFixed(3));
    },
    centerOn(wx, wy, z) {
      cam.z = z || cam.z;
      cam.x = cam.vw / 2 - wx * cam.z;
      cam.y = focusY() - wy * cam.z;
    },
    zoomAt(sx, sy, z) {
      const w = MV.worldAt(sx, sy);
      cam.z = clamp(z, cam.minZ, MAX_Z);
      cam.x = sx - w.x * cam.z;
      cam.y = sy - w.y * cam.z;
      MV.applyCam();
    },
    zoomBy(f) {
      stopAnim();
      const from = { x: cam.x, y: cam.y, z: cam.z };
      const w = MV.worldAt(cam.vw / 2, focusY());
      const z = clamp(cam.z * f, cam.minZ, MAX_Z);
      animate(from, () => { MV.centerOn(w.x, w.y, z); MV.clampCam(); return { x: cam.x, y: cam.y, z }; });
    },
    flyTo(wx, wy, z) {
      stopAnim();
      const from = { x: cam.x, y: cam.y, z: cam.z };
      animate(from, () => { MV.centerOn(wx, wy, z || cam.z); MV.clampCam(); return { x: cam.x, y: cam.y, z: cam.z }; });
    },
    flyToZone(id) {
      const z = MAP().zones.find((x) => x.id === id);
      if (z) MV.flyTo(z.x + z.w / 2, z.y + Math.min(z.h / 2, (cam.vh - INSET_TOP - INSET_BOTTOM) / 2 / cam.z));
    },
    /** true while a finger / mouse is panning, pinching or swiping the map */
    busy() { return !!gesture; },
    /** Bring a map element into view (tutorial focus, keyboard focus) */
    reveal(el, onlyIfHidden) {
      if (!el || !MV.els.world || !MV.els.world.contains(el)) return;
      const x = parseFloat(el.style.left), y = parseFloat(el.style.top);
      const w = parseFloat(el.style.width) || 0, hh = parseFloat(el.style.height) || 0;
      if (isNaN(x) || isNaN(y)) return;
      if (onlyIfHidden) {
        const sx = cam.x + x * cam.z, sy = cam.y + y * cam.z;
        if (sx >= 0 && sy >= INSET_TOP && sx + w * cam.z <= cam.vw && sy + hh * cam.z <= cam.vh - INSET_BOTTOM) return;
      }
      MV.flyTo(x + w / 2, y + hh / 2);
    },
    saveCamSoon() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const c = MV.worldAt(cam.vw / 2, focusY());
        S().camera = { cx: Math.round(c.x), cy: Math.round(c.y), z: Math.round(cam.z * 1000) / 1000 };
        NOA.save.schedule();
      }, 400);
    },

    /* ================================================================ sky over the farm */
    setSky(st) {
      const vp = MV.els.vp;
      if (!vp) return;
      vp.className = 'map-vp ph-' + st.phase + ' wx-' + st.weather + (st.rainbow ? ' rainbow' : '') + (st.fullMoon ? ' fullmoon' : '');
    },

    /* ================================================================ updates */
    updateAll() {
      if (!MV.els.world) return;
      MV.updatePlots('crop');
      MV.updatePlots('flower');
      for (const id in MV.els.blds) MV.updateBuilding(id);
    },
    updatePlots(bed) {
      const e = MV.els;
      if (!e.plots) return;
      const plots = S().fields[bed];
      e.plots[bed].forEach((el, i) => {
        const p = plots[i];
        if (p) renderPlot(el, p, bed, i);
        else if (i === plots.length) renderForSale(el, bed, i);
        else renderWild(el, bed, i);
      });
    },
    updateBuilding(id) {
      const el = MV.els.blds && MV.els.blds[id];
      if (!el) return;
      const kind = C().buildings[id].kind;
      if (kind === 'pen') renderPen(el, id);
      else if (kind === 'factory') renderFactory(el, id);
      else if (kind === 'ship') renderDock(el);
      else renderBuilding(el, id);
    },
    /** 4 Hz: progress bars and timers of what is on the map */
    tick() {
      if (UI.current !== 'farm' || !MV.els.world) return;
      const now = NOA.time.now();
      for (const bed of ['crop', 'flower']) {
        S().fields[bed].forEach((p, i) => {
          const el = MV.els.plots[bed][i];
          if (!el || !p.seed || NOA.farm.isReady(p)) return;
          if (el._stage !== stageOf(p)) { renderPlot(el, p, bed, i); return; }
          const bar = el.querySelector('.p-bar i');
          if (bar) bar.style.width = (NOA.farm.progress(p) * 100).toFixed(1) + '%';
        });
      }
      for (const penId in S().pens) {
        const el = MV.els.blds[penId];
        if (!el) continue;
        S().pens[penId].slots.forEach((slot, i) => {
          if (!slot || !slot.end || now >= slot.end) return;
          const ring = el.querySelector('.an[data-slot="' + i + '"] .an-ring');
          if (ring) ring.style.setProperty('--p', NOA.farm.progress(slot).toFixed(3));
        });
      }
      for (const id of NOA.production.ids()) {
        const el = MV.els.blds[id];
        const tm = el && el.querySelector('.b-bubble .tm');
        if (!tm) continue;
        const job = NOA.production.queue(id).find((j) => now < j.end);
        if (job) tm.textContent = UI.dur(job.end - now);
      }
      const dock = MV.els.blds.dock;
      const dtm = dock && dock.querySelector('.b-bubble .tm');
      if (dtm) dtm.textContent = UI.dur(NOA.ship.left());
    },

    /* ================================================================ interactions */
    onPlot(bed, i) {
      NOA.audio.unlock();
      const p = S().fields[bed][i];
      if (!p) {
        if (i === S().fields[bed].length) MV.buyPlot(bed);
        else { NOA.audio.play('invalid'); UI.toast(t('toast.levelReq', { level: B().fields[bed].levelReq[i] })); }
        return;
      }
      if (NOA.farm.isReady(p)) { MV.harvest(bed, i); return; }
      NOA.audio.play('tap');
      if (!p.seed) NOA.ui.panels.seedPicker(bed, i);
      else NOA.ui.panels.plotSheet(bed, i);
    },
    buyPlot(bed) {
      const c = NOA.farm.nextPlotCost(bed);
      if (!c) return;
      if (S().level < c.level) { NOA.audio.play('invalid'); UI.toast(t('toast.levelReq', { level: c.level })); return; }
      UI.modal({
        title: t('plot.buy'),
        body: h('p', { style: { textAlign: 'center', fontWeight: '800', fontSize: '18px' } }, (bed === 'crop' ? '🟫 ' : '🌸 ') + t('zone.' + bed) + ' · ' + UI.num(c.coins) + '🪙'),
        actions: [
          { label: t('ui.cancel'), kind: 'ghost' },
          {
            label: t('ui.confirm'), kind: 'leaf', onClick: () => {
              const r = NOA.farm.unlockPlot(bed);
              if (r.ok) {
                NOA.audio.play('unlock');
                const el = MV.els.plots[bed][S().fields[bed].length - 1];
                const c2 = UI.center(el);
                FX().confetti(c2.x, c2.y, 40);
              } else UI.toast(r.error === 'coins' ? t('toast.notEnough', { name: t('res.coins') }) : t('toast.levelReq', { level: r.level }), 'warn');
            }
          }
        ]
      });
    },
    /** Harvest one field with all its feedback. -> true when something was harvested */
    harvest(bed, i) {
      const el = MV.els.plots[bed][i];
      const r = NOA.farm.harvest(bed, i);
      if (!r) return false;
      if (r.error === 'barn') {
        NOA.audio.play('invalid');
        FX().shake(el);
        FX().bump(UI.tabEl('barn'));
        UI.toast(t('harvest.barnFull', { n: r.need - NOA.barn.free() }), 'warn');
        return false;
      }
      const c = UI.center(el);
      NOA.audio.play('harvest');
      NOA.audio.vibrate(12);
      FX().burst(c.x, c.y, { count: 18, colors: ['#5cbb49', '#9be37a', '#ffd36b', '#c08a5f'], shapes: ['leaf', 'circle'], speed: 220 });
      const emo = I().goodEmoji(r.goods[0].pid);
      FX().flyTo(c, UI.tabEl('barn'), emo, Math.min(6, r.goods.length));
      let line = '+' + r.goods.length + ' ' + emo;
      for (const m in r.mats) line += '  +' + r.mats[m] + ' ' + C().materials[m].emoji;
      FX().float(c.x, c.y - 8, line, 'good');
      if (r.seeds.length) {
        setTimeout(() => FX().flyTo(c, UI.tabEl('breed'), '🌰', r.seeds.length), 180);
        FX().float(c.x, c.y + 18, t('harvest.seeds', { n: r.seeds.length }), '', 0.15);
        if (r.seeds.some((s) => s.where === 'pending')) UI.toast(t('harvest.pending', { n: S().vault.pending.length }), 'warn');
        const g = r.seeds.find((s) => s.item.gene);
        if (g) FX().float(c.x, c.y + 40, C().genes[g.item.gene.id].emoji + ' ' + I().name(g.item), 'gene', 0.3);
      }
      if (r.lostSeeds) UI.toast(t('harvest.lostSeeds', { n: r.lostSeeds }), 'warn');
      return true;
    },
    onBuilding(id) {
      NOA.audio.unlock();
      const def = C().buildings[id];
      const lock = lockLevel(id);
      if (lock) { NOA.audio.play('invalid'); FX().shake(MV.els.blds[id]); UI.toast(t('toast.levelReq', { level: lock })); return; }
      NOA.audio.play('tap');
      switch (def.kind) {
        case 'house': UI.show('codex', { tab: 'story' }); break;
        case 'orders': UI.show('orders'); break;
        case 'barn': UI.show('barn'); break;
        case 'market': UI.show('shop', { tab: 'breeds' }); break;
        case 'lab': UI.show('breed', { grid: NOA.labs.grid(def.lab) }); break;
        case 'shrine': UI.show('codex', { tab: 'mascots' }); break;
        case 'gacha': UI.show('shop', { tab: 'gacha' }); break;
        case 'pen': MV.onPen(id); break;
        case 'factory': MV.onFactory(id); break;
        case 'ship': NOA.ui.panels.shipPanel(); break;
      }
    },
    onPen(penId) {
      if (NOA.farm.readyCount(penId) > 0) { MV.collectPen(penId); return; }
      NOA.ui.panels.penPanel(penId);
    },
    collectPen(penId) {
      const el = MV.els.blds[penId];
      const r = NOA.farm.collectAll(penId);
      const c = UI.center(el);
      if (r.collected) {
        NOA.audio.play('harvest');
        NOA.audio.vibrate(12);
        FX().burst(c.x, c.y, { count: 16, colors: ['#fff6d6', '#ffd36b', '#ffffff'], speed: 200 });
        const emo = I().goodEmoji(r.goods[0].pid);
        FX().flyTo(c, UI.tabEl('barn'), emo, Math.min(6, r.goods.length));
        FX().float(c.x, c.y - 8, '+' + r.goods.length + ' ' + emo + (r.manure ? '  +' + r.manure + ' 💩' : ''), 'good');
        if (r.young.length) {
          setTimeout(() => FX().flyTo(c, UI.tabEl('breed'), I().emoji(r.young[0].item), r.young.length), 200);
          FX().float(c.x, c.y + 20, t('pen.young', { n: r.young.length }), 'gene', 0.2);
        }
        if (r.lostYoung) UI.toast(t('pen.lostYoung', { n: r.lostYoung }), 'warn');
      }
      if (r.error === 'barn') { NOA.audio.play('invalid'); FX().shake(el); UI.toast(t('barn.full'), 'warn'); }
      return r;
    },
    onFactory(id) {
      if (NOA.production.readyJobs(id).length) MV.collectFactory(id);
      NOA.ui.panels.factoryPanel(id);
    },
    collectFactory(id) {
      const el = MV.els.blds[id];
      const r = NOA.production.collect(id);
      const c = UI.center(el);
      if (r.items.length) {
        NOA.audio.play('harvest');
        const emo = I().goodEmoji(r.items[0].pid);
        FX().burst(c.x, c.y, { count: 14, colors: ['#ffd36b', '#ffffff', '#ff9f80'], shapes: ['star', 'circle'], speed: 200 });
        FX().flyTo(c, UI.tabEl('barn'), emo, r.items.length);
        FX().float(c.x, c.y - 8, '+' + r.items.length + ' ' + emo, 'good');
      }
      if (r.error === 'barn') { NOA.audio.play('invalid'); UI.toast(t('barn.full'), 'warn'); }
      return r;
    }
  };

  /* ================================================================ renderers */
  function lockLevel(id) {
    const def = C().buildings[id];
    if (def.kind === 'pen') return NOA.farm.penOpen(id) ? 0 : penUnlockLevel(id);
    if (def.kind === 'factory') return NOA.production.isOpen(id) ? 0 : NOA.production.cfg(id).unlockLevel;
    if (def.unlock && !NOA.progress.isUnlocked(def.unlock)) return B().unlocks[def.unlock];
    return 0;
  }
  function penUnlockLevel(penId) {
    let lv = 99;
    for (const sp of NOA.farm.penSpecies(penId)) if (!C().species[sp].hybrid) lv = Math.min(lv, B().species[sp].unlockLevel);
    return lv;
  }
  function stageOf(p) {
    if (!p.seed) return 'empty';
    if (NOA.farm.isReady(p)) return 'ready';
    const q = NOA.farm.progress(p);
    return q < 0.34 ? 's1' : q < 0.75 ? 's2' : 's3';
  }
  function plantEmojis(p, stage, n) {
    const sp = C().species[p.seed.species];
    const out = [];
    for (let k = 0; k < n; k++) {
      let e = sp.emoji;
      if (sp.emoji2 && k % 2) e = sp.emoji2;
      if (stage === 's1') e = '🌱';
      else if (stage === 's2') e = '🌿';
      out.push(h('span', { class: 'pl', style: { '--k': String(k) } }, e));
    }
    return out;
  }
  function renderPlot(el, p, bed, i) {
    const stage = stageOf(p);
    const g = p.seed && p.seed.gene ? C().genes[p.seed.gene.id] : null;
    const sig = [stage, p.seed ? p.seed.id : '', p.fert].join('|');
    el._stage = stage;
    if (el._sig === sig) return;
    el._sig = sig;
    UI.clear(el);
    el.className = 'plot plot--' + bed + ' st-' + stage + (stage === 'ready' ? ' ready' : '') + (p.fert ? ' fert' : '') + (g ? ' has-gene' : '');
    el.style.removeProperty('--gc');
    if (g) el.style.setProperty('--gc', g.color);
    let label;
    if (!p.seed) {
      el.append(h('span', { class: 'p-hint' }, '＋'));
      label = t('farm.plot') + ' ' + (i + 1) + ' · ' + t('plot.empty');
    } else {
      el.append(h('span', { class: 'p-plants' }, plantEmojis(p, stage, bed === 'crop' ? 6 : 5)));
      if (stage !== 'ready') el.append(h('span', { class: 'p-bar' }, h('i', { style: { width: (NOA.farm.progress(p) * 100).toFixed(1) + '%' } })));
      else el.append(h('span', { class: 'p-tag' }, '✂️ ' + t('plot.harvest')));
      if (g) el.append(h('span', { class: 'p-gene' }, g.emoji));
      label = I().name(p.seed) + ' Lv' + p.seed.level + (stage === 'ready' ? ' · ' + t('ui.ready') : '');
    }
    if (p.fert) el.append(h('span', { class: 'p-fert', title: t('plot.fert') }, '💩'));
    el.setAttribute('aria-label', label);
  }
  function renderForSale(el, bed, i) {
    const c = NOA.farm.nextPlotCost(bed);
    const sig = 'sale|' + S().level;
    if (el._sig === sig) return;
    el._sig = sig;
    el._stage = null;
    UI.clear(el);
    const locked = !c || S().level < c.level;
    el.className = 'plot plot--' + bed + ' ' + (locked ? 'wild' : 'forsale');
    el.append(h('span', { class: 'p-sign' }, locked ? '🔒 ' + t('plot.locked', { level: c ? c.level : '?' }) : '🪙 ' + UI.compact(c.coins)));
    el.setAttribute('aria-label', t('plot.buy') + ' ' + (i + 1) + (locked ? ' · ' + t('plot.locked', { level: c.level }) : ' · ' + UI.num(c.coins) + '🪙'));
  }
  function renderWild(el, bed, i) {
    const lv = B().fields[bed].levelReq[i];
    const sig = 'wild|' + lv;
    if (el._sig === sig) return;
    el._sig = sig;
    el._stage = null;
    UI.clear(el);
    el.className = 'plot plot--' + bed + ' wild far';
    el.append(h('span', { class: 'p-bush', 'aria-hidden': 'true' }, bed === 'crop' ? '🌿' : '🌼'), h('span', { class: 'p-sign' }, '🔒 ' + t('plot.locked', { level: lv })));
    el.setAttribute('aria-label', t('plot.buy') + ' ' + (i + 1) + ' · ' + t('plot.locked', { level: lv }));
  }

  function houseArt(emoji) {
    return h('span', { class: 'b-art' }, h('span', { class: 'b-wall' }, h('span', { class: 'b-door' })), h('span', { class: 'b-roof' }), h('span', { class: 'b-emo' }, emoji));
  }
  function nameTag(id, extra) {
    return h('span', { class: 'b-name' }, t('bld.' + id), extra ? h('small', null, extra) : null);
  }
  function bubble(content, cls) { return h('span', { class: 'b-bubble ' + (cls || '') }, content); }
  function lockTag(level) { return h('span', { class: 'b-lock' }, '🔒 ' + t('ui.lv', { n: level })); }

  /** pairs that can be merged right now in a grid (same species & level, unlocked) */
  function mergePairs(grid) {
    const n = {};
    for (const it of S()[grid].cells) {
      if (!it || it.locked || I().isMaxed(it)) continue;
      const k = it.species + ':' + it.level;
      n[k] = (n[k] || 0) + 1;
    }
    let pairs = 0;
    for (const k in n) pairs += Math.floor(n[k] / 2);
    return pairs;
  }
  MV.mergePairs = mergePairs;

  function renderBuilding(el, id) {
    const def = C().buildings[id];
    const lock = lockLevel(id);
    UI.clear(el);
    el.className = 'bld bld--' + def.kind + ' bld-' + id + (lock ? ' locked' : '');
    let art;
    if (def.kind === 'orders') {
      art = h('span', { class: 'b-art' }, h('span', { class: 'board' }, h('i'), h('i'), h('i'), h('i')), h('span', { class: 'b-emo' }, def.emoji));
    } else if (def.kind === 'market') {
      art = h('span', { class: 'b-art' }, h('span', { class: 'awning' }), h('span', { class: 'counter' }, '🍅🌾🥚'), h('span', { class: 'b-emo' }, def.emoji));
    } else if (def.kind === 'gacha') {
      art = h('span', { class: 'b-art' }, h('span', { class: 'tree' }, '🎋'), h('span', { class: 'ribbons' }, '🎀'));
    } else if (def.kind === 'shrine') {
      art = h('span', { class: 'b-art' }, h('span', { class: 'torii' }, '⛩️'), h('span', { class: 'lanterns' }, '🏮 🏮'));
    } else {
      const lvl = def.kind === 'lab' ? NOA.labs.level(def.lab) : 0;
      art = houseArt(def.emoji);
      if (lvl) art.append(h('span', { class: 'b-lv' }, 'Lv' + lvl));
    }
    el.append(art);
    let extra = null;
    if (id === 'barn') extra = NOA.barn.used() + '/' + NOA.barn.cap();
    el.append(nameTag(id, extra));
    if (lock) { el.append(lockTag(lock)); el.setAttribute('aria-label', t('bld.' + id) + ' · ' + t('toast.levelReq', { level: lock })); return; }
    el.setAttribute('aria-label', t('bld.' + id) + (extra ? ' · ' + extra : ''));
    const s = S();
    if (id === 'orders') {
      const n = s.orders.filter((o) => NOA.orders.canDeliver(o)).length;
      if (n) el.append(bubble('✅ ' + n, 'good'));
    } else if (id === 'barn') {
      if (NOA.barn.free() <= 0) el.append(bubble('⚠️', 'warn'));
    } else if (def.kind === 'lab') {
      const grid = NOA.labs.grid(def.lab);
      const hybridReady = s.labs[def.lab].slots.some((j) => j && NOA.time.now() >= j.end);
      const pairs = mergePairs(grid);
      if (hybridReady) el.append(bubble('🧪✨', 'good'));
      else if (grid === 'vault' && s.vault.pending.length) el.append(bubble('🧺 ' + s.vault.pending.length, 'warn'));
      else if (pairs) el.append(bubble('🧬 ' + pairs, 'info'));
    } else if (def.kind === 'gacha') {
      const n = Object.values(s.tickets).reduce((a, b) => a + b, 0);
      if (n) el.append(bubble('🎟️ ' + n, 'good'));
    }
  }

  const SLOT_POS = [[14, 54], [58, 60], [102, 54], [16, 98], [60, 104], [104, 98]];
  function renderPen(el, penId) {
    const lock = lockLevel(penId);
    const pen = S().pens[penId];
    const def = C().buildings[penId];
    const now = NOA.time.now();
    UI.clear(el);
    const ready = NOA.farm.readyCount(penId);
    el.className = 'bld bld--pen pen-' + penId + (lock ? ' locked' : '') + (ready ? ' ready' : '');
    const yard = h('span', { class: 'pen-yard' },
      h('span', { class: 'pen-shed' }, h('span', { class: 'b-emo' }, def.emoji)),
      h('span', { class: 'trough' }));
    if (!lock) {
      const used = pen.slots.filter(Boolean).length;
      pen.slots.forEach((slot, i) => {
        const [x, y] = SLOT_POS[i] || SLOT_POS[0];
        if (!slot) { yard.append(h('span', { class: 'an empty', style: { left: x + 'px', top: y + 'px' } }, '＋')); return; }
        const a = slot.animal;
        const g = a.gene ? C().genes[a.gene.id] : null;
        const st = !slot.end ? 'hungry' : now >= slot.end ? 'done' : 'work';
        const style = { left: x + 'px', top: y + 'px', '--d': (i * 0.7) + 's' };
        if (g) style['--gc'] = g.color;
        const an = h('span', { class: 'an ' + st + (g ? ' has-gene' : ''), data: { slot: String(i) }, style },
          h('span', { class: 'an-e', style: { '--as': String(0.8 + 0.06 * a.level) } }, I().emoji(a)));
        if (st === 'hungry') an.append(h('span', { class: 'an-think' }, (NOA.farm.feedFor(a).map((f) => I().goodEmoji(f))[0]) || '🍽️'));
        else if (st === 'work') an.append(h('span', { class: 'an-ring', style: { '--p': NOA.farm.progress(slot).toFixed(3) } }));
        else an.append(h('span', { class: 'an-prod' }, I().goodEmoji(C().species[C().species[a.species].hybrid ? C().species[a.species].hybrid[0] : a.species].products[0])));
        yard.append(an);
      });
      el.append(yard, nameTag(penId, used + '/' + pen.slots.length));
      const hungry = pen.slots.filter((s) => NOA.farm.hungry(s)).length;
      if (ready) el.append(bubble('✋ ' + ready, 'good'));
      else if (hungry) el.append(bubble('🍽️ ' + hungry, 'warn'));
      else if (!used) el.append(bubble('＋', 'info'));
      el.setAttribute('aria-label', t('bld.' + penId) + ' · ' + used + '/' + pen.slots.length + (ready ? ' · ' + t('pen.ready') : hungry ? ' · ' + t('pen.hungry') : ''));
    } else {
      el.append(yard, nameTag(penId), lockTag(lock));
      el.setAttribute('aria-label', t('bld.' + penId) + ' · ' + t('toast.levelReq', { level: lock }));
    }
  }

  function renderFactory(el, id) {
    const lock = lockLevel(id);
    const def = C().buildings[id];
    UI.clear(el);
    const q = lock ? [] : NOA.production.queue(id);
    const now = NOA.time.now();
    const ready = q.filter((j) => now >= j.end);
    const running = q.find((j) => now < j.end);
    el.className = 'bld bld--factory bld-' + id + (lock ? ' locked' : '') + (ready.length ? ' ready' : '') + (running ? ' working' : '');
    el.append(houseArt(def.emoji), h('span', { class: 'smoke', 'aria-hidden': 'true' }, h('i'), h('i'), h('i')));
    el.append(nameTag(id, lock ? null : q.length + '/' + NOA.production.slots(id)));
    if (lock) { el.append(lockTag(lock)); el.setAttribute('aria-label', t('bld.' + id) + ' · ' + t('toast.levelReq', { level: lock })); return; }
    if (ready.length) el.append(bubble(I().goodEmoji(ready[0].pid) + (ready.length > 1 ? ' ×' + ready.length : ' ✓'), 'good'));
    else if (running) el.append(bubble([I().goodEmoji(running.pid) + ' ', h('b', { class: 'tm num' }, UI.dur(running.end - now))], 'info'));
    else el.append(bubble('💤', 'idle'));
    el.setAttribute('aria-label', t('bld.' + id) + ' · ' + t('prod.queue', { n: q.length, max: NOA.production.slots(id) }));
  }

  function renderDock(el) {
    const lock = lockLevel('dock');
    UI.clear(el);
    const docked = !lock && NOA.ship.docked();
    el.className = 'bld bld--ship' + (lock ? ' locked' : '') + (docked ? ' docked' : ' away');
    const pad = h('span', { class: 'pad' }, h('span', { class: 'pad-h' }, 'H'));
    if (docked) {
      const crates = S().ship.crates.map((c) => h('span', { class: 'crate' + (c.filled ? ' filled' : '') }, c.filled ? '✅' : I().goodEmoji(c.product)));
      pad.append(h('span', { class: 'ship' }, h('span', { class: 'ship-body' }, '🚀'), h('span', { class: 'ship-bee' }, '🐝')), h('span', { class: 'crates' }, crates));
    }
    el.append(pad, nameTag('dock'));
    if (lock) { el.append(lockTag(lock)); el.setAttribute('aria-label', t('bld.dock') + ' · ' + t('toast.levelReq', { level: lock })); return; }
    el.append(bubble([docked ? '🚀 ' : '✈️ ', h('b', { class: 'tm num' }, UI.dur(NOA.ship.left()))], docked ? 'good' : 'idle'));
    el.setAttribute('aria-label', t('bld.dock') + ' · ' + (docked ? t('ship.docked', { t: UI.dur(NOA.ship.left()) }) : t('ship.away', { t: UI.dur(NOA.ship.left()) })));
  }

  /* ================================================================ gestures */
  function vpPoint(ev) {
    const r = MV.els.vp.getBoundingClientRect();
    return { x: ev.clientX - r.left, y: ev.clientY - r.top };
  }
  function onDown(ev) {
    NOA.ui.hud.noteInput();
    if (ev.pointerType === 'mouse' && ev.button !== 0) return;
    if (ev.target.closest('.map-ui button, .map-ui .bubble, .zone-bar')) return;
    stopAnim();
    ptrs.set(ev.pointerId, vpPoint(ev));
    if (ptrs.size === 1) {
      const ripe = ev.target.closest('.plot.ready');
      const p = vpPoint(ev);
      gesture = { type: ripe ? 'swipe' : 'pan', x0: p.x, y0: p.y, cx: cam.x, cy: cam.y, moved: false, hist: [[performance.now(), p.x, p.y]], done: new Set() };
      document.addEventListener('pointermove', onMove, { passive: false });
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    } else if (ptrs.size === 2) {
      endSickle();
      const [a, b] = [...ptrs.values()];
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      gesture = { type: 'pinch', d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: cam.z, w: MV.worldAt(mid.x, mid.y), moved: true };
    }
  }
  function onMove(ev) {
    if (!ptrs.has(ev.pointerId) || !gesture) return;
    const p = vpPoint(ev);
    ptrs.set(ev.pointerId, p);
    if (gesture.type === 'pinch') {
      if (ptrs.size < 2) return;
      ev.preventDefault();
      const [a, b] = [...ptrs.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      cam.z = clamp(gesture.z0 * d / gesture.d0, cam.minZ, MAX_Z);
      cam.x = mid.x - gesture.w.x * cam.z;
      cam.y = mid.y - gesture.w.y * cam.z;
      MV.applyCam();
      return;
    }
    const dx = p.x - gesture.x0, dy = p.y - gesture.y0;
    if (!gesture.moved) {
      if (dx * dx + dy * dy < 64) return;
      gesture.moved = true;
      if (gesture.type === 'swipe') startSickle(ev);
    }
    ev.preventDefault();
    if (gesture.type === 'pan') {
      cam.x = gesture.cx + dx;
      cam.y = gesture.cy + dy;
      MV.applyCam();
      gesture.hist.push([performance.now(), p.x, p.y]);
      if (gesture.hist.length > 6) gesture.hist.shift();
    } else if (gesture.type === 'swipe') {
      moveSickle(ev);
      const under = document.elementFromPoint(ev.clientX, ev.clientY);
      const plot = under && under.closest('.plot.ready');
      if (plot && !gesture.done.has(plot.id)) {
        gesture.done.add(plot.id);
        MV.harvest(plot.dataset.bed, Number(plot.dataset.i));
      }
    }
  }
  function onUp(ev) {
    if (!ptrs.has(ev.pointerId)) return;
    ptrs.delete(ev.pointerId);
    const g = gesture;
    if (ptrs.size === 1 && g && g.type === 'pinch') {
      // keep panning with the finger that stayed down
      const [p] = [...ptrs.values()];
      gesture = { type: 'pan', x0: p.x, y0: p.y, cx: cam.x, cy: cam.y, moved: true, hist: [[performance.now(), p.x, p.y]] };
      return;
    }
    if (ptrs.size) return;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onUp);
    gesture = null;
    if (!g) return;
    if (g.moved) {
      suppressClick = true;
      setTimeout(() => { suppressClick = false; }, 80);
    }
    if (g.type === 'swipe') endSickle();
    if (g.type === 'pan' && g.moved && g.hist.length > 1) {
      const a = g.hist[0], b = g.hist[g.hist.length - 1];
      const dt = Math.max(1, b[0] - a[0]);
      if (performance.now() - b[0] < 90) glide((b[1] - a[1]) / dt, (b[2] - a[2]) / dt);
    }
    if (g.moved) MV.saveCamSoon();
  }
  function onWheel(ev) {
    ev.preventDefault();
    stopAnim();
    const p = vpPoint(ev);
    if (ev.ctrlKey || ev.metaKey) MV.zoomAt(p.x, p.y, cam.z * Math.exp(-ev.deltaY * 0.01));
    else {
      cam.x -= ev.shiftKey ? ev.deltaY : ev.deltaX;
      cam.y -= ev.shiftKey ? 0 : ev.deltaY;
      MV.applyCam();
    }
    MV.saveCamSoon();
  }

  /* ------------------------------------------------------------ camera animation */
  function stopAnim() { if (cam.anim) cancelAnimationFrame(cam.anim); cam.anim = 0; }
  function animate(from, targetFn) {
    const to = targetFn();
    cam.x = from.x; cam.y = from.y; cam.z = from.z;
    if (UI.reduced) { cam.x = to.x; cam.y = to.y; cam.z = to.z; MV.applyCam(); MV.saveCamSoon(); return; }
    const t0 = performance.now(), dur = 420;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - k, 3);
      cam.x = from.x + (to.x - from.x) * e;
      cam.y = from.y + (to.y - from.y) * e;
      cam.z = from.z + (to.z - from.z) * e;
      MV.applyCam();
      cam.anim = k < 1 ? requestAnimationFrame(step) : 0;
      if (k >= 1) MV.saveCamSoon();
    };
    cam.anim = requestAnimationFrame(step);
  }
  function glide(vx, vy) {
    if (UI.reduced) return;
    let last = performance.now();
    const step = (now) => {
      const dt = Math.min(40, now - last);
      last = now;
      cam.x += vx * dt;
      cam.y += vy * dt;
      const f = Math.pow(0.94, dt / 16);
      vx *= f; vy *= f;
      MV.applyCam();
      cam.anim = Math.hypot(vx, vy) > 0.02 ? requestAnimationFrame(step) : 0;
      if (!cam.anim) MV.saveCamSoon();
    };
    cam.anim = requestAnimationFrame(step);
  }

  /* ------------------------------------------------------------ ✂️ sickle */
  let sickle = null;
  function startSickle(ev) {
    sickle = h('div', { class: 'sickle', 'aria-hidden': 'true' }, '✂️');
    document.body.append(sickle);
    moveSickle(ev);
  }
  function moveSickle(ev) {
    if (!sickle) return;
    sickle.style.left = ev.clientX + 'px';
    sickle.style.top = ev.clientY + 'px';
  }
  function endSickle() { if (sickle) { sickle.remove(); sickle = null; } }
})();
