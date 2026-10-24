/*
 * HUD: the top bar (level, coins, gems, codex, settings) on every screen, plus the widgets that
 * float over the farm map: robot Bean with its speech bubble, the sky widget (weather, moon, Earth,
 * daily gift), live event chips, shooting stars and the idle firefly.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const UI = NOA.ui;
  const h = (...a) => UI.h(...a);
  const t = (k, p) => NOA.t(k, p);
  const S = () => NOA.state;
  const B = () => NOA.BALANCE;

  let meteorTimer = 0;
  let lastInput = Date.now();
  let fireflyOut = false;
  let sayTimer = 0;
  let idleTipAt = Date.now() + 20000;

  const earthColor = (p) => {
    const k = Math.max(0, Math.min(1, p / 100));
    const mix = (a, b) => Math.round(a + (b - a) * k);
    const from = [164, 122, 88], to = [74, 176, 214];
    return 'rgb(' + mix(from[0], to[0]) + ',' + mix(from[1], to[1]) + ',' + mix(from[2], to[2]) + ')';
  };
  const IDLE_TIPS = 8;   // i18n bean.idle1..8
  const WX_ICON = { sunny: '☀️', cloudy: '⛅', rain: '🌧️', storm: '⛈️' };

  const HUD = NOA.ui.hud = {
    els: {},

    /* ------------------------------------------------------------ top bar */
    render() {
      const bar = document.getElementById('hud');
      if (!bar) return;
      UI.clear(bar);
      const e = HUD.els;
      e.level = h('button', { type: 'button', class: 'lvl', 'aria-label': t('ui.level'), on: { click: HUD.showXP } }, h('b', null, ''));
      e.coins = h('button', { type: 'button', class: 'pill pill--coins', on: { click: () => { UI.show('shop', { tab: 'items' }); } } }, h('span', { class: 'pi' }, '🪙'), h('b', null, ''));
      e.gems = h('button', { type: 'button', class: 'pill pill--gems', on: { click: () => { UI.show('shop', { tab: 'gems' }); } } }, h('span', { class: 'pi' }, '💎'), h('b', null, ''));
      e.codex = h('button', { type: 'button', class: 'btn-icon hud-btn', 'aria-label': t('tab.codex'), title: t('tab.codex'), on: { click: () => UI.show('codex') } }, '📖');
      e.settings = h('button', { type: 'button', class: 'btn-icon hud-btn', 'aria-label': t('settings.title'), title: t('settings.title'), on: { click: () => NOA.ui.settings.open() } }, '⚙️');
      bar.append(e.level, h('div', { class: 'grow' }, e.coins, e.gems), e.codex, e.settings);
      HUD.update();
    },
    update() {
      const e = HUD.els;
      if (!e.level || !S()) return;
      const s = S();
      const need = NOA.progress.xpToNext(s.level);
      e.level.style.setProperty('--p', String(Math.min(1, s.xp / need)));
      e.level.querySelector('b').textContent = s.level;
      e.level.title = t('hud.xp', { xp: UI.num(s.xp), need: UI.num(need) });
      e.coins.querySelector('b').textContent = UI.compact(s.res.coins);
      e.gems.querySelector('b').textContent = UI.compact(s.res.gems);
      if (e.gift) {
        const dot = NOA.rewards.login.canClaim();
        const old = e.gift.querySelector('.dot');
        if (dot && !old) e.gift.append(h('span', { class: 'dot' }));
        if (!dot && old) old.remove();
      }
    },

    /* ------------------------------------------------------------ map overlay (built by the farm map) */
    mountOverlay(root) {
      const e = HUD.els;
      e.bean = h('button', { type: 'button', class: 'bean', 'aria-label': t('bean.name'), on: { click: HUD.onBean } },
        h('span', { class: 'sprout' }),
        h('span', { class: 'bean-body' }, h('span', { class: 'eye l' }), h('span', { class: 'eye r' }), h('span', { class: 'blush' }), h('span', { class: 'mouth' })));
      e.say = h('div', { class: 'bubble', 'aria-live': 'polite', on: { click: () => e.say.classList.toggle('mini') } }, '');
      e.wx = h('button', { type: 'button', class: 'sw-wx', on: { click: HUD.skyInfo } }, '');
      e.moon = h('button', { type: 'button', class: 'sw-moon', on: { click: HUD.skyInfo } }, '');
      e.earth = h('button', { type: 'button', class: 'earth', 'aria-label': 'Earth', on: { click: HUD.skyInfo } }, h('small', null, ''));
      e.gift = h('button', { type: 'button', class: 'btn-icon gift-btn', 'aria-label': t('login.title'), title: t('login.title'), on: { click: () => NOA.ui.panels.loginModal() } }, '🎁');
      e.events = h('div', { class: 'sky-events' });
      e.layer = h('div', { class: 'sky-layer' });
      root.append(
        h('div', { class: 'bean-dock' }, e.bean, e.say),
        h('div', { class: 'sky-widget' }, h('div', { class: 'sw-row' }, e.wx, e.moon, e.earth), e.gift, e.events),
        e.layer);
      HUD.update();
      HUD.updateSky();
      HUD.sayDefault();
    },

    tick() {
      if (!HUD.els.level) return;
      HUD.skyTick();
    },

    /* ------------------------------------------------------------ sky */
    updateSky() {
      const e = HUD.els;
      const st = NOA.world.sky();
      if (NOA.ui.screens.farm && NOA.ui.screens.farm.setSky) NOA.ui.screens.farm.setSky(st);
      if (!e.wx || !e.wx.isConnected) return;
      e.wx.textContent = st.weather === 'sunny' && st.night ? '✨' : WX_ICON[st.weather];
      e.wx.setAttribute('aria-label', t('wx.' + st.weather));
      e.wx.title = t('wx.' + st.weather);
      e.moon.textContent = st.night ? st.moon : '';
      e.moon.hidden = !st.night;
      e.moon.classList.toggle('full', st.fullMoon);
      e.moon.setAttribute('aria-label', st.fullMoon ? t('sky.fullMoon') : t('sky.night'));
      e.earth.style.setProperty('--earth', earthColor(st.earth));
      e.earth.title = t('sky.earth', { n: st.earth });
      e.earth.querySelector('small').textContent = st.earth + '%';
      UI.clear(e.events);
      if (st.fullMoon) e.events.append(h('span', { class: 'ev' }, '🌕 ' + t('sky.fullMoon')));
      if (st.meteor) e.events.append(h('span', { class: 'ev' }, '🌠 ' + t('meteor.' + st.meteor.id) + (st.meteor.peak ? ' · ' + t('sky.meteorPeak') : '')));
      if (st.rainbow) e.events.append(h('span', { class: 'ev' }, '🌈 ' + t('sky.rainbow')));
      if (st.weather === 'storm') e.events.append(h('span', { class: 'ev' }, '⛈️ ' + t('wx.storm')));
      for (const id in S().mascots.temp) {
        const left = NOA.mascots.tempRemaining(id);
        if (left > 0) e.events.append(h('span', { class: 'ev', title: t('mascot.' + id) }, NOA.CONTENT.mascots[id].emoji + ' ' + UI.dur(left)));
      }
      HUD._sky = st.phase + st.weather + st.fullMoon + !!st.meteor + st.rainbow + st.earth;
    },
    skyTick() {
      const st = NOA.world.sky();
      const sig = st.phase + st.weather + st.fullMoon + !!st.meteor + st.rainbow + st.earth;
      if (sig !== HUD._sky) {
        const prevWx = HUD._wx;
        HUD.updateSky();
        if (prevWx && prevWx !== st.weather && st.weather === 'storm') HUD.say(t('bean.storm'), 9000);
        if (st.fullMoon && !HUD._moonSaid) { HUD._moonSaid = true; HUD.say(t('bean.fullmoon'), 9000); }
      } else {
        // refresh mascot timers in the event chips about once per second
        const nowS = Math.floor(Date.now() / 1000);
        if (nowS !== HUD._sec) { HUD._sec = nowS; if (Object.keys(S().mascots.temp).length) HUD.updateSky(); }
      }
      HUD._wx = st.weather;
      const onMap = NOA.ui.current === 'farm' && !document.hidden;
      // shooting stars over the farm
      if (st.meteor && onMap) {
        const now = Date.now();
        if (!meteorTimer) meteorTimer = now + 4000;
        if (now >= meteorTimer) {
          HUD.spawnMeteor();
          const r = st.meteor.peak ? B().world.meteor.peakIntervalSec : B().world.meteor.intervalSec;
          meteorTimer = now + (r[0] + Math.random() * (r[1] - r[0])) * 1000;
        }
      }
      // idle firefly + idle tips
      const idle = (Date.now() - lastInput) / 1000;
      if (NOA.FEATURES.secrets && !fireflyOut && idle > B().world.idleFirefly.idleSec && onMap && !UI.hasModal()) HUD.spawnFirefly();
      if (Date.now() > idleTipAt && NOA.ui.story && NOA.ui.story.tutorialDone()) {
        idleTipAt = Date.now() + 26000 + Math.random() * 20000;
        if (onMap) HUD.say(t('bean.idle' + (1 + Math.floor(Math.random() * IDLE_TIPS))), 9000);
      }
    },
    noteInput() { lastInput = Date.now(); },
    spawnMeteor() {
      const layer = HUD.els.layer;
      if (!layer || !layer.isConnected) return;
      const m = h('button', { type: 'button', class: 'meteor', 'aria-label': t('sky.meteor'), style: { left: (45 + Math.random() * 45) + '%', top: (10 + Math.random() * 60) + 'px' } });
      m.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const c = UI.center(m);
        m.remove();
        NOA.audio.play('star');
        NOA.ui.fx.burst(c.x, c.y, { count: 24, colors: ['#fff8c9', '#ffd84d', '#ffffff'], shapes: ['star'], speed: 260 });
        const got = NOA.secrets.catchMeteor();
        NOA.ui.fx.float(c.x, c.y + 20, t('meteor.caught'), 'gene');
        if (got && got.length) UI.toast(got.map((g) => g.icon + ' +' + g.n).join('  '), 'good');
      });
      layer.append(m);
      setTimeout(() => m.remove(), 2000);
    },
    spawnFirefly() {
      fireflyOut = true;
      const vis = B().world.idleFirefly.visibleSec * 1000;
      const f = h('button', { type: 'button', class: 'firefly', 'aria-label': t('mascot.firefly'), style: { left: (innerWidth - 60) + 'px', top: (innerHeight * 0.45) + 'px', 'animation-duration': (vis / 1000) + 's' } });
      f.addEventListener('click', () => {
        const c = UI.center(f);
        f.remove();
        NOA.audio.play('secret');
        NOA.ui.fx.burst(c.x, c.y, { count: 30, colors: ['#f6ff9e', '#ffffff', '#c8ff7a'], shapes: ['circle'], speed: 200, gravity: -40 });
        NOA.ui.fx.float(c.x, c.y, t('firefly.caught'), 'good');
        NOA.secrets.catchFirefly();
        lastInput = Date.now();
        fireflyOut = false;
      });
      document.body.append(f);
      setTimeout(() => { if (f.isConnected) { f.remove(); lastInput = Date.now(); fireflyOut = false; } }, vis);
    },
    skyInfo() {
      const st = NOA.world.sky();
      const lines = [
        (st.night ? st.moon + ' ' + t('sky.night') : '☀️') + ' · ' + t('wx.' + st.weather),
        t('sky.earth', { n: st.earth })
      ];
      if (st.fullMoon) lines.push('🌕 ' + t('sky.fullMoon'));
      if (st.meteor) lines.push('🌠 ' + t('meteor.' + st.meteor.id));
      if (st.rainbow) lines.push('🌈 ' + t('sky.rainbow'));
      UI.toast(lines.join(' · '));
    },
    showXP() {
      const s = S();
      UI.toast(t('hud.level', { n: s.level }) + ' · ' + t('hud.xp', { xp: UI.num(s.xp), need: UI.num(NOA.progress.xpToNext(s.level)) }));
    },

    /* ------------------------------------------------------------ Bean */
    /** Bean talks on the farm map; elsewhere `important` messages fall back to a toast */
    say(text, ms, important) {
      const e = HUD.els;
      if (!e.say) return;
      e.say.textContent = text;
      e.say.classList.remove('pop', 'mini');
      void e.say.offsetWidth;
      e.say.classList.add('pop');
      e.bean.classList.remove('talk');
      void e.bean.offsetWidth;
      e.bean.classList.add('talk');
      clearTimeout(sayTimer);
      if (ms) sayTimer = setTimeout(HUD.sayDefault, ms);
      if (important && NOA.ui.current !== 'farm') UI.toast('🤖 ' + text);
    },
    /** Tutorial tips stay open; otherwise Bean's bubble folds into a one-line chip so the map stays visible */
    sayDefault() {
      if (!HUD.els.say) return;
      const tip = NOA.ui.story && NOA.ui.story.currentTip();
      HUD.els.say.textContent = tip || t('bean.idle' + (1 + (S().level % IDLE_TIPS)));
      HUD.els.say.classList.toggle('mini', !tip);
    },
    onBean() {
      NOA.audio.unlock();
      NOA.audio.play('tap');
      const r = NOA.secrets.tapBean();
      if (r && r !== 'again') {
        HUD.els.bean.classList.add('glitch');
        setTimeout(() => HUD.els.bean.classList.remove('glitch'), 1000);
        HUD.say(t('secret.bean.voice'), 12000);
      } else if (r === 'again') {
        HUD.say(t('secret.bean.voice'), 12000);
      } else {
        HUD.sayDefault();
        HUD.els.say.classList.remove('mini');
      }
    }
  };
})();
