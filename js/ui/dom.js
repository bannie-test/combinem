/*
 * UI helpers: element builder, item / goods art, modals, toasts, cost / reward labels, screens & tab bar.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const UI = NOA.ui = NOA.ui || {};
  const C = () => NOA.CONTENT;
  const I = () => NOA.items;
  const t = (k, p) => NOA.t(k, p);

  UI.reduced = !!(globalThis.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ------------------------------------------------------------ element builder */
  UI.h = function h(tag, attrs) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'on') { for (const ev in v) el.addEventListener(ev, v[ev]); }
        else if (k === 'data') { for (const d in v) if (v[d] != null) el.dataset[d] = v[d]; }
        else if (k === 'style') {
          if (typeof v === 'string') el.style.cssText = v;
          else for (const s in v) el.style.setProperty(s, v[s]);
        } else if (k === 'hidden') el.hidden = true;
        else if (typeof v === 'boolean') { if (k in el) el[k] = v; else el.setAttribute(k, ''); }
        else el.setAttribute(k, v);
      }
    }
    for (let i = 2; i < arguments.length; i++) UI.append(el, arguments[i]);
    return el;
  };
  UI.append = function (el, kid) {
    if (kid == null || kid === false) return;
    if (Array.isArray(kid)) { kid.forEach((k) => UI.append(el, k)); return; }
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  };
  UI.clear = (el) => { while (el && el.firstChild) el.firstChild.remove(); return el; };
  UI.$ = (sel, root) => (root || document).querySelector(sel);
  UI.btn = (label, kind, onClick, attrs) =>
    UI.h('button', Object.assign({ type: 'button', class: 'btn' + (kind ? ' btn--' + kind.split(' ').join(' btn--') : ''), on: onClick ? { click: onClick } : null }, attrs || {}), label);
  UI.center = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height };
  };

  /* ------------------------------------------------------------ formatting */
  UI.num = (n) => NOA.i18n.num(n);
  UI.compact = (n) => NOA.i18n.compact(n);
  UI.pct = (p) => NOA.util.pct(p);
  UI.dur = (ms) => NOA.util.fmtDuration(ms);
  const COST_ICON = { coins: '🪙', gems: '💎', rp: '🔬' };
  UI.cost = function (cost) {
    const parts = [];
    for (const k in cost || {}) {
      if (k === 'tickets') for (const tk in cost.tickets) parts.push('🎟️' + cost.tickets[tk]);
      else parts.push(UI.num(cost[k]) + COST_ICON[k]);
    }
    return parts.join(' · ');
  };
  UI.rewardPreview = function (r) {
    const out = [];
    if (!r) return out;
    if (r.coins) out.push({ icon: '🪙', n: r.coins });
    if (r.gems) out.push({ icon: '💎', n: r.gems });
    if (r.rp) out.push({ icon: '🔬', n: r.rp });
    for (const k in r.tickets || {}) out.push({ icon: '🎟️', n: r.tickets[k], label: t('ticket.' + k) });
    for (const k in r.boosters || {}) out.push({ icon: C().boosters[k].emoji, n: r.boosters[k], label: t('booster.' + k) });
    for (const k in r.materials || {}) out.push({ icon: C().materials[k].emoji, n: r.materials[k], label: t('material.' + k) });
    for (const k in r.products || {}) out.push({ icon: C().products[k].emoji, n: r.products[k], label: t('product.' + k) });
    for (const sp of (r.seeds || []).concat(r.animals || [])) out.push({ icon: C().species[sp.species].emoji, n: 1, label: t('species.' + sp.species) + ' Lv' + (sp.level || 1) });
    if (r.vault) out.push({ icon: '🌰', n: r.vault, label: t('res.vault') });
    if (r.nursery) out.push({ icon: '🐣', n: r.nursery, label: t('res.nursery') });
    if (r.mascot) out.push({ icon: C().mascots[r.mascot].emoji, n: 1, label: t('mascot.' + r.mascot) });
    return out;
  };
  /** entries from NOA.rewards.grant or UI.rewardPreview -> chips */
  UI.rewardChips = function (entries) {
    const wrap = UI.h('div', { class: 'rewards' });
    (entries || []).forEach((e, i) => {
      const label = e.label || (e.key ? t(e.key) : '');
      wrap.append(UI.h('span', { class: 'rchip', style: { 'animation-delay': (i * 0.06) + 's' } },
        UI.h('span', { class: 'ri' }, e.icon),
        UI.h('span', null, (e.n > 1 || e.key && e.key.startsWith('res.') ? '+' + UI.num(e.n) : '')),
        label ? UI.h('small', null, label) : null));
    });
    return wrap;
  };

  /* ------------------------------------------------------------ item art */
  UI.itemArt = function (item, opts) {
    opts = opts || {};
    if (!item) return UI.h('div', { class: 'art' });
    const gene = I().geneDef(item);
    const cls = ['art', 'art--' + item.kind];
    const style = {};
    if (gene) { cls.push('has-gene', 'gt-' + gene.tier); style['--gc'] = gene.color; }
    if (I().isSuper(item)) cls.push('is-super');
    if (item.locked) cls.push('locked-item');
    if (item.kind === 'animal') style['--as'] = String(0.72 + 0.07 * item.level);
    if (opts.size) style['--sz'] = opts.size + 'px';
    const el = UI.h('div', { class: cls.join(' '), style });
    if (item.kind === 'seed') el.append(UI.h('span', { class: 'sack' }));
    if (item.kind === 'animal') el.append(UI.h('span', { class: 'tuft' }));
    el.append(UI.h('span', { class: 'emo' }, I().emoji(item)));
    const e2 = I().emoji2(item);
    if (e2) el.append(UI.h('span', { class: 'emo2' }, e2));
    if (opts.badges === false) return el;
    if (I().isBreed(item)) el.append(UI.h('span', { class: 'b-lv' }, item.level));
    if (gene) el.append(UI.h('span', { class: 'b-gene' }, gene.emoji));
    else if (item.revealed && item.carrier) el.append(UI.h('span', { class: 'b-carrier', title: t('item.carrier', { gene: t('gene.' + item.carrier) }) }, C().genes[item.carrier].emoji));
    if (item.charm) el.append(UI.h('span', { class: 'b-charm' }, C().boosters[item.charm].emoji));
    if (item.locked) el.append(UI.h('span', { class: 'b-lock' }, '🔒'));
    return el;
  };

  /** Barn goods (product / material stack): emoji + stars + gene badge */
  UI.goodArt = function (pid, stars, gene, opts) {
    opts = opts || {};
    const g = gene ? C().genes[gene.id] : null;
    const style = {};
    if (g) style['--gc'] = g.color;
    if (opts.size) style['--sz'] = opts.size + 'px';
    const el = UI.h('div', { class: 'art art--good' + (g ? ' has-gene gt-' + g.tier : ''), style },
      UI.h('span', { class: 'emo' }, I().goodEmoji(pid)));
    if (opts.badges === false) return el;
    if ((stars || 1) > 1) el.append(UI.h('span', { class: 'b-st' }, stars + '★'));
    if (g) el.append(UI.h('span', { class: 'b-gene' }, g.emoji));
    return el;
  };

  /* ------------------------------------------------------------ toasts */
  UI.toast = function (msg, kind) {
    const root = document.getElementById('toasts');
    if (!root) return;
    const el = UI.h('div', { class: 'toast' + (kind ? ' toast--' + kind : ''), role: 'status' }, msg);
    root.append(el);
    while (root.children.length > 3) root.firstChild.remove();
    setTimeout(() => el.classList.add('out'), 2400);
    setTimeout(() => el.remove(), 2800);
  };

  /* ------------------------------------------------------------ modals */
  const stack = [];
  UI.modal = function (opts) {
    const root = document.getElementById('modals');
    let closed = false;
    const close = () => {
      if (closed) return;
      closed = true;
      const i = stack.indexOf(api);
      if (i >= 0) stack.splice(i, 1);
      wrap.classList.add('closing');
      setTimeout(() => wrap.remove(), 180);
      NOA.audio.play('close');
      if (opts.onClose) opts.onClose();
    };
    const body = UI.h('div', { class: 'modal-body' });
    const dismissable = opts.dismissable !== false;
    const card = UI.h('div', { class: 'modal ' + (opts.cls || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': opts.title || '' },
      opts.title ? UI.h('div', { class: 'modal-title' }, UI.h('h2', null, opts.title)) : null,
      dismissable ? UI.h('button', { type: 'button', class: 'btn-icon modal-x', 'aria-label': t('ui.close'), on: { click: close } }, '✕') : null,
      body);
    if (opts.actions && opts.actions.length) {
      const acts = UI.h('div', { class: 'modal-actions' });
      opts.actions.forEach((a) => {
        acts.append(UI.btn(a.label, a.kind || 'ghost', () => {
          if (a.onClick) a.onClick(close);
          if (!a.keepOpen) close();
        }, { disabled: !!a.disabled }));
      });
      card.append(acts);
    }
    const wrap = UI.h('div', { class: 'modal-wrap' },
      UI.h('div', { class: 'modal-bg', on: { click: () => { if (dismissable) close(); } } }), card);
    const api = { el: card, body, close };
    if (typeof opts.body === 'function') opts.body(body, api);
    else if (opts.body) body.append(opts.body);
    root.append(wrap);
    stack.push(api);
    NOA.audio.play('open');
    const focusable = card.querySelector('.modal-actions .btn, .btn');
    if (focusable) setTimeout(() => { try { focusable.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 50);
    return api;
  };
  UI.closeTopModal = () => { const top = stack[stack.length - 1]; if (top) top.close(); };
  UI.hasModal = () => stack.length > 0;

  /* ------------------------------------------------------------ app skeleton & screens */
  UI.screens = {};
  UI.current = 'farm';
  const TABS = [
    { id: 'farm', icon: '🌾' },
    { id: 'orders', icon: '📋' },
    { id: 'breed', icon: '🧬' },
    { id: 'barn', icon: '📦' },
    { id: 'shop', icon: '🛒' }
  ];
  // screens without a tab button (opened from buildings / the HUD)
  const EXTRA = ['codex'];

  UI.mount = function () {
    const app = document.getElementById('app');
    UI.clear(app);
    app.className = 'app';
    app.append(
      UI.h('header', { class: 'hud-bar', id: 'hud' }),
      UI.h('main', { class: 'screens', id: 'screens' },
        TABS.map((tb) => tb.id).concat(EXTRA).map((id) => UI.h('section', { class: 'screen scr-' + id, id: 'scr-' + id, hidden: id !== UI.current, 'aria-label': t('tab.' + id) }))),
      UI.h('nav', { class: 'tabbar', id: 'tabbar', 'aria-label': 'Menu' })
    );
    const ensure = (id, tag) => {
      if (!document.getElementById(id)) document.body.append(UI.h(tag || 'div', { id }));
    };
    ensure('modals');
    ensure('toasts');
    ensure('fx-canvas', 'canvas');
    ensure('fx-layer');
    ensure('overlays');
    UI.renderTabs();
  };
  UI.tabEl = (id) => document.querySelector('#tabbar [data-tab="' + id + '"]');
  UI.renderTabs = function () {
    const nav = document.getElementById('tabbar');
    if (!nav) return;
    // update in place when the buttons exist (a rebuild under the finger would eat the tap)
    if (nav.children.length === TABS.length && nav.dataset.lang === NOA.i18n.lang) {
      TABS.forEach((tb, i) => {
        const b = nav.children[i];
        b.setAttribute('aria-current', tb.id === UI.current ? 'page' : 'false');
        const badge = UI.tabBadge(tb.id);
        let dot = b.querySelector('.badge-dot');
        if (!badge) { if (dot) dot.remove(); return; }
        if (!dot) { dot = UI.h('span', { class: 'badge-dot' }); b.append(dot); }
        dot.classList.toggle('n', typeof badge === 'number');
        dot.textContent = typeof badge === 'number' ? String(badge) : '';
      });
      return;
    }
    nav.dataset.lang = NOA.i18n.lang;
    UI.clear(nav);
    TABS.forEach((tb) => {
      const b = UI.h('button', {
        type: 'button', class: 'tab', data: { tab: tb.id }, 'aria-current': tb.id === UI.current ? 'page' : 'false',
        on: { click: () => { NOA.audio.unlock(); NOA.audio.play('tap'); UI.show(tb.id); } }
      }, UI.h('span', { class: 'ti' }, tb.icon), UI.h('span', null, t('tab.' + tb.id)));
      const badge = UI.tabBadge(tb.id);
      if (badge) b.append(UI.h('span', { class: 'badge-dot' + (typeof badge === 'number' ? ' n' : '') }, typeof badge === 'number' ? String(badge) : null));
      nav.append(b);
    });
  };
  /** true / a count when a tab has something waiting */
  UI.tabBadge = function (id) {
    const s = NOA.state;
    if (!s) return false;
    if (id === 'orders') {
      const n = s.orders.filter((o) => NOA.orders.canDeliver(o)).length;
      return n || false;
    }
    if (id === 'breed') {
      return NOA.labs.ids.some((lab) => NOA.labs.isOpen(lab) && s.labs[lab].slots.some((j) => j && NOA.time.now() >= j.end));
    }
    if (id === 'barn') return NOA.barn.free() <= 0;
    if (id === 'shop') {
      const tickets = Object.keys(NOA.BALANCE.gacha.boxes).some((b) => NOA.gacha.isUnlocked(b) && (s.tickets[NOA.BALANCE.gacha.boxes[b].ticket] || 0) > 0);
      return tickets || NOA.payment.monthly.canClaim();
    }
    return false;
  };
  UI.show = function (id, opts) {
    UI.current = id;
    document.querySelectorAll('.screen').forEach((s) => { s.hidden = s.id !== 'scr-' + id; });
    UI.renderTabs();
    if (NOA.ui.panels) NOA.ui.panels.closeSheet();
    const view = UI.screens[id];
    if (view && view.render) view.render(opts);
    const scr = document.getElementById('screens');
    if (scr && id !== 'farm') scr.scrollTop = 0;
    if (NOA.ui.story) NOA.ui.story.applyFocus();
  };
  UI.renderAll = function () {
    UI.renderTabs();
    if (NOA.ui.hud) NOA.ui.hud.render();
    for (const id in UI.screens) {
      const s = document.getElementById('scr-' + id);
      if (s && UI.screens[id].render && (!s.hidden || id === 'farm')) UI.screens[id].render();
    }
  };
})();
