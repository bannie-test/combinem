/*
 * i18n: flat key dictionaries in i18n/vi.js and i18n/en.js.
 * t('key', {param}) replaces {param}; missing keys fall back to Vietnamese, then the key itself.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  NOA.I18N = NOA.I18N || {};

  const LOCALES = { vi: 'vi-VN', en: 'en-US' };

  NOA.i18n = {
    lang: 'vi',
    langs: ['vi', 'en'],
    setLang(lang) {
      this.lang = LOCALES[lang] ? lang : 'vi';
      if (globalThis.document) document.documentElement.lang = this.lang;
      NOA.events.emit('lang.changed', this.lang);
    },
    locale() { return LOCALES[this.lang] || 'vi-VN'; },
    has(key) {
      const d = NOA.I18N[this.lang] || {};
      return d[key] != null || (NOA.I18N.vi || {})[key] != null;
    },
    t(key, params) {
      const d = NOA.I18N[this.lang] || {};
      let s = d[key];
      if (s == null) s = (NOA.I18N.vi || {})[key];
      if (s == null) return key;
      if (params) s = s.replace(/\{(\w+)\}/g, (m, p) => (params[p] != null ? params[p] : m));
      return s;
    },
    num(n) {
      return Math.round(n).toLocaleString(this.locale());
    },
    /** 1.2K / 3,4M */
    compact(n) {
      if (Math.abs(n) < 10000) return this.num(n);
      try {
        return new Intl.NumberFormat(this.locale(), { notation: 'compact', maximumFractionDigits: 1 }).format(n);
      } catch (e) { return this.num(n); }
    }
  };

  NOA.t = (key, params) => NOA.i18n.t(key, params);
})();
