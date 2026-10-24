/*
 * Labs screen: 🌱 Greenhouse and 🐾 Ranch — upgrades, current vs next-level bonuses,
 * cross-breeding slots and extension sections (gene essence...).
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

  const LV = NOA.ui.screens.labs = {
    render() {
      const root = document.getElementById('scr-labs');
      UI.clear(root);
      L().ids.forEach((lab) => root.append(LV.labCard(lab)));
      const fams = ['plant', 'animal'];
      const genes = Object.keys(C().genes);
      const found = genes.filter((g) => S().discovered.genes[g]).length;
      root.append(h('div', { class: 'panel' },
        h('div', { class: 'panel-title' }, h('span', null, '🧬 ' + t('lab.genes')), h('span', { class: 'num' }, found + '/' + genes.length)),
        h('div', { class: 'essence-row', style: { marginTop: '8px' } },
          fams.map((f) => genes.filter((g) => C().genes[g].family === f).map((g) =>
            h('span', { class: 'ev', title: S().discovered.genes[g] ? t('gene.' + g) : '???', style: { opacity: S().discovered.genes[g] ? '1' : '0.35' } },
              S().discovered.genes[g] ? C().genes[g].emoji : '❔'))))));
    },
    tick() {
      if (NOA.ui.current !== 'labs') return;
      document.querySelectorAll('#scr-labs [data-job]').forEach((el) => {
        const [lab, i] = el.dataset.job.split(':');
        const job = S().labs[lab].slots[Number(i)];
        if (!job) return;
        const left = job.end - NOA.time.now();
        const tm = el.querySelector('.jt');
        if (left > 0 && tm) tm.textContent = UI.dur(left);
        else if (left <= 0 && !el.dataset.ready) LV.render();
      });
    },

    labCard(lab) {
      const lvl = L().level(lab);
      const cur = L().data(lab);
      const next = lvl < B().labs.maxLevel ? B().labs.levels[lvl + 1] : null;
      const open = L().isOpen(lab);
      const tier = lvl >= 8 ? 3 : lvl >= 4 ? 2 : 1;
      const card = h('section', { class: 'panel lab' + (open ? '' : ' locked-panel'), 'data-lock': open ? null : '🔒 ' + t('lab.locked', { level: B().unlocks.ranch }) });
      card.append(h('div', { class: 'lab-head' },
        h('div', { class: 'lab-art tier-' + tier }, lab === 'greenhouse' ? (tier === 3 ? '🏰' : tier === 2 ? '🏡' : '🛖') : (tier === 3 ? '🏯' : tier === 2 ? '🏠' : '🛖'),
          h('span', { class: 'lv' }, String(lvl))),
        h('div', { style: { minWidth: '0' } },
          h('div', { class: 'lab-name' }, (lab === 'greenhouse' ? '🌱 ' : '🐾 ') + t('lab.' + lab)),
          h('p', { class: 'muted tiny' }, t('lab.' + lab + '.desc')))));

      const pct = (v) => UI.pct(v);
      const rows = [
        ['lab.success', '+' + pct(cur.success), next ? '+' + pct(next.success) : null],
        ['lab.spawn', pct(B().gene.spawnChance + cur.spawnAdd), next ? pct(B().gene.spawnChance + next.spawnAdd) : null],
        ['lab.break', '+' + pct(cur.breakAdd), next ? '+' + pct(next.breakAdd) : null],
        ['lab.lv2', pct(cur.lv2Spawn), next ? pct(next.lv2Spawn) : null],
        ['lab.purityCap', '◆' + cur.purityCap, next ? '◆' + next.purityCap : null],
        ['lab.fusionTier', t('tier.n', { n: cur.fusionTier }), next ? t('tier.n', { n: next.fusionTier }) : null],
        ['lab.slots', String(cur.slots), next ? String(next.slots) : null],
        ['lab.discovery', pct(B().hybrid.baseDiscovery + cur.discoveryAdd), next ? pct(B().hybrid.baseDiscovery + next.discoveryAdd) : null]
      ];
      const kv = h('dl', { class: 'kv' });
      rows.forEach(([k, v, n]) => {
        kv.append(h('dt', null, t(k)), h('dd', null, v), h('span', { class: 'up' }, n && n !== v ? '→ ' + n : ''));
      });
      card.append(kv);

      if (open) {
        if (next) {
          const can = NOA.res.canAfford(next.cost);
          card.append(UI.btn('⬆️ ' + t('lab.upgradeTo', { n: lvl + 1 }) + ' · ' + UI.cost(next.cost), can ? 'leaf block' : 'ghost block', () => {
            const r = L().upgrade(lab);
            if (r.ok) {
              NOA.audio.play('levelUp');
              NOA.ui.fx.confetti(innerWidth / 2, innerHeight * 0.4, 70);
              UI.toast(t('lab.upgraded', { lab: t('lab.' + lab), n: r.level }), 'good');
              LV.render();
              NOA.ui.hud.update();
            } else {
              NOA.audio.play('invalid');
              UI.toast(t('toast.notEnough', { name: t('res.coins') + ' / ' + t('res.rp') }), 'warn');
            }
          }));
        } else {
          card.append(h('p', { class: 'notice', style: { textAlign: 'center' } }, '🏆 ' + t('lab.maxed')));
        }
        card.append(LV.hybridSection(lab));
        const extra = NOA.hooks.run('labs.sections', [], lab);
        extra.forEach((s) => { const box = h('div'); s.render(box); card.append(box); });
      }
      return card;
    },

    hybridSection(lab) {
      const box = h('div', { class: 'lab' });
      box.append(h('h3', { class: 'lab-sub' }, '🧪 ' + t('lab.hybridTitle')));
      if (!L().hybridOpen(lab)) {
        box.append(h('p', { class: 'muted tiny' }, t('lab.hybridLocked', { level: B().unlocks.hybrid })));
        return box;
      }
      box.append(h('p', { class: 'muted tiny' }, t('lab.hybridHint', { vigor: B().hybrid.vigorBonus })));
      L().syncSlots(lab);
      const grid = h('div', { class: 'hslots' });
      S().labs[lab].slots.forEach((job, i) => {
        if (!job) {
          grid.append(h('button', { type: 'button', class: 'hslot', on: { click: () => LV.pickPair(lab, i) } },
            h('span', { style: { fontSize: '26px' } }, '🧬'), t('lab.hybridNew')));
          return;
        }
        const ready = NOA.time.now() >= job.end;
        const el = h('div', { class: 'hslot busy', data: { job: lab + ':' + i, ready: ready ? '1' : null } },
          h('span', { class: 'pair' }, C().species[job.a.species].emoji, h('span', { class: 'dna' }, '🧬'), C().species[job.b.species].emoji),
          ready ? UI.btn(t('lab.hybridReady'), 'sm berry', () => LV.collect(lab, i))
            : h('span', null, t('lab.hybridRunning') + ' ', h('b', { class: 'jt num' }, UI.dur(job.end - NOA.time.now()))));
        grid.append(el);
      });
      box.append(grid);
      return box;
    },

    pickPair(lab, slot) {
      const cands = L().candidates(lab);
      const species = new Set(cands.map((i) => S().board[i].species));
      if (species.size < 2) { UI.toast(t('lab.noCandidates'), 'warn'); return; }
      const chosen = [];
      UI.modal({
        title: t('lab.hybridPick'),
        body: (b, m) => {
          const grid = h('div', { class: 'pick-grid' });
          const startBtn = UI.btn(t('lab.hybridCost', { n: B().hybrid.costCoins }), 'leaf block', () => {
            const r = L().startHybrid(lab, slot, chosen[0], chosen[1]);
            if (r.ok) { NOA.audio.play('swoosh'); m.close(); LV.render(); }
            else { NOA.audio.play('invalid'); UI.toast(r.error === 'coins' ? t('toast.notEnough', { name: t('res.coins') }) : t('lab.noCandidates'), 'warn'); }
          }, { disabled: true });
          const status = h('p', { class: 'muted tiny', style: { textAlign: 'center' } }, '');
          const update = () => {
            grid.querySelectorAll('.pick').forEach((el) => el.setAttribute('aria-pressed', chosen.indexOf(Number(el.dataset.i)) >= 0 ? 'true' : 'false'));
            startBtn.disabled = chosen.length !== 2;
            status.textContent = chosen.map((i) => I().name(S().board[i])).join(' × ');
          };
          cands.forEach((i) => {
            const it = S().board[i];
            grid.append(h('button', {
              type: 'button', class: 'pick', data: { i: String(i) }, 'aria-pressed': 'false', title: I().name(it),
              on: {
                click: () => {
                  const k = chosen.indexOf(i);
                  if (k >= 0) chosen.splice(k, 1);
                  else {
                    if (chosen.length === 1 && S().board[chosen[0]].species === it.species) { UI.toast(t('lab.hybridHint', { vigor: B().hybrid.vigorBonus })); return; }
                    if (chosen.length >= 2) chosen.shift();
                    chosen.push(i);
                  }
                  NOA.audio.play('tap');
                  update();
                }
              }
            }, UI.itemArt(it)));
          });
          b.append(grid, status, startBtn);
        }
      });
    },

    collect(lab, slot) {
      const r = L().collectHybrid(lab, slot);
      if (!r) return;
      if (r.error === 'full') { UI.toast(t('toast.boardFull'), 'warn'); return; }
      LV.render();
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
