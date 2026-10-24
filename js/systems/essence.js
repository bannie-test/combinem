/*
 * Gene Essence (Tinh chất gen) — EXTENSION MODULE, disabled by default (config/features.js).
 * Shows how a new feature plugs in without touching the core:
 *   - hooks 'item.actions'   : adds "Decompose gene" to the item card
 *   - hooks 'labs.sections'  : adds an "Inject gene" panel to each lab
 *   - numbers live in balance.essence
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const S = () => NOA.state;
  const I = () => NOA.items;

  const E = NOA.essence = {
    enabled() {
      const dev = S() && S().dev.features;
      return !!(dev && dev.geneEssence != null ? dev.geneEssence : NOA.FEATURES.geneEssence);
    },
    amount(geneId) { return (S().essence || {})[geneId] || 0; },
    yieldOf(item) {
      if (!item || !item.gene) return 0;
      const tier = C().genes[item.gene.id].tier;
      return (B().essence.decomposeYield[tier] || [])[item.gene.purity] || 0;
    },
    decompose(ref) {
      const it = S()[ref.grid].cells[ref.index];
      if (!E.enabled() || !it || !it.gene || it.locked) return null;
      const n = E.yieldOf(it);
      S().essence[it.gene.id] = E.amount(it.gene.id) + n;
      NOA.grids.remove(ref.grid, ref.index);
      NOA.events.emit('essence.changed', { gene: it.gene.id, n });
      return { gene: it.gene.id, n };
    },
    injectCost(geneId) { return B().essence.injectCost[C().genes[geneId].tier]; },
    canInject(item, geneId) {
      return E.enabled() && I().isBreed(item) && !item.gene && !item.locked &&
        C().genes[geneId].family === I().family(item) && E.amount(geneId) >= E.injectCost(geneId);
    },
    inject(ref, geneId) {
      const it = S()[ref.grid].cells[ref.index];
      if (!E.canInject(it, geneId)) return null;
      S().essence[geneId] -= E.injectCost(geneId);
      const tier = C().genes[geneId].tier;
      const ok = NOA.util.chance(B().essence.injectChance[tier]);
      if (ok) {
        it.gene = { id: geneId, purity: 1 };
        it.carrier = null;
        NOA.grids.recordGene(geneId, [{ type: 'awaken', gene: geneId }], I().family(it));
      }
      NOA.grids.changed(ref.grid, { updated: [ref.index] });
      NOA.events.emit('essence.changed', { gene: geneId });
      return { ok };
    },

    init() {
      NOA.hooks.add('item.actions', (actions, item, ref) => {
        if (!E.enabled() || !item || !item.gene || !ref) return actions;
        actions.push({
          id: 'decompose',
          label: NOA.t('essence.decompose', { n: E.yieldOf(item) }),
          kind: 'ghost',
          run() {
            const r = E.decompose(ref);
            if (r) NOA.ui.toast(NOA.t('essence.decomposed', { n: r.n, gene: I().geneName(r.gene) }));
          }
        });
        return actions;
      });
      NOA.hooks.add('labs.sections', (sections, lab) => {
        if (!E.enabled()) return sections;
        sections.push({ id: 'essence', render: (el) => E.renderLab(el, lab) });
        return sections;
      });
    },

    /** Lab panel: owned essences + inject onto a picked board item */
    renderLab(el, lab) {
      const h = NOA.ui.h;
      const fam = NOA.labs.family(lab);
      const genes = Object.keys(C().genes).filter((g) => C().genes[g].family === fam && E.amount(g) > 0);
      el.append(h('h3', { class: 'lab-sub' }, NOA.t('essence.title')));
      if (!genes.length) {
        el.append(h('p', { class: 'muted' }, NOA.t('essence.empty')));
        return;
      }
      const row = h('div', { class: 'essence-row' });
      genes.forEach((g) => {
        const btn = h('button', { class: 'chip-btn', type: 'button' },
          C().genes[g].emoji + ' ' + I().geneName(g) + ' × ' + E.amount(g));
        btn.addEventListener('click', () => {
          const grid = NOA.labs.grid(lab);
          const cands = [];
          S()[grid].cells.forEach((it, i) => { if (E.canInject(it, g)) cands.push(i); });
          if (!cands.length) { NOA.ui.toast(NOA.t('essence.noTarget', { n: E.injectCost(g) })); return; }
          const r = E.inject({ grid, index: cands[0] }, g);
          NOA.ui.toast(NOA.t(r && r.ok ? 'essence.injected' : 'essence.injectFail', { gene: I().geneName(g) }));
          NOA.events.emit('lab.changed', { lab });
        });
        row.append(btn);
      });
      el.append(row);
    }
  };
})();
