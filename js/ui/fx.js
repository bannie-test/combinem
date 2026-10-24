/*
 * Juice: canvas particles, floating text, flying coins, rings, flashes, screen shake
 * and the full-screen "gene awakened" cinematic.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const UI = NOA.ui;
  const P = [];
  let cv, ctx, raf = 0, last = 0, dpr = 1;

  const FX = NOA.ui.fx = {
    init() {
      cv = document.getElementById('fx-canvas');
      ctx = cv.getContext('2d');
      const resize = () => {
        dpr = Math.min(2, globalThis.devicePixelRatio || 1);
        cv.width = Math.round(innerWidth * dpr);
        cv.height = Math.round(innerHeight * dpr);
      };
      resize();
      addEventListener('resize', resize);
    },

    /* ------------------------------------------------------------ particles */
    burst(x, y, o) {
      o = o || {};
      const n = UI.reduced ? Math.min(6, o.count || 18) : (o.count || 18);
      const colors = o.colors || ['#ffc83a', '#5cbb49', '#ffffff', '#ff6b8e'];
      const shapes = o.shapes || ['circle', 'star'];
      for (let i = 0; i < n; i++) {
        const a = (o.angle != null ? o.angle : Math.random() * Math.PI * 2) + (o.spread != null ? (Math.random() - 0.5) * o.spread : 0);
        const sp = (o.speed || 260) * (0.35 + Math.random() * 0.65);
        P.push({
          x, y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - (o.lift || 60),
          g: o.gravity != null ? o.gravity : 520,
          life: 0,
          max: (o.life || 0.9) * (0.6 + Math.random() * 0.6),
          size: (o.size || 6) * (0.6 + Math.random() * 0.8),
          color: colors[Math.floor(Math.random() * colors.length)],
          shape: shapes[Math.floor(Math.random() * shapes.length)],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 10,
          drag: o.drag || 0.985
        });
      }
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(FX.loop); }
    },
    confetti(x, y, n) {
      FX.burst(x, y, { count: n || 60, shapes: ['square', 'square', 'circle', 'star'], colors: ['#ff6b8e', '#ffc83a', '#5cbb49', '#56c1ff', '#a560f0', '#fff'], speed: 520, lift: 220, gravity: 640, life: 1.6, size: 7 });
    },
    loop(now) {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.life += dt;
        if (p.life >= p.max) { P.splice(i, 1); continue; }
        p.vx *= p.drag; p.vy = p.vy * p.drag + p.g * dt;
        p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
        const k = 1 - p.life / p.max;
        ctx.globalAlpha = Math.min(1, k * 1.6);
        ctx.fillStyle = p.color;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const s = p.size * (0.6 + 0.4 * k);
        if (p.shape === 'circle') { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill(); }
        else if (p.shape === 'square') ctx.fillRect(-s / 2, -s / 3, s, s * 0.66);
        else if (p.shape === 'leaf') { ctx.beginPath(); ctx.ellipse(0, 0, s * 0.7, s * 0.35, 0, 0, Math.PI * 2); ctx.fill(); }
        else { FX.star(s); }
        ctx.restore();
      }
      ctx.globalAlpha = 1;
      raf = P.length ? requestAnimationFrame(FX.loop) : 0;
      if (!raf) ctx.clearRect(0, 0, cv.width, cv.height);
    },
    star(s) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.28 : s * 0.7;
        const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
    },

    /* ------------------------------------------------------------ DOM fx */
    layer() { return document.getElementById('fx-layer'); },
    float(x, y, text, cls, delay) {
      const el = UI.h('div', { class: 'ftxt ' + (cls || ''), style: { left: x + 'px', top: y + 'px', 'animation-delay': (delay || 0) + 's' } }, text);
      FX.layer().append(el);
      setTimeout(() => el.remove(), 1400 + (delay || 0) * 1000);
    },
    ring(x, y, color) {
      if (UI.reduced) return;
      const el = UI.h('div', { class: 'ring-fx', style: { left: x + 'px', top: y + 'px', '--rc': color || '#fff' } });
      FX.layer().append(el);
      setTimeout(() => el.remove(), 600);
    },
    flash(color) {
      if (UI.reduced) return;
      const el = UI.h('div', { class: 'flash-fx', style: { '--fc': color || '#fff' } });
      document.body.append(el);
      setTimeout(() => el.remove(), 400);
    },
    shake(el) {
      if (UI.reduced || !el) return;
      el.classList.remove('screen-shake');
      void el.offsetWidth;
      el.classList.add('screen-shake');
      setTimeout(() => el.classList.remove('screen-shake'), 400);
    },
    bump(el) {
      if (!el) return;
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
      setTimeout(() => el.classList.remove('bump'), 380);
    },
    /** Emojis fly along an arc from a point to a HUD element */
    flyTo(from, target, emoji, n, onEach) {
      if (!target) return;
      const to = UI.center(target);
      const count = Math.min(n || 6, 10);
      let coinSound = 0;
      for (let i = 0; i < count; i++) {
        const el = UI.h('div', { class: 'fly' }, emoji);
        FX.layer().append(el);
        const sx = from.x + (Math.random() - 0.5) * 40, sy = from.y + (Math.random() - 0.5) * 30;
        const cx = (sx + to.x) / 2 + (Math.random() - 0.5) * 120, cy = Math.min(sy, to.y) - 80 - Math.random() * 60;
        const dur = 620 + Math.random() * 220, delay = i * 55;
        const t0 = performance.now() + delay;
        const step = (now) => {
          const k = Math.min(1, Math.max(0, (now - t0) / dur));
          const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
          const x = (1 - e) * (1 - e) * sx + 2 * (1 - e) * e * cx + e * e * to.x;
          const y = (1 - e) * (1 - e) * sy + 2 * (1 - e) * e * cy + e * e * to.y;
          el.style.left = x + 'px';
          el.style.top = y + 'px';
          el.style.transform = 'translate(-50%,-50%) scale(' + (1.2 - 0.5 * e) + ')';
          if (k < 1) requestAnimationFrame(step);
          else {
            el.remove();
            FX.bump(target);
            if (now - coinSound > 70) { NOA.audio.play(emoji === '💎' ? 'gem' : 'coin'); coinSound = now; }
            if (onEach) onEach(i);
          }
        };
        el.style.left = sx + 'px';
        el.style.top = sy + 'px';
        requestAnimationFrame(step);
      }
    },

    /* ------------------------------------------------------------ gene awakening cinematic (queued) */
    _queue: Promise.resolve(),
    awaken(item, mode) {
      FX._queue = FX._queue.then(() => FX._awaken(item, mode));
      return FX._queue;
    },
    _awaken(item, mode) {
      return new Promise((resolve) => {
        const g = NOA.CONTENT.genes[item.gene.id];
        const titles = { awaken: 'awaken.title', fusion: 'awaken.fusion', super: 'awaken.super', recessive: 'awaken.recessive' };
        const I = NOA.items;
        const sub = [g.emoji + ' ' + NOA.t('gene.tier' + g.tier), I.purityText(item.gene.purity),
          NOA.t('gene.favor', { stat: NOA.t(g.favor === 'all' ? 'stat.all' : 'stat.' + g.favor) })].join(' · ');
        const ov = UI.h('div', { class: 'awaken mode-' + mode, style: { '--gc': g.color }, role: 'dialog', 'aria-label': NOA.t(titles[mode]) },
          UI.h('div', { class: 'aw-bg' }),
          UI.h('div', { class: 'aw-rays' }),
          UI.h('div', { class: 'aw-item' }, UI.itemArt(item, { badges: false })),
          UI.h('div', { class: 'aw-title' }, NOA.t(titles[mode] || 'awaken.title')),
          UI.h('div', { class: 'aw-name' }, I.name(item)),
          UI.h('div', { class: 'aw-sub' }, sub),
          UI.h('div', { class: 'aw-sub' }, NOA.t('gene.' + item.gene.id + '.desc')),
          UI.h('div', { class: 'aw-tap' }, NOA.t('ui.tapToContinue')));
        document.getElementById('overlays').append(ov);
        NOA.audio.play(mode === 'super' ? 'levelUp' : 'gene');
        NOA.audio.vibrate([30, 40, 70]);
        const c = { x: innerWidth / 2, y: innerHeight * 0.42 };
        setTimeout(() => FX.burst(c.x, c.y, { count: 40, colors: [g.color, '#fff', '#fff6b0'], speed: 420, life: 1.3, shapes: ['star', 'circle'] }), 250);
        if (mode === 'super' || mode === 'fusion') setTimeout(() => FX.confetti(c.x, c.y, 70), 500);
        let done = false;
        const close = () => {
          if (done) return;
          done = true;
          ov.classList.add('closing');
          setTimeout(() => { ov.remove(); resolve(); }, 280);
        };
        setTimeout(() => ov.addEventListener('click', close), 500);
        setTimeout(close, 5200);
      });
    }
  };
})();
