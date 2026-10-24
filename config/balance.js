/*
 * NOA FARM — BẢNG CÂN BẰNG (Balance / Rates) · v0.2
 * ============================================================
 * MỌI tỉ lệ, xác suất, trọng số, giá, thời gian, công thức chế biến của game đều nằm ở file này.
 * Code trong js/ KHÔNG chứa số "cứng" — luôn đọc từ NOA.BALANCE.
 *
 * Quy ước:
 *   - Xác suất viết dạng 0..1   (0.25 = 25%)
 *   - Trọng số (weights) là số tương đối, không cần cộng đủ 100
 *   - Thời gian tính bằng giây (Sec) hoặc phút (Min) như tên biến (giá trị prototype: ngắn để test nhanh)
 *   - Mảng "ByLevel" dùng index = cấp (index 0 bỏ trống)
 *
 * Sau khi sửa: mở game, ⚙️ > Công cụ Dev > "Kiểm tra cấu hình" sẽ báo lỗi nếu có số sai.
 * Muốn kiểm chứng tỉ lệ thực tế: chạy  `node tools/simulate.mjs`
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

NOA.BALANCE = {
  meta: { version: '0.2.0', saveVersion: 2 },

  /* ---------------------------------------------------------- THỜI GIAN */
  time: {
    timeScale: 1,        // nhân MỌI thời lượng (trồng, chăn nuôi, chế biến, linh vật). 0.1 = nhanh gấp 10
    dayResetHour: 0,     // giờ đổi ngày cho phần thưởng đăng nhập (giờ máy người chơi)
    nightStartHour: 18,  // từ 18:00 ...
    nightEndHour: 6      // ... đến 05:59 là ban đêm
  },

  /* ---------------------------------------------------------- KHO CHỨA */
  storage: {
    barnStart: 100,                                         // Kho nông sản: tổng số món chứa được
    barnUpgrade: { step: 25, max: 400, costBase: 400, costGrowth: 1.5 }, // mỗi lần nâng +25 chỗ, giá = costBase × costGrowth^lần
    vaultStart: 24,      // Kho hạt giống (lưới merge hạt): số ô ban đầu
    vaultMax: 48,
    nurseryStart: 12,    // Chuồng ươm (lưới merge con giống): số ô ban đầu
    nurseryMax: 30,
    gridCols: 6,         // số cột của lưới merge
    pendingSeedsMax: 12  // kho hạt đầy: hạt mới vào "giỏ chờ" tối đa chừng này, quá nữa thì mất
  },

  /* ---------------------------------------------------------- RUỘNG & VƯỜN HOA */
  // Ô thứ i (index) cần cấp levelReq[i] và giá cost[i] để mở. start = số ô có sẵn.
  fields: {
    crop:   { start: 4, max: 12,
      cost:     [0, 0, 0, 0, 300, 600, 1000, 1600, 2500, 3800, 5500, 8000],
      levelReq: [1, 1, 1, 1, 2,   3,   4,    5,    6,    8,    10,   12] },
    flower: { start: 0, max: 6,
      cost:     [0, 0, 800, 1600, 3200, 6000],
      levelReq: [2, 2, 4,   6,    8,    10] }
  },

  /* ---------------------------------------------------------- LOÀI: GIÁ / THỜI GIAN / MỞ KHÓA */
  // price      : giá bán 1 sản phẩm thô (1★, không gen)
  // growSec    : thời gian trồng hạt Lv1   | cycleSec: 1 lứa sản xuất của vật nuôi Lv1
  // unlockLevel: cấp người chơi mở loài    | seedPrice / buyPrice: giá mua hạt / con giống Lv1 ở Cửa hàng
  species: {
    rice:       { price: 6,  growSec: 30,  unlockLevel: 1, seedPrice: 10 },
    tomato:     { price: 9,  growSec: 45,  unlockLevel: 1, seedPrice: 15 },
    strawberry: { price: 13, growSec: 60,  unlockLevel: 2, seedPrice: 25 },
    potato:     { price: 11, growSec: 50,  unlockLevel: 3, seedPrice: 20 },
    rose:       { price: 15, growSec: 70,  unlockLevel: 2, seedPrice: 30 },
    sunflower:  { price: 16, growSec: 80,  unlockLevel: 4, seedPrice: 35 },
    chicken:    { price: 11, cycleSec: 40, unlockLevel: 1, buyPrice: 60 },
    cow:        { price: 16, cycleSec: 60, unlockLevel: 3, buyPrice: 150 },
    bee:        { price: 24, cycleSec: 90, unlockLevel: 4, buyPrice: 250 },
    sheep:      { price: 19, cycleSec: 75, unlockLevel: 5, buyPrice: 200 },
    goat:       { price: 18, cycleSec: 70, unlockLevel: 6, buyPrice: 220 },
    // Giống lai (chỉ có từ bàn lai chéo). Giá = trung bình 2 loài × hệ số
    pomato:     { hybridPriceMult: 1.3, growSec: 60 },
    rosaberry:  { hybridPriceMult: 1.3, growSec: 75 },
    geep:       { hybridPriceMult: 1.3, cycleSec: 80 }
  },

  /* ---------------------------------------------------------- HẠT / CON GIỐNG MỚI */
  breeds: {
    spawnStats: {                  // khoảng chỉ số khi hạt / con giống sinh ra (mua ở shop, quà...)
      1: [3, 14],
      2: [12, 28],
      3: [24, 42]
    },
    carrierChance: 0.12            // tỉ lệ mang GEN LẶN ẩn
  },

  /* ---------------------------------------------------------- MERGE (trong Kho hạt giống / Chuồng ươm) */
  merge: {
    maxLevel: 5,
    statCapByLevel: [0, 25, 45, 65, 85, 100], // trần chỉ số gốc theo cấp
    statGain: [4, 12],                        // con = trung bình bố mẹ + ngẫu nhiên [4..12]
    breakthroughChance: [0, 0.07, 0.06, 0.05, 0, 0], // ĐỘT PHÁ: 2 vật Lv n -> thẳng Lv n+2
    breakthroughStatBonus: 8,
    comboWindowMs: 2400,                      // merge liên tiếp trong khoảng này = combo (cao độ âm thanh tăng dần)
    maxChance: 0.95                           // trần của mọi xác suất sau khi cộng dồn bonus
  },

  /* ---------------------------------------------------------- GEN (phẩm chất hiếm) */
  gene: {
    spawnChance: 0.010,       // Thường + Thường -> gen mới xuất hiện (cộng thêm từ Viện, linh vật, sự kiện)
    keep: {
      withNormal: 0.22,       // Cao cấp + Thường         -> giữ gen (THẤP)
      sameGene:   0.88,       // Cao cấp + Cao cấp cùng gen -> giữ gen (CAO)
      diffGene:   0.62        // Cao cấp + Cao cấp khác gen (không dung hợp) -> giữ 1 trong 2
    },
    purityLossWithNormal: 1,
    lostGeneBecomesRecessive: true,
    purityUpChance: [0, 0.48, 0.34, 0.22, 0.12],
    purityUpUnequalFactor: 0.5,
    maxPurity: 5,
    fusion: { chanceByTier: { 2: 0.22, 3: 0.09 }, minPurity: 2 },
    statBonusByPurity: [0, 8, 12, 17, 23, 32],
    allFavorShare: 0.5,
    priceMult: {
      1: [1, 4, 6, 9, 14, 40],
      2: [1, 9, 13, 19, 28, 100],
      3: [1, 25, 35, 55, 85, 300]
    },
    spawnWeights: {
      plant:  { solar: 30, lunar: 24, blaze: 24, crystal: 22 },
      animal: { dragon: 20, qilin: 30, tortoise: 30, phoenix: 20 }
    },
    firstDiscoveryRP: 15,
    firstGeneAtMerge: 3       // lần merge thứ 3 chắc chắn thức tỉnh gen đầu tiên (dạy người chơi mới). 0 = tắt
  },

  /* ---------------------------------------------------------- GEN LẶN (ẩn) */
  recessive: {
    expressChance: 0.25,       // 2 vật cùng mang 1 gen lặn -> 25% biểu hiện (tỉ lệ Mendel 1/4)
    inheritBothCarriers: 0.667,
    inheritOneCarrier: 0.5
  },

  /* ---------------------------------------------------------- THU HOẠCH & PHỤ PHẨM */
  harvest: {
    baseUnitsByLevel: [0, 2, 4, 7, 12, 20],    // số nông sản / lần thu theo cấp hạt
    timeMultByLevel:  [0, 1, 1.4, 1.9, 2.4, 3.0],
    yieldBonusPerPoint: 0.01,                  // mỗi điểm Năng suất: +1% sản lượng
    growthReductionPerPoint: 0.005,            // mỗi điểm Sinh trưởng: -0.5% thời gian
    maxTimeReduction: 0.6,
    starThresholds: [0, 20, 40, 60, 80],       // Phẩm chất -> sao
    starJitter: 8,
    geneProductChance: 0.5,                    // mỗi nông sản của giống có gen: 50% mang gen
    geneRP: 1,
    naturalCloverChance: 0.002,
    // PHỤ PHẨM 1: HẠT GIỐNG thế hệ sau (đi vào Kho hạt giống)
    seeds: {
      countByLevel: [0, 1, 1, 2, 2, 3],        // số hạt / lần thu theo cấp cây mẹ
      extraChance: 0.3,                        // thêm 1 hạt với xác suất này (+ theo Năng suất)
      extraPerYieldPoint: 0.004,
      levelDrop: 2,                            // hạt con = cấp mẹ - 2 (tối thiểu Lv1): Lv5 cho hạt Lv3
      inheritRatio: 0.75,                      // chỉ số con ≈ 75% chỉ số mẹ (± đột biến), không vượt trần cấp
      mutation: 5,                             // dao động ± điểm khi di truyền
      geneInherit: 0.35,                       // mẹ có gen: mỗi hạt con 35% mang gen (◆ -1)
      carrierFromGene: 0.5,                    // không mang gen thì 50% mang gen đó dạng LẶN
      carrierInherit: 0.5                      // mẹ mang gen lặn: con mang tiếp 50%
    }
  },
  // PHỤ PHẨM 2: vật liệu theo loài (content.species.byproduct) — số lượng = base + floor(nông sản / perUnits)
  byproducts: {
    straw:  { base: 1, perUnits: 3 },          // 🧹 Rơm (từ lúa) — thức ăn của bò, cừu, dê
    pollen: { base: 1, perUnits: 3 }           // 🌼 Phấn hoa (từ hoa) — thức ăn của ong
  },
  fertilizer: { unitsMult: 1.5, extraSeeds: 1 }, // 💩 bón phân: lần thu tới ×1.5 nông sản, +1 hạt

  /* ---------------------------------------------------------- CHĂN NUÔI */
  livestock: {
    pens: {   // ô nuôi ban đầu / tối đa / giá mở ô thứ i
      coop:      { slotsStart: 2, slotsMax: 6, slotCost: [0, 0, 400, 900, 1800, 3500] },
      cowshed:   { slotsStart: 1, slotsMax: 5, slotCost: [0, 800, 1600, 3000, 5000] },
      apiary:    { slotsStart: 1, slotsMax: 4, slotCost: [0, 1200, 2500, 5000] },
      sheepfold: { slotsStart: 1, slotsMax: 5, slotCost: [0, 1000, 2000, 3800, 6000] },
      goatpen:   { slotsStart: 1, slotsMax: 5, slotCost: [0, 1100, 2200, 4000, 6500] }
    },
    offspringChance: 0.14,       // mỗi lứa: tỉ lệ đẻ CON NON (đi vào Chuồng ươm)
    offspringPerLevel: 0.02,     // + mỗi cấp của con mẹ
    manureChance: 0.6            // bò, dê: tỉ lệ ra 💩 phân bón mỗi lứa
  },

  /* ---------------------------------------------------------- CHẾ BIẾN (Township-style) */
  production: {
    buildings: {      // mở ở cấp / số ô hàng chờ ban đầu / tối đa / giá mở ô thứ i
      mill:    { unlockLevel: 1, slotsStart: 2, slotsMax: 5, slotCost: [0, 0, 300, 800, 2000] },
      kitchen: { unlockLevel: 3, slotsStart: 2, slotsMax: 5, slotCost: [0, 0, 500, 1200, 2800] },
      dairy:   { unlockLevel: 4, slotsStart: 2, slotsMax: 5, slotCost: [0, 0, 600, 1500, 3200] },
      craft:   { unlockLevel: 5, slotsStart: 2, slotsMax: 5, slotCost: [0, 0, 700, 1700, 3600] }
    },
    valueMarkup: 1.3,          // giá thành phẩm = tổng giá nguyên liệu × 1.3
    starUpChance: 0.15,        // thành phẩm có 15% được +1★
    xpPerSecond: 0.1           // XP khi thu thành phẩm = thời gian chế biến × 0.1
  },
  // Công thức: sản phẩm = { building, inputs: { nguyên liệu: số lượng }, timeSec }
  recipes: {
    rice_2:       { building: 'mill',    inputs: { rice_1: 3 },                          timeSec: 40 },
    sunflower_2:  { building: 'mill',    inputs: { sunflower_1: 3 },                     timeSec: 45 },
    rice_3:       { building: 'kitchen', inputs: { rice_2: 2 },                          timeSec: 60 },
    tomato_2:     { building: 'kitchen', inputs: { tomato_1: 3 },                        timeSec: 50 },
    potato_2:     { building: 'kitchen', inputs: { potato_1: 3 },                        timeSec: 50 },
    chicken_2:    { building: 'kitchen', inputs: { chicken_1: 2 },                       timeSec: 40 },
    strawberry_2: { building: 'kitchen', inputs: { strawberry_1: 2, cow_1: 1 },          timeSec: 50 },
    potato_3:     { building: 'kitchen', inputs: { potato_2: 2, cow_1: 1 },              timeSec: 80 },
    chicken_3:    { building: 'kitchen', inputs: { chicken_1: 3, cow_1: 1 },             timeSec: 90 },
    sunflower_3:  { building: 'kitchen', inputs: { sunflower_2: 2, chicken_1: 1 },       timeSec: 90 },
    bee_3:        { building: 'kitchen', inputs: { bee_1: 1, rice_2: 1, chicken_1: 1 },  timeSec: 90 },
    tomato_3:     { building: 'kitchen', inputs: { tomato_2: 2, goat_2: 1 },             timeSec: 100 },
    strawberry_3: { building: 'kitchen', inputs: { strawberry_2: 2, cow_2: 1 },          timeSec: 110 },
    goat_3:       { building: 'kitchen', inputs: { goat_2: 1, rice_2: 2 },               timeSec: 100 },
    cow_2:        { building: 'dairy',   inputs: { cow_1: 3 },                           timeSec: 60 },
    cow_3:        { building: 'dairy',   inputs: { cow_1: 2, bee_1: 1 },                 timeSec: 90 },
    goat_2:       { building: 'dairy',   inputs: { goat_1: 3 },                          timeSec: 70 },
    rose_2:       { building: 'craft',   inputs: { rose_1: 3 },                          timeSec: 45 },
    bee_2:        { building: 'craft',   inputs: { bee_1: 2 },                           timeSec: 60 },
    rose_3:       { building: 'craft',   inputs: { rose_2: 2, bee_2: 1 },                timeSec: 100 },
    sheep_2:      { building: 'craft',   inputs: { sheep_1: 3 },                         timeSec: 60 },
    sheep_3:      { building: 'craft',   inputs: { sheep_2: 2, sheep_1: 1 },             timeSec: 120 }
  },

  /* ---------------------------------------------------------- SẢN PHẨM & VẬT LIỆU */
  product: {
    starPriceMult: [0, 1, 1.25, 1.6, 2.1, 2.8]
  },
  materials: {                 // giá bán vật liệu
    straw:  { price: 2 },
    pollen: { price: 3 },
    manure: { price: 4 }
  },

  /* ---------------------------------------------------------- BÁN HÀNG & THỊ TRƯỜNG */
  market: {
    saturationStep: 0.05,      // mỗi lần bán cùng 1 loại trong ngày: giá -5%
    saturationFloor: 0.45,
    seedSellBase: 3,           // giá bán hạt / con giống = seedSellBase × levelMult[cấp] × hệ số gen
    seedLevelMult: [0, 1, 2.5, 6, 14, 32],
    confirmSellMinLevel: 4
  },

  /* ---------------------------------------------------------- BẢNG ĐƠN HÀNG */
  orders: {
    slots: 6,
    refillDelaySec: 6,
    swapCooldownSec: 60,
    linesByLevel: [ { level: 1, max: 1 }, { level: 3, max: 2 }, { level: 6, max: 3 } ],
    countByTier: { 1: [2, 5], 2: [1, 3], 3: [1, 2] },
    tierWeightsByLevel: [
      { level: 1, weights: [100, 0, 0] },
      { level: 2, weights: [75, 25, 0] },
      { level: 4, weights: [55, 35, 10] },
      { level: 7, weights: [40, 38, 22] }
    ],
    rewardMult: 1.5,
    xpPerCoin: 0.15,
    minXP: 5,
    vip: {
      unlockLevel: 4,
      chance: 0.18,
      rewardMult: 2.6,
      rpRange: [4, 12],
      gemChance: 0.35,
      gemRange: [2, 6],
      requireGeneChance: 0.6,
      minStars: 3
    }
  },

  /* ---------------------------------------------------------- TÀU ONG VÀNG (gửi hàng về Trái Đất — kiểu tàu hỏa Township) */
  ship: {
    unlockLevel: 3,
    dockMinutes: 8,            // tàu đậu chờ 8 phút
    awayMinutes: 4,            // bay về Trái Đất 4 phút rồi quay lại
    crates: 3,
    countRange: [2, 4],
    tierWeights: [70, 30, 0],
    rewardMult: 1.8,
    allBonus: { gems: 5, rp: 10 },   // lấp đủ mọi thùng
    earthProgress: 3                 // +3% hồi sinh Trái Đất mỗi chuyến đầy
  },

  /* ---------------------------------------------------------- KINH NGHIỆM & CẤP */
  level: {
    xpToNext: [0, 40, 80, 130, 190, 260, 340, 430, 530, 640, 760, 890, 1030, 1180, 1340],
    xpGrowthAfterTable: 170,
    maxLevel: 60
  },
  xp: {
    mergePerLevel: 1,
    harvestPerUnit: 0.5,
    discovery: 20,
    hybrid: 30,
    labUpgrade: 25
  },

  /* ---------------------------------------------------------- MỞ KHÓA TÍNH NĂNG */
  unlocks: {
    flowers: 2,     // Vườn hoa
    blindbox: 2,
    ranch: 1,       // Trại nghiên cứu (Chuồng ươm)
    ship: 3,        // Tàu Ong Vàng
    shrine: 3,
    vipOrders: 4,
    hybrid: 5,
    starBox: 5
  },

  /* ---------------------------------------------------------- VIỆN NGHIÊN CỨU */
  labs: {
    maxLevel: 10,
    levels: [
      null,
      { cost: null,                      success: 0.00, spawnAdd: 0.000, breakAdd: 0.000, slots: 0, discoveryAdd: 0.00, purityCap: 2, fusionTier: 1 },
      { cost: { coins: 600,   rp: 8 },   success: 0.02, spawnAdd: 0.003, breakAdd: 0.005, slots: 1, discoveryAdd: 0.00, purityCap: 3, fusionTier: 1 },
      { cost: { coins: 1600,  rp: 20 },  success: 0.04, spawnAdd: 0.006, breakAdd: 0.010, slots: 1, discoveryAdd: 0.03, purityCap: 3, fusionTier: 2 },
      { cost: { coins: 3200,  rp: 36 },  success: 0.06, spawnAdd: 0.009, breakAdd: 0.015, slots: 1, discoveryAdd: 0.06, purityCap: 4, fusionTier: 2 },
      { cost: { coins: 5600,  rp: 56 },  success: 0.08, spawnAdd: 0.012, breakAdd: 0.020, slots: 2, discoveryAdd: 0.09, purityCap: 4, fusionTier: 2 },
      { cost: { coins: 9000,  rp: 80 },  success: 0.10, spawnAdd: 0.016, breakAdd: 0.025, slots: 2, discoveryAdd: 0.12, purityCap: 5, fusionTier: 3 },
      { cost: { coins: 13500, rp: 110 }, success: 0.12, spawnAdd: 0.020, breakAdd: 0.030, slots: 2, discoveryAdd: 0.15, purityCap: 5, fusionTier: 3 },
      { cost: { coins: 19500, rp: 150 }, success: 0.14, spawnAdd: 0.025, breakAdd: 0.035, slots: 3, discoveryAdd: 0.18, purityCap: 5, fusionTier: 3 },
      { cost: { coins: 27000, rp: 200 }, success: 0.17, spawnAdd: 0.030, breakAdd: 0.040, slots: 3, discoveryAdd: 0.22, purityCap: 5, fusionTier: 3 },
      { cost: { coins: 38000, rp: 270 }, success: 0.20, spawnAdd: 0.040, breakAdd: 0.050, slots: 4, discoveryAdd: 0.27, purityCap: 5, fusionTier: 3 }
    ]
  },

  /* ---------------------------------------------------------- LAI CHÉO 2 LOÀI (bàn nghiên cứu) */
  hybrid: {
    durationSec: 90,
    costCoins: 200,
    baseDiscovery: 0.35,
    vigorBonus: 10,           // "Ưu thế lai": +10 điểm mọi chỉ số
    failRefundRP: 3
  },

  /* ---------------------------------------------------------- PHẦN THƯỞNG ĐĂNG NHẬP (7 ngày, lặp lại) */
  // Kiểu phần thưởng: coins, gems, rp, tickets{sprout,star}, boosters{...}, materials{straw,pollen,manure},
  //                   products{id:n}, seeds:[{species,level}], animals:[{species,level}]
  login: {
    resetOnMiss: false,
    days: [
      { coins: 200 },
      { materials: { manure: 3 }, boosters: { clover: 1 } },
      { tickets: { sprout: 1 } },
      { coins: 400, rp: 15 },
      { gems: 15 },
      { materials: { straw: 10 }, boosters: { stabilizer: 1 } },
      { gems: 30, tickets: { star: 1 } }
    ]
  },

  /* ---------------------------------------------------------- PHẦN THƯỞNG LÊN CẤP */
  levelRewards: {
    2:  { coins: 300,  gems: 10, tickets: { sprout: 1 }, seeds: [{ species: 'rose', level: 1 }, { species: 'rose', level: 1 }] },
    3:  { coins: 400,  materials: { straw: 10 }, animals: [{ species: 'cow', level: 1 }] },
    4:  { coins: 500,  rp: 10, boosters: { stabilizer: 1 }, materials: { pollen: 6 } },
    5:  { coins: 700,  gems: 20, tickets: { star: 1 } },
    6:  { coins: 800,  materials: { manure: 5 }, boosters: { stardust: 1 } },
    7:  { coins: 1000, rp: 20, tickets: { sprout: 2 } },
    8:  { coins: 1200, gems: 25 },
    9:  { coins: 1400, boosters: { clover: 2, tonic: 2 } },
    10: { coins: 2000, gems: 40, tickets: { star: 2 } }
  },
  levelRewardFormula: { coinsBase: 1000, coinsPerLevel: 150, gems: 10, manure: 3, starTicketEvery: 5 },

  /* ---------------------------------------------------------- VẬT PHẨM HỖ TRỢ / MAY MẮN */
  boosters: {
    clover:     { geneKeepAdd: 0.15, purityUpAdd: 0.10, fusionAdd: 0.08, spawnMult: 2.5, breakthroughAdd: 0.03 },
    stabilizer: { noGeneLoss: true, noPurityLoss: true },
    stardust:   { breakthroughAdd: 0.10, fusionAdd: 0.10 },
    tonic:      {},   // Thuốc tăng trưởng: xong ngay 1 ô ruộng / 1 con vật / 1 lượt chế biến
    loupe:      {}    // Kính lúp gen: soi gen lặn
  },

  /* ---------------------------------------------------------- CỬA HÀNG */
  // price: { coins } = Xu (kiếm trong game) | { gems } = Ngọc (từ nạp tiền / phần thưởng)
  // Hạt giống & con giống Lv1 bán theo species.seedPrice / buyPrice ở trên
  shop: {
    items: [
      { id: 'manure_5',     grant: { materials: { manure: 5 } },   price: { coins: 300 } },
      { id: 'straw_10',     grant: { materials: { straw: 10 } },   price: { coins: 150 } },
      { id: 'pollen_10',    grant: { materials: { pollen: 10 } },  price: { coins: 220 } },
      { id: 'clover_1',     grant: { boosters: { clover: 1 } },     price: { coins: 900 } },
      { id: 'clover_5',     grant: { boosters: { clover: 5 } },     price: { gems: 30 } },
      { id: 'stabilizer_1', grant: { boosters: { stabilizer: 1 } }, price: { gems: 25 } },
      { id: 'stardust_1',   grant: { boosters: { stardust: 1 } },   price: { coins: 1500 } },
      { id: 'tonic_3',      grant: { boosters: { tonic: 3 } },      price: { gems: 12 } },
      { id: 'loupe_1',      grant: { boosters: { loupe: 1 } },      price: { coins: 2500 } },
      { id: 'vault_6',      grant: { vault: 6 },                    price: { gems: 40 } },
      { id: 'nursery_3',    grant: { nursery: 3 },                  price: { gems: 30 } },
      { id: 'ticket_star',  grant: { tickets: { star: 1 } },        price: { gems: 55 } }
    ],
    exchange: { gems: 10, coins: 800 }
  },

  /* ---------------------------------------------------------- BLINDBOX (gacha) */
  gacha: {
    rarityOrder: ['common', 'rare', 'epic', 'legendary', 'mythic'],
    // Hạt / con giống trong hộp: chọn loài (đã mở khóa) theo trọng số này
    speciesWeights: {
      rice: 30, tomato: 26, strawberry: 20, potato: 20, rose: 16, sunflower: 14,
      chicken: 30, cow: 22, bee: 14, sheep: 16, goat: 16
    },
    rewards: {
      seed_lv1:      { type: 'seed',   level: [1, 1] },
      seed_lv2:      { type: 'seed',   level: [2, 2] },
      seed_lv3:      { type: 'seed',   level: [3, 3] },
      animal_lv1:    { type: 'animal', level: [1, 1] },
      animal_lv2:    { type: 'animal', level: [2, 2] },
      animal_lv3:    { type: 'animal', level: [3, 3] },
      seed_gene1:    { type: 'seed',   level: [1, 2], geneTier: 1, purity: [1, 1] },
      seed_gene2:    { type: 'seed',   level: [2, 3], geneTier: 1, purity: [2, 2] },
      animal_gene1:  { type: 'animal', level: [1, 2], geneTier: 1, purity: [1, 1] },
      animal_gene2:  { type: 'animal', level: [2, 3], geneTier: 1, purity: [2, 2] },
      seed_fusion:   { type: 'seed',   level: [2, 3], geneTier: 2, purity: [1, 1] },
      animal_fusion: { type: 'animal', level: [2, 3], geneTier: 2, purity: [1, 1] },
      seed_mythic:   { type: 'seed',   level: [3, 3], geneTier: 3, purity: [1, 1] },
      animal_mythic: { type: 'animal', level: [3, 3], geneTier: 3, purity: [1, 1] },
      clover:        { type: 'booster', id: 'clover',     qty: 1 },
      clover_2:      { type: 'booster', id: 'clover',     qty: 2 },
      stabilizer:    { type: 'booster', id: 'stabilizer', qty: 1 },
      stabilizer_2:  { type: 'booster', id: 'stabilizer', qty: 2 },
      stardust:      { type: 'booster', id: 'stardust',   qty: 1 },
      tonic:         { type: 'booster', id: 'tonic',      qty: 2 },
      loupe:         { type: 'booster', id: 'loupe',      qty: 1 },
      manure_s:      { type: 'material', id: 'manure', qty: 3 },
      straw_m:       { type: 'material', id: 'straw',  qty: 10 },
      coins_s:       { type: 'currency', coins: 150 },
      gems_s:        { type: 'currency', gems: 10 },
      mascot_temp:   { type: 'mascot', pool: 'temp' },
      mascot_perm:   { type: 'mascot', pool: 'perm' },
      mascot_rare:   { type: 'mascot', pool: 'permRare' }
    },
    boxes: {
      sprout: {
        cost: { coins: 300 },
        ticket: 'sprout',
        multi: { count: 10, costMult: 9, guaranteeMinRarity: 'epic' },
        rarityWeights: { common: 6200, rare: 2800, epic: 850, legendary: 150, mythic: 0 },
        pity: { epic: 10, legendary: 60 },
        pool: {
          common:    { seed_lv1: 38, animal_lv1: 26, seed_lv2: 16, coins_s: 10, manure_s: 10 },
          rare:      { seed_lv3: 22, animal_lv2: 26, clover: 20, tonic: 16, straw_m: 16 },
          epic:      { seed_gene1: 32, animal_gene1: 26, mascot_temp: 28, stabilizer: 14 },
          legendary: { mascot_perm: 60, seed_fusion: 20, animal_fusion: 20 },
          mythic:    {}
        }
      },
      star: {
        cost: { gems: 60 },
        ticket: 'star',
        multi: { count: 10, costMult: 9, guaranteeMinRarity: 'epic' },
        rarityWeights: { common: 0, rare: 5300, epic: 3500, legendary: 1000, mythic: 200 },
        pity: { legendary: 20, mythic: 90 },
        pool: {
          common:    {},
          rare:      { seed_lv3: 24, animal_lv3: 20, clover_2: 20, stardust: 14, loupe: 10, gems_s: 12 },
          epic:      { seed_gene2: 26, animal_gene2: 24, mascot_temp: 34, stabilizer_2: 16 },
          legendary: { mascot_perm: 56, seed_fusion: 22, animal_fusion: 22 },
          mythic:    { seed_mythic: 30, animal_mythic: 30, mascot_rare: 40 }
        }
      }
    },
    mascotPools: {
      temp:     { jade_rabbit: 25, ladybug: 25, squirrel: 20, owl: 15, worker_bee: 15 },
      perm:     { fortune_cat: 24, rain_toad: 22, golden_buffalo: 22, farm_dog: 22, white_swan: 6, golden_carp: 4 },
      permRare: { white_swan: 50, golden_carp: 50 }
    },
    duplicatePerm: { maxStars: 5, overflowGems: 20 }
  },

  /* ---------------------------------------------------------- LINH VẬT */
  mascots: {
    shrineSlots: 3,
    durationMin: { jade_rabbit: 15, ladybug: 20, squirrel: 30, owl: 15, worker_bee: 20, firefly: 10 },
    effects: {
      jade_rabbit:    [ { key: 'plant.timeMult', mult: 0.75 } ],
      ladybug:        [ { key: 'gene.keep', add: 0.08 }, { key: 'gene.purityUp', add: 0.06 } ],
      squirrel:       [ { key: 'production.timeMult', mult: 0.8 } ],
      owl:            [ { key: 'gene.spawn', mult: 2 } ],
      worker_bee:     [ { key: 'harvest.units', mult: 1.3 } ],
      firefly:        [ { key: 'gene.spawn', mult: 1.5 } ],
      fortune_cat:    [ { key: 'coins.mult', mult: 1.10, perStar: 0.02 } ],
      rain_toad:      [ { key: 'plant.timeMult', mult: 0.92, perStar: -0.015 }, { key: 'weather.rain', mult: 1.6 } ],
      golden_buffalo: [ { key: 'harvest.units', mult: 1.12, perStar: 0.03 } ],
      farm_dog:       [ { key: 'barn.cap', add: 20, perStar: 10 } ],
      white_swan:     [ { key: 'gene.keep', add: 0.04, perStar: 0.01 } ],
      golden_carp:    [ { key: 'merge.breakthrough', add: 0.03, perStar: 0.01 } ],
      nightingale:    [ { key: 'combo.windowMs', add: 1000 }, { key: 'gene.spawn', mult: 1.1 } ]
    }
  },

  /* ---------------------------------------------------------- THẾ GIỚI: THỜI TIẾT / TRĂNG / SAO BĂNG */
  world: {
    weather: {
      slotMinutes: 6,
      weights: { sunny: 40, cloudy: 25, rain: 25, storm: 10 },
      effects: {
        sunny:  { plantTimeMult: 0.95, geneWeights: { solar: 1.5 } },
        cloudy: { plantTimeMult: 1.00, geneWeights: { lunar: 1.2 } },
        rain:   { plantTimeMult: 0.88, geneWeights: { crystal: 1.6 } },
        storm:  { plantTimeMult: 1.00, geneWeights: { blaze: 1.3, crystal: 1.3 } }
      },
      rainbowMinutes: 3,
      rainbowFusionMult: 2.0
    },
    moon: {
      synodicDays: 29.530588853,
      epochNewMoonUTC: '2000-01-06T18:14:00Z',
      fullWindowDays: 1.2,
      lunarWeightMult: 3,
      spawnMult: 1.5
    },
    meteor: {
      intervalSec: [25, 60],
      peakIntervalSec: [8, 20],
      peakWindowDays: 1,
      stardustChance: 0.85,
      gemReward: 3,
      stellarFusionMult: 2.0
    },
    earth: { maxProgress: 100 },
    idleFirefly: { idleSec: 45, visibleSec: 9 }
  },

  /* ---------------------------------------------------------- BÍ ẨN (kích hoạt ẩn) */
  secrets: {
    thunderChance: 0.35,
    whiteTigerChance: 0.30,
    octaveCombo: 8,
    beanTaps: 7,
    beanTapWindowMs: 2600,
    renameWords: ['trái đất', 'trai dat', 'earth'],
    rewards: {
      fullmoon:  { gems: 10 },
      meteor:    { rp: 10 },
      thunder:   { rp: 30 },
      whitetiger:{ rp: 30 },
      octave:    { mascot: 'nightingale' },
      mendel:    { rp: 25, boosters: { loupe: 1 } },
      firefly:   { mascot: 'firefly' },
      fireflyRepeat: { coins: 50 },
      bean:      { tickets: { star: 1 } },
      rename:    { gems: 50 },
      clover4:   { gems: 10 },
      rainbow:   { rp: 15 },
      earthday:  { gems: 22, rp: 22 }
    }
  },

  /* ---------------------------------------------------------- TINH CHẤT GEN (tính năng mở rộng — đang TẮT) */
  essence: {
    decomposeYield: { 1: [0, 1, 2, 4, 7, 15], 2: [0, 2, 4, 7, 12, 25], 3: [0, 4, 7, 12, 20, 40] },
    injectCost: { 1: 3, 2: 8, 3: 20 },
    injectChance: { 1: 0.7, 2: 0.45, 3: 0.25 }
  }
};
