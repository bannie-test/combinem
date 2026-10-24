/*
 * Genetics: merge resolution for seeds / animals / products, gene inheritance,
 * fusion, purity, recessive genes, breakthrough, and the pre-merge preview.
 *
 * Rules (from the design):
 *   - max 1 gene per item, plant genes only on plants, animal genes only on animals
 *   - normal + normal   -> small chance a new gene appears (lab level raises it)
 *   - gene   + normal   -> LOW chance to keep the gene (purity -1)
 *   - gene   + gene     -> HIGH chance to keep; same gene can gain purity;
 *                          a valid pair can fuse into a higher-tier gene
 *   - luck boosters attached to either parent add to every chance of that merge
 *   - a lost gene sinks into a hidden recessive gene that can re-awaken later
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const U = NOA.util;
  const I = () => NOA.items;

  const G = NOA.genetics = {
    labId(family) { return C().families[family].lab; },
    labLevel(family) {
      const s = NOA.state;
      return s ? s.labs[G.labId(family)].level : 1;
    },
    labData(family) { return B().labs.levels[G.labLevel(family)] || B().labs.levels[1]; },
    purityCap(family) { return Math.min(B().gene.maxPurity, G.labData(family).purityCap); },
    fusionTierAllowed(family) { return G.labData(family).fusionTier; },

    ctxFor(a, b, op) {
      return {
        family: I().family(a),
        items: [a, b],
        charms: [a && a.charm, b && b.charm].filter(Boolean),
        op: op || 'merge'
      };
    },

    /** Weighted pick of a tier-1 gene for a family, with world / mascot weight modifiers */
    spawnGeneId(family, ctx) {
      const w = Object.assign({}, B().gene.spawnWeights[family]);
      for (const id in w) w[id] = NOA.mods.value('geneWeight.' + id, w[id], ctx || { family });
      return U.pickWeighted(w);
    },

    /** Fusion recipe for two different genes -> gene id or null */
    fusionTarget(g1, g2) {
      for (const id in C().genes) {
        const p = C().genes[id].parents;
        if (p && ((p[0] === g1 && p[1] === g2) || (p[0] === g2 && p[1] === g1))) return id;
      }
      return null;
    },

    better(a, b) {
      const ta = C().genes[a.id].tier, tb = C().genes[b.id].tier;
      if (ta !== tb) return ta > tb ? a : b;
      if (a.purity !== b.purity) return a.purity > b.purity ? a : b;
      return U.chance(0.5) ? a : b;
    },

    chances(a, b, ctx) {
      const g = B().gene;
      const stab = ctx.charms.indexOf('stabilizer') >= 0;
      return {
        spawn: NOA.mods.chance('gene.spawn', g.spawnChance, ctx),
        keepNormal: stab ? 1 : NOA.mods.chance('gene.keep.withNormal', g.keep.withNormal, ctx),
        keepSame: stab ? 1 : NOA.mods.chance('gene.keep.sameGene', g.keep.sameGene, ctx),
        keepDiff: stab ? 1 : NOA.mods.chance('gene.keep.diffGene', g.keep.diffGene, ctx),
        recessive: NOA.mods.chance('recessive.express', B().recessive.expressChance, ctx),
        stab
      };
    },

    purityUpChance(gA, gB, ctx) {
      const g = B().gene;
      const purity = Math.max(gA.purity, gB.purity);
      let base = g.purityUpChance[purity] || 0;
      if (gA.purity !== gB.purity) base *= g.purityUpUnequalFactor;
      return NOA.mods.chance('gene.purityUp', base, ctx);
    },

    fusionChance(target, ctx) {
      const tier = C().genes[target].tier;
      const base = B().gene.fusion.chanceByTier[tier] || 0;
      return NOA.mods.chance('gene.fusion', base, Object.assign({}, ctx, { fusionTo: target }));
    },

    /** Gene outcome for two breeds -> { gene, carrier } and pushes fx events */
    resolveGene(a, b, ctx, fx) {
      const g = B().gene;
      const fam = ctx.family;
      const ch = G.chances(a, b, ctx);
      const gA = a.gene, gB = b.gene;

      // --- normal + normal
      if (!gA && !gB) {
        let carrier = null;
        if (NOA.FEATURES.recessiveGenes && a.carrier && a.carrier === b.carrier) {
          if (U.chance(ch.recessive)) {
            fx.push({ type: 'recessive', gene: a.carrier });
            fx.push({ type: 'awaken', gene: a.carrier });
            return { gene: { id: a.carrier, purity: 1 }, carrier: null };
          }
          carrier = U.chance(B().recessive.inheritBothCarriers) ? a.carrier : null;
        } else if (NOA.FEATURES.recessiveGenes && (a.carrier || b.carrier)) {
          const c = a.carrier && b.carrier ? U.pick([a.carrier, b.carrier]) : (a.carrier || b.carrier);
          carrier = U.chance(B().recessive.inheritOneCarrier) ? c : null;
        }
        if (ctx.forceGene || U.chance(ch.spawn)) {
          const id = G.spawnGeneId(fam, ctx);
          fx.push({ type: 'awaken', gene: id });
          return { gene: { id, purity: 1 }, carrier: null };
        }
        return { gene: null, carrier };
      }

      // --- gene + gene
      if (gA && gB) {
        if (gA.id === gB.id) {
          if (!U.chance(ch.keepSame)) {
            fx.push({ type: 'geneLost', gene: gA.id });
            return { gene: null, carrier: g.lostGeneBecomesRecessive ? gA.id : null };
          }
          let purity = Math.max(gA.purity, gB.purity);
          const cap = G.purityCap(fam);
          if (purity < g.maxPurity) {
            if (purity >= cap) {
              fx.push({ type: 'purityCapped', gene: gA.id, cap });
            } else if (U.chance(G.purityUpChance(gA, gB, ctx))) {
              purity += 1;
              fx.push({ type: 'purityUp', gene: gA.id, purity });
              if (purity >= g.maxPurity) fx.push({ type: 'super', gene: gA.id });
            }
          }
          return { gene: { id: gA.id, purity }, carrier: null };
        }

        // different genes: try a fusion recipe, then secret recipes, else keep one
        let fused = null;
        const target = G.fusionTarget(gA.id, gB.id);
        if (target) {
          const tier = C().genes[target].tier;
          const allowed = tier <= G.fusionTierAllowed(fam);
          const pure = gA.purity >= g.fusion.minPurity && gB.purity >= g.fusion.minPurity;
          if (!allowed) fx.push({ type: 'fusionLocked', gene: target });
          else if (!pure) fx.push({ type: 'fusionNeedsPurity', gene: target });
          else if (U.chance(G.fusionChance(target, ctx))) fused = target;
        } else {
          fused = NOA.hooks.run('gene.secretFusion', null, { a: gA, b: gB, ctx, fx });
        }
        if (fused) {
          fx.push({ type: 'fusion', gene: fused });
          fx.push({ type: 'awaken', gene: fused });
          return { gene: { id: fused, purity: 1 }, carrier: null };
        }
        const win = G.better(gA, gB);
        if (U.chance(ch.keepDiff)) return { gene: { id: win.id, purity: win.purity }, carrier: null };
        fx.push({ type: 'geneLost', gene: win.id });
        return { gene: null, carrier: g.lostGeneBecomesRecessive ? win.id : null };
      }

      // --- gene + normal
      const one = gA || gB;
      if (U.chance(ch.keepNormal)) {
        const loss = ch.stab ? 0 : g.purityLossWithNormal;
        const purity = Math.max(1, one.purity - loss);
        if (purity < one.purity) fx.push({ type: 'purityDown', gene: one.id, purity });
        return { gene: { id: one.id, purity }, carrier: null };
      }
      fx.push({ type: 'geneLost', gene: one.id });
      return { gene: null, carrier: g.lostGeneBecomesRecessive ? one.id : null };
    },

    /** Merge two seeds or two animals (same species, same level) */
    mergeBreed(a, b, opts) {
      const ctx = G.ctxFor(a, b, 'merge');
      if (opts && opts.forceGene) ctx.forceGene = true;
      const fx = [];
      const m = B().merge;
      const L = a.level;
      let level = L + 1;
      let bt = false;
      if (L + 2 <= m.maxLevel) {
        const p = NOA.mods.chance('merge.breakthrough', m.breakthroughChance[L] || 0, ctx);
        if (p > 0 && U.chance(p)) { level = L + 2; bt = true; fx.push({ type: 'breakthrough', level }); }
      }
      const cap = m.statCapByLevel[level] || 100;
      const stats = {};
      for (const s of I().STATS) {
        const v = (a.stats[s] + b.stats[s]) / 2 + U.randInt(m.statGain[0], m.statGain[1]) + (bt ? m.breakthroughStatBonus : 0);
        stats[s] = U.clamp(Math.round(v), 1, cap);
      }
      const res = G.resolveGene(a, b, ctx, fx);
      const item = I().newBreed(a.species, level, { stats, gene: res.gene, carrier: res.carrier });
      item.revealed = !!(a.revealed || b.revealed);
      const out = NOA.hooks.run('merge.result', { item, fx, a, b, ctx });
      return out;
    },

    /** Merge two products (same product) -> next processed tier, always succeeds */
    mergeProduct(a, b) {
      const ctx = G.ctxFor(a, b, 'product');
      const fx = [];
      const p = C().products[a.product];
      const next = C().species[p.species].products[p.tier];
      let stars = Math.round(((a.stars || 1) + (b.stars || 1)) / 2);
      if (stars < 5 && U.chance(B().product.starUpChanceOnMerge)) { stars += 1; fx.push({ type: 'starUp', stars }); }
      let gene = null;
      const ch = G.chances(a, b, ctx);
      if (a.gene && b.gene) {
        if (a.gene.id === b.gene.id) {
          if (U.chance(ch.keepSame)) gene = { id: a.gene.id, purity: Math.max(a.gene.purity, b.gene.purity) };
          else fx.push({ type: 'geneLost', gene: a.gene.id });
        } else {
          const win = G.better(a.gene, b.gene);
          if (U.chance(ch.keepDiff)) gene = { id: win.id, purity: win.purity };
          else fx.push({ type: 'geneLost', gene: win.id });
        }
      } else if (a.gene || b.gene) {
        const one = a.gene || b.gene;
        if (U.chance(ch.keepNormal)) gene = { id: one.id, purity: Math.max(1, one.purity - B().gene.purityLossWithNormal) };
        else fx.push({ type: 'geneLost', gene: one.id });
      }
      const item = I().newProduct(next, stars, gene);
      return NOA.hooks.run('merge.result', { item, fx, a, b, ctx });
    },

    merge(a, b, opts) {
      return I().isBreed(a) ? G.mergeBreed(a, b, opts) : G.mergeProduct(a, b);
    },

    /** Luck boosters attached to the merging items */
    charmMods(ctx) {
      const out = [];
      for (const c of ctx.charms || []) {
        const b = B().boosters[c];
        if (!b) continue;
        if (b.geneKeepAdd) out.push({ key: 'gene.keep', add: b.geneKeepAdd, src: 'booster', id: c });
        if (b.purityUpAdd) out.push({ key: 'gene.purityUp', add: b.purityUpAdd, src: 'booster', id: c });
        if (b.fusionAdd) out.push({ key: 'gene.fusion', add: b.fusionAdd, src: 'booster', id: c });
        if (b.spawnMult) out.push({ key: 'gene.spawn', mult: b.spawnMult, src: 'booster', id: c });
        if (b.breakthroughAdd) out.push({ key: 'merge.breakthrough', add: b.breakthroughAdd, src: 'booster', id: c });
      }
      return out;
    },

    /** Research labs: bonuses for the family being merged */
    labMods(ctx) {
      if (!ctx.family || !NOA.state) return [];
      const L = G.labData(ctx.family);
      const lv = G.labLevel(ctx.family);
      const src = 'lab', id = G.labId(ctx.family);
      const out = [];
      if (L.success) {
        out.push({ key: 'gene.keep', add: L.success, src, id, lv });
        out.push({ key: 'gene.purityUp', add: L.success, src, id, lv });
        out.push({ key: 'gene.fusion', add: L.success, src, id, lv });
      }
      if (L.spawnAdd) out.push({ key: 'gene.spawn', add: L.spawnAdd, src, id, lv });
      if (L.breakAdd) out.push({ key: 'merge.breakthrough', add: L.breakAdd, src, id, lv });
      if (L.discoveryAdd) out.push({ key: 'hybrid.discovery', add: L.discoveryAdd, src, id, lv });
      if (L.lv2Spawn) out.push({ key: 'gen.lv2', add: L.lv2Spawn, src, id, lv });
      return out;
    }
  };

  Object.assign(G, {

    /**
     * What the player sees while hovering one item over another.
     * Returns rows: { k: i18n key, p: probability|null, params }
     */
    preview(a, b) {
      const rows = [];
      if (!I().canMerge(a, b)) return rows;
      const ctx = G.ctxFor(a, b, I().isBreed(a) ? 'merge' : 'product');
      const ch = G.chances(a, b, ctx);
      if (a.kind === 'product') {
        const p = C().products[a.product];
        rows.push({ k: 'preview.process', p: 1, params: { name: NOA.t('product.' + C().species[p.species].products[p.tier]) } });
        rows.push({ k: 'preview.starUp', p: B().product.starUpChanceOnMerge });
        if (a.gene && b.gene) rows.push({ k: 'preview.keepGene', p: a.gene.id === b.gene.id ? ch.keepSame : ch.keepDiff });
        else if (a.gene || b.gene) rows.push({ k: 'preview.keepGene', p: ch.keepNormal });
        return rows;
      }
      const m = B().merge;
      rows.push({ k: 'preview.levelUp', p: 1, params: { level: a.level + 1 } });
      if (a.level + 2 <= m.maxLevel) {
        const p = NOA.mods.chance('merge.breakthrough', m.breakthroughChance[a.level] || 0, ctx);
        if (p > 0) rows.push({ k: 'preview.breakthrough', p, params: { level: a.level + 2 } });
      }
      const gA = a.gene, gB = b.gene;
      if (!gA && !gB) {
        rows.push({ k: 'preview.newGene', p: ch.spawn });
        if (a.revealed && b.revealed && a.carrier && a.carrier === b.carrier) {
          rows.push({ k: 'preview.recessive', p: ch.recessive, params: { gene: NOA.t('gene.' + a.carrier) } });
        }
      } else if (gA && gB && gA.id === gB.id) {
        rows.push({ k: 'preview.keepGene', p: ch.keepSame });
        const purity = Math.max(gA.purity, gB.purity);
        if (purity < B().gene.maxPurity) {
          if (purity >= G.purityCap(ctx.family)) rows.push({ k: 'preview.purityCapped', p: null, params: { level: G.labLevel(ctx.family) + 1 } });
          else rows.push({ k: 'preview.purityUp', p: G.purityUpChance(gA, gB, ctx), params: { purity: purity + 1 } });
        }
      } else if (gA && gB) {
        const target = G.fusionTarget(gA.id, gB.id);
        if (target) {
          const tier = C().genes[target].tier;
          if (tier > G.fusionTierAllowed(ctx.family)) rows.push({ k: 'preview.fusionLocked', p: null, params: { gene: NOA.t('gene.' + target) } });
          else if (gA.purity < B().gene.fusion.minPurity || gB.purity < B().gene.fusion.minPurity) {
            rows.push({ k: 'preview.fusionNeedsPurity', p: null, params: { purity: B().gene.fusion.minPurity } });
          } else {
            const known = NOA.state && NOA.state.discovered.genes[target];
            rows.push({ k: 'preview.fusion', p: G.fusionChance(target, ctx), params: { gene: known ? NOA.t('gene.' + target) : '???' } });
          }
        }
        rows.push({ k: 'preview.keepOne', p: ch.keepDiff });
      } else {
        rows.push({ k: 'preview.keepGeneNormal', p: ch.keepNormal });
      }
      if (ctx.charms.length) rows.push({ k: 'preview.charms', p: null, params: { list: ctx.charms.map((c) => C().boosters[c].emoji).join(' ') } });
      return rows;
    }
  });

  NOA.mods.register('charms', (ctx) => G.charmMods(ctx));
  NOA.mods.register('labs', (ctx) => G.labMods(ctx));
})();
