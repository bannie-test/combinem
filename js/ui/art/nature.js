/*
 * Art kit · nature: trees, bushes, flowers, rocks, grass tufts, fences, tilled fields and
 * every crop at every growth stage. All drawn at the call site's scale `s` (1 = normal).
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const ART = NOA.art;
  const { rr, ell, poly, blob, curve, lump, lin, rad, fs, gloss } = ART;
  const INK = ART.INK;

  /* ================================================================ foliage helpers */
  /** circles → one cartoon cluster with a single soft outline, a shade side and highlights */
  function cluster(ctx, circles, colors, o) {
    o = o || {};
    const [dark, mid, light, hi] = colors;
    // outline: every circle a little bigger in ink
    ctx.fillStyle = o.ink || INK;
    circles.forEach(([x, y, r]) => { ell(ctx, x, y, r + (o.lw || 1.4), r + (o.lw || 1.4)); ctx.fill(); });
    // shade base
    ctx.fillStyle = dark;
    circles.forEach(([x, y, r]) => { ell(ctx, x, y, r, r); ctx.fill(); });
    // lit body (shifted to the light, top-left)
    ctx.fillStyle = mid;
    circles.forEach(([x, y, r]) => { ell(ctx, x - r * 0.12, y - r * 0.14, r * 0.86, r * 0.84); ctx.fill(); });
    ctx.fillStyle = light;
    circles.forEach(([x, y, r]) => { ell(ctx, x - r * 0.3, y - r * 0.34, r * 0.5, r * 0.44); ctx.fill(); });
    if (hi) {
      ctx.fillStyle = hi;
      circles.forEach(([x, y, r]) => { ell(ctx, x - r * 0.42, y - r * 0.46, r * 0.2, r * 0.15, -0.5); ctx.fill(); });
    }
  }
  ART.cluster = cluster;
  const GREENS = ['#3f8f37', '#5bb447', '#80cc59', '#c7f08e'];
  const DEEP = ['#2f7a3a', '#459a43', '#67b552', '#a9e07f'];

  /* ================================================================ trees */
  ART.tree = function (ctx, cx, by, s, rnd, kind) {
    kind = kind || 'round';
    if (kind === 'pine') return pine(ctx, cx, by, s, rnd);
    if (kind === 'fruit') return roundTree(ctx, cx, by, s, rnd, true);
    return roundTree(ctx, cx, by, s, rnd, false);
  };
  function trunk(ctx, cx, by, s, hgt) {
    const w = 7 * s;
    poly(ctx, [[cx - w * 0.6, by], [cx - w * 0.42, by - hgt], [cx + w * 0.42, by - hgt], [cx + w * 0.6, by]]);
    fs(ctx, lin(ctx, cx - w, 0, cx + w, 0, ['#9a6338', '#7b4a28']), INK, 1.4);
    // little roots
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.6, by); ctx.quadraticCurveTo(cx - w, by + 1, cx - w * 1.2, by + 1.5);
    ctx.moveTo(cx + w * 0.6, by); ctx.quadraticCurveTo(cx + w, by + 1, cx + w * 1.2, by + 1.5);
    ctx.stroke();
  }
  function roundTree(ctx, cx, by, s, rnd, fruit) {
    ART.groundShadow(ctx, cx + 9 * s, by + 1, 21 * s, 7 * s);
    trunk(ctx, cx, by, s, 20 * s);
    const r = 15 * s;
    const top = by - 31 * s;
    const circles = [
      [cx - r * 0.8, top + r * 0.35, r * 0.78],
      [cx + r * 0.85, top + r * 0.4, r * 0.75],
      [cx, top + r * 0.55, r * 0.9],
      [cx - r * 0.35, top - r * 0.35, r * 0.85],
      [cx + r * 0.45, top - r * 0.3, r * 0.8]
    ].map(([x, y, rr0]) => [x + (rnd() - 0.5) * 2 * s, y + (rnd() - 0.5) * 2 * s, rr0]);
    cluster(ctx, circles, rnd() < 0.5 ? GREENS : DEEP);
    if (fruit) {
      for (let i = 0; i < 6; i++) {
        const a = rnd() * Math.PI * 2, d = rnd() * r * 0.9;
        const fx = cx + Math.cos(a) * d * 1.1, fy = top + Math.sin(a) * d * 0.8 + r * 0.1;
        ell(ctx, fx, fy, 2.6 * s, 2.6 * s); fs(ctx, '#ff5b4a', INK, 1);
        gloss(ctx, fx - 0.8 * s, fy - 0.9 * s, 0.9 * s, 0.6 * s, 0.7);
      }
    }
  }
  function pine(ctx, cx, by, s, rnd) {
    ART.groundShadow(ctx, cx + 8 * s, by + 1, 16 * s, 6 * s);
    trunk(ctx, cx, by, s * 0.85, 10 * s);
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const w = (18 - i * 4.5) * s, yb = by - 8 * s - i * 11 * s, ht = 17 * s;
      blob(ctx, [[cx - w, yb], [cx - w * 0.5, yb - ht * 0.45], [cx, yb - ht], [cx + w * 0.5, yb - ht * 0.45], [cx + w, yb], [cx, yb + 3 * s]], 0.35);
      fs(ctx, lin(ctx, cx - w, yb - ht, cx + w, yb, ['#5aa84a', '#2f7a3a']), INK, 1.4);
      ctx.fillStyle = 'rgba(200,240,150,0.45)';
      blob(ctx, [[cx - w * 0.7, yb - 2 * s], [cx - w * 0.35, yb - ht * 0.5], [cx - 1 * s, yb - ht * 0.85], [cx - w * 0.15, yb - ht * 0.35]], 0.3);
      ctx.fill();
    }
    void rnd;
  }

  ART.bush = function (ctx, cx, by, s, rnd, o) {
    o = o || {};
    ART.groundShadow(ctx, cx + 4 * s, by, 14 * s, 4.5 * s);
    const r = 8 * s;
    const circles = [[cx - r * 0.9, by - r * 0.8, r * 0.8], [cx + r * 0.9, by - r * 0.75, r * 0.78], [cx, by - r * 1.2, r]]
      .map(([x, y, rr0]) => [x + (rnd() - 0.5) * s, y + (rnd() - 0.5) * s, rr0]);
    cluster(ctx, circles, o.colors || GREENS);
    if (o.dots) {
      for (let i = 0; i < 5; i++) {
        const x = cx + (rnd() - 0.5) * r * 2.4, y = by - r * 0.5 - rnd() * r * 1.2;
        ell(ctx, x, y, 1.6 * s, 1.6 * s); fs(ctx, o.dots, INK, 0.8);
      }
    }
  };

  /** five-petal flower head */
  ART.flower = function (ctx, x, y, r, petal, center) {
    ctx.fillStyle = petal;
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      ell(ctx, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.5, r * 0.5);
      ctx.fill();
    }
    ell(ctx, x, y, r * 0.38, r * 0.38); ctx.fillStyle = center || '#ffd23e'; ctx.fill();
  };
  ART.flowers = function (ctx, cx, cy, s, rnd, palette) {
    const cols = palette || ['#ffffff', '#ffd6e6', '#ff8fb3', '#fff27a', '#b9a4ff'];
    for (let i = 0; i < 6; i++) {
      const x = cx + (rnd() - 0.5) * 18 * s, y = cy + (rnd() - 0.5) * 9 * s;
      ctx.strokeStyle = '#4f9a3c';
      ctx.lineWidth = 1 * s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 0.5 * s, y + 4 * s); ctx.stroke();
      ART.flower(ctx, x, y, 2.6 * s, cols[Math.floor(rnd() * cols.length)]);
    }
  };

  ART.rock = function (ctx, cx, by, s, rnd) {
    ART.groundShadow(ctx, cx + 3 * s, by, 10 * s, 3.2 * s);
    lump(ctx, cx, by - 5 * s, 9 * s, 6.5 * s, rnd, 0.3, 8);
    fs(ctx, lin(ctx, cx, by - 12 * s, cx, by, ['#d9d4cb', '#a39d93']), INK, 1.3);
    gloss(ctx, cx - 3 * s, by - 8 * s, 3 * s, 1.6 * s, 0.6);
  };

  ART.tuft = function (ctx, x, y, s, c) {
    ctx.strokeStyle = c || '#4d9a32';
    ctx.lineWidth = 1.2 * s;
    ctx.beginPath();
    ctx.moveTo(x - 2.5 * s, y); ctx.quadraticCurveTo(x - 3 * s, y - 3 * s, x - 4.2 * s, y - 4.5 * s);
    ctx.moveTo(x, y); ctx.quadraticCurveTo(x, y - 4 * s, x + 0.4 * s, y - 6 * s);
    ctx.moveTo(x + 2.5 * s, y); ctx.quadraticCurveTo(x + 3 * s, y - 3 * s, x + 4.4 * s, y - 4.2 * s);
    ctx.stroke();
  };

  /* ================================================================ fences */
  function post(ctx, x, by, s) {
    rr(ctx, x - 2.4 * s, by - 13 * s, 4.8 * s, 14 * s, 1.6 * s);
    fs(ctx, lin(ctx, x - 3 * s, 0, x + 3 * s, 0, ['#e1a866', '#b07541']), INK, 1.2);
    ell(ctx, x, by - 12.6 * s, 2.3 * s, 1.1 * s); ctx.fillStyle = '#f3c98d'; ctx.fill();
  }
  /** fence along the screen x axis (seen from the front) */
  ART.fenceH = function (ctx, x0, x1, by, s, gapFrom, gapTo) {
    const step = 18 * s;
    const n = Math.max(1, Math.round((x1 - x0) / step));
    const xs = [];
    for (let i = 0; i <= n; i++) xs.push(x0 + ((x1 - x0) * i) / n);
    ART.softShadow(ctx, (c) => { c.beginPath(); c.rect(x0, by - 2 * s, x1 - x0, 4 * s); }, { blur: 3, dx: 3 * s, dy: 3 * s });
    for (const yy of [by - 9.5 * s, by - 4.5 * s]) {
      for (let i = 0; i < n; i++) {
        const a = xs[i], b = xs[i + 1];
        if (gapFrom != null && a >= gapFrom - 1 && b <= gapTo + 1) continue;
        rr(ctx, a, yy - 1.6 * s, b - a, 3.2 * s, 1.4 * s);
        fs(ctx, lin(ctx, 0, yy - 2 * s, 0, yy + 2 * s, ['#e6b072', '#b97c45']), INK, 1);
      }
    }
    xs.forEach((x) => { if (gapFrom == null || x < gapFrom - 1 || x > gapTo + 1) post(ctx, x, by, s); });
  };
  /** fence going up the screen (a side fence, seen from above) */
  ART.fenceV = function (ctx, x, y0, y1, s) {
    const step = 15 * s;
    const n = Math.max(1, Math.round((y1 - y0) / step));
    for (let i = 0; i < n; i++) {
      const a = y0 + ((y1 - y0) * i) / n, b = y0 + ((y1 - y0) * (i + 1)) / n;
      rr(ctx, x - 1.6 * s, a - 9 * s, 3.2 * s, b - a, 1.4 * s);
      fs(ctx, lin(ctx, x - 2 * s, 0, x + 2 * s, 0, ['#e6b072', '#b97c45']), INK, 1);
    }
    for (let i = 0; i <= n; i++) post(ctx, x, y0 + ((y1 - y0) * i) / n, s);
  };

  /* ================================================================ fields */
  /**
   * Tilled field / flower bed seen from above with a front edge.
   * rows: furrow count. o: { bed, fert, wild, sale }
   */
  ART.field = function (ctx, w, h, o) {
    o = o || {};
    const edge = 6;
    const x = 3, y = 3, fw = w - 8, fh = h - edge - 6;
    const r = o.bed === 'flower' ? 16 : 12;
    // cast shadow
    ART.softShadow(ctx, (c) => rr(c, x, y, fw, fh + edge, r), { blur: 5, dx: 4, dy: 4 });
    if (o.bed === 'flower') {
      // pebble border bed
      rr(ctx, x, y + edge * 0.4, fw, fh + edge * 0.6, r);
      fs(ctx, '#cfc6b4', INK, 1.4);
      rr(ctx, x + 4, y + 3, fw - 8, fh - 2, r - 4);
      fs(ctx, lin(ctx, 0, y, 0, y + fh, o.fert ? ['#6e4325', '#55321b'] : ['#8a5832', '#6d4325']), null);
      const rnd = ART.rng(w * 31 + h);
      for (let i = 0; i < 26; i++) {
        const t = i / 26;
        const px = t < 0.5 ? x + 4 + (fw - 8) * (t * 2) : x + 4 + (fw - 8) * ((t - 0.5) * 2);
        const py = t < 0.5 ? y + 2.5 : y + fh + 1.2;
        ell(ctx, px, py + (rnd() - 0.5), 3.2, 2.2); fs(ctx, rnd() < 0.5 ? '#ece6da' : '#d8d0c0', INK, 0.8);
      }
    } else {
      // soil block: front edge then top
      rr(ctx, x, y + edge, fw, fh, r);
      fs(ctx, '#7a4a28', INK, 1.5);
      rr(ctx, x, y, fw, fh, r);
      fs(ctx, lin(ctx, 0, y, 0, y + fh, o.fert ? ['#7d4c2a', '#62391f'] : ['#b47a46', '#98623a']), INK, 1.5);
    }
    // furrows
    const rows = o.rows || 3;
    const top = y + (o.bed === 'flower' ? 8 : 9), bottom = y + fh - (o.bed === 'flower' ? 6 : 8);
    for (let i = 0; i < rows; i++) {
      const fy = top + ((bottom - top) * (i + 0.5)) / rows;
      ctx.lineCap = 'round';
      ctx.strokeStyle = o.fert ? 'rgba(40,20,10,0.55)' : 'rgba(80,45,22,0.55)';
      ctx.lineWidth = 3.4;
      ctx.beginPath(); ctx.moveTo(x + 9, fy + 2); ctx.quadraticCurveTo(x + fw / 2, fy + 3.5, x + fw - 9, fy + 2); ctx.stroke();
      ctx.strokeStyle = o.fert ? 'rgba(150,100,60,0.55)' : 'rgba(225,170,110,0.7)';
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.moveTo(x + 9, fy - 1); ctx.quadraticCurveTo(x + fw / 2, fy + 0.5, x + fw - 9, fy - 1); ctx.stroke();
    }
    if (o.fert) {
      const rnd = ART.rng(77 + w);
      for (let i = 0; i < 18; i++) { ell(ctx, x + 8 + rnd() * (fw - 16), y + 6 + rnd() * (fh - 12), 1.2, 1); ctx.fillStyle = 'rgba(30,15,5,0.6)'; ctx.fill(); }
    }
    // soft top light
    ctx.save();
    rr(ctx, x, y, fw, fh, r);
    ctx.clip();
    ctx.fillStyle = lin(ctx, x, y, x + fw, y + fh, ['rgba(255,240,210,0.18)', 'rgba(255,240,210,0)', 'rgba(0,0,0,0.06)']);
    ctx.fillRect(x, y, fw, fh);
    ctx.restore();
    return { rows, top, bottom, x: x + 6, w: fw - 12 };
  };
  /** grass lot waiting to be bought / unlocked */
  ART.lot = function (ctx, w, h, o) {
    o = o || {};
    const rnd = ART.rng(Math.round(w * 7 + h * 13 + (o.seed || 0)));
    rr(ctx, 4, 4, w - 8, h - 8, 14);
    ctx.setLineDash([4, 4]);
    fs(ctx, o.sale ? 'rgba(255,248,220,0.28)' : 'rgba(60,110,30,0.12)', o.sale ? 'rgba(120,80,40,0.65)' : 'rgba(60,90,30,0.45)', 1.6);
    ctx.setLineDash([]);
    for (let i = 0; i < 7; i++) ART.tuft(ctx, 12 + rnd() * (w - 24), 14 + rnd() * (h - 22), 1, '#4a8f2e');
    if (!o.sale) {
      ART.bush(ctx, 18 + rnd() * 10, h - 12, 0.75, rnd);
      ART.rock(ctx, w - 22 - rnd() * 10, h - 14, 0.7, rnd);
    }
  };

  /* ================================================================ crops */
  const LEAF = ['#3f8c34', '#58ad46', '#7fcf5a', '#c3ef8d'];
  function sprout(ctx, x, by, s) {
    ctx.strokeStyle = '#3e8a2f'; ctx.lineWidth = 1.6 * s;
    ctx.beginPath(); ctx.moveTo(x, by); ctx.lineTo(x, by - 6 * s); ctx.stroke();
    ell(ctx, x - 3.2 * s, by - 7 * s, 3.4 * s, 1.9 * s, -0.5); fs(ctx, '#86d45e', INK, 1);
    ell(ctx, x + 3.2 * s, by - 7.5 * s, 3.4 * s, 1.9 * s, 0.5); fs(ctx, '#a6e472', INK, 1);
  }
  function blades(ctx, x, by, s, n, hgt, colA, colB, droop) {
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) - 0.5 : 0;
      const tipX = x + t * 16 * s, tipY = by - hgt * (1 - Math.abs(t) * 0.35);
      ctx.strokeStyle = INK; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(x + t * 3 * s, by); ctx.quadraticCurveTo(x + t * 6 * s, by - hgt * 0.6, tipX + (droop ? t * 6 * s : 0), tipY); ctx.stroke();
      ctx.strokeStyle = i % 2 ? colA : colB; ctx.lineWidth = 1.8 * s;
      ctx.beginPath(); ctx.moveTo(x + t * 3 * s, by); ctx.quadraticCurveTo(x + t * 6 * s, by - hgt * 0.6, tipX + (droop ? t * 6 * s : 0), tipY); ctx.stroke();
    }
  }
  function leafBush(ctx, x, by, s, r, colors) {
    cluster(ctx, [[x - r * 0.75, by - r * 0.75, r * 0.72], [x + r * 0.75, by - r * 0.7, r * 0.7], [x, by - r * 1.15, r * 0.85]], colors || LEAF, { lw: 1.1 });
  }
  function fruit(ctx, x, y, r, c0, c1, calyx) {
    ell(ctx, x, y, r, r * 0.92); fs(ctx, rad(ctx, x - r * 0.35, y - r * 0.4, r * 0.1, r * 1.2, [c0, c1]), INK, 1);
    gloss(ctx, x - r * 0.35, y - r * 0.4, r * 0.32, r * 0.2, 0.75);
    if (calyx) {
      ctx.strokeStyle = '#3d8a2f'; ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) { const a = -Math.PI / 2 + (i - 1.5) * 0.6; ctx.moveTo(x, y - r * 0.85); ctx.lineTo(x + Math.cos(a) * r * 0.55, y - r * 0.85 + Math.sin(a) * r * 0.25 + 1); }
      ctx.stroke();
    }
  }
  function rose(ctx, x, y, r, c) {
    ell(ctx, x, y, r, r * 0.9); fs(ctx, rad(ctx, x - r * 0.3, y - r * 0.3, r * 0.1, r * 1.1, [ART.shade(c, 0.25), ART.shade(c, -0.2)]), INK, 1);
    ctx.strokeStyle = ART.shade(c, -0.45); ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.arc(x, y, r * 0.55, 0.3, 4.6); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + r * 0.08, y + r * 0.05, r * 0.25, 2.2, 6.6); ctx.stroke();
  }
  function berry(ctx, x, y, r) {
    blob(ctx, [[x - r, y - r * 0.6], [x, y - r * 0.9], [x + r, y - r * 0.6], [x + r * 0.45, y + r * 0.6], [x, y + r * 1.05], [x - r * 0.45, y + r * 0.6]], 0.45);
    fs(ctx, rad(ctx, x - r * 0.3, y - r * 0.3, r * 0.1, r * 1.3, ['#ff6b6b', '#d81f3b']), INK, 1);
    ctx.fillStyle = '#ffe9a8';
    for (let i = 0; i < 5; i++) { ell(ctx, x + Math.cos(i * 2.4) * r * 0.45, y + Math.sin(i * 2.4) * r * 0.45, 0.45, 0.6); ctx.fill(); }
    ctx.fillStyle = '#4f9d36';
    ell(ctx, x, y - r * 0.85, r * 0.55, r * 0.22); ctx.fill();
  }
  function potatoes(ctx, x, by, s) {
    [[-5, 1.5, 4.2], [4, 2.5, 3.6]].forEach(([dx, dy, r]) => {
      ell(ctx, x + dx * s, by + dy * s, r * s, r * 0.72 * s, 0.2); fs(ctx, rad(ctx, x + dx * s - 1, by + dy * s - 1, 0.5, r * s * 1.2, ['#e3b06d', '#a8703a']), INK, 1);
      ctx.fillStyle = 'rgba(90,50,20,0.6)';
      ell(ctx, x + dx * s + 1, by + dy * s - 0.5, 0.6, 0.5); ctx.fill();
      ell(ctx, x + dx * s - 1.4, by + dy * s + 0.8, 0.5, 0.45); ctx.fill();
    });
  }
  function sunflowerHead(ctx, x, y, r) {
    ctx.fillStyle = INK;
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ell(ctx, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.85, r * 0.5, r * 0.26, a); ctx.fill(); }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ell(ctx, x + Math.cos(a) * r * 0.95, y + Math.sin(a) * r * 0.85, r * 0.42, r * 0.19, a);
      ctx.fillStyle = i % 2 ? '#ffd02e' : '#ffbe1e'; ctx.fill();
    }
    ell(ctx, x, y, r * 0.62, r * 0.56); fs(ctx, rad(ctx, x - r * 0.2, y - r * 0.2, 0.5, r * 0.7, ['#9a5b2c', '#5e3317']), INK, 1);
    ctx.fillStyle = 'rgba(255,220,150,0.5)';
    for (let i = 0; i < 6; i++) { ell(ctx, x + Math.cos(i) * r * 0.3, y + Math.sin(i * 1.7) * r * 0.25, 0.6, 0.6); ctx.fill(); }
  }

  /**
   * One plant standing on the ground at (x, by).
   * stage: s1 | s2 | s3 | ready ; species: content.species id (hybrids mix their parents)
   */
  ART.plant = function (ctx, species, stage, x, by, s, rnd) {
    s = s || 1;
    rnd = rnd || ART.rng(7);
    ell(ctx, x + 2 * s, by + 0.5 * s, 7 * s, 2.2 * s); ctx.fillStyle = 'rgba(40,20,5,0.28)'; ctx.fill();
    if (stage === 's1') { sprout(ctx, x, by, s); return; }
    const big = stage === 'ready' ? 1 : stage === 's3' ? 0.9 : 0.72;
    switch (species) {
      case 'rice': {
        if (stage === 'ready') {
          blades(ctx, x, by, s, 7, 21 * s, '#e3bb3c', '#cfa22e', true);
          for (let i = 0; i < 3; i++) {
            const hx = x + (i - 1) * 6 * s, hy = by - 18 * s;
            ctx.strokeStyle = '#b8862a'; ctx.lineWidth = 1 * s;
            ctx.beginPath(); ctx.moveTo(hx, hy); ctx.quadraticCurveTo(hx + 4 * s, hy - 3 * s, hx + 6 * s, hy + 3 * s); ctx.stroke();
            for (let k = 0; k < 4; k++) { ell(ctx, hx + 1.5 * s * k + 1, hy - 1 * s + k * 1.1 * s, 1.5 * s, 1 * s, 0.6); fs(ctx, '#ffd95a', '#a8761f', 0.7); }
          }
        } else {
          blades(ctx, x, by, s, stage === 's3' ? 7 : 5, (stage === 's3' ? 19 : 13) * s, stage === 's3' ? '#9fcf4a' : '#69bf48', stage === 's3' ? '#86c043' : '#58ad3c');
        }
        break;
      }
      case 'tomato': case 'pomato': {
        leafBush(ctx, x, by, s, 8.5 * s * big);
        if (stage !== 's2') {
          const ripe = stage === 'ready';
          [[-4.5, -9], [4, -7.5], [0, -13]].forEach(([dx, dy], i) => {
            if (!ripe && i === 2) return;
            fruit(ctx, x + dx * s, by + dy * s, (ripe ? 3.4 : 2.4) * s, ripe ? '#ff7a5c' : '#c8ef8a', ripe ? '#d8302a' : '#7cbf45', true);
          });
        }
        if (species === 'pomato' && stage === 'ready') potatoes(ctx, x, by, s * 0.85);
        break;
      }
      case 'strawberry': case 'rosaberry': {
        const leaves = [[-6, -4, 4.2], [6, -4, 4.2], [0, -7, 4.6], [-2, -2, 3.6], [3, -2, 3.6]];
        cluster(ctx, leaves.map(([dx, dy, r]) => [x + dx * s * big, by + dy * s * big, r * s * big]), LEAF, { lw: 1 });
        if (species === 'rosaberry' && stage !== 's2') rose(ctx, x + 1 * s, by - 11 * s, 3.2 * s, '#ff8fc0');
        if (stage === 's3') { ART.flower(ctx, x - 4 * s, by - 6 * s, 2.6 * s, '#ffffff'); ART.flower(ctx, x + 5 * s, by - 7 * s, 2.4 * s, '#ffffff'); }
        if (stage === 'ready') { berry(ctx, x - 4.5 * s, by - 3.5 * s, 2.8 * s); berry(ctx, x + 5 * s, by - 4 * s, 2.6 * s); }
        break;
      }
      case 'potato': {
        leafBush(ctx, x, by, s, 8 * s * big, ['#4d9a35', '#6cbd47', '#93d866', '#cdf39a']);
        if (stage === 's3') { ART.flower(ctx, x - 3 * s, by - 13 * s, 2 * s, '#e9d8ff', '#ffd23e'); ART.flower(ctx, x + 4 * s, by - 11 * s, 2 * s, '#ffffff', '#ffd23e'); }
        if (stage === 'ready') potatoes(ctx, x, by, s);
        break;
      }
      case 'rose': {
        leafBush(ctx, x, by, s, 8 * s * big, DEEP);
        if (stage === 's3') {
          [[-4, -11], [4, -9]].forEach(([dx, dy]) => { ell(ctx, x + dx * s, by + dy * s, 1.8 * s, 2.6 * s); fs(ctx, '#e8344f', INK, 1); });
        } else if (stage === 'ready') {
          rose(ctx, x - 4 * s, by - 10 * s, 3.6 * s, '#f0304e');
          rose(ctx, x + 4.5 * s, by - 8 * s, 3.3 * s, '#ff4766');
          rose(ctx, x + 0.5 * s, by - 15 * s, 3.2 * s, '#e8284a');
        }
        break;
      }
      case 'sunflower': {
        const hgt = (stage === 'ready' ? 30 : stage === 's3' ? 24 : 15) * s;
        ctx.strokeStyle = INK; ctx.lineWidth = 3.4 * s;
        ctx.beginPath(); ctx.moveTo(x, by); ctx.quadraticCurveTo(x + 1.5 * s, by - hgt * 0.5, x, by - hgt); ctx.stroke();
        ctx.strokeStyle = '#5aa83f'; ctx.lineWidth = 2 * s; ctx.stroke();
        ell(ctx, x - 4.5 * s, by - hgt * 0.42, 4.2 * s, 2.2 * s, -0.4); fs(ctx, '#6cbf4c', INK, 1);
        ell(ctx, x + 4.5 * s, by - hgt * 0.6, 4.2 * s, 2.2 * s, 0.4); fs(ctx, '#7fcf5a', INK, 1);
        if (stage === 'ready') sunflowerHead(ctx, x, by - hgt, 7 * s);
        else if (stage === 's3') { ell(ctx, x, by - hgt, 3.4 * s, 3.4 * s); fs(ctx, '#7cbf45', INK, 1); }
        break;
      }
      default:
        leafBush(ctx, x, by, s, 8 * s * big);
    }
    void rnd;
  };
})();
