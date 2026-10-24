/*
 * Codex (Sổ tay): species & hybrids, genes, mascots + shrine, secrets, story & letters.
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

  let tab = 'species';

  const unlocked = (u) => {
    if (!u) return true;
    if (u.level != null) return S().level >= u.level;
    if (u.earth != null) return S().earth >= u.earth;
    if (u.flag) return !!S().flags[u.flag];
    return false;
  };

  const CV = NOA.ui.screens.codex = {
    tab(name) { tab = name; CV.render(); },
    render() {
      const root = document.getElementById('scr-codex');
      UI.clear(root);
      const seg = h('div', { class: 'seg', role: 'tablist' });
      [['species', '🌱'], ['genes', '🧬'], ['mascots', '🐾'], ['secrets', '🔮'], ['story', '📜']].forEach(([id, ic]) => {
        seg.append(h('button', { type: 'button', role: 'tab', 'aria-pressed': tab === id ? 'true' : 'false', on: { click: () => { NOA.audio.play('tap'); CV.tab(id); } } }, ic + ' ' + t('codex.' + id)));
      });
      root.append(seg);
      ({ species: CV.species, genes: CV.genes, mascots: CV.mascots, secrets: CV.secrets, story: CV.story })[tab](root);
    },

    species(root) {
      const all = Object.keys(C().species);
      const found = all.filter((id) => S().discovered.species[id]);
      root.append(h('div', { class: 'row-title' }, h('span', null, t('codex.progress', { a: found.length, b: all.length }))));
      const grid = h('div', { class: 'cx-grid' });
      all.forEach((id) => {
        const sp = C().species[id];
        const known = !!S().discovered.species[id];
        const best = S().discovered.maxLevel[id];
        grid.append(h('button', {
          type: 'button', class: 'cx' + (known ? '' : ' unknown'),
          on: { click: () => CV.speciesInfo(id) }
        },
          h('span', { class: 'ce' }, sp.emoji + (sp.emoji2 ? sp.emoji2 : '')),
          h('span', { class: 'cn' }, known ? t('species.' + id) : t('codex.unknown')),
          h('span', { class: 'cs' }, known ? (sp.hybrid ? t('item.hybrid') : t('fam.' + sp.family)) + (best ? ' · ' + t('ui.lv', { n: best }) : '') : sp.hybrid ? t('item.hybrid') : t('ui.unlockAt', { level: B().species[id].unlockLevel }))));
      });
      root.append(grid);
    },
    speciesInfo(id) {
      const sp = C().species[id];
      const known = !!S().discovered.species[id];
      UI.modal({
        title: known ? sp.emoji + ' ' + t('species.' + id) : t('codex.unknown'),
        body: (b) => {
          if (sp.hybrid) {
            b.append(h('p', { style: { textAlign: 'center', fontWeight: '800' } }, t('codex.hybridOf', { a: C().species[sp.hybrid[0]].emoji + ' ' + (known ? t('species.' + sp.hybrid[0]) : '???'), b: C().species[sp.hybrid[1]].emoji + ' ' + (known ? t('species.' + sp.hybrid[1]) : '???') })));
            b.append(h('p', { class: 'notice' }, known ? '🔎 ' + t('hybrid.' + id + '.fact') : '💡 ' + t('hybrid.' + id + '.hint')));
          } else {
            const prods = sp.products.map((p) => h('span', { class: 'ev', style: { opacity: S().discovered.products[p] ? '1' : '0.4' } }, C().products[p].emoji + ' ' + (S().discovered.products[p] ? t('product.' + p) : '???')));
            b.append(h('div', { class: 'essence-row', style: { justifyContent: 'center' } }, prods));
            if (sp.feed) b.append(h('p', { class: 'muted', style: { textAlign: 'center' } }, t('item.eats', { list: sp.feed.map((f) => C().species[f].emoji + ' ' + t('species.' + f)).join(', ') })));
          }
          if (S().discovered.maxLevel[id]) b.append(h('p', { style: { textAlign: 'center' } }, t('codex.bestLevel', { n: S().discovered.maxLevel[id] })));
        }
      });
    },

    genes(root) {
      const all = Object.keys(C().genes);
      const found = all.filter((g) => S().discovered.genes[g]).length;
      root.append(h('div', { class: 'row-title' }, h('span', null, t('codex.progress', { a: found, b: all.length }))));
      ['plant', 'animal'].forEach((fam) => {
        root.append(h('h3', { class: 'lab-sub' }, (fam === 'plant' ? '🌱 ' : '🐾 ') + t('fam.' + fam)));
        const grid = h('div', { class: 'cx-grid' });
        all.filter((g) => C().genes[g].family === fam).forEach((g) => {
          const def = C().genes[g];
          const known = !!S().discovered.genes[g];
          grid.append(h('button', {
            type: 'button', class: 'cx' + (known ? ' has-gene' : ' unknown'), style: { '--gc': def.color },
            on: { click: () => CV.geneInfo(g) }
          },
            h('span', { class: 'ce' }, def.emoji),
            h('span', { class: 'cn' }, known ? t('gene.' + g) : t('codex.unknown')),
            h('span', { class: 'cs' }, (def.secret ? '🔮 ' : '') + t('gene.tier' + def.tier))));
        });
        root.append(grid);
      });
    },
    geneInfo(g) {
      const def = C().genes[g];
      const known = !!S().discovered.genes[g];
      UI.modal({
        title: known ? def.emoji + ' ' + t('gene.' + g) : t('codex.unknown'),
        body: (b) => {
          b.append(h('p', { style: { textAlign: 'center', fontWeight: '800' } }, t('gene.tier' + def.tier) + ' · ' + t('fam.' + def.family) + ' · ' + t('gene.favor', { stat: t(def.favor === 'all' ? 'stat.all' : 'stat.' + def.favor) })));
          if (known) b.append(h('p', { style: { textAlign: 'center' } }, t('gene.' + g + '.desc')));
          if (def.parents) {
            const p = def.parents.map((x) => C().genes[x].emoji + ' ' + (S().discovered.genes[x] ? t('gene.' + x) : '???'));
            b.append(h('p', { class: 'notice' }, known ? t('gene.recipe', { a: p[0], b: p[1] }) : '💡 ' + t('gene.' + g + '.hint')));
          } else if (def.secret) {
            b.append(h('p', { class: 'notice' }, '🔮 ' + t('gene.secret') + ' · ' + t('gene.' + g + '.hint')));
          }
          const row = B().gene.priceMult[def.tier];
          b.append(h('p', { class: 'muted tiny', style: { textAlign: 'center' } }, '🪙 ×' + row[1] + ' (◆1) → ×' + row[5] + ' (◆5)'));
        }
      });
    },

    mascots(root) {
      const shrineLv = B().unlocks.shrine;
      root.append(h('h3', { class: 'lab-sub' }, '⛩️ ' + t('mascot.shrine')));
      if (S().level < shrineLv) root.append(h('p', { class: 'notice' }, '🔒 ' + t('ui.unlockAt', { level: shrineLv })));
      const shrine = h('div', { class: 'shrine' });
      S().mascots.shrine.forEach((id, i) => {
        shrine.append(h('button', {
          type: 'button', class: 'shrine-slot' + (id ? ' filled' : ''),
          on: { click: () => { if (id) { NOA.mascots.unplace(i); NOA.audio.play('close'); CV.render(); } } }
        }, id ? [h('span', { class: 'ce' }, C().mascots[id].emoji), t('mascot.' + id), h('br'), '★'.repeat(NOA.mascots.stars(id))] : t('ui.empty')));
      });
      root.append(shrine, h('p', { class: 'muted tiny' }, t('mascot.shrineHint')));
      ['perm', 'temp'].forEach((type) => {
        root.append(h('h3', { class: 'lab-sub' }, t('mascot.' + type)));
        const grid = h('div', { class: 'cx-grid' });
        Object.keys(C().mascots).filter((id) => C().mascots[id].type === type).forEach((id) => {
          const m = C().mascots[id];
          const known = !!S().discovered.mascots[id];
          const active = NOA.mascots.isActive(id);
          let status = '';
          if (type === 'temp' && active) status = t('mascot.remaining', { t: UI.dur(NOA.mascots.tempRemaining(id)) });
          else if (type === 'perm' && S().mascots.owned[id]) status = '★'.repeat(NOA.mascots.stars(id)) + (active ? ' · ' + t('mascot.active') : '');
          grid.append(h('button', {
            type: 'button', class: 'cx' + (known ? '' : ' unknown') + (active ? ' active' : ''),
            on: { click: () => CV.mascotInfo(id) }
          },
            h('span', { class: 'ce' }, m.emoji),
            h('span', { class: 'cn' }, known ? t('mascot.' + id) : (m.secret ? '🔮 ' : '') + t('codex.unknown')),
            h('span', { class: 'cs' }, status)));
        });
        root.append(grid);
      });
    },
    mascotInfo(id) {
      const m = C().mascots[id];
      const known = !!S().discovered.mascots[id];
      const owned = !!S().mascots.owned[id];
      const inShrine = S().mascots.shrine.indexOf(id);
      const actions = [];
      if (m.type === 'perm' && owned && S().level >= B().unlocks.shrine) {
        if (inShrine >= 0) actions.push({ label: t('mascot.remove'), kind: 'ghost', onClick: () => { NOA.mascots.unplace(inShrine); CV.render(); } });
        else actions.push({
          label: t('mascot.place'), kind: 'leaf', onClick: () => {
            const free = S().mascots.shrine.indexOf(null);
            if (free < 0) { UI.toast(t('mascot.shrineFull'), 'warn'); return; }
            NOA.mascots.place(id, free);
            NOA.audio.play('unlock');
            CV.render();
          }
        });
      }
      UI.modal({
        title: known ? m.emoji + ' ' + t('mascot.' + id) : t('codex.unknown'),
        body: (b) => {
          b.append(h('div', { style: { fontSize: '64px', textAlign: 'center', lineHeight: '1.1', filter: known ? 'none' : 'brightness(0) opacity(.25)' } }, m.emoji));
          b.append(h('p', { style: { textAlign: 'center', fontWeight: '800' } }, t('mascot.' + m.type) + (owned ? ' · ' + '★'.repeat(NOA.mascots.stars(id)) : '')));
          if (known) b.append(h('p', { style: { textAlign: 'center' } }, t('mascot.' + id + '.desc')));
          else if (m.secret) b.append(h('p', { class: 'notice' }, '🔮 ???'));
        },
        actions
      });
    },

    secrets(root) {
      const ids = NOA.secrets.ids();
      root.append(h('div', { class: 'row-title' }, h('span', null, t('codex.progress', { a: NOA.secrets.count(), b: ids.length }))));
      ids.forEach((id) => {
        const found = NOA.secrets.isFound(id);
        root.append(h('div', { class: 'panel secret-card' + (found ? '' : ' unknown') },
          h('span', { class: 'ce' }, found ? C().secrets[id].icon : '❔'),
          h('div', null,
            h('h4', null, found ? t('secret.' + id + '.title') : t('codex.unknown')),
            h('p', null, found ? t('secret.' + id + '.desc') : '💡 ' + t('secret.' + id + '.hint')))));
      });
    },

    story(root) {
      root.append(h('div', { class: 'panel story-card' },
        h('h3', null, '🌍 ' + t('codex.earth', { n: S().earth })),
        h('div', { class: 'earth-meter' }, h('i', { style: { width: S().earth + '%' } }))));
      C().chapters.forEach((ch) => {
        const open = unlocked(ch.unlock);
        root.append(h('article', { class: 'panel story-card' + (open ? '' : ' locked') },
          h('h3', null, (open ? '📖 ' : '🔒 ') + t('story.' + ch.id + '.title')),
          h('p', null, open ? t('story.' + ch.id + '.text') : t('codex.chapterLocked'))));
      });
      root.append(h('h3', { class: 'lab-sub' }, '✉️ ' + t('codex.letters')));
      C().letters.forEach((l) => {
        const open = unlocked(l.unlock);
        root.append(h('article', { class: 'panel story-card' + (open ? '' : ' locked') },
          h('h3', null, (open ? '💌 ' : '🔒 ') + t('story.' + l.id + '.title')),
          h('p', null, open ? t('story.' + l.id + '.text') : t('codex.chapterLocked'))));
      });
      root.append(UI.btn('🎬 ' + t('settings.story'), 'ghost', () => NOA.ui.story.intro()));
    }
  };
  CV.isUnlocked = unlocked;
})();
