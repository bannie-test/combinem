/*
 * Boot: load / create the save, wire events to views, run the clock, show intro / daily gift.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const UI = NOA.ui;
  const S = () => NOA.state;

  /** Add keys that newer versions introduced, without touching existing values */
  function fillDefaults(target, defaults) {
    for (const k in defaults) {
      if (target[k] === undefined) target[k] = NOA.util.clone(defaults[k]);
      else if (NOA.util.isObj(target[k]) && NOA.util.isObj(defaults[k])) fillDefaults(target[k], defaults[k]);
    }
    return target;
  }
  function detectLang() {
    try { return (navigator.language || 'vi').toLowerCase().startsWith('vi') ? 'vi' : 'en'; } catch (e) { return 'vi'; }
  }

  let loopTimer = 0;
  let lastSave = Date.now();
  let loginShownFor = null;
  let throttled = 0;

  const APP = NOA.app = {
    boot(hot) {
      let state = hot && hot.state ? hot.state : NOA.save.load();
      const fresh = !state;
      if (fresh) state = NOA.newState(detectLang());
      else fillDefaults(state, NOA.newState(state.lang));
      NOA.state = state;
      if (fresh) NOA.seedNewGame();
      NOA.i18n.setLang(state.lang);

      NOA.secrets.init();
      NOA.essence.init();
      NOA.ui.story.init();

      // catch up on time spent away
      NOA.res.tickEnergy();
      NOA.orders.fill();
      NOA.labs.ids.forEach((l) => NOA.labs.syncSlots(l));

      UI.mount();
      UI.fx.init();
      UI.hud.render();
      UI.show('farm');
      APP.wire();
      APP.startLoop();

      const warnings = NOA.validateConfig();
      if (warnings.length) console.warn('[Noa Farm] config warnings:\n - ' + warnings.join('\n - '));

      const unlockAudio = () => { NOA.audio.unlock(); document.removeEventListener('pointerdown', unlockAudio, true); };
      document.addEventListener('pointerdown', unlockAudio, true);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape') UI.closeTopModal(); });
      document.addEventListener('visibilitychange', () => { if (document.hidden) NOA.save.write(); });
      addEventListener('pagehide', () => NOA.save.write());

      if (!state.seen.intro) UI.story.intro(() => APP.afterIntro());
      else setTimeout(APP.maybeLogin, 600);

      try {
        const h = globalThis.claude && globalThis.claude.hot;
        if (h && typeof h.snapshot === 'function') h.snapshot(() => ({ state: NOA.state }));
      } catch (e) { /* not inside the artifact viewer */ }
      NOA.save.write();
    },

    afterIntro() {
      UI.hud.say(UI.story.currentTip() || NOA.t('bean.idle1'));
      UI.story.applyFocus();
      setTimeout(APP.maybeLogin, 900);
    },

    maybeLogin() {
      const day = NOA.time.dayKey();
      if (loginShownFor === day || !S().seen.intro) return;
      if (NOA.rewards.login.canClaim() && !UI.hasModal()) {
        loginShownFor = day;
        UI.panels.loginModal(true);
      }
    },

    wire() {
      const on = NOA.events.on;
      const farm = UI.screens.farm;
      on('board.changed', () => { farm.renderBoard(); farm.renderOrders(); UI.panels.refreshSheet(); });
      on('orders.changed', () => farm.renderOrders());
      on('field.changed', () => { farm.renderField(); UI.panels.refreshSheet(); UI.story.applyFocus(); });
      on('storage.changed', () => farm.renderDock());
      on('booster.used', () => farm.renderDock());
      on('rewards.granted', () => { farm.renderDock(); UI.hud.update(); });
      on('res.changed', (e) => {
        UI.hud.update();
        if (e && (e.k === 'coins' || e.k === 'gems' || e.k === 'rp' || e.k === 'all')) {
          clearTimeout(throttled);
          throttled = setTimeout(() => {
            if (UI.current === 'labs' || UI.current === 'shop') UI.screens[UI.current].render();
          }, 120);
        }
      });
      on('xp.changed', () => UI.hud.update());
      on('level.up', (e) => { UI.panels.levelUp(e); UI.hud.update(); });
      on('secret.unlocked', (e) => setTimeout(() => UI.panels.secret(e), 500));
      on('gene.discovered', (e) => UI.hud.say(NOA.t('bean.gene', { gene: NOA.CONTENT.genes[e.gene].emoji + ' ' + NOA.t('gene.' + e.gene) }), 9000));
      on('mascots.changed', () => { UI.hud.updateSky(); if (UI.current === 'codex') UI.screens.codex.render(); });
      on('mascot.expired', (e) => UI.toast(NOA.t('mascot.expired', { name: NOA.CONTENT.mascots[e.id].emoji + ' ' + NOA.t('mascot.' + e.id) })));
      on('lab.changed', () => { if (UI.current === 'labs') UI.screens.labs.render(); UI.renderTabs(); });
      on('lab.upgraded', () => UI.renderTabs());
      on('earth.changed', () => UI.hud.updateSky());
      on('lang.changed', () => { if (S()) { S().lang = NOA.i18n.lang; UI.renderAll(); UI.hud.render(); } });
      on('payment.completed', () => UI.hud.update());
      on('essence.changed', () => { if (UI.current === 'labs') UI.screens.labs.render(); });
    },

    startLoop() {
      clearInterval(loopTimer);
      let n = 0;
      loopTimer = setInterval(() => {
        n += 1;
        try {
          NOA.res.tickEnergy();
          NOA.farm.tick();
          NOA.orders.tick();
          NOA.labs.tick();
          NOA.mascots.tick();
          NOA.secrets.tick();
          UI.hud.tick();
          UI.screens.farm.tick();
          UI.screens.labs.tick();
          if (n % 8 === 0) { UI.renderTabs(); APP.maybeLogin(); }
          if (Date.now() - lastSave > 10000) { lastSave = Date.now(); NOA.save.write(); }
        } catch (e) {
          console.error('[Noa Farm loop]', e);
        }
      }, 250);
    },

    reset() {
      const lang = S().lang;
      NOA.save.clear();
      NOA.state = NOA.newState(lang);
      NOA.seedNewGame();
      NOA.orders.fill();
      UI.panels.closeSheet();
      UI.current = 'farm';
      UI.mount();
      UI.hud.render();
      UI.show('farm');
      NOA.save.write();
      UI.story.intro(() => APP.afterIntro());
    }
  };

  function start(data) { APP.boot(data || {}); }
  function ready() {
    const hot = globalThis.claude && globalThis.claude.hot;
    if (hot && typeof hot.ready === 'function') hot.ready(start);
    else start(hot && hot.data ? hot.data : {});
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready);
  else ready();
})();
