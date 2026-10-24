/*
 * Sky header: HUD (level, energy, coins, gems), robot Bean with speech bubble,
 * sky state (day/night, weather, moon, Earth), events, shooting stars and the idle firefly.
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

  const HUD = NOA.ui.hud = {
    els: {},
    render() {
      const sky = document.getElementById('sky');
      UI.clear(sky);
      const e = HUD.els;
      e.level = h('button', { type: 'button', class: 'lvl', 'aria-label': t('ui.level'), on: { click: HUD.showXP } }, h('b', null, ''));
      e.energy = h('button', { type: 'button', class: 'pill pill--energy', on: { click: () => NOA.ui.panels.energyModal() } },
        h('span', { class: 'pi' }, '⚡'), h('b', null, ''), h('span', { class: 'pill-timer', hidden: true }, ''));
      e.coins = h('button', { type: 'button', class: 'pill pill--coins', on: { click: () => UI.show('shop') } }, h('span', { class: 'pi' }, '🪙'), h('b', null, ''));
      e.gems = h('button', { type: 'button', class: 'pill pill--gems', on: { click: () => { UI.show('shop'); NOA.ui.screens.shop.tab('gems'); } } }, h('span', { class: 'pi' }, '💎'), h('b', null, ''));
      e.login = h('button', { type: 'button', class: 'btn-icon hud-btn gift-btn', 'aria-label': t('login.title'), title: t('login.title'), on: { click: () => NOA.ui.panels.loginModal() } }, '🎁');
      e.settings = h('button', { type: 'button', class: 'btn-icon hud-btn', 'aria-label': t('settings.title'), on: { click: () => NOA.ui.settings.open() } }, '⚙️');
      const hud = h('div', { class: 'hud' }, e.level, h('div', { class: 'grow' }, e.energy, e.coins, e.gems), e.settings);

      e.bean = h('button', { type: 'button', class: 'bean', 'aria-label': t('bean.name'), on: { click: HUD.onBean } },
        h('span', { class: 'sprout' }),
        h('span', { class: 'bean-body' }, h('span', { class: 'eye l' }), h('span', { class: 'eye r' }), h('span', { class: 'blush' }), h('span', { class: 'mouth' })));
      e.say = h('div', { class: 'bubble', 'aria-live': 'polite' }, '');
      e.moon = h('button', { type: 'button', class: 'moon', on: { click: () => HUD.skyInfo() } }, '');
      e.earth = h('button', { type: 'button', class: 'earth', 'aria-label': 'Earth', on: { click: () => HUD.skyInfo() } });
      e.wx = h('button', { type: 'button', class: 'wx', on: { click: () => HUD.skyInfo() } }, '');
      const scene = h('div', { class: 'scene' }, e.bean, e.say, e.login, h('div', { class: 'sky-icons' }, e.moon, e.earth, e.wx));
      e.events = h('div', { class: 'sky-events' });
      e.layer = h('div', { class: 'sky-layer' });
      sky.append(h('div', { class: 'sky-fx' }), hud, scene, e.events, e.layer);
      HUD.update();
      HUD.updateSky();
      HUD.sayDefault();
    },
    update() {
      const e = HUD.els;
      if (!e.level) return;
      const s = S();
      const need = NOA.progress.xpToNext(s.level);
      e.level.style.setProperty('--p', String(Math.min(1, s.xp / need)));
      e.level.querySelector('b').textContent = s.level;
      e.level.title = t('hud.xp', { xp: UI.num(s.xp), need: UI.num(need) });
      e.energy.querySelector('b').textContent = UI.num(s.res.energy);
      e.energy.title = UI.num(s.res.energy) + '/' + NOA.res.energyMax();
      e.coins.querySelector('b').textContent = UI.compact(s.res.coins);
      e.gems.querySelector('b').textContent = UI.compact(s.res.gems);
      const dot = NOA.rewards.login.canClaim();
      const old = e.login.querySelector('.dot');
      if (dot && !old) e.login.append(h('span', { class: 'dot' }));
      if (!dot && old) old.remove();
    },
    tick() {
      const e = HUD.els;
      if (!e.energy) return;
      const ms = NOA.res.energyNextMs();
      const tm = e.energy.querySelector('.pill-timer');
      tm.hidden = !ms;
      if (ms) tm.textContent = '+1 ' + UI.dur(ms);
      e.energy.querySelector('b').textContent = UI.num(S().res.energy);
      HUD.skyTick();
    },

    /* ------------------------------------------------------------ sky */
    updateSky() {
      const e = HUD.els;
      const sky = document.getElementById('sky');
      const st = NOA.world.sky();
      sky.className = 'sky sky--' + st.phase + ' wx-' + st.weather;
      e.moon.textContent = st.night ? st.moon : '☁️';
      e.moon.classList.toggle('full', st.fullMoon);
      e.moon.setAttribute('aria-label', st.fullMoon ? t('sky.fullMoon') : t('sky.night'));
      e.earth.style.setProperty('--earth', earthColor(st.earth));
      e.earth.title = t('sky.earth', { n: st.earth });
      e.wx.textContent = { sunny: st.night ? '✨' : '☀️', cloudy: '⛅', rain: '🌧️', storm: '⛈️' }[st.weather];
      e.wx.setAttribute('aria-label', t('wx.' + st.weather));
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
        if (prevWx && prevWx !== st.weather && st.weather === 'storm') HUD.say(t('bean.storm'));
        if (st.fullMoon && !HUD._moonSaid) { HUD._moonSaid = true; HUD.say(t('bean.fullmoon')); }
      } else {
        // refresh mascot timers in the event chips about once per second
        const nowS = Math.floor(Date.now() / 1000);
        if (nowS !== HUD._sec) { HUD._sec = nowS; if (Object.keys(S().mascots.temp).length) HUD.updateSky(); }
      }
      HUD._wx = st.weather;
      // shooting stars
      if (st.meteor && NOA.ui.current === 'farm' && !document.hidden) {
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
      if (NOA.FEATURES.secrets && !fireflyOut && idle > B().world.idleFirefly.idleSec && NOA.ui.current === 'farm' && !UI.hasModal()) HUD.spawnFirefly();
      if (Date.now() > idleTipAt && NOA.ui.story && NOA.ui.story.tutorialDone()) {
        idleTipAt = Date.now() + 26000 + Math.random() * 20000;
        HUD.say(t('bean.idle' + (1 + Math.floor(Math.random() * 6))));
      }
    },
    noteInput() { lastInput = Date.now(); },
    spawnMeteor() {
      const layer = HUD.els.layer;
      if (!layer) return;
      const m = h('button', { type: 'button', class: 'meteor', 'aria-label': t('sky.meteor'), style: { left: (55 + Math.random() * 40) + '%', top: (-4 + Math.random() * 30) + 'px' } });
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
    say(text, ms) {
      const e = HUD.els;
      if (!e.say) return;
      e.say.textContent = text;
      e.say.classList.remove('pop');
      void e.say.offsetWidth;
      e.say.classList.add('pop');
      e.bean.classList.remove('talk');
      void e.bean.offsetWidth;
      e.bean.classList.add('talk');
      clearTimeout(sayTimer);
      if (ms) sayTimer = setTimeout(HUD.sayDefault, ms);
    },
    sayDefault() {
      const tip = NOA.ui.story && NOA.ui.story.currentTip();
      HUD.els.say.textContent = tip || t('bean.idle' + (1 + (S().level % 6)));
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
      }
    }
  };
})();
