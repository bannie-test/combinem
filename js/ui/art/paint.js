/*
 * Art kit core: every picture on the farm map is painted in code on <canvas>
 * (no image files), in a cartoon 3/4 top-down view lit from the top-left with soft
 * drop shadows to the bottom-right.
 *
 *   NOA.art.sprite(key, w, h, draw)  paints once into an offscreen canvas (cached)
 *   NOA.art.show(el, sprite)          shows a cached sprite in an element's own <canvas>
 *   NOA.art.box3(ctx, ox, oy)         oblique projection used by every building
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const ART = NOA.art = NOA.art || {};

  /** device pixels per world pixel for sprites: crisp up to the map's max zoom on retina */
  ART.S = Math.max(2, Math.min(3, Math.round((globalThis.devicePixelRatio || 1) * 1.5)));

  /* ------------------------------------------------------------ random */
  ART.rng = function (seed) {
    let s = (seed >>> 0) || 1;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  ART.hash = (str) => { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  /* ------------------------------------------------------------ colour */
  const rgbOf = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return hex.length === 4
      ? [((n >> 8) & 15) * 17, ((n >> 4) & 15) * 17, (n & 15) * 17]
      : [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const toHex = (r, g, b) => '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
  /** mix two hex colours, t = 0..1 */
  ART.mix = (a, b, t) => { const x = rgbOf(a), y = rgbOf(b); return toHex(x[0] + (y[0] - x[0]) * t, x[1] + (y[1] - x[1]) * t, x[2] + (y[2] - x[2]) * t); };
  /** amt > 0 lightens towards white, < 0 darkens towards a warm brown-black */
  ART.shade = (hex, amt) => (amt >= 0 ? ART.mix(hex, '#ffffff', amt) : ART.mix(hex, '#2a1a12', -amt));
  ART.rgba = (hex, a) => { const c = rgbOf(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
  ART.INK = '#4a2f22';          // soft warm outline
  ART.SHADOW = 'rgba(38,62,18,0.30)';

  /* ------------------------------------------------------------ paths */
  ART.rr = (ctx, x, y, w, h, r) => {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };
  ART.ell = (ctx, cx, cy, rx, ry, rot) => { ctx.beginPath(); ctx.ellipse(cx, cy, Math.max(0.01, rx), Math.max(0.01, ry), rot || 0, 0, Math.PI * 2); };
  ART.poly = (ctx, pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); };
  /** smooth closed curve through points (Catmull-Rom) */
  ART.blob = (ctx, pts, tension) => {
    const k = (tension == null ? 0.5 : tension) / 3;
    const n = pts.length;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k, p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
    }
    ctx.closePath();
  };
  /** open smooth curve through points */
  ART.curve = (ctx, pts) => {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
  };
  /** irregular round blob (stones, bushes): n points around an ellipse with jitter */
  ART.lump = (ctx, cx, cy, rx, ry, rnd, jit, n) => {
    n = n || 9;
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const j = 1 + (rnd() - 0.5) * (jit == null ? 0.25 : jit);
      pts.push([cx + Math.cos(a) * rx * j, cy + Math.sin(a) * ry * j]);
    }
    ART.blob(ctx, pts);
  };

  /* ------------------------------------------------------------ fills */
  ART.lin = (ctx, x0, y0, x1, y1, stops) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    stops.forEach((s, i) => (Array.isArray(s) ? g.addColorStop(s[0], s[1]) : g.addColorStop(i / Math.max(1, stops.length - 1), s)));
    return g;
  };
  ART.rad = (ctx, x, y, r0, r1, stops, x1, y1) => {
    const g = ctx.createRadialGradient(x, y, r0, x1 == null ? x : x1, y1 == null ? y : y1, r1);
    stops.forEach((s, i) => (Array.isArray(s) ? g.addColorStop(s[0], s[1]) : g.addColorStop(i / Math.max(1, stops.length - 1), s)));
    return g;
  };
  /** fill the current path, then outline it */
  ART.fs = (ctx, fill, stroke, lw) => {
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1.6; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke(); }
  };
  /**
   * Soft shadow of a shape: the path drawn by buildPath() is cast far away and only its blurred
   * shadow is brought back (works in every browser, unlike ctx.filter)
   */
  ART.softShadow = (ctx, buildPath, o) => {
    o = o || {};
    const S = ART.S;
    const far = 4000;
    ctx.save();
    ctx.translate(-far, 0);
    buildPath(ctx);
    ctx.shadowColor = o.color || ART.SHADOW;
    ctx.shadowBlur = (o.blur == null ? 6 : o.blur) * S;
    ctx.shadowOffsetX = (far + (o.dx || 0)) * S;
    ctx.shadowOffsetY = (o.dy || 0) * S;
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.restore();
  };
  /** ground shadow ellipse under an object */
  ART.groundShadow = (ctx, cx, cy, rx, ry, o) => ART.softShadow(ctx, (c) => ART.ell(c, cx, cy, rx, ry), Object.assign({ blur: Math.max(2, ry * 0.8) }, o));
  /** small shiny highlight */
  ART.gloss = (ctx, x, y, rx, ry, a) => { ART.ell(ctx, x, y, rx, ry, -0.5); ctx.fillStyle = 'rgba(255,255,255,' + (a == null ? 0.55 : a) + ')'; ctx.fill(); };
  /** emoji / text glyph painted onto a sign */
  ART.glyph = (ctx, ch, x, y, size) => {
    ctx.save();
    ctx.font = size + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(ch, x, y + size * 0.06);
    ctx.restore();
  };

  /* ------------------------------------------------------------ oblique 3/4 projection
   * World axes: X to the right, Y up (height), Z away from the viewer.
   * Screen: depth goes up and a little to the right, so we see the front, the top and the right side.
   */
  ART.K = { x: 0.34, y: 0.86, z: 0.5 };
  ART.box3 = function (ctx, ox, oy) {
    const K = ART.K;
    const P = (X, Y, Z) => [ox + X + Z * K.x, oy - Y * K.y - Z * K.z];
    return {
      P,
      poly(pts3) { ART.poly(ctx, pts3.map((p) => P(p[0], p[1], p[2]))); },
      /** draw a polygon given in 3D and fill / outline it */
      face(pts3, fill, stroke, lw) { this.poly(pts3); ART.fs(ctx, fill, stroke === undefined ? ART.INK : stroke, lw || 1.5); },
      /** lines across a quad from edge a0-a1 towards edge b0-b1 (roof tiles, planks) */
      bands(q, n, color, lw, from, to) {
        const [a0, a1, b1, b0] = q.map((p) => P(p[0], p[1], p[2]));
        ctx.strokeStyle = color;
        ctx.lineWidth = lw || 1;
        for (let i = (from || 1); i < (to || n); i++) {
          const t = i / n;
          ctx.beginPath();
          ctx.moveTo(a0[0] + (b0[0] - a0[0]) * t, a0[1] + (b0[1] - a0[1]) * t);
          ctx.lineTo(a1[0] + (b1[0] - a1[0]) * t, a1[1] + (b1[1] - a1[1]) * t);
          ctx.stroke();
        }
      }
    };
  };
  /** screen size of a box: width w, depth d, height h (plus roof height) */
  ART.boxSize = (w, d, h) => ({ w: w + d * ART.K.x, h: h * ART.K.y + d * ART.K.z });

  /* ------------------------------------------------------------ sprite cache */
  const cache = new Map();
  ART.sprite = function (key, w, h, draw) {
    const hit = cache.get(key);
    if (hit) return hit;
    const S = ART.S;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * S);
    c.height = Math.ceil(h * S);
    c._w = w;
    c._h = h;
    const ctx = c.getContext('2d');
    ctx.scale(S, S);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    try { draw(ctx, w, h); } catch (e) { console.error('[art ' + key + ']', e); }
    cache.set(key, c);
    return c;
  };
  ART.has = (key) => cache.has(key);
  ART.clear = () => cache.clear();
  /** Put a sprite into el (reusing its canvas). Returns the visible canvas. */
  ART.show = function (el, sprite, cls) {
    let cv = el.querySelector(':scope > canvas.spr' + (cls ? '.' + cls : ''));
    if (!cv) {
      cv = document.createElement('canvas');
      cv.className = 'spr' + (cls ? ' ' + cls : '');
      cv.setAttribute('aria-hidden', 'true');
      el.prepend(cv);
    }
    if (cv._src === sprite) return cv;
    cv._src = sprite;
    cv.width = sprite.width;
    cv.height = sprite.height;
    cv.style.width = sprite._w + 'px';
    cv.style.height = sprite._h + 'px';
    cv.getContext('2d').drawImage(sprite, 0, 0);
    return cv;
  };
  /** A fresh canvas element showing a sprite (for repeated things like animals) */
  ART.canvasOf = function (sprite, cls) {
    const cv = document.createElement('canvas');
    cv.className = 'spr' + (cls ? ' ' + cls : '');
    cv.setAttribute('aria-hidden', 'true');
    cv.width = sprite.width;
    cv.height = sprite.height;
    cv.style.width = sprite._w + 'px';
    cv.style.height = sprite._h + 'px';
    cv.getContext('2d').drawImage(sprite, 0, 0);
    return cv;
  };
})();
