/*
 * Research lab window (🌱 Greenhouse / 🐾 Ranch), opened from the breeding screen or the map:
 *   ⬆️ upgrade tab — current vs next-level bonuses (gene chances, purity cap, fusion tier, slots)
 *   🧪 cross-breeding tab — pair two different species from the lab's grid for a hybrid
 * Extension sections (gene essence...) plug in through the 'labs.sections' hook.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const UI = NOA.ui;
  const h = (...a) => UI.h(...a);
  const t = (k, p) => NOA.t(k, p);
  const S = () => NOA.state;
  const B = () => NOA.BALANCE;
  const C = () => NOA.CONTENT;
  const I = () => NOA.items;
  const L = () => NOA.labs;

  let current = null;   // { lab, tab, modal }

  const LV = NOA.ui.labs = {
    open(lab, tab) {
      if (!L().isOpen(lab)) { UI.toast(t('lab.locked', { level: B().unlocks.ranch })); return; }
      if (current) current.modal.close();
      current = { lab, tab: tab || 'upgrade' };
      current.modal = UI.modal({
        title: C().buildings[lab].emoji + ' ' + t('bld.' + lab),
        cls: 'lab-modal',
        body: (b) => { current.body = b; LV.fill(); },
        onClose: () => { current = null; }
      });
    },
    /** Re-render the open window (lab level / slots / resources changed) */
    refresh() { if (current && current.body && current.body.isConnected) LV.fill(); },
    tick() {
      if (!current || current.tab !== 'hybrid' || !current.body) return;
      current.body.querySelectorAll('[data-job]').forEach((el) => {
        const job = S().labs[current.lab].slots[Number(el.dataset.job)];
        if (!job) return;
        const left = job.end - NOA.time.now();
        const tm = el.querySelector('.jt');
        if (left > 0 && tm) tm.textContent = UI.dur(left);
        else if (left <= 0 && !el.dataset.ready) LV.fill();
      });
    },

    fill() {
      const { lab } = current;
      const b = current.body;
      UI.clear(b);
      const lvl = L().level(lab);
      const tier = lvl >= 8 ? 3 : lvl >= 4 ? 2 : 1;
      b.append(h('div', { class: 'lab-head' },
        h('div', { class: 'lab-art tier-' + tier }, C().buildings[lab].emoji, h('span', { class: 'lv' }, String(lvl))),
        h('p', { class: 'muted tiny' }, t('lab.' + lab + '.desc'))));
      const seg = h('div', { class: 'seg', role: 'tablist' });
      [['upgrade', '⬆️ ' + t('lab.tabUpgrade')], ['hybrid', '🧪 ' + t('lab.tabHybrid')]].forEach(([id, label]) => {
        seg.append(h('button', { type: 'button', role: 'tab', 'aria-pressed': current.tab === id ? 'true' : 'false', on: { click: () => { NOA.audio.play('tap'); current.tab = id; LV.fill(); } } }, label));
      });
      b.append(seg);
      if (current.tab === 'upgrade') LV.upgradeTab(b, lab);
      else LV.hybridTab(b, lab);
      const extra = NOA.hooks.run('labs.sections', [], lab);
      extra.forEach((s) => { const box = h('div', { class: 'lab' }); s.render(box); b.append(box); });
    },

    upgradeTab(b, lab) {
      const lvl = L().level(lab);
      const cur = L().data(lab);
      const next = lvl < B().labs.maxLevel ? B().labs.levels[lvl + 1] : null;
      const pct = (v) => UI.pct(v);
      const rows = [
        ['lab.success', '+' + pct(cur.success), next ? '+' + pct(next.success) : null],
        ['lab.spawn', pct(B().gene.spawnChance + cur.spawnAdd), next ? pct(B().gene.spawnChance + next.spawnAdd) : null],
        ['lab.break', '+' + pct(cur.breakAdd), next ? '+' + pct(next.breakAdd) : null],
        ['lab.purityCap', '◆' + cur.purityCap, next ? '◆' + next.purityCap : null],
        ['lab.fusionTier', t('tier.n', { n: cur.fusionTier }), next ? t('tier.n', { n: next.fusionTier }) : null],
        ['lab.slots', String(cur.slots), next ? String(next.slots) : null],
        ['lab.discovery', pct(B().hybrid.baseDiscovery + cur.discoveryAdd), next ? pct(B().hybrid.baseDiscovery + next.discoveryAdd) : null]
      ];
      const kv = h('dl', { class: 'kv' });
      rows.forEach(([k, v, n]) => kv.append(h('dt', null, t(k)), h('dd', null, v), h('span', { class: 'up' }, n && n !== v ? '→ ' + n : '')));
      b.append(kv);
      if (!next) { b.append(h('p', { class: 'notice', style: { textAlign: 'center' } }, '🏆 ' + t('lab.maxed'))); return; }
      const can = NOA.res.canAfford(next.cost);
      b.append(UI.btn('⬆️ ' + t('lab.upgradeTo', { n: lvl + 1 }) + ' · ' + UI.cost(next.cost), can ? 'leaf block' : 'ghost block', () => {
        const r = L().upgrade(lab);
        if (r.ok) {
          NOA.audio.play('levelUp');
          NOA.ui.fx.confetti(innerWidth / 2, innerHeight * 0.4, 70);
          UI.toast(t('lab.upgraded', { lab: t('bld.' + lab), n: r.level }), 'good');
          LV.fill();
          NOA.ui.hud.update();
        } else {
          NOA.audio.play('invalid');
          UI.toast(t('toast.notEnough', { name: t('res.coins') + ' / ' + t('res.rp') }), 'warn');
        }
      }));
    },

    hybridTab(b, lab) {
      if (!L().hybridOpen(lab)) {
        b.append(h('p', { class: 'notice' }, t('lab.hybridLocked', { level: B().unlocks.hybrid })));
        return;
      }
      b.append(h('p', { class: 'muted tiny' }, t('lab.hybridHint', { vigor: B().hybrid.vigorBonus })));
      L().syncSlots(lab);
      const grid = h('div', { class: 'hslots' });
      S().labs[lab].slots.forEach((job, i) => {
        if (!job) {
          grid.append(h('button', { type: 'button', class: 'hslot', on: { click: () => LV.pickPair(lab, i) } },
            h('span', { style: { fontSize: '26px' } }, '🧬'), t('lab.hybridNew')));
          return;
        }
        const ready = NOA.time.now() >= job.end;
        grid.append(h('div', { class: 'hslot busy', data: { job: String(i), ready: ready ? '1' : null } },
          h('span', { class: 'pair' }, C().species[job.a.species].emoji, h('span', { class: 'dna' }, '🧬'), C().species[job.b.species].emoji),
          ready ? UI.btn(t('lab.hybridReady'), 'sm berry', () => LV.collect(lab, i))
            : h('span', null, t('lab.hybridRunning') + ' ', h('b', { class: 'jt num' }, UI.dur(job.end - NOA.time.now())))));
      });
      b.append(grid);
      b.append(h('p', { class: 'muted tiny' }, '💡 ' + C().hybrids.filter((x) => C().species[x.a].family === L().family(lab))
        .map((x) => C().species[x.a].emoji + '×' + C().species[x.b].emoji + (S().discovered.hybrids[x.result] ? ' → ' + t('species.' + x.result) : ' → ???')).join(' · ')));
    },

    pickPair(lab, slot) {
      const grid = L().grid(lab);
      const cells = S()[grid].cells;
      const cands = L().candidates(lab);
      const species = new Set(cands.map((i) => cells[i].species));
      if (species.size < 2) { UI.toast(t('lab.noCandidates'), 'warn'); return; }
      const chosen = [];
      UI.modal({
        title: t('lab.hybridPick'),
        body: (b, m) => {
          const pick = h('div', { class: 'pick-grid' });
          const startBtn = UI.btn(t('lab.hybridCost', { n: B().hybrid.costCoins }), 'leaf block', () => {
            const r = L().startHybrid(lab, slot, chosen[0], chosen[1]);
            if (r.ok) { NOA.audio.play('swoosh'); m.close(); LV.refresh(); }
            else { NOA.audio.play('invalid'); UI.toast(r.error === 'coins' ? t('toast.notEnough', { name: t('res.coins') }) : t('lab.noCandidates'), 'warn'); }
          }, { disabled: true });
          const status = h('p', { class: 'muted tiny', style: { textAlign: 'center' } }, '');
          const update = () => {
            pick.querySelectorAll('.pick').forEach((el) => el.setAttribute('aria-pressed', chosen.indexOf(Number(el.dataset.i)) >= 0 ? 'true' : 'false'));
            startBtn.disabled = chosen.length !== 2;
            status.textContent = chosen.map((i) => I().name(cells[i])).join(' × ');
          };
          cands.forEach((i) => {
            const it = cells[i];
            pick.append(h('button', {
              type: 'button', class: 'pick', data: { i: String(i) }, 'aria-pressed': 'false', title: I().name(it),
              on: {
                click: () => {
                  const k = chosen.indexOf(i);
                  if (k >= 0) chosen.splice(k, 1);
                  else {
                    if (chosen.length === 1 && cells[chosen[0]].species === it.species) { UI.toast(t('lab.hybridHint', { vigor: B().hybrid.vigorBonus })); return; }
                    if (chosen.length >= 2) chosen.shift();
                    chosen.push(i);
                  }
                  NOA.audio.play('tap');
                  update();
                }
              }
            }, UI.itemArt(it)));
          });
          b.append(pick, status, startBtn);
        }
      });
    },

    collect(lab, slot) {
      const r = L().collectHybrid(lab, slot);
      if (!r) return;
      if (r.error === 'full') { UI.toast(t('grid.full', { grid: t('grid.' + L().grid(lab)) }), 'warn'); return; }
      LV.refresh();
      if (r.success) {
        NOA.audio.play('reveal', r.isNew ? 3 : 2);
        NOA.ui.fx.confetti(innerWidth / 2, innerHeight * 0.4, 80);
        UI.modal({
          title: '🧬 ' + t('lab.hybridSuccess'),
          body: (b) => {
            b.append(h('div', { style: { width: '110px', height: '110px', margin: '0 auto' } }, UI.itemArt(r.item, { size: 54 })),
              h('h3', { style: { textAlign: 'center' } }, I().name(r.item) + (r.isNew ? '  ' + t('ui.new') : '')),
              h('p', { class: 'notice' }, '🔎 ' + t('hybrid.' + r.species + '.fact')));
          },
          actions: [{ label: t('ui.ok'), kind: 'leaf' }],
          onClose: () => { if (r.item.gene && r.fx.some((f) => f.type === 'awaken')) NOA.ui.fx.awaken(r.item, 'awaken'); }
        });
      } else {
        NOA.audio.play('geneLost');
        UI.modal({
          title: t('lab.hybridFail'),
          body: h('p', { style: { textAlign: 'center' } }, t('lab.hybridFailText', {
            name: I().name(r.item), rp: r.rp, extra: t(r.compatible ? 'lab.hybridCompatible' : 'lab.hybridIncompatible')
          })),
          actions: [{ label: t('ui.ok'), kind: 'ghost' }]
        });
      }
    }
  };
})();
