/*
 * Items: breeds (seeds / animals living in the merge grids), barn goods (products & materials
 * stored as stacks), naming, effective stats and value.
 *
 *   breed  : { id, kind:'seed'|'animal', species, level, stats:{yield,growth,quality},
 *              gene:{id,purity}|null, carrier: geneId|null (hidden recessive), revealed, charm, locked }
 *   barn   : stacks keyed "productId|stars|geneId|purity"  (materials: "straw||0|0")
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const U = NOA.util;
  const STATS = ['yield', 'growth', 'quality'];
  const valueCache = {};

  const I = NOA.items = {
    STATS,
    kindOf(family) { return family === 'plant' ? 'seed' : 'animal'; },
    isBreed(item) { return !!item && (item.kind === 'seed' || item.kind === 'animal'); },
    family(item) {
      if (!item) return null;
      if (I.isBreed(item)) return C().species[item.species].family;
      return null;
    },
    isMaterial(id) { return !!C().materials[id]; },
    productSpecies(pid) { return C().products[pid] ? C().products[pid].species : null; },

    /* ------------------------------------------------------------ breeds */
    rollStats(level) {
      const ranges = B().breeds.spawnStats;
      let r = ranges[level];
      if (!r) {
        const cap = B().merge.statCapByLevel[level] || 100;
        r = [Math.round(cap * 0.4), Math.round(cap * 0.65)];
      }
      return { yield: U.randInt(r[0], r[1]), growth: U.randInt(r[0], r[1]), quality: U.randInt(r[0], r[1]) };
    },
    randomCarrier(family) {
      if (!NOA.FEATURES.recessiveGenes) return null;
      if (!U.chance(B().breeds.carrierChance)) return null;
      return U.pickWeighted(B().gene.spawnWeights[family]);
    },
    newBreed(species, level, opts) {
      opts = opts || {};
      const fam = C().species[species].family;
      return {
        id: U.uid('b'),
        kind: I.kindOf(fam),
        species,
        level: level || 1,
        stats: opts.stats || I.rollStats(level || 1),
        gene: opts.gene || null,
        carrier: opts.carrier !== undefined ? opts.carrier : (opts.gene ? null : I.randomCarrier(fam)),
        revealed: false,
        charm: null,
        locked: false
      };
    },
    geneDef(item) { return item && item.gene ? C().genes[item.gene.id] : null; },
    geneTier(item) { const g = I.geneDef(item); return g ? g.tier : 0; },
    isSuper(item) { return !!(item && item.gene && item.gene.purity >= B().gene.maxPurity); },
    geneBonus(item, stat) {
      const g = I.geneDef(item);
      if (!g) return 0;
      const pts = B().gene.statBonusByPurity[item.gene.purity] || 0;
      if (g.favor === 'all') return Math.round(pts * B().gene.allFavorShare);
      return g.favor === stat ? pts : 0;
    },
    stat(item, stat) {
      if (!I.isBreed(item)) return 0;
      return item.stats[stat] + I.geneBonus(item, stat);
    },
    statTotal(item) { return STATS.reduce((a, s) => a + I.stat(item, s), 0); },
    geneMult(gene) {
      if (!gene) return 1;
      const def = C().genes[gene.id];
      const row = B().gene.priceMult[def.tier] || [1];
      return row[gene.purity] || row[row.length - 1];
    },
    breedValue(item) {
      if (!I.isBreed(item)) return 0;
      const m = B().market;
      const hybrid = C().species[item.species].hybrid ? 1.5 : 1;
      return Math.round(m.seedSellBase * (m.seedLevelMult[item.level] || 1) * I.geneMult(item.gene) * hybrid);
    },
    canMerge(a, b) {
      if (!a || !b || a === b || a.locked || b.locked) return false;
      return I.isBreed(a) && I.isBreed(b) && a.kind === b.kind && a.species === b.species &&
        a.level === b.level && a.level < B().merge.maxLevel;
    },
    isMaxed(item) { return I.isBreed(item) && item.level >= B().merge.maxLevel; },

    /* ------------------------------------------------------------ barn goods */
    key(pid, stars, gene) {
      if (I.isMaterial(pid)) return pid + '||0|0';
      return pid + '|' + (stars || 1) + '|' + (gene ? gene.id : '') + '|' + (gene ? gene.purity : 0);
    },
    parseKey(key) {
      const [pid, stars, geneId, purity] = key.split('|');
      return { pid, stars: Number(stars) || 1, gene: geneId ? { id: geneId, purity: Number(purity) || 1 } : null };
    },
    unitPrice(species) {
      const eco = B().species[species];
      if (eco.price) return eco.price;
      const sp = C().species[species];
      if (sp.hybrid) return (I.unitPrice(sp.hybrid[0]) + I.unitPrice(sp.hybrid[1])) / 2 * (eco.hybridPriceMult || 1);
      return 1;
    },
    /** Base value of a product (1★, no gene). Processed goods = inputs × markup (from the recipe). */
    baseValue(pid) {
      if (valueCache[pid] != null) return valueCache[pid];
      let v;
      if (I.isMaterial(pid)) v = B().materials[pid].price;
      else {
        const rec = B().recipes[pid];
        if (rec) {
          v = 0;
          for (const inp in rec.inputs) v += I.baseValue(inp) * rec.inputs[inp];
          v *= B().production.valueMarkup;
        } else {
          v = I.unitPrice(C().products[pid].species);
        }
      }
      valueCache[pid] = v;
      return v;
    },
    clearValueCache() { for (const k in valueCache) delete valueCache[k]; },
    productValue(pid, stars, gene) {
      if (I.isMaterial(pid)) return I.baseValue(pid);
      return I.baseValue(pid) * (B().product.starPriceMult[stars || 1] || 1) * I.geneMult(gene);
    },
    keyValue(key) {
      const p = I.parseKey(key);
      return I.productValue(p.pid, p.stars, p.gene);
    },
    tierOf(pid) { return C().products[pid] ? C().products[pid].tier : 0; },

    /* ------------------------------------------------------------ display */
    speciesName(id) { return NOA.t('species.' + id); },
    geneName(id) { return NOA.t('gene.' + id); },
    baseName(item) {
      if (!item) return '';
      if (item.kind === 'seed') return NOA.t('item.seedName', { species: I.speciesName(item.species) });
      if (item.kind === 'animal') return I.speciesName(item.species);
      return '';
    },
    name(item) {
      const base = I.baseName(item);
      if (item && item.gene) return NOA.t('item.withGene', { base, gene: I.geneName(item.gene.id) });
      return base;
    },
    goodName(pid, gene) {
      const base = I.isMaterial(pid) ? NOA.t('material.' + pid) : NOA.t('product.' + pid);
      return gene ? NOA.t('item.withGene', { base, gene: I.geneName(gene.id) }) : base;
    },
    goodEmoji(pid) { return I.isMaterial(pid) ? C().materials[pid].emoji : C().products[pid].emoji; },
    emoji(item) { return I.isBreed(item) ? C().species[item.species].emoji : ''; },
    emoji2(item) { return I.isBreed(item) ? C().species[item.species].emoji2 || null : null; },
    purityText(p) {
      const max = B().gene.maxPurity;
      return '◆'.repeat(p) + '◇'.repeat(Math.max(0, max - p));
    },
    starsFor(quality) {
      const th = B().harvest.starThresholds;
      let s = 1;
      for (let i = 0; i < th.length; i++) if (quality >= th[i]) s = i + 1;
      return U.clamp(s, 1, 5);
    }
  };
})();
