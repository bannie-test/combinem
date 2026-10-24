/*
 * Story: the intro cutscene and the step-by-step tutorial led by robot Bean.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const UI = NOA.ui;
  const h = (...a) => UI.h(...a);
  const t = (k, p) => NOA.t(k, p);
  const S = () => NOA.state;
  const C = () => NOA.CONTENT;

  const SCENES = [
    { cls: 's1', art: '🌍🥀' },
    { cls: 's2', art: '🧬🌱🚀' },
    { cls: 's3', art: '🪐✨' },
    { cls: 's4', art: '💥🧬✨' },
    { cls: 's5', art: '❄️🛌💤' },
    { cls: 's6', art: null }
  ];

  const beanEl = () => h('span', { class: 'bean', 'aria-hidden': 'true' },
    h('span', { class: 'sprout' }),
    h('span', { class: 'bean-body' }, h('span', { class: 'eye l' }), h('span', { class: 'eye r' }), h('span', { class: 'blush' }), h('span', { class: 'mouth' })));

  const ST = NOA.ui.story = {
    /* ------------------------------------------------------------ intro */
    intro(onDone) {
      let i = 0;
      const ov = h('div', { class: 'intro', role: 'dialog', 'aria-label': t('game.title') });
      const card = h('div', { class: 'intro-card' });
      ov.append(card);
      const finish = () => {
        S().seen.intro = true;
        NOA.save.schedule();
        ov.classList.add('closing');
        setTimeout(() => ov.remove(), 380);
        if (onDone) onDone();
      };
      const show = () => {
        UI.clear(card);
        const sc = SCENES[i];
        const art = h('div', { class: 'intro-art ' + sc.cls }, sc.art ? sc.art : beanEl());
        const dots = h('div', { class: 'intro-dots' }, SCENES.map((s, k) => h('i', { class: k === i ? 'on' : '' })));
        const last = i === SCENES.length - 1;
        card.append(
          h('div', { class: 'intro-logo' }, t('game.title'), h('small', null, t('game.subtitle'))),
          art,
          h('p', { class: 'intro-text' }, t('intro.' + (i + 1))),
          dots,
          h('div', { class: 'intro-actions' },
            UI.btn(t('ui.skip'), 'ghost', () => { NOA.audio.unlock(); finish(); }),
            UI.btn(last ? t('intro.start') : t('ui.next') + ' →', last ? 'leaf' : 'sun', () => {
              NOA.audio.unlock();
              NOA.audio.play(last ? 'levelUp' : 'tap');
              if (last) finish();
              else { i += 1; show(); }
            })));
      };
      show();
      document.getElementById('overlays').append(ov);
    },

    /* ------------------------------------------------------------ tutorial */
    steps() { return C().tutorial; },
    current() {
      const tu = S().tutorial;
      if (!NOA.FEATURES.tutorial || tu.done) return null;
      return ST.steps()[tu.step] || null;
    },
    tutorialDone() { return !NOA.FEATURES.tutorial || S().tutorial.done; },
    currentTip() {
      const st = ST.current();
      return st ? t('tut.' + st.id) : null;
    },
    advance() {
      const tu = S().tutorial;
      tu.step += 1;
      tu.counts = {};
      if (tu.step >= ST.steps().length) {
        tu.done = true;
        NOA.ui.hud.say(t('tut.done'), 8000);
        NOA.progress.addXP(10);
      } else {
        NOA.ui.hud.say(ST.currentTip());
      }
      ST.applyFocus();
      NOA.save.schedule();
    },
    /**
     * Highlight what the current step needs. On the farm map the camera flies to it once per step;
     * on other screens the matching button / item pulses.
     */
    applyFocus() {
      document.querySelectorAll('.tut-focus').forEach((el) => el.classList.remove('tut-focus'));
      const st = ST.current();
      ST.banner(st);
      if (!st) return;
      const el = ST.focusTarget(st);
      if (!el) return;
      el.classList.add('tut-focus');
      if (UI.current === 'farm' && ST._flown !== st.id + ':farm') {
        ST._flown = st.id + ':farm';
        // let the reward effects of the step that just finished play out before the camera moves,
        // and never pull the map from under a finger that is dragging it
        const MV = NOA.ui.screens.farm;
        const go = () => { if (MV.busy()) setTimeout(go, 400); else MV.reveal(el, true); };
        setTimeout(go, 900);
      }
    },
    /** Off the farm map Bean is not visible, so the current tip sits at the top of the screen */
    banner(st) {
      document.querySelectorAll('.tut-banner').forEach((el) => el.remove());
      if (!st || UI.current === 'farm') return;
      const root = document.getElementById('scr-' + UI.current);
      if (!root) return;
      root.prepend(h('div', { class: 'tut-banner', role: 'status' }, h('span', { class: 'tb-bean', 'aria-hidden': 'true' }, '🌱'), h('span', null, t('tut.' + st.id))));
    },
    focusTarget(st) {
      const scr = UI.current;
      const byId = (id) => document.getElementById(id);
      if (scr === 'farm') return byId(st.focus);
      if (scr === 'breed') {
        const grid = NOA.ui.screens.breed.grid;
        const cells = S()[grid].cells;
        if (st.id === 'merge') {
          for (let i = 0; i < cells.length; i++) {
            for (let j = i + 1; j < cells.length; j++) if (NOA.items.canMerge(cells[i], cells[j])) return byId('gi-' + grid + '-' + i);
          }
        }
        if (st.id === 'animal' && grid === 'nursery') {
          const i = cells.findIndex((x) => x && x.species === 'chicken');
          if (i >= 0) return byId('gi-' + grid + '-' + i);
        }
        if (st.id === 'animal' && grid === 'vault') return document.querySelector('#scr-breed .seg button:last-child');
        return null;
      }
      if (scr === 'orders' && st.id === 'order') {
        const o = S().orders.find((x) => NOA.orders.canDeliver(x));
        return o ? document.querySelector('#order-' + o.id + ' .btn--leaf') : null;
      }
      return null;
    },
    init() {
      NOA.events.on('*', (name) => {
        const st = ST.current();
        if (!st || st.done !== name) return;
        const tu = S().tutorial;
        tu.counts[st.id] = (tu.counts[st.id] || 0) + 1;
        if (tu.counts[st.id] >= (st.count || 1)) setTimeout(ST.advance, 350);
      });
      // While the tutorial runs, keep one easy order (2 Rice Sheaves — the starter barn has 3) on the board
      NOA.hooks.add('order.generated', (o) => {
        const tu = S().tutorial;
        const orderStep = ST.steps().findIndex((x) => x.id === 'order');
        if (!NOA.FEATURES.tutorial || tu.done || tu.step > orderStep) return o;
        const hasEasy = S().orders.some((x) => x.lines.length === 1 && x.lines[0].product === 'rice_1' && x.lines[0].count <= 2);
        if (!hasEasy && !o.vip) o.lines = [{ product: 'rice_1', count: 2, filled: 0, minStars: 0, needGene: false }];
        return o;
      });
    }
  };
})();
