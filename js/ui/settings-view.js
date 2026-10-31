/*
 * Settings: language, sound, farm name, story replay, reset.
 * The developer panel lives in js/dev/dev-tools.js, which only the development page loads.
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
    toggle,
    seg,
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
            NOA.FEATURES.devPanel && NOA.dev ? UI.btn('🛠️ ' + t('dev.title'), 'sm ghost', () => { m.close(); NOA.dev.open(); }) : null));
          let armed = false;
          const reset = UI.btn('🗑️ ' + t('settings.reset'), 'sm ghost', () => {
            if (!armed) { armed = true; reset.textContent = '⚠️ ' + t('settings.resetConfirm'); reset.classList.add('btn--berry'); return; }
            m.close();
            NOA.app.reset();
          });
          b.append(reset, h('p', { class: 'muted tiny', style: { textAlign: 'center' } }, t('settings.version', { v: B().meta.version })));
        }
      });
    }
  };
})();
