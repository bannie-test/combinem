/*
 * Clock: real time + dev offset, duration scaling, day keys and the lunar phase.
 * Every timer in the game reads NOA.time.now() so the dev panel can time-travel.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const DAY = 86400000;

  NOA.time = {
    now() {
      const dev = NOA.state && NOA.state.dev;
      return Date.now() + (dev && dev.offsetMs ? dev.offsetMs : 0);
    },
    scale() {
      const dev = NOA.state && NOA.state.dev;
      return dev && dev.timeScale ? dev.timeScale : NOA.BALANCE.time.timeScale;
    },
    /** seconds of game design time -> real milliseconds */
    dur(sec) { return sec * 1000 * NOA.time.scale(); },
    date() { return new Date(NOA.time.now()); },
    hour() { return NOA.time.date().getHours() + NOA.time.date().getMinutes() / 60; },
    isNight() {
      const force = NOA.state && NOA.state.dev && NOA.state.dev.force;
      if (force && force.night != null) return !!force.night;
      const h = NOA.time.date().getHours();
      const b = NOA.BALANCE.time;
      return h >= b.nightStartHour || h < b.nightEndHour;
    },
    /** 'dawn' | 'day' | 'dusk' | 'night' */
    phase() {
      if (NOA.time.isNight()) return 'night';
      const h = NOA.time.hour();
      const b = NOA.BALANCE.time;
      if (h < b.nightEndHour + 1.5) return 'dawn';
      if (h >= b.nightStartHour - 1.5) return 'dusk';
      return 'day';
    },
    /** Calendar day key that rolls over at balance.time.dayResetHour */
    dayKey(ts) {
      const d = new Date((ts != null ? ts : NOA.time.now()) - NOA.BALANCE.time.dayResetHour * 3600000);
      return d.getFullYear() + '-' + NOA.util.pad2(d.getMonth() + 1) + '-' + NOA.util.pad2(d.getDate());
    },
    /** 'MM-DD' in local time */
    md(ts) {
      const d = new Date(ts != null ? ts : NOA.time.now());
      return NOA.util.pad2(d.getMonth() + 1) + '-' + NOA.util.pad2(d.getDate());
    },
    /** Moon age as a fraction of the synodic month: 0 = new moon, 0.5 = full moon */
    moonPhase(ts) {
      const m = NOA.BALANCE.world.moon;
      const epoch = Date.parse(m.epochNewMoonUTC);
      const days = ((ts != null ? ts : NOA.time.now()) - epoch) / DAY;
      const f = (days / m.synodicDays) % 1;
      return f < 0 ? f + 1 : f;
    },
    isFullMoon(ts) {
      const force = NOA.state && NOA.state.dev && NOA.state.dev.force;
      if (force && force.fullMoon != null) return !!force.fullMoon;
      const m = NOA.BALANCE.world.moon;
      const ageFromFull = Math.abs(NOA.time.moonPhase(ts) - 0.5) * m.synodicDays;
      return ageFromFull <= m.fullWindowDays;
    },
    moonEmoji(ts) {
      if (NOA.time.isFullMoon(ts)) return '🌕';
      const f = NOA.time.moonPhase(ts);
      const icons = ['🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'];
      return icons[Math.round(f * 8) % 8];
    },
    DAY
  };
})();
