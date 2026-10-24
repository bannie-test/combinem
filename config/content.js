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
    plant:  { lab: 'greenhouse', generator: 'seedSack' },
    animal: { lab: 'ranch',      generator: 'incubator' }
  },

  /* ---------------------------------------------------------- LOÀI */
  // hybrid: [bố, mẹ]  -> giống lai, chỉ có được qua Viện lai tạo; thu hoạch ra sản phẩm của CẢ HAI loài
  // feed  : loài vật nuôi ăn sản phẩm của loài cây nào
  species: {
    rice:       { family: 'plant',  emoji: '🌾', products: ['rice_1', 'rice_2', 'rice_3'] },
    tomato:     { family: 'plant',  emoji: '🍅', products: ['tomato_1', 'tomato_2', 'tomato_3'] },
    strawberry: { family: 'plant',  emoji: '🍓', products: ['strawberry_1', 'strawberry_2', 'strawberry_3'] },
    rose:       { family: 'plant',  emoji: '🌹', products: ['rose_1', 'rose_2', 'rose_3'] },
    potato:     { family: 'plant',  emoji: '🥔', products: ['potato_1', 'potato_2', 'potato_3'] },
    sunflower:  { family: 'plant',  emoji: '🌻', products: ['sunflower_1', 'sunflower_2', 'sunflower_3'] },
    chicken:    { family: 'animal', emoji: '🐔', products: ['chicken_1', 'chicken_2', 'chicken_3'], feed: ['rice'] },
    cow:        { family: 'animal', emoji: '🐄', products: ['cow_1', 'cow_2', 'cow_3'], feed: ['rice'] },
    sheep:      { family: 'animal', emoji: '🐑', products: ['sheep_1', 'sheep_2', 'sheep_3'], feed: ['rice'] },
    goat:       { family: 'animal', emoji: '🐐', products: ['goat_1', 'goat_2', 'goat_3'], feed: ['rice'] },
    bee:        { family: 'animal', emoji: '🐝', products: ['bee_1', 'bee_2', 'bee_3'], feed: ['rose', 'sunflower'] },
    // Giống lai (giữ nguyên tên loài thật)
    pomato:     { family: 'plant',  emoji: '🍅', emoji2: '🥔', hybrid: ['tomato', 'potato'] },
    rosaberry:  { family: 'plant',  emoji: '🍓', emoji2: '🌹', hybrid: ['strawberry', 'rose'] },
    geep:       { family: 'animal', emoji: '🐑', emoji2: '🐐', hybrid: ['sheep', 'goat'], feed: ['rice'] }
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
  // target: breed = kéo thả lên hạt giống / con giống | slot = kéo lên ô đất / chuồng
  boosters: {
    clover:     { emoji: '🍀', target: 'breed' },
    stabilizer: { emoji: '🧪', target: 'breed' },
    stardust:   { emoji: '✨', target: 'breed' },
    tonic:      { emoji: '🧃', target: 'slot' },
    loupe:      { emoji: '🔍', target: 'breed' }
  },

  /* ---------------------------------------------------------- MÁY TẠO */
  generators: {
    seedSack:  { emoji: '🌱', family: 'plant' },
    incubator: { emoji: '🐣', family: 'animal' }
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

  /* ---------------------------------------------------------- HƯỚNG DẪN (robot Đậu) */
  // done: sự kiện hoàn thành bước | count: số lần
  tutorial: [
    { id: 'tap',     done: 'item.spawned',   count: 2, focus: 'gen-seedSack' },
    { id: 'merge',   done: 'merge.done',     count: 1, focus: 'board' },
    { id: 'plant',   done: 'plot.planted',   count: 1, focus: 'field' },
    { id: 'harvest', done: 'harvest',        count: 1, focus: 'field' },
    { id: 'order',   done: 'order.complete', count: 1, focus: 'orders' },
    { id: 'animal',  done: 'pen.placed',     count: 1, focus: 'gen-incubator' },
    { id: 'feed',    done: 'pen.fed',        count: 1, focus: 'field' }
  ]
};
