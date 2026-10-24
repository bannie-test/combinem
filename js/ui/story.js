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
    applyFocus() {
      document.querySelectorAll('.tut-focus').forEach((el) => el.classList.remove('tut-focus'));
      const st = ST.current();
      if (!st || !st.focus) return;
      let el = document.getElementById(st.focus);
      if (el && el.classList.contains('hscroll')) el = el.firstElementChild;
      if (el) el.classList.add('tut-focus');
    },
    init() {
      NOA.events.on('*', (name) => {
        const st = ST.current();
        if (!st || st.done !== name) return;
        const tu = S().tutorial;
        tu.counts[st.id] = (tu.counts[st.id] || 0) + 1;
        if (tu.counts[st.id] >= (st.count || 1)) setTimeout(ST.advance, 350);
      });
      // During the first steps the seed sack always gives rice (so the first merge is guaranteed)
      // and the first animal is a chicken (fed with rice).
      NOA.hooks.add('spawn.species', (sp, info) => {
        if (sp) return sp;
        const st = ST.current();
        if (!st) return sp;
        const early = ['tap', 'merge', 'plant', 'harvest', 'order'];
        if (info.family === 'plant' && early.indexOf(st.id) >= 0) return 'rice';
        if (info.family === 'animal' && (st.id === 'animal' || st.id === 'feed')) return 'chicken';
        return sp;
      });
    }
  };
})();
