/*
 * Secrets: hidden triggers players discover by themselves.
 * Each secret unlocks once, grants balance.secrets.rewards[id] and shows up in the Codex.
 * Hints for undiscovered secrets are deliberately vague (i18n: secret.<id>.hint).
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const S = () => NOA.state;
  const U = NOA.util;

  let beanTaps = [];
  let lastCheck = 0;

  const SE = NOA.secrets = {
    ids() { return Object.keys(NOA.CONTENT.secrets); },
    isFound(id) { return !!(S() && S().secrets[id]); },
    count() { return SE.ids().filter(SE.isFound).length; },
    unlock(id) {
      if (!NOA.FEATURES.secrets || SE.isFound(id)) return null;
      S().secrets[id] = NOA.time.now();
      const reward = B().secrets.rewards[id];
      const granted = reward ? NOA.rewards.grant(reward, 'secret') : [];
      if (id === 'bean') S().flags.bean = true;
      NOA.events.emit('secret.unlocked', { id, granted });
      NOA.save.schedule();
      return granted;
    },

    /* ------------------------------------------------------------ player actions */
    catchMeteor() {
      const m = B().world.meteor;
      const reward = U.chance(m.stardustChance) ? { boosters: { stardust: 1 } } : { gems: m.gemReward };
      const granted = NOA.rewards.grant(reward, 'meteor');
      SE.unlock('meteor');
      return granted;
    },
    catchFirefly() {
      if (!SE.isFound('firefly')) return SE.unlock('firefly');
      return NOA.rewards.grant(B().secrets.rewards.fireflyRepeat, 'firefly');
    },
    tapBean() {
      const now = Date.now();
      const cfg = B().secrets;
      beanTaps = beanTaps.filter((t) => now - t < cfg.beanTapWindowMs);
      beanTaps.push(now);
      if (beanTaps.length >= cfg.beanTaps) {
        beanTaps = [];
        return SE.unlock('bean') || 'again';
      }
      return null;
    },
    rename(name) {
      const s = S();
      s.farmName = String(name || '').slice(0, 24);
      NOA.events.emit('farm.renamed', { name: s.farmName });
      const norm = s.farmName.trim().toLowerCase();
      if (B().secrets.renameWords.some((w) => norm === w)) SE.unlock('rename');
      NOA.save.schedule();
    },

    /* ------------------------------------------------------------ periodic checks */
    tick() {
      if (!NOA.FEATURES.secrets) return;
      const now = Date.now();
      if (now - lastCheck < 2000) return;
      lastCheck = now;
      if (NOA.world.fullMoonNight()) SE.unlock('fullmoon');
      if (NOA.world.rainbow()) SE.unlock('rainbow');
      if (NOA.world.specialDay()) SE.unlock('earthday');
    },

    init() {
      // ⚡ Lôi Vũ / 🐅 Bạch Hổ: secret fusions for pairs that have no normal recipe
      NOA.hooks.add('gene.secretFusion', (found, info) => {
        if (found || !NOA.FEATURES.secrets) return found;
        const ids = [info.a.id, info.b.id].sort().join('+');
        const cfg = B().secrets;
        if (ids === 'blaze+crystal' && NOA.world.weather() === 'storm' && U.chance(cfg.thunderChance)) {
          setTimeout(() => SE.unlock('thunder'), 0);
          return 'thunder';
        }
        if (ids === 'phoenix+tortoise' && NOA.time.isNight() && (NOA.time.isFullMoon() || NOA.world.meteor()) && U.chance(cfg.whiteTigerChance)) {
          setTimeout(() => SE.unlock('whitetiger'), 0);
          return 'whitetiger';
        }
        return found;
      });
      NOA.events.on('merge.done', (e) => {
        if (e.fx && e.fx.some((f) => f.type === 'recessive')) SE.unlock('mendel');
        if (e.combo >= B().secrets.octaveCombo) SE.unlock('octave');
      });
      NOA.events.on('hybrid.done', (e) => {
        if (e.fx && e.fx.some((f) => f.type === 'recessive')) SE.unlock('mendel');
      });
      NOA.events.on('harvest.clover', () => SE.unlock('clover4'));
    }
  };
})();
