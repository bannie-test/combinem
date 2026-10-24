/*
 * NOA FARM — NỘI DUNG (Content definitions)
 * ============================================================
 * File này định nghĩa "cái gì tồn tại" trong game: loài, sản phẩm, gen, linh vật,
 * hộp quà, nhân vật, bí ẩn, chương truyện...  KHÔNG chứa tỉ lệ / giá (xem balance.js).
 * Tên hiển thị nằm trong i18n/vi.js và i18n/en.js theo cùng id.
 *
 * Thêm 1 loài mới = thêm 1 dòng ở `species`, 3 dòng ở `products`,
 * 1 dòng ở balance.species, và tên trong 2 file i18n.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

NOA.CONTENT = {
  families: {
    plant:  { lab: 'greenhouse', grid: 'vault' },     // hạt giống sống trong Kho hạt giống
    animal: { lab: 'ranch',      grid: 'nursery' }    // con giống sống trong Chuồng ươm
  },

  /* ---------------------------------------------------------- LOÀI */
  // bed      : cây trồng ở ruộng (crop) hay vườn hoa (flower)
  // pen      : vật nuôi sống ở chuồng nào (xem buildings)
  // feed     : vật nuôi ăn món gì trong Kho nông sản (id sản phẩm hoặc vật liệu)
  // byproduct: phụ phẩm khi thu hoạch (ngoài hạt giống)  | manure: vật nuôi ra phân bón
  // hybrid   : [bố, mẹ] -> giống lai, chỉ có từ bàn lai chéo; thu hoạch ra sản phẩm của CẢ HAI loài
  species: {
    rice:       { family: 'plant',  bed: 'crop',   emoji: '🌾', products: ['rice_1', 'rice_2', 'rice_3'], byproduct: 'straw' },
    tomato:     { family: 'plant',  bed: 'crop',   emoji: '🍅', products: ['tomato_1', 'tomato_2', 'tomato_3'] },
    strawberry: { family: 'plant',  bed: 'crop',   emoji: '🍓', products: ['strawberry_1', 'strawberry_2', 'strawberry_3'] },
    potato:     { family: 'plant',  bed: 'crop',   emoji: '🥔', products: ['potato_1', 'potato_2', 'potato_3'] },
    rose:       { family: 'plant',  bed: 'flower', emoji: '🌹', products: ['rose_1', 'rose_2', 'rose_3'], byproduct: 'pollen' },
    sunflower:  { family: 'plant',  bed: 'flower', emoji: '🌻', products: ['sunflower_1', 'sunflower_2', 'sunflower_3'], byproduct: 'pollen' },
    chicken:    { family: 'animal', pen: 'coop',      emoji: '🐔', products: ['chicken_1', 'chicken_2', 'chicken_3'], feed: ['rice_1'] },
    cow:        { family: 'animal', pen: 'cowshed',   emoji: '🐄', products: ['cow_1', 'cow_2', 'cow_3'], feed: ['straw'], manure: true },
    bee:        { family: 'animal', pen: 'apiary',    emoji: '🐝', products: ['bee_1', 'bee_2', 'bee_3'], feed: ['pollen'] },
    sheep:      { family: 'animal', pen: 'sheepfold', emoji: '🐑', products: ['sheep_1', 'sheep_2', 'sheep_3'], feed: ['straw'] },
    goat:       { family: 'animal', pen: 'goatpen',   emoji: '🐐', products: ['goat_1', 'goat_2', 'goat_3'], feed: ['straw'], manure: true },
    // Giống lai (giữ nguyên tên loài thật)
    pomato:     { family: 'plant',  bed: 'crop',   emoji: '🍅', emoji2: '🥔', hybrid: ['tomato', 'potato'] },
    rosaberry:  { family: 'plant',  bed: 'flower', emoji: '🍓', emoji2: '🌹', hybrid: ['strawberry', 'rose'], byproduct: 'pollen' },
    geep:       { family: 'animal', pen: 'sheepfold', emoji: '🐑', emoji2: '🐐', hybrid: ['sheep', 'goat'], feed: ['straw'] }
  },

  /* ---------------------------------------------------------- VẬT LIỆU (phụ phẩm, nằm trong Kho nông sản) */
  materials: {
    straw:  { emoji: '🧹' },   // Rơm: từ lúa — thức ăn của bò, cừu, dê
    pollen: { emoji: '🌼' },   // Phấn hoa: từ vườn hoa — thức ăn của ong
    manure: { emoji: '💩' }    // Phân bón hữu cơ: từ bò, dê — bón ruộng để tăng sản lượng
  },

  /* ---------------------------------------------------------- SẢN PHẨM (3 cấp chế biến mỗi loài) */
  products: {
    rice_1:       { species: 'rice',       tier: 1, emoji: '🌾' },
    rice_2:       { species: 'rice',       tier: 2, emoji: '🍚' },
    rice_3:       { species: 'rice',       tier: 3, emoji: '🍙' },
    tomato_1:     { species: 'tomato',     tier: 1, emoji: '🍅' },
    tomato_2:     { species: 'tomato',     tier: 2, emoji: '🥫' },
    tomato_3:     { species: 'tomato',     tier: 3, emoji: '🍕' },
    strawberry_1: { species: 'strawberry', tier: 1, emoji: '🍓' },
    strawberry_2: { species: 'strawberry', tier: 2, emoji: '🥤' },
    strawberry_3: { species: 'strawberry', tier: 3, emoji: '🍰' },
    rose_1:       { species: 'rose',       tier: 1, emoji: '🌹' },
    rose_2:       { species: 'rose',       tier: 2, emoji: '💐' },
    rose_3:       { species: 'rose',       tier: 3, emoji: '💝' },
    potato_1:     { species: 'potato',     tier: 1, emoji: '🥔' },
    potato_2:     { species: 'potato',     tier: 2, emoji: '🍟' },
    potato_3:     { species: 'potato',     tier: 3, emoji: '🥘' },
    sunflower_1:  { species: 'sunflower',  tier: 1, emoji: '🌻' },
    sunflower_2:  { species: 'sunflower',  tier: 2, emoji: '🌰' },
    sunflower_3:  { species: 'sunflower',  tier: 3, emoji: '🍪' },
    chicken_1:    { species: 'chicken',    tier: 1, emoji: '🥚' },
    chicken_2:    { species: 'chicken',    tier: 2, emoji: '🍳' },
    chicken_3:    { species: 'chicken',    tier: 3, emoji: '🍮' },
    cow_1:        { species: 'cow',        tier: 1, emoji: '🥛' },
    cow_2:        { species: 'cow',        tier: 2, emoji: '🧈' },
    cow_3:        { species: 'cow',        tier: 3, emoji: '🍦' },
    sheep_1:      { species: 'sheep',      tier: 1, emoji: '🧶' },
    sheep_2:      { species: 'sheep',      tier: 2, emoji: '🧣' },
    sheep_3:      { species: 'sheep',      tier: 3, emoji: '🧥' },
    goat_1:       { species: 'goat',       tier: 1, emoji: '🍼' },
    goat_2:       { species: 'goat',       tier: 2, emoji: '🧀' },
    goat_3:       { species: 'goat',       tier: 3, emoji: '🥪' },
    bee_1:        { species: 'bee',        tier: 1, emoji: '🍯' },
    bee_2:        { species: 'bee',        tier: 2, emoji: '🕯️' },
    bee_3:        { species: 'bee',        tier: 3, emoji: '🥞' }
  },

  /* ---------------------------------------------------------- GEN */
  // family : plant = gen thực vật | animal = gen động vật (MỖI VẬT PHẨM TỐI ĐA 1 GEN, đúng họ)
  // tier   : 1 nguyên tố / 2 dung hợp / 3 thần thoại
  // favor  : chỉ số sở trường được cộng điểm (yield / growth / quality / all)
  // parents: công thức dung hợp | secret: gen ẩn, cần điều kiện đặc biệt (xem js/systems/secrets.js)
  genes: {
    solar:      { family: 'plant',  tier: 1, emoji: '☀️', color: '#ffb321', favor: 'yield' },
    lunar:      { family: 'plant',  tier: 1, emoji: '🌙', color: '#8fb6ff', favor: 'quality' },
    blaze:      { family: 'plant',  tier: 1, emoji: '🔥', color: '#ff6a3d', favor: 'growth' },
    crystal:    { family: 'plant',  tier: 1, emoji: '💧', color: '#38c6e0', favor: 'all' },
    rainbow:    { family: 'plant',  tier: 2, emoji: '🌈', color: '#ff7eb6', favor: 'all',     parents: ['solar', 'crystal'] },
    eclipse:    { family: 'plant',  tier: 2, emoji: '🌗', color: '#7f74e0', favor: 'quality', parents: ['solar', 'lunar'] },
    frost:      { family: 'plant',  tier: 2, emoji: '❄️', color: '#7fd8ff', favor: 'growth',  parents: ['lunar', 'crystal'] },
    golden:     { family: 'plant',  tier: 2, emoji: '👑', color: '#f2b01e', favor: 'yield',   parents: ['solar', 'blaze'] },
    thunder:    { family: 'plant',  tier: 2, emoji: '⚡', color: '#ffd21f', favor: 'yield',   secret: true },
    stellar:    { family: 'plant',  tier: 3, emoji: '🌠', color: '#ff9bf0', favor: 'all',     parents: ['eclipse', 'rainbow'] },

    dragon:     { family: 'animal', tier: 1, emoji: '🐉', color: '#2fbf7a', favor: 'quality' },
    qilin:      { family: 'animal', tier: 1, emoji: '🦄', color: '#ff86b4', favor: 'yield' },
    tortoise:   { family: 'animal', tier: 1, emoji: '🐢', color: '#7db35c', favor: 'all' },
    phoenix:    { family: 'animal', tier: 1, emoji: '🦚', color: '#ff8a2a', favor: 'growth' },
    harmony:    { family: 'animal', tier: 2, emoji: '☯️', color: '#ff5c7a', favor: 'quality', parents: ['dragon', 'phoenix'] },
    fortune:    { family: 'animal', tier: 2, emoji: '🍑', color: '#ff9f80', favor: 'yield',   parents: ['qilin', 'tortoise'] },
    xuanwu:     { family: 'animal', tier: 2, emoji: '🌊', color: '#3d8bff', favor: 'all',     parents: ['dragon', 'tortoise'] },
    auspice:    { family: 'animal', tier: 2, emoji: '🎐', color: '#b886ff', favor: 'growth',  parents: ['qilin', 'phoenix'] },
    whitetiger: { family: 'animal', tier: 2, emoji: '🐅', color: '#c9d6f2', favor: 'quality', secret: true },
    foursacred: { family: 'animal', tier: 3, emoji: '🌟', color: '#ffcf33', favor: 'all',     parents: ['harmony', 'fortune'] }
  },

  /* ---------------------------------------------------------- LAI CHÉO 2 LOÀI (Viện) */
  // fact: sự thật khoa học đi kèm (hiện trong Sổ tay khi khám phá)
  hybrids: [
    { a: 'tomato', b: 'potato', result: 'pomato' },
    { a: 'strawberry', b: 'rose', result: 'rosaberry' },
    { a: 'sheep', b: 'goat', result: 'geep' }
  ],

  /* ---------------------------------------------------------- VẬT PHẨM HỖ TRỢ */
  // target: breed = dùng lên hạt giống / con giống | slot = dùng lên ô ruộng / vật nuôi / lượt chế biến
  boosters: {
    clover:     { emoji: '🍀', target: 'breed' },
    stabilizer: { emoji: '🧪', target: 'breed' },
    stardust:   { emoji: '✨', target: 'breed' },
    tonic:      { emoji: '🧃', target: 'slot' },
    loupe:      { emoji: '🔍', target: 'breed' }
  },

  /* ---------------------------------------------------------- LINH VẬT */
  mascots: {
    jade_rabbit:    { emoji: '🐇', type: 'temp' },
    ladybug:        { emoji: '🐞', type: 'temp' },
    squirrel:       { emoji: '🐿️', type: 'temp' },
    owl:            { emoji: '🦉', type: 'temp' },
    worker_bee:     { emoji: '🐝', type: 'temp' },
    firefly:        { emoji: '💫', type: 'temp', secret: true },
    fortune_cat:    { emoji: '🐈', type: 'perm' },
    rain_toad:      { emoji: '🐸', type: 'perm' },
    golden_buffalo: { emoji: '🐃', type: 'perm' },
    farm_dog:       { emoji: '🐕', type: 'perm' },
    white_swan:     { emoji: '🦢', type: 'perm' },
    golden_carp:    { emoji: '🐟', type: 'perm' },
    nightingale:    { emoji: '🐦', type: 'perm', secret: true }
  },

  /* ---------------------------------------------------------- BLINDBOX */
  boxes: {
    sprout: { emoji: '🌱', unlock: 'blindbox' },
    star:   { emoji: '🌠', unlock: 'starBox' }
  },

  /* ---------------------------------------------------------- KHÁCH ĐẶT HÀNG */
  npcs: {
    tu:       { emoji: '👨‍🚀' },
    lan:      { emoji: '👩‍🍳' },
    bao:      { emoji: '👨‍🔧' },
    mo:       { emoji: '👵' },
    bin:      { emoji: '👦' },
    traveler: { emoji: '🧙', vip: true },
    na:       { emoji: '👧', earth: true }
  },

  /* ---------------------------------------------------------- MƯA SAO BĂNG (lịch thật, tháng-ngày) */
  meteorShowers: [
    { id: 'quadrantids',  start: '12-28', end: '01-12', peak: '01-03' },
    { id: 'lyrids',       start: '04-14', end: '04-30', peak: '04-22' },
    { id: 'etaAquariids', start: '04-19', end: '05-28', peak: '05-06' },
    { id: 'perseids',     start: '07-17', end: '08-24', peak: '08-12' },
    { id: 'orionids',     start: '10-02', end: '11-07', peak: '10-21' },
    { id: 'leonids',      start: '11-06', end: '11-30', peak: '11-17' },
    { id: 'geminids',     start: '12-04', end: '12-17', peak: '12-14' }
  ],
  // Ngày đặc biệt có thật
  specialDays: [
    { id: 'earthDay',       date: '04-22' },
    { id: 'environmentDay', date: '06-05' }
  ],

  /* ---------------------------------------------------------- BÍ ẨN (xem docs/GDD.md) */
  secrets: {
    fullmoon:   { icon: '🌕' },
    meteor:     { icon: '🌠' },
    rainbow:    { icon: '🌈' },
    thunder:    { icon: '⚡' },
    whitetiger: { icon: '🐅' },
    octave:     { icon: '🎵' },
    mendel:     { icon: '🧬' },
    firefly:    { icon: '💫' },
    bean:       { icon: '🤖' },
    rename:     { icon: '🌍' },
    clover4:    { icon: '🍀' },
    earthday:   { icon: '🗓️' }
  },

  /* ---------------------------------------------------------- CỐT TRUYỆN */
  // unlock: { level } | { earth } | { flag }   (flag: firstGene, firstHybrid, bean, stellar)
  chapters: [
    { id: 'ch1', unlock: { level: 1 } },
    { id: 'ch2', unlock: { flag: 'firstGene' } },
    { id: 'ch3', unlock: { level: 3 } },
    { id: 'ch4', unlock: { flag: 'firstAnimalGene' } },
    { id: 'ch5', unlock: { earth: 20 } },
    { id: 'ch6', unlock: { earth: 50 } },
    { id: 'ch7', unlock: { earth: 100 } }
  ],
  letters: [
    { id: 'l1', unlock: { level: 1 } },
    { id: 'l2', unlock: { flag: 'firstGene' } },
    { id: 'l3', unlock: { flag: 'firstHybrid' } },
    { id: 'l4', unlock: { flag: 'bean' } },
    { id: 'l5', unlock: { earth: 50 } }
  ],

  /* ---------------------------------------------------------- CÔNG TRÌNH TRÊN BẢN ĐỒ */
  // kind: house | orders | barn | market | lab | shrine | gacha | pen | factory | ship
  // unlock: khóa tính năng trong balance.unlocks (hoặc theo cấp mở của loài / xưởng)
  buildings: {
    house:      { kind: 'house',   emoji: '🏡', roof: '#e8735a' },
    orders:     { kind: 'orders',  emoji: '📋', roof: '#b9804f' },
    barn:       { kind: 'barn',    emoji: '📦', roof: '#d0473c' },
    market:     { kind: 'market',  emoji: '🧺', roof: '#ff8fa3' },
    greenhouse: { kind: 'lab', lab: 'greenhouse', emoji: '🌱', roof: '#8fd8f0' },
    ranch:      { kind: 'lab', lab: 'ranch',      emoji: '🐾', roof: '#c4503f', unlock: 'ranch' },
    shrine:     { kind: 'shrine',  emoji: '⛩️', roof: '#e2574c', unlock: 'shrine' },
    wishtree:   { kind: 'gacha',   emoji: '🎋', roof: '#5cbb49', unlock: 'blindbox' },
    coop:       { kind: 'pen',     emoji: '🐔', roof: '#e86a4f' },
    cowshed:    { kind: 'pen',     emoji: '🐄', roof: '#c9453a' },
    apiary:     { kind: 'pen',     emoji: '🐝', roof: '#f2b532' },
    sheepfold:  { kind: 'pen',     emoji: '🐑', roof: '#9b7bd1' },
    goatpen:    { kind: 'pen',     emoji: '🐐', roof: '#7d9a4a' },
    mill:       { kind: 'factory', emoji: '🏭', roof: '#a6764b' },
    kitchen:    { kind: 'factory', emoji: '🍳', roof: '#ef8a3c' },
    dairy:      { kind: 'factory', emoji: '🧀', roof: '#4fb0d8' },
    craft:      { kind: 'factory', emoji: '🧵', roof: '#c26fb4' },
    dock:       { kind: 'ship',    emoji: '🚀', roof: '#5b6bb8', unlock: 'ship' }
  },

  /* ---------------------------------------------------------- BẢN ĐỒ NÔNG TRẠI (đơn vị: px ở mức zoom 1) */
  // Mỗi khu là một mảng đất riêng có biển tên — kiểu Hay Day / Township.
  map: {
    width: 520,
    height: 1790,
    zones: [
      { id: 'home',      x: 16, y: 16,   w: 488, h: 206, ground: 'cobble' },
      { id: 'crop',      x: 16, y: 240,  w: 488, h: 330, ground: 'soil' },
      { id: 'flower',    x: 16, y: 588,  w: 488, h: 192, ground: 'garden' },
      { id: 'research',  x: 16, y: 798,  w: 488, h: 206, ground: 'stone' },
      { id: 'livestock', x: 16, y: 1022, w: 488, h: 362, ground: 'meadow' },
      { id: 'workshop',  x: 16, y: 1402, w: 488, h: 198, ground: 'wood' },
      { id: 'dock',      x: 16, y: 1618, w: 488, h: 156, ground: 'pad' }
    ],
    buildings: {
      house:      { x: 28,  y: 62,   w: 110, h: 140 },
      orders:     { x: 150, y: 62,   w: 102, h: 140 },
      barn:       { x: 264, y: 62,   w: 112, h: 140 },
      market:     { x: 388, y: 62,   w: 104, h: 140 },
      greenhouse: { x: 28,  y: 846,  w: 112, h: 140 },
      ranch:      { x: 152, y: 846,  w: 112, h: 140 },
      shrine:     { x: 276, y: 846,  w: 100, h: 140 },
      wishtree:   { x: 388, y: 846,  w: 104, h: 140 },
      coop:       { x: 28,  y: 1068, w: 148, h: 148 },
      cowshed:    { x: 186, y: 1068, w: 148, h: 148 },
      apiary:     { x: 344, y: 1068, w: 148, h: 148 },
      sheepfold:  { x: 28,  y: 1226, w: 148, h: 148 },
      goatpen:    { x: 186, y: 1226, w: 148, h: 148 },
      mill:       { x: 28,  y: 1450, w: 110, h: 140 },
      kitchen:    { x: 150, y: 1450, w: 110, h: 140 },
      dairy:      { x: 272, y: 1450, w: 110, h: 140 },
      craft:      { x: 394, y: 1450, w: 98,  h: 140 },
      dock:       { x: 120, y: 1660, w: 280, h: 104 }
    },
    plots: {
      crop:   { x: 34, y: 290, cols: 4, w: 104, h: 80, gap: 12 },
      flower: { x: 34, y: 636, cols: 3, w: 140, h: 62, gap: 12 }
    },
    deco: [
      { e: '🌳', x: 486, y: 214, s: 34 }, { e: '🌲', x: 2, y: 560, s: 30 }, { e: '🌳', x: 488, y: 772, s: 30 },
      { e: '🪨', x: 404, y: 1250, s: 22 }, { e: '🦆', x: 420, y: 1300, s: 22 }, { e: '🌳', x: 2, y: 1390, s: 32 },
      { e: '🌷', x: 470, y: 1600, s: 22 }, { e: '🌳', x: 30, y: 1700, s: 34 }, { e: '🌳', x: 456, y: 1700, s: 34 }
    ],
    pond: { x: 350, y: 1236, w: 140, h: 126 }
  },

  /* ---------------------------------------------------------- HƯỚNG DẪN (robot Đậu) */
  // done: sự kiện hoàn thành bước | count: số lần | focus: id phần tử cần làm nổi bật trên bản đồ
  tutorial: [
    { id: 'plant',   done: 'plot.planted',       count: 1, focus: 'plot-crop-0' },
    { id: 'harvest', done: 'harvest',            count: 1, focus: 'plot-crop-0' },
    { id: 'merge',   done: 'merge.done',         count: 1, focus: 'bld-greenhouse' },
    { id: 'order',   done: 'order.complete',     count: 1, focus: 'bld-orders' },
    { id: 'animal',  done: 'pen.placed',         count: 1, focus: 'bld-ranch' },
    { id: 'feed',    done: 'pen.fed',            count: 1, focus: 'bld-coop' },
    { id: 'process', done: 'production.started', count: 1, focus: 'bld-mill' }
  ]
};
