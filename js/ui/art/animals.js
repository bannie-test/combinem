/*
 * Art kit · animals: chicken, cow, sheep, goat, geep (sheep × goat), bee and the straw beehive.
 * Each faces right, stands on its own soft shadow and fits the box returned by ART.animalSize().
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const ART = NOA.art;
  const { rr, ell, poly, blob, lin, rad, fs, gloss } = ART;
  const INK = ART.INK;

  const SIZES = { chicken: [34, 30], cow: [52, 40], sheep: [46, 36], goat: [46, 40], geep: [46, 38], bee: [36, 38] };
  ART.animalSize = (sp) => SIZES[sp] || [40, 34];

  function eye(ctx, x, y, r) {
    ell(ctx, x, y, r, r * 1.15); ctx.fillStyle = '#2b1d16'; ctx.fill();
    ell(ctx, x - r * 0.35, y - r * 0.4, r * 0.38, r * 0.38); ctx.fillStyle = '#fff'; ctx.fill();
  }
  function blush(ctx, x, y, r) { ell(ctx, x, y, r, r * 0.6); ctx.fillStyle = 'rgba(255,120,140,0.45)'; ctx.fill(); }
  function leg(ctx, x, y0, y1, w, c) {
    rr(ctx, x - w / 2, y0, w, y1 - y0, w / 2);
    fs(ctx, c, INK, 1.1);
  }

  function chicken(ctx, w, h) {
    const cx = w * 0.46, by = h - 4;
    ART.groundShadow(ctx, cx + 2, by, 11, 3.2);
    // legs
    ctx.strokeStyle = '#e8902a'; ctx.lineWidth = 1.8;
    ctx.beginPath(); ctx.moveTo(cx - 2, by - 7); ctx.lineTo(cx - 3, by); ctx.lineTo(cx - 6, by + 0.5); ctx.moveTo(cx + 3, by - 7); ctx.lineTo(cx + 3, by); ctx.lineTo(cx + 6, by + 0.5); ctx.stroke();
    // tail feathers
    blob(ctx, [[cx - 9, by - 13], [cx - 15, by - 21], [cx - 12, by - 13], [cx - 17, by - 16], [cx - 11, by - 9]], 0.4);
    fs(ctx, '#f4f1ea', INK, 1.3);
    // body
    blob(ctx, [[cx - 11, by - 12], [cx - 4, by - 19], [cx + 6, by - 17], [cx + 10, by - 10], [cx + 5, by - 5], [cx - 6, by - 5]], 0.5);
    fs(ctx, rad(ctx, cx - 3, by - 15, 1, 15, ['#ffffff', '#ece6da']), INK, 1.4);
    // wing
    blob(ctx, [[cx - 6, by - 12], [cx + 1, by - 14], [cx + 3, by - 9], [cx - 3, by - 8]], 0.5);
    fs(ctx, '#e7dfcf', INK, 1.1);
    // head
    ell(ctx, cx + 8, by - 20, 5.6, 5.4); fs(ctx, '#ffffff', INK, 1.3);
    // comb
    blob(ctx, [[cx + 4.5, by - 24], [cx + 6, by - 28], [cx + 8, by - 25.5], [cx + 10, by - 28.5], [cx + 11.2, by - 24]], 0.5);
    fs(ctx, '#ff4b45', INK, 1.1);
    // beak + wattle
    poly(ctx, [[cx + 12.5, by - 21], [cx + 17, by - 19.5], [cx + 12.5, by - 18]]); fs(ctx, '#ffad2e', INK, 1);
    ell(ctx, cx + 12.4, by - 15.6, 1.4, 2); fs(ctx, '#ff4b45', INK, 0.9);
    eye(ctx, cx + 9.5, by - 21, 1.25);
    blush(ctx, cx + 8, by - 17.5, 1.6);
  }

  function cow(ctx, w, h) {
    const cx = w * 0.44, by = h - 4;
    ART.groundShadow(ctx, cx + 3, by, 19, 4);
    // back legs
    leg(ctx, cx - 11, by - 10, by, 4.2, '#d9d2c6');
    leg(ctx, cx + 7, by - 10, by, 4.2, '#d9d2c6');
    // tail
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(cx - 15, by - 19); ctx.quadraticCurveTo(cx - 20, by - 14, cx - 18, by - 8); ctx.stroke();
    ell(ctx, cx - 18, by - 7.5, 1.6, 2.2); fs(ctx, '#3a2a22', null);
    // body
    rr(ctx, cx - 16, by - 24, 30, 16, 8);
    fs(ctx, lin(ctx, 0, by - 24, 0, by - 8, ['#ffffff', '#ebe5da']), INK, 1.5);
    ctx.save(); rr(ctx, cx - 16, by - 24, 30, 16, 8); ctx.clip();
    ctx.fillStyle = '#2f2724';
    blob(ctx, [[cx - 12, by - 25], [cx - 3, by - 24], [cx - 4, by - 17], [cx - 11, by - 15]], 0.5); ctx.fill();
    blob(ctx, [[cx + 4, by - 15], [cx + 11, by - 17], [cx + 13, by - 10], [cx + 5, by - 9]], 0.5); ctx.fill();
    ctx.restore();
    // udder
    ell(ctx, cx + 1, by - 8.2, 3.2, 2); fs(ctx, '#ffb3c1', INK, 1);
    // front legs
    leg(ctx, cx - 7, by - 10, by + 0.5, 4.4, '#ffffff');
    leg(ctx, cx + 10, by - 10, by + 0.5, 4.4, '#ffffff');
    [[cx - 7, by], [cx + 10, by]].forEach(([x, y]) => { rr(ctx, x - 2.4, y - 2, 4.8, 2.6, 1); fs(ctx, '#3a2a22', null); });
    // head
    ell(ctx, cx + 18, by - 26, 2.4, 3.2, 0.5); fs(ctx, '#e8e1d4', INK, 1);     // ear back
    rr(ctx, cx + 12, by - 31, 13, 14, 6);
    fs(ctx, '#ffffff', INK, 1.4);
    ctx.save(); rr(ctx, cx + 12, by - 31, 13, 14, 6); ctx.clip();
    ctx.fillStyle = '#2f2724'; blob(ctx, [[cx + 18, by - 32], [cx + 26, by - 31], [cx + 25, by - 25], [cx + 20, by - 26]], 0.5); ctx.fill();
    ctx.restore();
    // horns
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx + 15, by - 30); ctx.quadraticCurveTo(cx + 13.5, by - 34, cx + 15.5, by - 35); ctx.moveTo(cx + 22, by - 30); ctx.quadraticCurveTo(cx + 23.5, by - 34, cx + 21.5, by - 35); ctx.stroke();
    ctx.strokeStyle = '#f6e7c8'; ctx.lineWidth = 1.6; ctx.stroke();
    // ear front
    ell(ctx, cx + 26, by - 27, 3, 2, -0.4); fs(ctx, '#ffd0d8', INK, 1);
    // muzzle
    ell(ctx, cx + 19.5, by - 19.8, 6, 3.6); fs(ctx, rad(ctx, cx + 18, by - 21, 0.5, 6, ['#ffd3dc', '#f2a4b3']), INK, 1.2);
    ctx.fillStyle = '#9a4b5a'; ell(ctx, cx + 17.5, by - 19.8, 0.9, 1.1); ctx.fill(); ell(ctx, cx + 21.5, by - 19.8, 0.9, 1.1); ctx.fill();
    eye(ctx, cx + 16, by - 26, 1.3);
    eye(ctx, cx + 22, by - 26.4, 1.3);
  }

  function woolBody(ctx, cx, by, color) {
    const pts = [[cx - 14, by - 17, 6.5], [cx - 7, by - 22, 7], [cx + 2, by - 23, 7], [cx + 9, by - 19, 6.5], [cx + 8, by - 11, 6], [cx - 1, by - 10, 7], [cx - 11, by - 10, 6.5], [cx - 3, by - 17, 8]];
    ART.cluster(ctx, pts.map(([x, y, r]) => [x, y, r]), [ART.shade(color, -0.12), color, ART.shade(color, 0.5), '#ffffff'], { lw: 1.4 });
  }
  function sheepHead(ctx, x, y, horns) {
    if (horns) {
      ctx.strokeStyle = INK; ctx.lineWidth = 3.2;
      ctx.beginPath(); ctx.moveTo(x - 1, y - 5); ctx.quadraticCurveTo(x - 7, y - 11, x - 9, y - 4); ctx.stroke();
      ctx.strokeStyle = '#d8c6a0'; ctx.lineWidth = 1.8; ctx.stroke();
    }
    ell(ctx, x - 5, y - 1, 3.4, 1.8, 0.5); fs(ctx, '#4a3c36', INK, 1);
    blob(ctx, [[x - 4, y - 5], [x + 4, y - 6], [x + 7, y + 1], [x + 3, y + 6], [x - 3, y + 4]], 0.5);
    fs(ctx, lin(ctx, x - 4, y - 6, x + 6, y + 6, ['#5d4c45', '#3a2e2a']), INK, 1.3);
    ell(ctx, x + 6, y - 2, 3, 1.7, -0.4); fs(ctx, '#5d4c45', INK, 1);
    eye(ctx, x + 2.5, y - 1, 1.2);
    ctx.fillStyle = '#fff'; ell(ctx, x + 1, y - 5.5, 3.2, 2.2); ctx.fill();  // little wool tuft
  }
  function sheep(ctx, w, h) {
    const cx = w * 0.42, by = h - 4;
    ART.groundShadow(ctx, cx + 3, by, 17, 3.8);
    [cx - 9, cx + 6].forEach((x) => leg(ctx, x, by - 9, by, 3.2, '#4a3c36'));
    woolBody(ctx, cx, by - 2, '#f6f1e6');
    [cx - 5, cx + 9].forEach((x) => leg(ctx, x, by - 7, by + 0.5, 3.4, '#5d4c45'));
    sheepHead(ctx, cx + 15, by - 22, false);
  }
  function goatLike(ctx, w, h, wool) {
    const cx = w * 0.42, by = h - 4;
    ART.groundShadow(ctx, cx + 3, by, 17, 3.8);
    [cx - 10, cx + 6].forEach((x) => leg(ctx, x, by - 10, by, 3.2, '#c9b496'));
    // tail
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(cx - 13, by - 20); ctx.lineTo(cx - 16, by - 25); ctx.stroke();
    ctx.strokeStyle = '#efe5d2'; ctx.lineWidth = 1.6; ctx.stroke();
    if (wool) woolBody(ctx, cx, by - 2, '#f3ece0');
    else {
      rr(ctx, cx - 15, by - 23, 27, 14, 7);
      fs(ctx, lin(ctx, 0, by - 23, 0, by - 9, ['#fbf6ec', '#e3d6bd']), INK, 1.5);
      ctx.save(); rr(ctx, cx - 15, by - 23, 27, 14, 7); ctx.clip();
      ctx.fillStyle = '#c99d6a'; blob(ctx, [[cx - 16, by - 24], [cx - 5, by - 24], [cx - 8, by - 15], [cx - 16, by - 14]], 0.5); ctx.fill();
      ctx.restore();
    }
    [cx - 6, cx + 9].forEach((x) => leg(ctx, x, by - 9, by + 0.5, 3.4, '#efe5d2'));
    // head
    const hx = cx + 15, hy = by - 25;
    ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(hx - 2, hy - 4); ctx.quadraticCurveTo(hx - 7, hy - 12, hx - 12, hy - 8); ctx.stroke();
    ctx.strokeStyle = '#a89070'; ctx.lineWidth = 2; ctx.stroke();
    ell(ctx, hx - 5, hy + 0.5, 3.6, 1.8, 0.6); fs(ctx, '#d8c3a2', INK, 1);
    blob(ctx, [[hx - 4, hy - 5], [hx + 4, hy - 5], [hx + 8, hy + 3], [hx + 4, hy + 7], [hx - 2, hy + 4]], 0.5);
    fs(ctx, lin(ctx, hx - 4, hy - 5, hx + 6, hy + 7, ['#fffaf0', '#e6d8bf']), INK, 1.3);
    // beard
    blob(ctx, [[hx + 2, hy + 5], [hx + 5, hy + 6], [hx + 3, hy + 11]], 0.4); fs(ctx, '#f3ece0', INK, 1);
    ell(ctx, hx + 7, hy + 2.5, 1.6, 1.1); ctx.fillStyle = '#f2a4b3'; ctx.fill();
    eye(ctx, hx + 2.6, hy - 0.5, 1.2);
    blush(ctx, hx + 3, hy + 3, 1.4);
  }
  function bee(ctx, x, y, s) {
    ell(ctx, x - 1 * s, y - 4 * s, 3.2 * s, 2.2 * s, -0.4); ctx.fillStyle = 'rgba(220,245,255,0.85)'; ctx.fill(); ctx.strokeStyle = 'rgba(74,47,34,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
    ell(ctx, x + 2 * s, y - 4.4 * s, 2.8 * s, 1.9 * s, 0.4); ctx.fillStyle = 'rgba(220,245,255,0.85)'; ctx.fill(); ctx.stroke();
    ell(ctx, x, y, 4.2 * s, 3.2 * s); fs(ctx, '#ffd23a', INK, 1.1);
    ctx.save(); ell(ctx, x, y, 4.2 * s, 3.2 * s); ctx.clip();
    ctx.fillStyle = '#3a2a22'; ctx.fillRect(x - 1.6 * s, y - 4 * s, 1.4 * s, 8 * s); ctx.fillRect(x + 1.2 * s, y - 4 * s, 1.4 * s, 8 * s);
    ctx.restore();
    eye(ctx, x + 3 * s, y - 0.6 * s, 0.7 * s);
  }
  ART.bee = bee;
  /** straw skep hive with bees around (the apiary's "animal") */
  function hive(ctx, w, h) {
    const cx = w * 0.5, by = h - 5;
    ART.groundShadow(ctx, cx + 3, by, 13, 3.6);
    rr(ctx, cx - 12, by - 4, 24, 5, 2); fs(ctx, '#b07541', INK, 1.2);   // stand
    blob(ctx, [[cx - 12, by - 4], [cx - 11, by - 16], [cx, by - 26], [cx + 11, by - 16], [cx + 12, by - 4]], 0.45);
    fs(ctx, lin(ctx, cx - 12, by - 26, cx + 12, by - 4, ['#ffd977', '#d99a2e']), INK, 1.5);
    ctx.save();
    blob(ctx, [[cx - 12, by - 4], [cx - 11, by - 16], [cx, by - 26], [cx + 11, by - 16], [cx + 12, by - 4]], 0.45); ctx.clip();
    ctx.strokeStyle = 'rgba(140,85,25,0.55)'; ctx.lineWidth = 1.2;
    for (let i = 1; i < 5; i++) { ctx.beginPath(); ctx.ellipse(cx, by - 4 - i * 4.6, 14, 2.4, 0, 0, Math.PI); ctx.stroke(); }
    ctx.restore();
    ell(ctx, cx, by - 7, 3.2, 2.4); fs(ctx, '#4a2f22', null);
    gloss(ctx, cx - 5, by - 18, 3, 2, 0.45);
    bee(ctx, cx + 10, by - 26, 0.8);
  }

  ART.animal = function (ctx, species, w, h) {
    switch (species) {
      case 'chicken': return chicken(ctx, w, h);
      case 'cow': return cow(ctx, w, h);
      case 'sheep': return sheep(ctx, w, h);
      case 'goat': return goatLike(ctx, w, h, false);
      case 'geep': return goatLike(ctx, w, h, true);
      case 'bee': return hive(ctx, w, h);
      default: return chicken(ctx, w, h);
    }
  };
  /** cached sprite for an animal species */
  ART.animalSprite = function (species) {
    const [w, h] = ART.animalSize(species);
    return ART.sprite('animal:' + species, w, h, (ctx) => ART.animal(ctx, species, w, h));
  };
  ART.beeSprite = () => ART.sprite('bee', 14, 12, (ctx) => bee(ctx, 6, 7, 0.95));
})();
