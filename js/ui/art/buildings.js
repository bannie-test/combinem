/*
 * Art kit · buildings, drawn with the oblique 3/4 projection of ART.box3 (front, top and right
 * side visible, lit from the top-left, soft shadow to the bottom-right).
 *
 *   ART.buildingSize(id) -> { w, h }       sprite box in world px (the map uses the same size)
 *   ART.building(ctx, id, w, h, opts)       paint one building
 *   ART.pen(ctx, penId, w, h, layer)        paddock: layer 'back' (ground, fences, shed) | 'front' (front fence)
 *   ART.windmillBlades / ART.beeShip / ART.signpost
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

(function () {
  'use strict';
  const ART = NOA.art;
  const { rr, ell, poly, blob, lin, rad, fs, gloss, glyph } = ART;
  const INK = ART.INK;
  const sh = ART.shade;

  const SIZES = {
    house: [124, 128], orders: [96, 104], barn: [136, 150], market: [112, 108],
    greenhouse: [124, 128], ranch: [126, 136], shrine: [104, 128], wishtree: [108, 150],
    mill: [104, 172], kitchen: [114, 132], dairy: [112, 128], craft: [110, 128],
    dock: [300, 124],
    coop: [150, 150], cowshed: [150, 150], apiary: [150, 150], sheepfold: [150, 150], goatpen: [150, 150]
  };
  ART.buildingSize = (id) => { const s = SIZES[id] || [110, 120]; return { w: s[0], h: s[1] }; };
  ART.buildingIds = Object.keys(SIZES);

  /* ================================================================ pieces */
  function footprintShadow(ctx, B, w, d, o, extra) {
    const pts = [B.P(-o, 0, -o), B.P(w + o, 0, -o), B.P(w + o, 0, d + o), B.P(-o, 0, d + o)];
    ART.softShadow(ctx, (c) => poly(c, pts), { blur: 7, dx: 9 + (extra || 0), dy: 5, color: 'rgba(38,62,18,0.34)' });
  }
  /** window on the front wall: x, y = top-left in screen space */
  function win(ctx, x, y, w, h, o) {
    o = o || {};
    if (o.shutters) {
      rr(ctx, x - w * 0.42, y - 1, w * 0.4, h + 2, 1.5); fs(ctx, o.shutters, INK, 1.1);
      rr(ctx, x + w * 1.02, y - 1, w * 0.4, h + 2, 1.5); fs(ctx, o.shutters, INK, 1.1);
    }
    rr(ctx, x - 1.6, y - 1.6, w + 3.2, h + 3.2, o.round ? w : 2.5);
    fs(ctx, o.frame || '#fffaf0', INK, 1.3);
    rr(ctx, x, y, w, h, o.round ? w : 1.5);
    fs(ctx, lin(ctx, x, y, x + w, y + h, ['#bfeaff', '#7cc4ea', '#5aa9d6']), null);
    ctx.strokeStyle = o.frame || '#fffaf0'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + h / 2); ctx.lineTo(x + w, y + h / 2); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    poly(ctx, [[x + 1, y + h * 0.55], [x + w * 0.35, y + 1], [x + w * 0.55, y + 1], [x + 1, y + h * 0.85]]); ctx.fill();
    if (o.box) {
      rr(ctx, x - 2.5, y + h + 1, w + 5, 4, 1.5); fs(ctx, '#b07541', INK, 1.1);
      ['#ff6b8e', '#ffd23e', '#ff8fb3', '#ffffff'].forEach((c, i) => { ART.flower(ctx, x + 1 + i * (w / 3.2), y + h + 0.5, 1.9, c); });
    }
  }
  function door(ctx, x, y, w, h, o) {
    o = o || {};
    const c = o.color || '#a8693a';
    rr(ctx, x - 1.6, y - 1.6, w + 3.2, h + 1.6, o.arch ? w / 2 + 1.6 : 2);
    fs(ctx, o.frame || '#fffaf0', INK, 1.2);
    rr(ctx, x, y, w, h, o.arch ? w / 2 : 1.5);
    fs(ctx, lin(ctx, x, y, x + w, y, [sh(c, 0.12), sh(c, -0.12)]), INK, 1.1);
    ctx.strokeStyle = sh(c, -0.35); ctx.lineWidth = 0.9;
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(x + (w * i) / 3, y + (o.arch ? w * 0.35 : 2)); ctx.lineTo(x + (w * i) / 3, y + h - 1); ctx.stroke(); }
    if (o.barn) {
      ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.rect(x + 1.5, y + 1.5, w - 3, h - 3); ctx.moveTo(x + 2, y + 2); ctx.lineTo(x + w - 2, y + h - 2); ctx.moveTo(x + w - 2, y + 2); ctx.lineTo(x + 2, y + h - 2);
      ctx.moveTo(x + w / 2, y + 2); ctx.lineTo(x + w / 2, y + h - 2); ctx.stroke();
    } else {
      ell(ctx, x + w * 0.78, y + h * 0.56, 1.2, 1.2); fs(ctx, '#ffd23e', INK, 0.7);
    }
  }
  function signRound(ctx, x, y, r, ch, ring) {
    ell(ctx, x + 1.5, y + 2, r, r); ctx.fillStyle = 'rgba(40,20,10,0.25)'; ctx.fill();
    ell(ctx, x, y, r, r); fs(ctx, ring || '#e8b77b', INK, 1.4);
    ell(ctx, x, y, r * 0.78, r * 0.78); fs(ctx, '#fffaf0', null);
    glyph(ctx, ch, x, y, r * 1.1);
  }
  function chimney(ctx, B, X, Y, Z, s, smoke) {
    const w = 8 * s, d = 8 * s, hgt = 16 * s;
    const box = (x0, y0, z0, x1, y1, z1, front, side, top) => {
      B.face([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], side);
      B.face([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], front);
      B.face([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], top);
    };
    box(X, Y, Z, X + w, Y + hgt, Z + d, '#c9785a', '#a05a40', '#e09474');
    box(X - 1.2, Y + hgt, Z - 1.2, X + w + 1.2, Y + hgt + 3, Z + d + 1.2, '#8c5a48', '#6d4334', '#a9705a');
    void smoke;
  }
  /** striped awning in front of the wall, from x0 to x1 at screen y (top), dropping to y + h */
  function awning(ctx, x0, x1, y, h, c1, c2) {
    const n = Math.max(3, Math.round((x1 - x0) / 9));
    const sw = (x1 - x0) / n;
    ART.softShadow(ctx, (c) => { c.beginPath(); c.rect(x0, y + h, x1 - x0, 3); }, { blur: 3, dy: 3 });
    for (let i = 0; i < n; i++) {
      const a = x0 + i * sw;
      poly(ctx, [[a + 2, y], [a + sw + 2, y], [a + sw, y + h], [a, y + h]]);
      fs(ctx, i % 2 ? c2 : c1, null);
      // scalloped edge
      ell(ctx, a + sw / 2, y + h, sw / 2, 2.6); ctx.fillStyle = i % 2 ? c2 : c1; ctx.fill();
    }
    poly(ctx, [[x0 + 2, y], [x1 + 2, y], [x1, y + h], [x0, y + h]]);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i < n; i++) ctx.ellipse(x0 + i * sw + sw / 2, y + h, sw / 2, 2.6, 0, 0, Math.PI);
    ctx.stroke();
  }
  function stoneBase(ctx, B, w, d, hgt) {
    B.face([[w, 0, 0], [w, 0, d], [w, hgt, d], [w, hgt, 0]], '#a39a8c');
    B.face([[0, 0, 0], [w, 0, 0], [w, hgt, 0], [0, hgt, 0]], '#c9c0b0');
    const [x0, y0] = B.P(0, hgt, 0), [x1, y1] = B.P(w, 0, 0);
    ctx.strokeStyle = 'rgba(90,75,60,0.45)'; ctx.lineWidth = 0.8;
    for (let x = x0 + 6; x < x1 - 2; x += 9) { ctx.beginPath(); ctx.moveTo(x, y0 + 1); ctx.lineTo(x, y1 - 1); ctx.stroke(); }
  }

  /**
   * Classic house body: box + roof.
   * o: { ox, oy, w, d, hw, hr, over, wall, wallSide, roof, roofStyle:'side'|'front', trim }
   * returns the projector so callers can add details
   */
  function house3(ctx, o) {
    const B = ART.box3(ctx, o.ox, o.oy);
    const { w, d, hw, hr } = o;
    const ov = o.over == null ? 5 : o.over;
    const wall = o.wall || '#fff1d6', side = o.wallSide || sh(wall, -0.2);
    const roof = o.roof || '#e8735a';
    footprintShadow(ctx, B, w, d, ov, hw * 0.25);
    if (o.base) stoneBase(ctx, B, w, d, o.base);
    const b = o.base || 0;
    if (o.roofStyle === 'front') {
      // right side wall
      B.face([[w, b, 0], [w, b, d], [w, hw, d], [w, hw, 0]], lin(ctx, ...B.P(w, hw, 0), ...B.P(w, b, d), [side, sh(side, -0.1)]));
      // front gable wall (pentagon)
      B.face([[0, b, 0], [w, b, 0], [w, hw, 0], [w / 2, hw + hr, 0], [0, hw, 0]], lin(ctx, ...B.P(0, hw + hr, 0), ...B.P(0, b, 0), [sh(wall, 0.15), wall]));
      // roof slopes (left lit, right shaded)
      const L = [[-ov, hw - ov * 0.4, -ov], [w / 2, hw + hr, -ov], [w / 2, hw + hr, d + ov], [-ov, hw - ov * 0.4, d + ov]];
      const R = [[w / 2, hw + hr, -ov], [w + ov, hw - ov * 0.4, -ov], [w + ov, hw - ov * 0.4, d + ov], [w / 2, hw + hr, d + ov]];
      B.face(R, sh(roof, -0.18));
      B.bands(R, 6, 'rgba(60,20,10,0.25)', 1);
      B.face(L, sh(roof, 0.06));
      B.bands(L, 6, 'rgba(60,20,10,0.22)', 1);
      // fascia boards on the gable
      ctx.strokeStyle = INK; ctx.lineWidth = 4.6;
      ctx.beginPath(); ctx.moveTo(...B.P(-ov, hw - ov * 0.4, -ov)); ctx.lineTo(...B.P(w / 2, hw + hr, -ov)); ctx.lineTo(...B.P(w + ov, hw - ov * 0.4, -ov)); ctx.stroke();
      ctx.strokeStyle = o.trim || '#fffaf0'; ctx.lineWidth = 2.6; ctx.stroke();
    } else {
      B.face([[w, b, 0], [w, b, d], [w, hw, d], [w, hw, 0]], side);
      // right gable triangle
      B.face([[w, hw, -0.01], [w, hw, d], [w, hw + hr, d / 2]], sh(side, -0.04));
      // front wall
      B.face([[0, b, 0], [w, b, 0], [w, hw, 0], [0, hw, 0]], lin(ctx, ...B.P(0, hw, 0), ...B.P(0, b, 0), [sh(wall, 0.15), wall]));
      // eave shadow on the wall
      const [ex0, ey0] = B.P(0, hw, 0), [ex1] = B.P(w, hw, 0);
      ctx.fillStyle = 'rgba(60,30,10,0.18)'; ctx.fillRect(ex0, ey0, ex1 - ex0, 4);
      // front slope
      const F = [[-ov, hw - ov * 0.5, -ov], [w + ov, hw - ov * 0.5, -ov], [w + ov, hw + hr, d / 2], [-ov, hw + hr, d / 2]];
      B.face(F, lin(ctx, ...B.P(0, hw + hr, d / 2), ...B.P(0, hw, -ov), [sh(roof, 0.12), sh(roof, -0.05)]));
      B.bands(F, 5, 'rgba(60,20,10,0.22)', 1.1);
      // ridge cap
      ctx.strokeStyle = INK; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(...B.P(-ov, hw + hr, d / 2)); ctx.lineTo(...B.P(w + ov, hw + hr, d / 2)); ctx.stroke();
      ctx.strokeStyle = sh(roof, 0.25); ctx.lineWidth = 2.2; ctx.stroke();
      // eave edge
      ctx.strokeStyle = sh(roof, -0.35); ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(...B.P(-ov, hw - ov * 0.5, -ov)); ctx.lineTo(...B.P(w + ov, hw - ov * 0.5, -ov)); ctx.stroke();
    }
    return B;
  }
  ART.house3 = house3;

  /* ================================================================ buildings */
  const DRAW = {};

  DRAW.house = function (ctx, W, H, o) {
    const B = house3(ctx, { ox: 10, oy: H - 12, w: 80, d: 44, hw: 42, hr: 30, wall: '#fff3dc', roof: o.roof || '#ec6b4f', base: 5 });
    chimney(ctx, B, 56, 52, 14, 1);
    const [dx, dy] = B.P(14, 5, 0);
    door(ctx, dx, dy - 27, 15, 27, { arch: true, color: '#9b5d33' });
    const [wx, wy] = B.P(40, 30, 0);
    win(ctx, wx, wy, 13, 12, { box: true, shutters: '#5aa9d6' });
    const [wx2] = B.P(62, 30, 0);
    win(ctx, wx2, wy, 13, 12, { box: true, shutters: '#5aa9d6' });
    // doormat + lantern
    const [mx, my] = B.P(12, 0, -3);
    rr(ctx, mx, my - 2, 19, 4, 2); fs(ctx, '#d9534f', INK, 1);
    // mailbox
    const [bx, by] = B.P(88, 0, -8);
    rr(ctx, bx - 1, by - 12, 2.6, 12, 1); fs(ctx, '#8b5a33', INK, 1);
    rr(ctx, bx - 5, by - 17, 10, 6.5, 3); fs(ctx, '#4a90d9', INK, 1.1);
    rr(ctx, bx + 3.5, by - 19, 1.4, 4, 0.6); fs(ctx, '#ff4b45', null);
  };

  DRAW.barn = function (ctx, W, H, o) {
    const red = o.roof || '#d44a3a';
    const B = house3(ctx, { ox: 12, oy: H - 12, w: 88, d: 58, hw: 54, hr: 34, wall: red, wallSide: sh(red, -0.22), roof: '#8c5a48', roofStyle: 'front', trim: '#fffaf0', over: 5 });
    // white corner trims
    ctx.strokeStyle = '#fffaf0'; ctx.lineWidth = 2.4;
    [[0, 0], [88, 0]].forEach(([x]) => { ctx.beginPath(); ctx.moveTo(...B.P(x, 0, 0)); ctx.lineTo(...B.P(x, 54, 0)); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(...B.P(0, 54, 0)); ctx.lineTo(...B.P(88, 54, 0)); ctx.stroke();
    // plank lines
    ctx.strokeStyle = 'rgba(90,20,15,0.35)'; ctx.lineWidth = 1;
    for (let x = 8; x < 88; x += 8) { ctx.beginPath(); ctx.moveTo(...B.P(x, 1, 0)); ctx.lineTo(...B.P(x, 53, 0)); ctx.stroke(); }
    // big doors
    const [dx, dy] = B.P(27, 0, 0);
    door(ctx, dx, dy - 36, 34, 36, { barn: true, color: '#b8382c', frame: '#fffaf0' });
    // hay loft
    const [lx, ly] = B.P(35, 66, 0);
    rr(ctx, lx, ly, 18, 14, 2); fs(ctx, '#fffaf0', INK, 1.2);
    rr(ctx, lx + 2, ly + 2, 14, 10, 1.5); fs(ctx, '#6b3a22', null);
    ctx.fillStyle = '#ffd36b';
    for (let i = 0; i < 6; i++) { poly(ctx, [[lx + 2 + i * 2.4, ly + 12], [lx + 3.5 + i * 2.4, ly + 6 + (i % 2) * 2], [lx + 5 + i * 2.4, ly + 12]]); ctx.fill(); }
    // side window
    const [sx, sy] = B.P(88, 36, 26);
    poly(ctx, [[sx, sy], [sx + 6, sy - 7], [sx + 6, sy + 4], [sx, sy + 11]]); fs(ctx, '#fffaf0', INK, 1.1);
    // hay bales
    const [hx, hy] = B.P(92, 0, -10);
    rr(ctx, hx, hy - 10, 16, 10, 3); fs(ctx, lin(ctx, hx, hy - 10, hx, hy, ['#ffe08a', '#e3b04a']), INK, 1.2);
    ctx.strokeStyle = 'rgba(150,100,30,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx + 5, hy - 10); ctx.lineTo(hx + 5, hy); ctx.moveTo(hx + 11, hy - 10); ctx.lineTo(hx + 11, hy); ctx.stroke();
    // weathervane
    const [vx, vy] = B.P(44, 88, 28);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(vx, vy); ctx.lineTo(vx, vy - 12); ctx.stroke();
    poly(ctx, [[vx - 7, vy - 12], [vx + 7, vy - 14], [vx + 4, vy - 9]]); fs(ctx, '#ffd23e', INK, 1);
  };

  DRAW.orders = function (ctx, W, H) {
    const B = ART.box3(ctx, 14, H - 10);
    ART.softShadow(ctx, (c) => poly(c, [B.P(-4, 0, -2), B.P(70, 0, -2), B.P(70, 0, 8), B.P(-4, 0, 8)]), { blur: 5, dx: 8, dy: 4 });
    const postBox = (x) => {
      B.face([[x + 5, 0, 0], [x + 5, 0, 5], [x + 5, 64, 5], [x + 5, 64, 0]], '#8b5a33');
      B.face([[x, 0, 0], [x + 5, 0, 0], [x + 5, 64, 0], [x, 64, 0]], '#b07541');
    };
    postBox(2); postBox(60);
    // board
    B.face([[66, 18, 1], [66, 18, 4], [66, 60, 4], [66, 60, 1]], '#7b4a28');
    B.face([[-2, 18, 1], [66, 18, 1], [66, 60, 1], [-2, 60, 1]], lin(ctx, ...B.P(0, 60, 1), ...B.P(0, 18, 1), ['#d9a066', '#b97b45']));
    ctx.strokeStyle = 'rgba(90,50,20,0.35)'; ctx.lineWidth = 1;
    for (let y = 26; y < 60; y += 8) { ctx.beginPath(); ctx.moveTo(...B.P(0, y, 1)); ctx.lineTo(...B.P(64, y, 1)); ctx.stroke(); }
    // little roof
    B.face([[-6, 62, -4], [70, 62, -4], [70, 70, 6], [-6, 70, 6]], '#c4503f');
    B.bands([[-6, 62, -4], [70, 62, -4], [70, 70, 6], [-6, 70, 6]], 3, 'rgba(60,20,10,0.25)', 1);
    // notes
    const notes = [[4, 50, '#fffaf0', -0.08], [24, 52, '#fff3c4', 0.06], [44, 49, '#e4f6ff', -0.04], [8, 34, '#ffe4ec', 0.05], [30, 35, '#fffaf0', -0.06], [48, 33, '#e8ffd9', 0.08]];
    notes.forEach(([x, y, c, rot]) => {
      const [px, py] = B.P(x, y, 0);
      ctx.save(); ctx.translate(px + 7, py + 6); ctx.rotate(rot);
      rr(ctx, -7, -6, 14, 12, 1); fs(ctx, c, INK, 1);
      ctx.strokeStyle = 'rgba(90,70,60,0.5)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(-4.5, -2); ctx.lineTo(4.5, -2); ctx.moveTo(-4.5, 1); ctx.lineTo(3, 1); ctx.moveTo(-4.5, 4); ctx.lineTo(1, 4); ctx.stroke();
      ell(ctx, 0, -5, 1.3, 1.3); ctx.fillStyle = '#ff4b45'; ctx.fill();
      ctx.restore();
    });
    // crate
    const C = ART.box3(ctx, 70, H - 8);
    C.face([[14, 0, 0], [14, 0, 10], [14, 12, 10], [14, 12, 0]], '#b07541');
    C.face([[0, 0, 0], [14, 0, 0], [14, 12, 0], [0, 12, 0]], '#d9a066');
    C.face([[0, 12, 0], [14, 12, 0], [14, 12, 10], [0, 12, 10]], '#e8b77b');
    ART.glyph(ctx, '🍅', ...C.P(4, 14, 5), 7); ART.glyph(ctx, '🌾', ...C.P(10, 14, 6), 7);
  };

  DRAW.market = function (ctx, W, H, o) {
    const B = ART.box3(ctx, 10, H - 10);
    const w = 78, d = 30;
    footprintShadow(ctx, B, w, d, 4, 4);
    // counter
    B.face([[w, 0, 0], [w, 0, d], [w, 24, d], [w, 24, 0]], '#9a6338');
    B.face([[0, 0, 0], [w, 0, 0], [w, 24, 0], [0, 24, 0]], lin(ctx, ...B.P(0, 24, 0), ...B.P(0, 0, 0), ['#d9a066', '#b97b45']));
    ctx.strokeStyle = 'rgba(90,50,20,0.35)'; ctx.lineWidth = 1;
    for (let x = 10; x < w; x += 10) { ctx.beginPath(); ctx.moveTo(...B.P(x, 1, 0)); ctx.lineTo(...B.P(x, 23, 0)); ctx.stroke(); }
    B.face([[0, 24, 0], [w, 24, 0], [w, 24, d], [0, 24, d]], '#e8b77b');
    // produce baskets on the counter
    [['🍅', 10], ['🌽', 28], ['🍓', 46], ['🥚', 64]].forEach(([g, x]) => {
      const [px, py] = B.P(x, 24, d * 0.4);
      ell(ctx, px + 4, py + 1, 8, 3.4); fs(ctx, '#a8703a', INK, 1);
      ART.glyph(ctx, g, px + 4, py - 3, 10);
    });
    // posts + awning
    [[2, 0], [w - 2, 0]].forEach(([x]) => { B.face([[x - 2, 24, 0], [x + 2, 24, 0], [x + 2, 62, 0], [x - 2, 62, 0]], '#b07541'); });
    const [ax0, ay0] = B.P(-6, 66, -4), [ax1] = B.P(w + 6, 66, -4);
    const back0 = B.P(-6, 74, d), back1 = B.P(w + 6, 74, d);
    poly(ctx, [back0, back1, [ax1 + 2, ay0], [ax0 + 2, ay0]]); fs(ctx, sh(o.roof || '#ff8fa3', -0.1), INK, 1.3);
    awning(ctx, ax0, ax1, ay0, 13, o.roof || '#ff8fa3', '#fffaf0');
    // price sign
    const [sx, sy] = B.P(w - 4, 8, -6);
    rr(ctx, sx - 1, sy - 14, 2, 14, 1); fs(ctx, '#8b5a33', INK, 0.9);
    rr(ctx, sx - 9, sy - 22, 18, 10, 2); fs(ctx, '#fffaf0', INK, 1.1);
    ART.glyph(ctx, '🪙', sx, sy - 17, 7);
  };

  DRAW.greenhouse = function (ctx, W, H) {
    const B = ART.box3(ctx, 10, H - 12);
    const w = 82, d = 50, hw = 36, hr = 26;
    footprintShadow(ctx, B, w, d, 4, 6);
    stoneBase(ctx, B, w, d, 6);
    // plants inside (back first)
    const rnd = ART.rng(42);
    for (let i = 0; i < 7; i++) {
      const [px, py] = B.P(8 + i * 11, 6, 10 + (i % 3) * 10);
      ART.cluster(ctx, [[px, py - 6, 6 + rnd() * 2], [px + 5, py - 3, 5]], ['#3f8f37', '#5bb447', '#80cc59', null], { lw: 1 });
      if (i % 2) ART.flower(ctx, px + 2, py - 9, 2.4, i % 4 === 1 ? '#ff6b8e' : '#ffd23e');
    }
    const glassF = 'rgba(190,235,255,0.42)', glassS = 'rgba(150,205,235,0.5)';
    // side glass + frame
    B.face([[w, 6, 0], [w, 6, d], [w, hw, d], [w, hw, 0]], glassS);
    B.face([[w, hw, 0], [w, hw, d], [w, hw + hr, d / 2]], glassS);
    // front glass
    B.face([[0, 6, 0], [w, 6, 0], [w, hw, 0], [0, hw, 0]], glassF);
    // roof glass
    const F = [[-3, hw - 1, -3], [w + 3, hw - 1, -3], [w + 3, hw + hr, d / 2], [-3, hw + hr, d / 2]];
    B.face(F, 'rgba(210,245,255,0.55)');
    // white frames
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += w / 5) {
      ctx.beginPath(); ctx.moveTo(...B.P(x, 6, 0)); ctx.lineTo(...B.P(x, hw, 0)); ctx.lineTo(...B.P(x, hw + hr, d / 2)); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(...B.P(0, hw, 0)); ctx.lineTo(...B.P(w, hw, 0)); ctx.lineTo(...B.P(w, hw, d)); ctx.moveTo(...B.P(w, hw, 0)); ctx.lineTo(...B.P(w, hw + hr, d / 2)); ctx.lineTo(...B.P(w, hw, d)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(...B.P(-3, hw + hr, d / 2)); ctx.lineTo(...B.P(w + 3, hw + hr, d / 2)); ctx.stroke();
    ctx.strokeStyle = INK; ctx.lineWidth = 1.2;
    B.poly([[0, 6, 0], [w, 6, 0], [w, 6, d], [w, hw, d], [w, hw + hr, d / 2], [-3, hw + hr, d / 2], [-3, hw - 1, -3], [0, hw, 0]]); ctx.stroke();
    // reflections
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    poly(ctx, [B.P(6, 30, 0), B.P(16, 34, 0), B.P(9, 10, 0), B.P(5, 8, 0)]); ctx.fill();
    poly(ctx, [B.P(10, hw + 4, 2), B.P(30, hw + 4, 2), B.P(32, hw + 16, 14), B.P(14, hw + 16, 14)]); ctx.fill();
    // door
    const [dx, dy] = B.P(34, 6, 0);
    rr(ctx, dx, dy - 24, 14, 24, 2); fs(ctx, 'rgba(255,255,255,0.35)', '#ffffff', 2);
    ell(ctx, dx + 11, dy - 12, 1, 1); ctx.fillStyle = '#ffd23e'; ctx.fill();
    // sign
    const [sx, sy] = B.P(w - 6, hw + 8, -2);
    signRound(ctx, sx, sy, 9, '🌱');
  };

  DRAW.ranch = function (ctx, W, H, o) {
    const B = house3(ctx, { ox: 12, oy: H - 12, w: 84, d: 50, hw: 46, hr: 30, wall: '#fbe7c6', roof: o.roof || '#c4503f', roofStyle: 'front', over: 5, base: 5 });
    // timber frame
    ctx.strokeStyle = '#8b5a33'; ctx.lineWidth = 2.6;
    [[0], [42], [84]].forEach(([x]) => { ctx.beginPath(); ctx.moveTo(...B.P(x, 5, 0)); ctx.lineTo(...B.P(x, 46, 0)); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(...B.P(0, 46, 0)); ctx.lineTo(...B.P(84, 46, 0)); ctx.moveTo(...B.P(0, 26, 0)); ctx.lineTo(...B.P(84, 26, 0)); ctx.stroke();
    const [dx, dy] = B.P(10, 5, 0);
    door(ctx, dx, dy - 21, 24, 21, { barn: true, color: '#a8693a' });
    const [wx, wy] = B.P(54, 40, 0);
    win(ctx, wx, wy, 13, 11, { frame: '#fffaf0' });
    // round window with the paw sign
    const [rx, ry] = B.P(42, 62, 0);
    signRound(ctx, rx, ry, 10, '🐾', '#fffaf0');
    // little satellite dish for the "research"
    const [sx, sy] = B.P(80, 72, 30);
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + 3, sy - 8); ctx.stroke();
    ell(ctx, sx + 4, sy - 11, 7, 4, -0.5); fs(ctx, '#e9eef5', INK, 1.2);
    ell(ctx, sx + 4, sy - 11, 1.4, 1.4); ctx.fillStyle = '#ff4b45'; ctx.fill();
    // water trough
    const T = ART.box3(ctx, 96, H - 10);
    T.face([[18, 0, 0], [18, 0, 8], [18, 7, 8], [18, 7, 0]], '#8b5a33');
    T.face([[0, 0, 0], [18, 0, 0], [18, 7, 0], [0, 7, 0]], '#b07541');
    T.face([[1, 7, 1], [17, 7, 1], [17, 7, 7], [1, 7, 7]], '#6cc6ec');
  };

  DRAW.shrine = function (ctx, W, H) {
    const B = ART.box3(ctx, 14, H - 12);
    const w = 66, d = 40;
    footprintShadow(ctx, B, w, d, 6, 4);
    // stone platform with steps
    B.face([[w + 4, 0, -4], [w + 4, 0, d + 4], [w + 4, 8, d + 4], [w + 4, 8, -4]], '#9f978a');
    B.face([[-4, 0, -4], [w + 4, 0, -4], [w + 4, 8, -4], [-4, 8, -4]], '#cfc7b8');
    B.face([[-4, 8, -4], [w + 4, 8, -4], [w + 4, 8, d + 4], [-4, 8, d + 4]], '#e3dccf');
    B.face([[22, 0, -10], [44, 0, -10], [44, 4, -10], [22, 4, -10]], '#cfc7b8');
    B.face([[22, 4, -10], [44, 4, -10], [44, 4, -4], [22, 4, -4]], '#e3dccf');
    // walls
    B.face([[w, 8, 0], [w, 8, d], [w, 38, d], [w, 38, 0]], '#d9a43a');
    B.face([[0, 8, 0], [w, 8, 0], [w, 38, 0], [0, 38, 0]], lin(ctx, ...B.P(0, 38, 0), ...B.P(0, 8, 0), ['#ffd76a', '#f0b43c']));
    // red pillars
    [2, 22, 44, 64].forEach((x) => { B.face([[x - 2.4, 8, -1], [x + 2.4, 8, -1], [x + 2.4, 40, -1], [x - 2.4, 40, -1]], '#d8392b'); });
    // doorway
    const [dx, dy] = B.P(25, 8, 0);
    rr(ctx, dx, dy - 22, 16, 22, 3); fs(ctx, '#6b2a1c', INK, 1.1);
    ell(ctx, dx + 8, dy - 13, 4, 4); ctx.fillStyle = 'rgba(255,210,90,0.7)'; ctx.fill();
    // curved roof with upturned eaves (two tiers)
    const roofTier = (y0, y1, ov, col) => {
      const a = B.P(-ov, y0, -ov), b = B.P(w + ov, y0, -ov), c = B.P(w + ov, y1, d / 2), e = B.P(-ov, y1, d / 2);
      ctx.beginPath();
      ctx.moveTo(a[0] - 5, a[1] - 7);
      ctx.quadraticCurveTo(a[0] + 4, a[1] + 1, a[0] + 12, a[1]);
      ctx.lineTo(b[0] - 12, b[1]);
      ctx.quadraticCurveTo(b[0] - 4, b[1] + 1, b[0] + 5, b[1] - 7);
      ctx.lineTo(c[0], c[1]);
      ctx.lineTo(e[0], e[1]);
      ctx.closePath();
      fs(ctx, lin(ctx, 0, e[1], 0, a[1], [sh(col, 0.15), col]), INK, 1.4);
      ctx.strokeStyle = 'rgba(0,30,25,0.3)'; ctx.lineWidth = 1;
      for (let i = 1; i < 8; i++) { const t = i / 8; ctx.beginPath(); ctx.moveTo(a[0] + (b[0] - a[0]) * t, a[1]); ctx.lineTo(e[0] + (c[0] - e[0]) * t, e[1]); ctx.stroke(); }
    };
    roofTier(38, 54, 8, '#2f7d74');
    roofTier(56, 66, 2, '#2a6e66');
    // ridge ornament (stylised dragons / pearl)
    const [rx, ry] = B.P(w / 2, 67, d / 2);
    ctx.strokeStyle = INK; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(rx - 26, ry); ctx.quadraticCurveTo(rx - 30, ry - 7, rx - 24, ry - 8); ctx.moveTo(rx + 26, ry); ctx.quadraticCurveTo(rx + 30, ry - 7, rx + 24, ry - 8); ctx.stroke();
    ctx.strokeStyle = '#ffcf3a'; ctx.lineWidth = 2; ctx.stroke();
    ell(ctx, rx, ry - 4, 4, 4); fs(ctx, rad(ctx, rx - 1, ry - 5, 0.5, 4, ['#fff6b0', '#ffb21f']), INK, 1.2);
    // lanterns
    [[-6, 30], [w + 6, 30]].forEach(([x, y]) => {
      const [lx, ly] = B.P(x, y, -6);
      ctx.strokeStyle = INK; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(lx, ly - 6); ctx.lineTo(lx, ly - 2); ctx.stroke();
      ell(ctx, lx, ly + 3, 4, 5); fs(ctx, rad(ctx, lx - 1, ly + 2, 0.5, 5, ['#ff8a5c', '#d8392b']), INK, 1.1);
      ctx.fillStyle = '#ffcf3a'; ctx.fillRect(lx - 3, ly - 2.4, 6, 1.4); ctx.fillRect(lx - 3, ly + 7.4, 6, 1.4);
    });
    // incense bowl
    const [ix, iy] = B.P(33, 8, -16);
    ell(ctx, ix, iy, 7, 3.2); fs(ctx, '#7a6a55', INK, 1.1);
    ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 1;
    [-2, 0, 2].forEach((x) => { ctx.beginPath(); ctx.moveTo(ix + x, iy - 1); ctx.lineTo(ix + x * 1.3, iy - 9); ctx.stroke(); });
  };

  DRAW.wishtree = function (ctx, W, H) {
    const cx = W / 2 - 4, by = H - 14;
    const rnd = ART.rng(9);
    // stone ring
    ell(ctx, cx + 4, by + 2, 34, 10); ctx.fillStyle = 'rgba(38,62,18,0.25)'; ctx.fill();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      ell(ctx, cx + Math.cos(a) * 26, by + Math.sin(a) * 7 - 2, 5, 3.4); fs(ctx, i % 2 ? '#d9d4cb' : '#c4beb4', INK, 0.9);
    }
    ART.groundShadow(ctx, cx + 16, by, 30, 8);
    // trunk
    blob(ctx, [[cx - 9, by], [cx - 6, by - 36], [cx - 12, by - 54], [cx, by - 46], [cx + 12, by - 56], [cx + 6, by - 34], [cx + 10, by]], 0.35);
    fs(ctx, lin(ctx, cx - 10, 0, cx + 10, 0, ['#9a6338', '#6e4024']), INK, 1.5);
    // canopy
    const r = 24;
    const top = by - 86;
    ART.cluster(ctx, [
      [cx - 30, top + 22, 18], [cx + 30, top + 22, 18], [cx - 16, top + 4, 21], [cx + 16, top + 2, 21], [cx, top + 26, 22], [cx, top - 10, 18]
    ], ['#3f8f37', '#5bb447', '#80cc59', '#c7f08e']);
    // pink blossoms
    for (let i = 0; i < 9; i++) ART.flower(ctx, cx + (rnd() - 0.5) * 70, top + rnd() * 40 - 8, 2.8, rnd() < 0.5 ? '#ffd1e3' : '#ffffff', '#ff8fb3');
    // red ribbons + wishes
    for (let i = 0; i < 7; i++) {
      const x = cx - 32 + i * 10.5 + (rnd() - 0.5) * 3, y = top + 30 + (i % 2) * 6;
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y + 9, x - 1, y + 16); ctx.stroke();
      ctx.strokeStyle = '#e8344f'; ctx.lineWidth = 1.8; ctx.stroke();
      if (i % 2 === 0) { rr(ctx, x - 3, y + 14, 6, 8, 1); fs(ctx, '#fff3c4', INK, 0.9); }
    }
    // hanging lanterns
    [[cx - 20, top + 36], [cx + 22, top + 34]].forEach(([x, y]) => {
      ell(ctx, x, y + 5, 3.6, 4.6); fs(ctx, rad(ctx, x - 1, y + 4, 0.5, 4.5, ['#ffe08a', '#ff9d2e']), INK, 1);
    });
    void r;
  };

  /* ------------------------------------------------------------ workshops */
  DRAW.mill = function (ctx, W, H) {
    const cx = 44, by = H - 12;
    const B = ART.box3(ctx, cx - 26, by);
    ART.softShadow(ctx, (c) => poly(c, [B.P(-4, 0, -4), B.P(56, 0, -4), B.P(56, 0, 40), B.P(-4, 0, 40)]), { blur: 8, dx: 16, dy: 6 });
    // tapered tower: front face trapezoid + right face
    const base = 52, topw = 34, hgt = 92, d = 34;
    const ins = (base - topw) / 2;
    B.face([[base, 0, 0], [base, 0, d], [base - ins, hgt, d - ins * 0.6], [base - ins, hgt, ins * 0.4]], lin(ctx, ...B.P(base, hgt, 0), ...B.P(base, 0, d), ['#b9a586', '#93805f']));
    B.face([[0, 0, 0], [base, 0, 0], [base - ins, hgt, ins * 0.4], [ins, hgt, ins * 0.4]], lin(ctx, ...B.P(0, hgt, 0), ...B.P(0, 0, 0), ['#f3e6cc', '#dccbab']));
    // stones
    const rnd = ART.rng(3);
    ctx.save(); B.poly([[0, 0, 0], [base, 0, 0], [base - ins, hgt, ins * 0.4], [ins, hgt, ins * 0.4]]); ctx.clip();
    for (let y = 4; y < hgt; y += 9) {
      for (let x = (y / 9) % 2 ? 0 : 6; x < base; x += 12) {
        const [px, py] = B.P(x, y, 0);
        rr(ctx, px, py - 7, 10 + rnd() * 2, 7, 2.5);
        ctx.strokeStyle = 'rgba(120,100,70,0.35)'; ctx.lineWidth = 0.9; ctx.stroke();
      }
    }
    ctx.restore();
    // door + windows
    const [dx, dy] = B.P(17, 0, 0);
    door(ctx, dx, dy - 22, 17, 22, { arch: true, color: '#8b5a33' });
    const [wx, wy] = B.P(21, 48, 2);
    win(ctx, wx, wy, 10, 11, { round: true });
    // cone roof
    const [rx0, ry0] = B.P(ins - 5, hgt, ins * 0.4 - 3), [rx1] = B.P(base - ins + 5, hgt, ins * 0.4 - 3);
    const [apx, apy] = B.P(base / 2, hgt + 38, d / 2);
    const [sx1, sy1] = B.P(base - ins + 5, hgt, d - ins * 0.6 + 3);
    poly(ctx, [[rx1, ry0], [sx1, sy1], [apx, apy]]); fs(ctx, '#8c3a2c', INK, 1.4);
    poly(ctx, [[rx0, ry0], [rx1, ry0], [apx, apy]]); fs(ctx, lin(ctx, rx0, apy, rx1, ry0, ['#e9634e', '#b8402f']), INK, 1.4);
    ctx.strokeStyle = 'rgba(60,15,10,0.3)'; ctx.lineWidth = 1;
    for (let i = 1; i < 5; i++) { const t = i / 5; ctx.beginPath(); ctx.moveTo(rx0 + (apx - rx0) * t, ry0 + (apy - ry0) * t); ctx.lineTo(rx1 + (apx - rx1) * t, ry0 + (apy - ry0) * t); ctx.stroke(); }
    // hub (blades are a separate rotating sprite)
    const [hx, hy] = B.P(base / 2, hgt - 4, -6);
    ell(ctx, hx, hy, 5, 5); fs(ctx, '#6b4024', INK, 1.4);
    // flour sacks
    const [fx, fy] = B.P(56, 0, -6);
    [[0, 0], [9, 2]].forEach(([ox, oy]) => { blob(ctx, [[fx + ox - 5, fy + oy], [fx + ox - 4, fy + oy - 9], [fx + ox, fy + oy - 11], [fx + ox + 4, fy + oy - 9], [fx + ox + 5, fy + oy]], 0.5); fs(ctx, '#f3ead6', INK, 1.1); });
    ART.glyph(ctx, '🍚', fx + 4, fy - 4, 7);
  };
  /** the windmill's sails, drawn around the sprite centre (rotated by CSS) */
  ART.windmillBlades = function (ctx, size) {
    const c = size / 2;
    for (let i = 0; i < 4; i++) {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate((i * Math.PI) / 2);
      rr(ctx, -1.6, -c + 2, 3.2, c - 4, 1.5); fs(ctx, '#8b5a33', INK, 1.1);
      rr(ctx, 1.6, -c + 3, 9, c - 9, 1.5); fs(ctx, 'rgba(255,250,240,0.95)', INK, 1.2);
      ctx.strokeStyle = 'rgba(139,90,51,0.7)'; ctx.lineWidth = 0.9;
      for (let y = -c + 8; y < -6; y += 6) { ctx.beginPath(); ctx.moveTo(1.6, y); ctx.lineTo(10.6, y); ctx.stroke(); }
      ctx.beginPath(); ctx.moveTo(6.1, -c + 3); ctx.lineTo(6.1, -7); ctx.stroke();
      ctx.restore();
    }
    ell(ctx, c, c, 5.5, 5.5); fs(ctx, '#e8b77b', INK, 1.4);
    ell(ctx, c, c, 2, 2); fs(ctx, '#6b4024', null);
  };

  DRAW.kitchen = function (ctx, W, H, o) {
    const B = house3(ctx, { ox: 10, oy: H - 12, w: 80, d: 46, hw: 44, hr: 28, wall: '#fff0d4', roof: o.roof || '#ef8a3c', base: 5 });
    chimney(ctx, B, 60, 54, 16, 1.05);
    const [dx, dy] = B.P(10, 5, 0);
    door(ctx, dx, dy - 26, 16, 26, { color: '#b5652f' });
    const [wx, wy] = B.P(36, 30, 0);
    win(ctx, wx, wy, 30, 14, {});
    awning(ctx, wx - 4, wx + 34, wy - 8, 9, '#ef8a3c', '#fffaf0');
    // bread on the window sill
    ART.glyph(ctx, '🥐', wx + 7, wy + 16, 7);
    ART.glyph(ctx, '🍰', wx + 22, wy + 16, 7);
    const [sx, sy] = B.P(40, 58, -2);
    signRound(ctx, sx, sy, 9, '🍳');
    // table with jars
    const T = ART.box3(ctx, 94, H - 8);
    T.face([[12, 0, 0], [12, 0, 8], [12, 10, 8], [12, 10, 0]], '#8b5a33');
    T.face([[0, 0, 0], [12, 0, 0], [12, 10, 0], [0, 10, 0]], '#b07541');
    T.face([[0, 10, 0], [12, 10, 0], [12, 10, 8], [0, 10, 8]], '#d9a066');
    ART.glyph(ctx, '🥫', ...T.P(5, 15, 4), 8);
  };

  DRAW.dairy = function (ctx, W, H, o) {
    const B = house3(ctx, { ox: 10, oy: H - 12, w: 78, d: 50, hw: 44, hr: 28, wall: '#ffffff', wallSide: '#d9e6ef', roof: o.roof || '#4fb0d8', roofStyle: 'front', over: 5, base: 5, trim: '#ffffff' });
    // blue band
    const [bx0, by0] = B.P(0, 22, 0), [bx1] = B.P(78, 22, 0);
    ctx.fillStyle = '#bfe3f5'; ctx.fillRect(bx0, by0, bx1 - bx0, 4);
    const [dx, dy] = B.P(30, 5, 0);
    door(ctx, dx, dy - 24, 18, 24, { color: '#4f8fc4' });
    const [wx, wy] = B.P(6, 36, 0);
    win(ctx, wx, wy, 12, 11, {});
    const [wx2] = B.P(58, 36, 0);
    win(ctx, wx2, wy, 12, 11, {});
    const [sx, sy] = B.P(39, 54, 0);
    signRound(ctx, sx, sy, 9, '🧀', '#bfe3f5');
    // milk cans
    const [mx, my] = B.P(84, 0, -8);
    [[0, 0], [9, 2]].forEach(([ox, oy]) => {
      rr(ctx, mx + ox - 4, my + oy - 13, 8, 13, 2.5); fs(ctx, lin(ctx, mx + ox - 4, 0, mx + ox + 4, 0, ['#f2f6fa', '#b9c6d2']), INK, 1.1);
      rr(ctx, mx + ox - 2.5, my + oy - 16, 5, 3.5, 1); fs(ctx, '#d4dde6', INK, 1);
    });
  };

  DRAW.craft = function (ctx, W, H, o) {
    const B = house3(ctx, { ox: 10, oy: H - 12, w: 76, d: 46, hw: 44, hr: 30, wall: '#f6e6ff', wallSide: '#d6c0e6', roof: o.roof || '#a77bd6', base: 5 });
    // wood planks on the wall
    ctx.strokeStyle = 'rgba(120,80,150,0.25)'; ctx.lineWidth = 1;
    for (let y = 12; y < 44; y += 6) { ctx.beginPath(); ctx.moveTo(...B.P(0, y, 0)); ctx.lineTo(...B.P(76, y, 0)); ctx.stroke(); }
    const [dx, dy] = B.P(46, 5, 0);
    door(ctx, dx, dy - 26, 22, 26, { barn: true, color: '#8f5fbf', frame: '#fffaf0' });
    const [wx, wy] = B.P(10, 32, 0);
    win(ctx, wx, wy, 14, 12, { box: true });
    const [sx, sy] = B.P(38, 60, -2);
    signRound(ctx, sx, sy, 9, '🧵', '#e9d4ff');
    // yarn basket
    const [yx, yy] = B.P(86, 0, -8);
    ell(ctx, yx, yy - 4, 9, 5); fs(ctx, '#b07541', INK, 1.1);
    [['#ff6b8e', -4], ['#56c1ff', 2], ['#ffd23e', 7]].forEach(([c, ox]) => { ell(ctx, yx + ox - 1, yy - 8, 3.6, 3.6); fs(ctx, c, INK, 1); });
  };

  /* ------------------------------------------------------------ bee-ship dock */
  DRAW.dock = function (ctx, W, H) {
    const cx = W / 2 - 10, cy = H / 2 + 8;
    ART.softShadow(ctx, (c) => ell(c, cx, cy + 6, 104, 34), { blur: 8, dx: 6, dy: 6 });
    // pad: side then top
    ell(ctx, cx, cy + 6, 104, 34); fs(ctx, '#9aa3b1', INK, 1.5);
    ell(ctx, cx, cy, 104, 34); fs(ctx, rad(ctx, cx - 30, cy - 12, 4, 120, ['#f2f4f7', '#cfd5df']), INK, 1.5);
    // hazard ring
    ctx.save(); ell(ctx, cx, cy, 96, 30); ell(ctx, cx, cy, 86, 26); ctx.clip('evenodd');
    for (let i = 0; i < 28; i++) {
      const a = (i / 28) * Math.PI * 2;
      ctx.fillStyle = i % 2 ? '#ffcf3a' : '#3a2a22';
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 120, a, a + Math.PI / 14); ctx.closePath();
      ctx.save(); ctx.scale(1, 1); ctx.fill(); ctx.restore();
    }
    ctx.restore();
    ell(ctx, cx, cy, 96, 30); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.stroke();
    ell(ctx, cx, cy, 86, 26); ctx.stroke();
    // landing lights
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      ell(ctx, cx + Math.cos(a) * 100, cy + Math.sin(a) * 32, 2.2, 1.6); fs(ctx, i % 2 ? '#7dff9a' : '#fff6b0', INK, 0.8);
    }
    // painted bee mark
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, 0.33);
    ctx.globalAlpha = 0.22; ART.bee(ctx, 0, 0, 8); ctx.restore();
  };
  /** the golden bee-ship (drawn when docked) */
  ART.beeShip = function (ctx, W, H) {
    const cx = W / 2, cy = H / 2 + 6;
    ART.groundShadow(ctx, cx + 10, cy + 30, 40, 9);
    // legs
    ctx.strokeStyle = INK; ctx.lineWidth = 3;
    [[-18, 1], [18, 1]].forEach(([dx]) => { ctx.beginPath(); ctx.moveTo(cx + dx * 0.7, cy + 12); ctx.lineTo(cx + dx, cy + 28); ctx.lineTo(cx + dx * 1.25, cy + 28); ctx.stroke(); });
    // wings
    [[-1, -20], [1, -20]].forEach(([s]) => {
      ell(ctx, cx + s * 16, cy - 20, 22, 11, s * -0.5); ctx.fillStyle = 'rgba(215,245,255,0.85)'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.strokeStyle = 'rgba(120,170,200,0.7)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx + s * 4, cy - 14); ctx.quadraticCurveTo(cx + s * 18, cy - 24, cx + s * 34, cy - 24); ctx.stroke();
    });
    // body
    ell(ctx, cx, cy, 36, 22); fs(ctx, rad(ctx, cx - 12, cy - 10, 3, 40, ['#ffe680', '#ffbf1f']), INK, 1.8);
    ctx.save(); ell(ctx, cx, cy, 36, 22); ctx.clip();
    ctx.fillStyle = '#3a2a22';
    [-14, 0, 14].forEach((x) => { ctx.beginPath(); ctx.ellipse(cx + x, cy, 4.5, 26, 0.15, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    gloss(ctx, cx - 16, cy - 10, 9, 4.5, 0.6);
    // cockpit dome
    ell(ctx, cx + 18, cy - 12, 12, 9); fs(ctx, rad(ctx, cx + 14, cy - 16, 1, 13, ['#e8fbff', '#7cc4ea']), INK, 1.4);
    gloss(ctx, cx + 14, cy - 15, 4, 2.4, 0.8);
    // antennae
    ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(cx + 26, cy - 18); ctx.quadraticCurveTo(cx + 32, cy - 30, cx + 38, cy - 30); ctx.moveTo(cx + 22, cy - 19); ctx.quadraticCurveTo(cx + 24, cy - 32, cx + 30, cy - 35); ctx.stroke();
    ell(ctx, cx + 38, cy - 30, 2.4, 2.4); fs(ctx, '#ff6b8e', INK, 1);
    ell(ctx, cx + 30, cy - 35, 2.4, 2.4); fs(ctx, '#ff6b8e', INK, 1);
    // stinger thruster
    poly(ctx, [[cx - 35, cy - 4], [cx - 46, cy], [cx - 35, cy + 4]]); fs(ctx, '#7a5a3a', INK, 1.2);
    // porthole
    ell(ctx, cx - 4, cy + 6, 4.5, 4.5); fs(ctx, '#bfeaff', INK, 1.3);
  };

  /* ------------------------------------------------------------ zone signpost */
  ART.signpost = function (ctx, W, H) {
    const px = 12, by = H - 4;
    ART.groundShadow(ctx, px + 6, by, 8, 2.4);
    rr(ctx, px - 2, by - 26, 4.4, 26, 1.6); fs(ctx, lin(ctx, px - 2, 0, px + 2, 0, ['#c88a52', '#9a6338']), INK, 1.2);
    rr(ctx, 2, 2, W - 6, H - 22, 5);
    fs(ctx, lin(ctx, 0, 2, 0, H - 20, ['#f6cf8c', '#dca561']), INK, 1.5);
    ctx.strokeStyle = 'rgba(150,95,40,0.35)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(6, (H - 18) / 2 + 2); ctx.lineTo(W - 8, (H - 18) / 2 + 2); ctx.stroke();
    [6, W - 8].forEach((x) => { ell(ctx, x, 7, 1.2, 1.2); ctx.fillStyle = '#8b5a33'; ctx.fill(); });
  };

  /* ================================================================ pens (paddocks) */
  const PEN = {
    coop:      { ground: ['#c9e59a', '#b2d683'], shed: 'coop', fence: true, deco: 'hay' },
    cowshed:   { ground: ['#c3e491', '#a9d277'], shed: 'barnlet', fence: true, deco: 'trough' },
    apiary:    { ground: ['#d6eca6', '#bfe08f'], shed: null, fence: true, deco: 'flowers' },
    sheepfold: { ground: ['#c9e8a0', '#b0d888'], shed: 'shelter', fence: true, deco: 'hay' },
    goatpen:   { ground: ['#d9dfa2', '#c4cd8a'], shed: 'hut', fence: true, deco: 'rocks' }
  };
  /** inner yard rectangle of a pen sprite (where animals walk) */
  ART.penYard = (w, h) => ({ x: 14, y: 52, w: w - 30, h: h - 74 });
  function shedBox(ctx, kind, roof, x0, by) {
    if (kind === 'coop') {
      const B = house3(ctx, { ox: x0, oy: by, w: 40, d: 22, hw: 22, hr: 16, wall: '#f6d7a7', roof: roof || '#e86a4f', roofStyle: 'front', over: 3, base: 6 });
      ctx.strokeStyle = 'rgba(120,70,30,0.35)'; ctx.lineWidth = 1;
      for (let x = 6; x < 40; x += 6) { ctx.beginPath(); ctx.moveTo(...B.P(x, 6, 0)); ctx.lineTo(...B.P(x, 22, 0)); ctx.stroke(); }
      const [dx, dy] = B.P(14, 6, 0);
      rr(ctx, dx, dy - 11, 11, 11, 4); fs(ctx, '#5a3420', INK, 1.1);
      // ramp
      poly(ctx, [B.P(13, 6, 0), B.P(26, 6, 0), B.P(28, 0, -12), B.P(11, 0, -12)]); fs(ctx, '#c88a52', INK, 1.1);
      return;
    }
    if (kind === 'barnlet') {
      const B = house3(ctx, { ox: x0, oy: by, w: 46, d: 26, hw: 26, hr: 18, wall: roof || '#c9453a', wallSide: sh(roof || '#c9453a', -0.22), roof: '#7d4c3e', roofStyle: 'front', over: 3, trim: '#fffaf0' });
      const [dx, dy] = B.P(13, 0, 0);
      door(ctx, dx, dy - 17, 20, 17, { barn: true, color: '#a8382c', frame: '#fffaf0' });
      return;
    }
    if (kind === 'shelter') {
      const B = ART.box3(ctx, x0, by);
      [[0, 0], [44, 0], [0, 22], [44, 22]].forEach(([x, z]) => B.face([[x, 0, z], [x + 3, 0, z], [x + 3, 26, z], [x, 26, z]], '#b07541'));
      B.face([[0, 4, 22], [46, 4, 22], [46, 26, 22], [0, 26, 22]], '#9a6338');
      ctx.fillStyle = '#ffd77a';
      for (let i = 0; i < 6; i++) { const [hx, hy] = B.P(4 + i * 7, 0, 14); ell(ctx, hx, hy - 3, 6, 4); ctx.fill(); }
      const F = [[-4, 24, -4], [50, 24, -4], [50, 34, 13], [-4, 34, 13]];
      B.face([[-4, 34, 13], [50, 34, 13], [50, 26, 28], [-4, 26, 28]], sh(roof || '#9b7bd1', -0.2));
      B.face(F, sh(roof || '#9b7bd1', 0.05));
      B.bands(F, 4, 'rgba(40,20,60,0.25)', 1);
      return;
    }
    if (kind === 'hut') {
      const rnd = ART.rng(11);
      [[x0 + 6, by + 2, 14], [x0 + 30, by + 4, 12], [x0 + 46, by - 2, 9]].forEach(([x, y, r]) => { ART.lump(ctx, x, y - r * 0.5, r, r * 0.65, rnd, 0.3, 8); fs(ctx, lin(ctx, x, y - r, x, y, ['#d9d4cb', '#9f998f']), INK, 1.3); });
      house3(ctx, { ox: x0 + 4, oy: by - 6, w: 34, d: 20, hw: 18, hr: 14, wall: '#e6d2ae', roof: roof || '#7d9a4a', over: 3 });
    }
  }
  ART.pen = function (ctx, penId, w, h, layer, roof) {
    const p = PEN[penId] || PEN.coop;
    const x0 = 6, y0 = 30, x1 = w - 10, y1 = h - 14;
    const rnd = ART.rng(ART.hash(penId));
    if (layer === 'front') {
      ART.fenceH(ctx, x0, x1, y1, 1);
      return;
    }
    // yard ground
    rr(ctx, x0, y0, x1 - x0, y1 - y0 + 2, 10);
    fs(ctx, lin(ctx, 0, y0, 0, y1, p.ground), null);
    ctx.save(); rr(ctx, x0, y0, x1 - x0, y1 - y0, 10); ctx.clip();
    for (let i = 0; i < 26; i++) ART.tuft(ctx, x0 + 6 + rnd() * (x1 - x0 - 12), y0 + 8 + rnd() * (y1 - y0 - 10), 0.85, 'rgba(70,120,40,0.55)');
    if (penId === 'goatpen') for (let i = 0; i < 6; i++) { ell(ctx, x0 + 10 + rnd() * (x1 - x0 - 20), y0 + 20 + rnd() * (y1 - y0 - 26), 2.6, 1.6); ctx.fillStyle = '#b9b2a4'; ctx.fill(); }
    ctx.restore();
    // back & side fences
    ART.fenceH(ctx, x0, x1, y0 + 4, 0.95);
    ART.fenceV(ctx, x0, y0 + 4, y1, 0.95);
    ART.fenceV(ctx, x1, y0 + 4, y1, 0.95);
    // shed in the back-left corner
    if (p.shed) shedBox(ctx, p.shed, roof, x0 + 6, y0 + 22);
    // props on the back-right
    const bx = x1 - 34, by = y0 + 24;
    if (p.deco === 'trough') {
      const T = ART.box3(ctx, bx, by);
      T.face([[22, 0, 0], [22, 0, 8], [22, 7, 8], [22, 7, 0]], '#8b5a33');
      T.face([[0, 0, 0], [22, 0, 0], [22, 7, 0], [0, 7, 0]], '#b07541');
      T.face([[1, 7, 1], [21, 7, 1], [21, 7, 7], [1, 7, 7]], '#e8c46a');
    } else if (p.deco === 'hay') {
      rr(ctx, bx, by - 12, 20, 12, 3); fs(ctx, lin(ctx, 0, by - 12, 0, by, ['#ffe08a', '#e3b04a']), INK, 1.2);
      ctx.strokeStyle = 'rgba(150,100,30,0.6)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(bx + 7, by - 12); ctx.lineTo(bx + 7, by); ctx.moveTo(bx + 13, by - 12); ctx.lineTo(bx + 13, by); ctx.stroke();
    } else if (p.deco === 'flowers') {
      for (let i = 0; i < 4; i++) ART.flowers(ctx, x0 + 22 + i * 30, y0 + 22 + (i % 2) * 8, 0.9, rnd, ['#ffd23e', '#ff8fb3', '#ffffff', '#b9a4ff']);
    } else if (p.deco === 'rocks') {
      ART.rock(ctx, bx + 10, by + 2, 0.9, rnd);
    }
  };

  /* ================================================================ public */
  ART.building = function (ctx, id, w, h, o) {
    o = o || {};
    const f = DRAW[id];
    if (f) f(ctx, w, h, o);
  };
  ART.buildingSprite = function (id, roof) {
    const { w, h } = ART.buildingSize(id);
    return ART.sprite('bld:' + id, w, h, (ctx) => ART.building(ctx, id, w, h, { roof }));
  };
  ART.penSprite = function (penId, layer, roof) {
    const { w, h } = ART.buildingSize(penId);
    return ART.sprite('pen:' + penId + ':' + layer, w, h, (ctx) => ART.pen(ctx, penId, w, h, layer, roof));
  };
})();
