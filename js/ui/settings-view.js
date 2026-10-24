/*
 * Settings (language, sound, farm name, reset) and the Dev panel used to test config & rates.
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

  const toggle = (on, onChange, label) => {
    const b = h('button', { type: 'button', class: 'toggle', 'aria-pressed': on ? 'true' : 'false', 'aria-label': label });
    b.addEventListener('click', () => {
      const v = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', v ? 'true' : 'false');
      onChange(v);
    });
    return b;
  };
  const seg = (options, current, onPick) => {
    const box = h('div', { class: 'seg' });
    options.forEach(([val, label]) => {
      const b = h('button', { type: 'button', 'aria-pressed': val === current ? 'true' : 'false' }, label);
      b.addEventListener('click', () => {
        box.querySelectorAll('button').forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        onPick(val);
      });
      box.append(b);
    });
    return box;
  };

  const SET = NOA.ui.settings = {
    open() {
      UI.modal({
        title: '⚙️ ' + t('settings.title'),
        body: (b, m) => {
          const s = S();
          b.append(h('div', { class: 'form-row' }, h('label', null, '🌐 ' + t('settings.language')),
            seg([['vi', 'Tiếng Việt'], ['en', 'English']], s.lang, (lang) => {
              s.lang = lang;
              NOA.i18n.setLang(lang);
              NOA.save.schedule();
              m.close();
              setTimeout(SET.open, 200);
            })));
          const audioRow = (key, label) => h('div', { class: 'form-row' }, h('label', null, label),
            toggle(s.settings[key], (v) => { s.settings[key] = v; NOA.audio.unlock(); NOA.audio.applySettings(); NOA.save.schedule(); }, label));
          b.append(audioRow('sfx', '🔊 ' + t('settings.sfx')), audioRow('music', '🎵 ' + t('settings.music')), audioRow('haptics', '📳 ' + t('settings.haptics')));
          const input = h('input', { class: 'input', id: 'set-farm-name', type: 'text', maxlength: '24', placeholder: t('settings.farmNamePh'), value: s.farmName || '' });
          b.append(h('div', null, h('label', { for: 'set-farm-name', style: { fontWeight: '800', fontFamily: 'var(--font-ui)' } }, '🏷️ ' + t('settings.farmName'))),
            h('div', { class: 'form-row' }, input, UI.btn(t('settings.save'), 'sm leaf', () => {
              NOA.secrets.rename(input.value);
              UI.toast(t('toast.saved'), 'good');
            })));
          b.append(h('div', { class: 'form-row' },
            UI.btn('🎬 ' + t('settings.story'), 'sm ghost', () => { m.close(); NOA.ui.story.intro(); }),
            NOA.FEATURES.devPanel ? UI.btn('🛠️ ' + t('dev.title'), 'sm ghost', () => { m.close(); SET.dev(); }) : null));
          let armed = false;
          const reset = UI.btn('🗑️ ' + t('settings.reset'), 'sm ghost', () => {
            if (!armed) { armed = true; reset.textContent = '⚠️ ' + t('settings.resetConfirm'); reset.classList.add('btn--berry'); return; }
            m.close();
            NOA.app.reset();
          });
          b.append(reset, h('p', { class: 'muted tiny', style: { textAlign: 'center' } }, t('settings.version', { v: B().meta.version })));
        }
      });
    },

    dev() {
      UI.modal({
        title: '🛠️ ' + t('dev.title'),
        cls: 'dev-modal',
        body: (b, m) => {
          const s = S();
          const refresh = () => { NOA.ui.renderAll(); NOA.ui.hud.update(); NOA.ui.hud.updateSky(); };
          const box = h('div', { class: 'dev' });
          box.append(h('p', { class: 'muted tiny' }, t('dev.note')));

          box.append(h('h3', null, t('dev.give')), h('div', { class: 'row' },
            UI.btn('+1000🪙', 'sm sun', () => { NOA.res.add('coins', 1000); refresh(); }),
            UI.btn('+100💎', 'sm sky', () => { NOA.res.add('gems', 100); refresh(); }),
            UI.btn(t('dev.fillBarn'), 'sm ghost', () => {
              for (const pid in C().products) if (NOA.production.inputUnlocked(pid) || C().products[pid].tier === 1) NOA.barn.add(pid, 10, { force: true });
              for (const m in C().materials) NOA.barn.add(m, 10, { force: true });
              refresh();
            }),
            UI.btn(t('dev.finishAll'), 'sm sun', () => { SET.finishAll(); refresh(); }),
            UI.btn('+50🔬', 'sm ghost', () => { NOA.res.add('rp', 50); refresh(); }),
            UI.btn('+5 🍀🧪✨🧃🔍', 'sm ghost', () => { NOA.rewards.grant({ boosters: { clover: 5, stabilizer: 5, stardust: 5, tonic: 5, loupe: 5 } }); refresh(); }),
            UI.btn('+2 🎟️🎟️', 'sm ghost', () => { NOA.rewards.grant({ tickets: { sprout: 2, star: 2 } }); refresh(); }),
            UI.btn(t('dev.level'), 'sm leaf', () => { NOA.progress.addXP(NOA.progress.xpToNext(s.level) - s.xp); refresh(); }),
            UI.btn(t('dev.labMax'), 'sm ghost', () => { NOA.labs.ids.forEach((l) => { s.labs[l].level = B().labs.maxLevel; NOA.labs.syncSlots(l); }); refresh(); })));

          box.append(h('h3', null, '⏰ ' + t('dev.speed')), h('div', { class: 'row' },
            UI.btn(t('dev.nextDay'), 'sm ghost', () => { s.dev.offsetMs += NOA.time.DAY; refresh(); UI.toast(NOA.time.dayKey()); }),
            UI.btn(t('dev.skip10'), 'sm ghost', () => { s.dev.offsetMs += 600000; refresh(); }),
            UI.btn(t('dev.resetTime'), 'sm ghost', () => { s.dev.offsetMs = 0; refresh(); })),
          seg([[null, '×1'], [0.2, '×5'], [0.05, '×20']], s.dev.timeScale, (v) => { s.dev.timeScale = v; NOA.save.schedule(); }));

          const force = s.dev.force || (s.dev.force = {});
          const ft = (key, val, label) => h('div', { class: 'form-row' }, h('label', null, label),
            toggle(force[key] === val, (on) => { force[key] = on ? val : null; NOA.save.schedule(); NOA.ui.hud.updateSky(); }, label));
          box.append(h('h3', null, '🌌 ' + t('dev.force')),
            ft('night', true, '🌙 ' + t('dev.night')),
            ft('fullMoon', true, '🌕 ' + t('dev.fullMoon')),
            ft('meteor', true, '🌠 ' + t('dev.meteor')),
            ft('weather', 'storm', '⛈️ ' + t('dev.storm')),
            ft('rainbow', true, '🌈 ' + t('dev.rainbow')));

          box.append(h('h3', null, '💳 ' + t('dev.payProvider')),
            seg([[null, 'config (' + NOA.PAYMENT.provider + ')'], ['mock', 'mock']], s.dev.payProvider, (v) => { s.dev.payProvider = v; NOA.save.schedule(); }));

          box.append(h('h3', null, '🧩 ' + t('dev.features')),
            h('div', { class: 'form-row' }, h('label', null, '🧬 ' + t('dev.geneEssence')),
              toggle(NOA.essence.enabled(), (on) => { s.dev.features.geneEssence = on; NOA.save.schedule(); refresh(); }, t('dev.geneEssence'))));

          const sel = h('select', { class: 'input', id: 'dev-gene' }, Object.keys(C().genes).map((g) => h('option', { value: g }, C().genes[g].emoji + ' ' + t('gene.' + g))));
          box.append(h('h3', null, '🧪 ' + t('dev.spawnGene')), h('div', { class: 'form-row' }, sel, UI.btn('＋', 'sm leaf', () => {
            const g = C().genes[sel.value];
            const fam = g.family;
            const species = fam === 'plant' ? 'tomato' : 'chicken';
            const item = NOA.items.newBreed(species, 2, { gene: { id: sel.value, purity: 3 } });
            if (NOA.grids.place(item) === -1) { UI.toast(t('grid.full', { grid: t('grid.' + NOA.grids.gridFor(item)) }), 'warn'); return; }
            NOA.grids.recordGene(sel.value, [], fam);
            UI.toast(NOA.items.name(item), 'good');
          })));

          const out = h('pre', null, '');
          box.append(h('h3', null, '🎲 ' + t('dev.simulate')), h('div', { class: 'row' },
            Object.keys(B().gacha.boxes).map((id) => UI.btn(t('box.' + id), 'sm ghost', () => { out.textContent = SET.simulate(id, 1000); }))),
            UI.btn('✅ ' + t('dev.config'), 'sm ghost', () => {
              const w = NOA.validateConfig();
              out.textContent = w.length ? '⚠️ ' + w.join('\n⚠️ ') : t('dev.configOk');
            }), out);
          b.append(box);
          void m;
        }
      });
    },

    /** Dev: every field, pen, workshop job and hybrid finishes now */
    finishAll() {
      const now = NOA.time.now();
      const s = S();
      for (const bed in s.fields) s.fields[bed].forEach((p) => { if (p.seed) p.end = Math.min(p.end, now); });
      for (const id in s.pens) s.pens[id].slots.forEach((x) => { if (x && x.end) x.end = Math.min(x.end, now); });
      for (const id in s.factories) s.factories[id].queue.forEach((j) => { j.end = Math.min(j.end, now); j.start = Math.min(j.start, now); });
      for (const lab in s.labs) s.labs[lab].slots.forEach((j) => { if (j) j.end = Math.min(j.end, now); });
      NOA.farm.tick();
      NOA.production.tick();
      NOA.labs.tick();
      for (const bed in s.fields) NOA.events.emit('field.changed', { bed });
      for (const id in s.pens) NOA.events.emit('pens.changed', { penId: id });
      for (const id in s.factories) NOA.events.emit('factory.changed', { building: id });
    },

    /** Roll a box n times on a scratch pity state (the real save is untouched) */
    simulate(id, n) {
      const s = S();
      const saved = JSON.parse(JSON.stringify(s.gacha[id] || { opened: 0, since: {} }));
      s.gacha[id] = { opened: 0, since: {} };
      const counts = {};
      const rewards = {};
      for (let i = 0; i < n; i++) {
        const [r] = NOA.gacha.roll(id, 1);
        counts[r.rarity] = (counts[r.rarity] || 0) + 1;
        rewards[r.reward] = (rewards[r.reward] || 0) + 1;
      }
      s.gacha[id] = saved;
      const lines = [t('dev.simResult', { box: t('box.' + id) }) + ' · n=' + n];
      NOA.gacha.rates(id).forEach((r) => {
        lines.push(t('rarity.' + r.rarity).padEnd(12) + ' ' + t('dev.cfg') + ' ' + UI.pct(r.p).padStart(7) + ' | ' + t('dev.real') + ' ' + UI.pct((counts[r.rarity] || 0) / n).padStart(7));
      });
      lines.push('');
      Object.keys(rewards).sort((a, b) => rewards[b] - rewards[a]).forEach((k) => lines.push('· ' + t('reward.' + k) + ': ' + rewards[k]));
      return lines.join('\n');
    }
  };
})();
