/*
 * DEVELOPER TOOLS — loaded only by the development page (index.html, marked data-dev).
 * tools/build-artifact.mjs leaves this file out, so players never get these screens:
 * resources & time travel, forced sky events, mock payments, feature switches,
 * blindbox odds and simulations, config check.
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
  const toggle = (...a) => NOA.ui.settings.toggle(...a);
  const seg = (...a) => NOA.ui.settings.seg(...a);

  // dev-only strings stay out of the shipped dictionaries
  Object.assign(NOA.I18N.vi, {
    'ui.rates': 'Tỉ lệ',
    'box.ratesTitle': 'Tỉ lệ · {box}',
    'box.ratesNote': 'Tỉ lệ đọc trực tiếp từ config/balance.js. Mở ×10 đảm bảo ít nhất 1 {rarity}.',
    'dev.title': 'Công cụ Dev',
    'dev.note': 'Chỉ dùng khi phát triển. Tắt trong config/features.js (devPanel: false).',
    'dev.give': 'Cộng tài nguyên',
    'dev.level': 'Lên 1 cấp',
    'dev.nextDay': 'Sang ngày mới',
    'dev.skip10': 'Tua +10 phút',
    'dev.resetTime': 'Về giờ thật',
    'dev.speed': 'Tốc độ thời gian',
    'dev.force': 'Ép sự kiện',
    'dev.night': 'Ban đêm',
    'dev.fullMoon': 'Trăng tròn',
    'dev.meteor': 'Sao băng',
    'dev.storm': 'Giông',
    'dev.rainbow': 'Cầu vồng',
    'dev.payProvider': 'Thanh toán',
    'dev.features': 'Tính năng',
    'dev.geneEssence': 'Tinh chất gen',
    'dev.spawnGene': 'Tạo giống có gen',
    'dev.simulate': 'Giả lập 1.000 lần mở hộp',
    'dev.simResult': 'Kết quả giả lập {box}',
    'dev.config': 'Kiểm tra cấu hình',
    'dev.configOk': 'Cấu hình hợp lệ ✓',
    'dev.cfg': 'cấu hình',
    'dev.real': 'thực tế',
    'dev.labMax': 'Viện lên tối đa',
    'dev.finishAll': 'Hoàn thành mọi tiến trình',
    'dev.fillBarn': '+10 mỗi nông sản'
  });
  Object.assign(NOA.I18N.en, {
    'ui.rates': 'Rates',
    'box.ratesTitle': 'Rates · {box}',
    'box.ratesNote': 'Rates are read straight from config/balance.js. Opening ×10 guarantees at least one {rarity}.',
    'dev.title': 'Dev tools',
    'dev.note': 'For development only. Turn off in config/features.js (devPanel: false).',
    'dev.give': 'Add resources',
    'dev.level': 'Level up',
    'dev.nextDay': 'Next day',
    'dev.skip10': 'Skip +10 min',
    'dev.resetTime': 'Back to real time',
    'dev.speed': 'Time speed',
    'dev.force': 'Force events',
    'dev.night': 'Night',
    'dev.fullMoon': 'Full moon',
    'dev.meteor': 'Meteors',
    'dev.storm': 'Storm',
    'dev.rainbow': 'Rainbow',
    'dev.payProvider': 'Payments',
    'dev.features': 'Features',
    'dev.geneEssence': 'Gene essence',
    'dev.spawnGene': 'Spawn a gene breed',
    'dev.simulate': 'Simulate 1,000 box opens',
    'dev.simResult': 'Simulation · {box}',
    'dev.config': 'Check config',
    'dev.configOk': 'Config is valid ✓',
    'dev.cfg': 'config',
    'dev.real': 'observed',
    'dev.labMax': 'Max out labs',
    'dev.finishAll': 'Finish every timer',
    'dev.fillBarn': '+10 of every produce'
  });

  NOA.FEATURES.devPanel = true;

  const DEV = NOA.dev = {
    open() {
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
            UI.btn(t('dev.finishAll'), 'sm sun', () => { DEV.finishAll(); refresh(); }),
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
            Object.keys(B().gacha.boxes).map((id) => UI.btn(t('box.' + id), 'sm ghost', () => { out.textContent = DEV.simulate(id, 1000); })),
            Object.keys(B().gacha.boxes).map((id) => UI.btn('📊 ' + t('ui.rates') + ' · ' + t('box.' + id), 'sm ghost', () => DEV.ratesModal(id)))),
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
    },

    /** Blindbox odds table straight from config/balance.js */
    ratesModal(id) {
      const RC = { common: '#9aa69a', rare: '#3ea8f4', epic: '#a560f0', legendary: '#ffb21f', mythic: '#ff58a6' };
      const rates = NOA.gacha.rates(id);
      const box = B().gacha.boxes[id];
      UI.modal({
        title: t('box.ratesTitle', { box: t('box.' + id) }),
        body: (b) => {
          const tb = h('table', { class: 'rate-table' });
          rates.forEach((r) => {
            tb.append(h('tr', { class: 'rh' },
              h('td', null, h('span', { class: 'rh-dot', style: { background: RC[r.rarity] } }), t('rarity.' + r.rarity)),
              h('td', { class: 'p' }, UI.pct(r.p))));
            r.entries.forEach((e) => tb.append(h('tr', null, h('td', null, '· ' + t('reward.' + e.rewardId)), h('td', { class: 'p' }, UI.pct(e.p)))));
          });
          b.append(h('div', { style: { overflowX: 'auto' } }, tb));
          const pity = Object.keys(box.pity || {}).map((r) => t('box.pity', { rarity: t('rarity.' + r), n: box.pity[r] })).join(' · ');
          if (pity) b.append(h('p', { class: 'notice' }, pity));
          b.append(h('p', { class: 'muted tiny' }, t('box.ratesNote', { rarity: t('rarity.' + box.multi.guaranteeMinRarity) })));
        }
      });
    }
  };
})();
