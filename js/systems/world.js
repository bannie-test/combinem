/*
 * World: real-time day / night, deterministic weather slots, rainbow after rain,
 * real lunar phase (full-moon nights) and real meteor-shower dates.
 * Everything here feeds NOA.mods so genes respond to the sky.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;
  const WEATHERS = ['sunny', 'cloudy', 'rain', 'storm'];

  const mdToNum = (md) => { const [m, d] = md.split('-').map(Number); return m * 100 + d; };
  const inWindow = (md, start, end) => {
    const x = mdToNum(md), a = mdToNum(start), b = mdToNum(end);
    return a <= b ? x >= a && x <= b : x >= a || x <= b;
  };

  const W = NOA.world = {
    slotMs() { return B().world.weather.slotMinutes * 60000; },
    weatherAt(ts) {
      const w = Object.assign({}, B().world.weather.weights);
      // read mascot weather mods directly: going through NOA.mods would recurse into this provider
      if (S() && NOA.mascots) {
        for (const m of NOA.mascots.activeMods()) if (m.key === 'weather.rain' && m.mult) w.rain *= m.mult;
      }
      const slot = Math.floor(ts / W.slotMs());
      let total = 0;
      for (const k of WEATHERS) total += Math.max(0, w[k] || 0);
      let r = NOA.rng.hash(slot * 7919 + 17) * total;
      for (const k of WEATHERS) {
        const v = Math.max(0, w[k] || 0);
        if (r < v) return k;
        r -= v;
      }
      return 'sunny';
    },
    weather() {
      if (!NOA.FEATURES.weather) return 'sunny';
      const f = S() && S().dev.force && S().dev.force.weather;
      return f || W.weatherAt(NOA.time.now());
    },
    rainbow() {
      if (!NOA.FEATURES.weather) return false;
      const f = S() && S().dev.force;
      if (f && f.rainbow != null) return !!f.rainbow;
      const now = NOA.time.now();
      const slotStart = Math.floor(now / W.slotMs()) * W.slotMs();
      if (now - slotStart > B().world.weather.rainbowMinutes * 60000) return false;
      const prev = W.weatherAt(slotStart - 1);
      return W.weather() === 'sunny' && (prev === 'rain' || prev === 'storm') && !NOA.time.isNight();
    },
    fullMoonNight() {
      return NOA.FEATURES.realSkyEvents && NOA.time.isNight() && NOA.time.isFullMoon();
    },
    /** Active meteor shower tonight -> { id, peak } | null */
    meteor() {
      if (!NOA.FEATURES.realSkyEvents) return null;
      const f = S() && S().dev.force;
      if (f && f.meteor) return { id: 'orionids', peak: true, forced: true };
      if (!NOA.time.isNight()) return null;
      const md = NOA.time.md();
      for (const sh of C().meteorShowers) {
        if (inWindow(md, sh.start, sh.end)) {
          const peakDiff = Math.abs(mdToNum(md) - mdToNum(sh.peak));
          return { id: sh.id, peak: peakDiff <= B().world.meteor.peakWindowDays };
        }
      }
      return null;
    },
    specialDay() {
      const md = NOA.time.md();
      const d = C().specialDays.find((x) => x.date === md);
      return d ? d.id : null;
    },
    sky() {
      return {
        phase: NOA.time.phase(),
        night: NOA.time.isNight(),
        weather: W.weather(),
        rainbow: W.rainbow(),
        moon: NOA.time.moonEmoji(),
        fullMoon: W.fullMoonNight(),
        meteor: W.meteor(),
        earth: S() ? S().earth : 0
      };
    },
    mods(ctx) {
      const out = [];
      if (!S()) return out;
      const wx = W.weather();
      const eff = B().world.weather.effects[wx] || {};
      if (eff.plantTimeMult && eff.plantTimeMult !== 1) out.push({ key: 'plant.timeMult', mult: eff.plantTimeMult, src: 'weather', id: wx });
      for (const g in eff.geneWeights || {}) out.push({ key: 'geneWeight.' + g, mult: eff.geneWeights[g], src: 'weather', id: wx });
      if (W.fullMoonNight()) {
        const m = B().world.moon;
        out.push({ key: 'geneWeight.lunar', mult: m.lunarWeightMult, src: 'event', id: 'fullmoon' });
        out.push({ key: 'gene.spawn', mult: m.spawnMult, src: 'event', id: 'fullmoon' });
      }
      if (ctx && ctx.fusionTo === 'rainbow' && W.rainbow()) {
        out.push({ key: 'gene.fusion', mult: B().world.weather.rainbowFusionMult, src: 'event', id: 'rainbow' });
      }
      if (ctx && ctx.fusionTo === 'stellar' && W.meteor()) {
        out.push({ key: 'gene.fusion', mult: B().world.meteor.stellarFusionMult, src: 'event', id: 'meteor' });
      }
      return out;
    }
  };

  NOA.mods.register('world', (ctx) => W.mods(ctx));
})();
