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
  let badgeTimer = 0;

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
      NOA.farm.grantFreePlots();
      NOA.orders.fill();
      NOA.labs.ids.forEach((l) => NOA.labs.syncSlots(l));
      NOA.ship.tick();

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
      UI.hud.sayDefault();
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
      const PN = UI.panels;
      const cur = (id) => UI.current === id;
      const labBuildings = () => { farm.updateBuilding('greenhouse'); farm.updateBuilding('ranch'); };
      on('grid.changed', (e) => {
        if (cur('breed')) {
          if (e.expanded || e.pending || e.flushed || e.grid !== UI.screens.breed.grid) UI.screens.breed.build();
          else UI.screens.breed.renderCells();
          UI.story.applyFocus();
        }
        labBuildings();
        PN.refreshSheet('item:');
        PN.refreshSheet('picker:');
      });
      on('barn.changed', () => {
        farm.updateBuilding('barn');
        farm.updateBuilding('orders');
        ['factory:', 'pen:', 'good:', 'ship', 'picker:', 'plot:'].forEach((k) => PN.refreshSheet(k));
        if (cur('barn')) UI.screens.barn.render();
        if (cur('orders')) { UI.screens.orders.render(); UI.story.applyFocus(); }
        APP.badgesSoon();
      });
      on('orders.changed', () => {
        farm.updateBuilding('orders');
        if (cur('orders')) { UI.screens.orders.render(); UI.story.applyFocus(); }
        APP.badgesSoon();
      });
      on('field.changed', (e) => {
        if (e && e.bed) farm.updatePlots(e.bed);
        else { farm.updatePlots('crop'); farm.updatePlots('flower'); }
        PN.refreshSheet('plot:');
        PN.refreshSheet('picker:');
        UI.story.applyFocus();
      });
      on('pens.changed', (e) => {
        if (e && e.penId) farm.updateBuilding(e.penId);
        else for (const id in S().pens) farm.updateBuilding(id);
        PN.refreshSheet('pen:');
      });
      on('factory.changed', (e) => { farm.updateBuilding(e.building); PN.refreshSheet('factory:'); });
      on('ship.changed', () => { farm.updateBuilding('dock'); PN.refreshSheet('ship'); if (cur('orders')) UI.screens.orders.render(); });
      const labChanged = () => {
        UI.labs.refresh();
        labBuildings();
        if (cur('breed')) UI.screens.breed.build();
        APP.badgesSoon();
      };
      on('lab.changed', labChanged);
      on('lab.upgraded', labChanged);
      on('booster.used', () => { if (cur('breed')) UI.screens.breed.renderBag(); PN.refreshSheet('item:'); });
      on('rewards.granted', () => { UI.hud.update(); if (cur('breed')) UI.screens.breed.renderBag(); });
      on('res.changed', (e) => {
        UI.hud.update();
        if (e && (e.k === 'coins' || e.k === 'gems' || e.k === 'rp' || e.k === 'all' || e.k === 'tickets')) {
          clearTimeout(throttled);
          throttled = setTimeout(() => {
            if (cur('shop') || cur('barn')) UI.screens[UI.current].render();
            UI.labs.refresh();
            farm.updateBuilding('wishtree');
          }, 120);
        }
      });
      on('xp.changed', () => UI.hud.update());
      on('level.up', (e) => { PN.levelUp(e); UI.hud.update(); farm.updateAll(); });
      on('secret.unlocked', (e) => setTimeout(() => PN.secret(e), 500));
      on('gene.discovered', (e) => UI.hud.say(NOA.t('bean.gene', { gene: NOA.CONTENT.genes[e.gene].emoji + ' ' + NOA.t('gene.' + e.gene) }), 9000, true));
      on('mascots.changed', () => { UI.hud.updateSky(); if (cur('codex')) UI.screens.codex.render(); });
      on('mascot.expired', (e) => UI.toast(NOA.t('mascot.expired', { name: NOA.CONTENT.mascots[e.id].emoji + ' ' + NOA.t('mascot.' + e.id) })));
      on('earth.changed', () => UI.hud.updateSky());
      on('lang.changed', () => { if (S()) { S().lang = NOA.i18n.lang; PN.closeSheet(); UI.renderAll(); UI.hud.render(); UI.story.applyFocus(); } });
      on('payment.completed', () => UI.hud.update());
      on('essence.changed', () => { UI.labs.refresh(); if (cur('breed')) UI.screens.breed.build(); });
    },

    /** Tab badges follow the barn, orders and labs; batch their refresh */
    badgesSoon() {
      if (badgeTimer) return;
      badgeTimer = setTimeout(() => { badgeTimer = 0; UI.renderTabs(); }, 150);
    },

    startLoop() {
      clearInterval(loopTimer);
      let n = 0;
      loopTimer = setInterval(() => {
        n += 1;
        try {
          NOA.farm.tick();
          NOA.production.tick();
          NOA.ship.tick();
          NOA.orders.tick();
          NOA.labs.tick();
          NOA.mascots.tick();
          NOA.secrets.tick();
          UI.hud.tick();
          UI.screens.farm.tick();
          UI.screens.orders.tick();
          UI.panels.tick();
          UI.labs.tick();
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
      NOA.ship.tick();
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
