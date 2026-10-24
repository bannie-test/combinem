/*
 * NOA FARM — BẢNG CÂN BẰNG (Balance / Rates)
 * ============================================================
 * MỌI tỉ lệ, xác suất, trọng số, giá, thời gian của game đều nằm ở file này.
 * Code trong js/ KHÔNG chứa số "cứng" — luôn đọc từ NOA.BALANCE.
 *
 * Quy ước:
 *   - Xác suất viết dạng 0..1   (0.25 = 25%)
 *   - Trọng số (weights) là số tương đối, không cần cộng đủ 100
 *   - Thời gian tính bằng giây (Sec) hoặc phút (Min) như tên biến
 *   - Mảng "ByLevel" dùng index = cấp (index 0 bỏ trống)
 *
 * Sau khi sửa: mở game, bảng Dev > "Kiểm tra cấu hình" sẽ báo lỗi nếu có số sai.
 * Muốn kiểm chứng tỉ lệ thực tế: chạy  `node tools/simulate.mjs`
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

NOA.BALANCE = {
  meta: { version: '0.1.0', saveVersion: 1 },

  /* ---------------------------------------------------------- THỜI GIAN */
  time: {
    timeScale: 1,        // nhân MỌI thời lượng (trồng, chuồng, hồi năng lượng, linh vật). 0.1 = nhanh gấp 10
    dayResetHour: 0,     // giờ đổi ngày cho phần thưởng đăng nhập (giờ máy người chơi)
    nightStartHour: 18,  // từ 18:00 ...
    nightEndHour: 6      // ... đến 05:59 là ban đêm
  },

  /* ---------------------------------------------------------- NĂNG LƯỢNG */
  energy: {
    start: 100,
    max: 100,
    regenSeconds: 45     // hồi 1 năng lượng mỗi 45 giây
  },

  /* ---------------------------------------------------------- BÀN MERGE & KHO */
  board: {
    cols: 7,
    rows: 7,
    storageStart: 16,    // số ô kho ban đầu
    storageMax: 64
  },

  /* ---------------------------------------------------------- NÔNG TRẠI */
  farm: {
    plotsStart: 3,
    plotsMax: 8,
    plotCost:     [0, 0, 0, 600, 1500, 3500, 7000, 12000], // giá mở ô đất thứ i
    plotLevelReq: [1, 1, 1, 3,   5,    7,    9,    11],
    pensStart: 1,
    pensMax: 5,
    penCost:      [0, 900, 2500, 6000, 12000],
    penLevelReq:  [1, 3,   5,    8,    11],
    feedCapacity: 12     // số suất ăn tối đa trong 1 chuồng
  },

  /* ---------------------------------------------------------- LOÀI: GIÁ / THỜI GIAN / MỞ KHÓA */
  // price      : giá bán 1 "đơn vị" sản phẩm cấp 1 (1★, không gen)
  // growSec    : thời gian trồng hạt Lv1 (cây)       | cycleSec: 1 chu kỳ sản xuất Lv1 (vật nuôi)
  // unlockLevel: cấp người chơi để loài xuất hiện trong máy tạo
  // spawnWeight: trọng số xuất hiện trong máy tạo
  species: {
    rice:       { price: 8,  growSec: 20, unlockLevel: 1, spawnWeight: 32 },
    tomato:     { price: 10, growSec: 30, unlockLevel: 1, spawnWeight: 26 },
    strawberry: { price: 14, growSec: 40, unlockLevel: 2, spawnWeight: 20 },
    rose:       { price: 16, growSec: 50, unlockLevel: 3, spawnWeight: 16 },
    potato:     { price: 12, growSec: 35, unlockLevel: 4, spawnWeight: 22 },
    sunflower:  { price: 18, growSec: 60, unlockLevel: 5, spawnWeight: 14 },
    chicken:    { price: 12, cycleSec: 30, unlockLevel: 1, spawnWeight: 34 },
    cow:        { price: 16, cycleSec: 45, unlockLevel: 3, spawnWeight: 26 },
    sheep:      { price: 20, cycleSec: 60, unlockLevel: 4, spawnWeight: 22 },
    goat:       { price: 18, cycleSec: 50, unlockLevel: 6, spawnWeight: 20 },
    bee:        { price: 24, cycleSec: 70, unlockLevel: 7, spawnWeight: 16 },
    // Giống lai (chỉ có được từ Viện lai tạo). Giá = trung bình 2 loài bố mẹ × hệ số này
    pomato:     { hybridPriceMult: 1.3, growSec: 45 },
    rosaberry:  { hybridPriceMult: 1.3, growSec: 55 },
    geep:       { hybridPriceMult: 1.3, cycleSec: 65 }
  },

  /* ---------------------------------------------------------- MÁY TẠO (Generators) */
  generators: {
    seedSack:  { energy: 1 },      // Túi hạt giống: tốn 1 năng lượng / lần chạm
    incubator: { energy: 2 },      // Lồng ấp: tốn 2 năng lượng / lần chạm
    spawnStats: {                  // khoảng chỉ số khi vật phẩm mới sinh ra, theo cấp
      1: [3, 14],
      2: [12, 28],
      3: [24, 42]
    },
    carrierChance: 0.12            // tỉ lệ vật phẩm mới sinh mang GEN LẶN (ẩn, không hiển thị)
  },

  /* ---------------------------------------------------------- MERGE GIỐNG (cây & vật nuôi) */
  merge: {
    maxLevel: 5,
    statCapByLevel: [0, 25, 45, 65, 85, 100], // trần chỉ số gốc theo cấp
    statGain: [4, 12],                        // con = trung bình bố mẹ + ngẫu nhiên [4..12]
    // ĐỘT PHÁ: merge 2 vật Lv n có xác suất ra thẳng Lv n+2 (index = cấp bố mẹ)
    breakthroughChance: [0, 0.07, 0.06, 0.05, 0, 0],
    breakthroughStatBonus: 8,
    comboWindowMs: 2400,                      // merge liên tiếp trong khoảng này = combo (cao độ âm thanh tăng dần)
    maxChance: 0.95                           // trần của mọi xác suất sau khi cộng dồn bonus
  },

  /* ---------------------------------------------------------- GEN (phẩm chất hiếm) */
  gene: {
    // Thường + Thường -> xuất hiện gen mới (cộng thêm % từ Viện, linh vật, sự kiện)
    spawnChance: 0.010,
    keep: {
      withNormal: 0.22,   // Cao cấp + Thường        -> giữ gen (THẤP)
      sameGene:   0.88,   // Cao cấp + Cao cấp cùng gen -> giữ gen (CAO)
      diffGene:   0.62    // Cao cấp + Cao cấp khác gen (không dung hợp) -> giữ 1 trong 2
    },
    purityLossWithNormal: 1,          // giữ được gen khi merge với vật thường: độ thuần -1 (tối thiểu 1)
    lostGeneBecomesRecessive: true,   // gen bị mất -> chìm thành gen lặn, có thể thức tỉnh lại
    // Cùng gen, cùng độ thuần p -> lên p+1 (index = p hiện tại)
    purityUpChance: [0, 0.48, 0.34, 0.22, 0.12],
    purityUpUnequalFactor: 0.5,       // 2 bên lệch độ thuần: tỉ lệ lên = tỉ lệ trên × 0.5
    maxPurity: 5,                     // ◆5 = SIÊU GIỐNG THUẦN CHỦNG
    fusion: {
      chanceByTier: { 2: 0.22, 3: 0.09 }, // dung hợp ra gen tầng 2 / tầng 3
      minPurity: 2                        // cả 2 gen phải đạt ◆2 trở lên mới dung hợp được
    },
    // Điểm cộng vào chỉ số "sở trường" của gen, theo độ thuần (index = ◆)
    statBonusByPurity: [0, 8, 12, 17, 23, 32],
    allFavorShare: 0.5,               // gen sở trường "all": mỗi chỉ số nhận 50% số điểm trên
    // Hệ số giá theo TẦNG gen, theo độ thuần (index = ◆). ◆5 là Siêu giống
    priceMult: {
      1: [1, 4, 6, 9, 14, 40],
      2: [1, 9, 13, 19, 28, 100],
      3: [1, 25, 35, 55, 85, 300]
    },
    // Khi sinh gen mới: gen nào xuất hiện (trọng số)
    spawnWeights: {
      plant:  { solar: 30, lunar: 24, blaze: 24, crystal: 22 },
      animal: { dragon: 20, qilin: 30, tortoise: 30, phoenix: 20 }
    },
    firstDiscoveryRP: 15,             // điểm nghiên cứu thưởng khi khám phá 1 gen lần đầu
    firstGeneAtMerge: 5               // lần merge giống thứ 5 chắc chắn thức tỉnh gen đầu tiên (dạy người chơi mới). 0 = tắt
  },

  /* ---------------------------------------------------------- GEN LẶN (ẩn — tính năng bí ẩn) */
  recessive: {
    expressChance: 0.25,       // 2 vật cùng mang 1 gen lặn -> 25% biểu hiện (đúng tỉ lệ Mendel 1/4)
    inheritBothCarriers: 0.667,// không biểu hiện: con vẫn mang gen lặn với xác suất này (≈ 1/2 tổng)
    inheritOneCarrier: 0.5     // chỉ 1 bên mang: con mang gen lặn 50%
  },

  /* ---------------------------------------------------------- THU HOẠCH & SẢN XUẤT */
  harvest: {
    baseUnitsByLevel: [0, 1, 2, 4, 8, 16],     // sản lượng gốc (đơn vị) theo cấp giống
    timeMultByLevel:  [0, 1, 1.5, 2.1, 2.7, 3.3],
    yieldBonusPerPoint: 0.01,                  // mỗi điểm Năng suất: +1% sản lượng
    growthReductionPerPoint: 0.005,            // mỗi điểm Sinh trưởng: -0.5% thời gian
    maxTimeReduction: 0.6,                     // giảm tối đa 60%
    starThresholds: [0, 20, 40, 60, 80],       // Phẩm chất -> sao: <20 = 1★, 20+ = 2★ ... 80+ = 5★
    starJitter: 8,                             // dao động ± điểm khi tính sao cho từng sản phẩm
    geneProductChance: 0.6,                    // mỗi sản phẩm của giống có gen: 60% mang gen
    geneRP: 1,                                 // mỗi sản phẩm có gen: +1 điểm nghiên cứu
    naturalCloverChance: 0.002,                // nhặt được Cỏ bốn lá khi thu hoạch (bí ẩn)
    maxProductTier: 3,
    // Gộp sản lượng thành sản phẩm cấp cao để bàn không bị ngập:
    // chỉ gộp thành cấp 2 khi 1 lần thu hoạch có >= 4 đơn vị, cấp 3 khi >= 8 đơn vị
    packFromUnits: { 2: 4, 3: 8 }
  },

  /* ---------------------------------------------------------- SẢN PHẨM */
  product: {
    tierUnits:      [0, 1, 2, 4],              // sản phẩm cấp 2 = 2 đơn vị, cấp 3 = 4 đơn vị
    tierValueBonus: [0, 1, 1.1, 1.25],         // thưởng giá trị khi chế biến lên cấp
    starPriceMult:  [0, 1, 1.25, 1.6, 2.1, 2.8],
    starUpChanceOnMerge: 0.2                   // merge 2 sản phẩm: 20% sao +1
  },

  /* ---------------------------------------------------------- BÁN HÀNG & THỊ TRƯỜNG */
  market: {
    saturationStep: 0.05,      // mỗi lần bán cùng 1 loại trong ngày: giá -5%
    saturationFloor: 0.45,     // giá thấp nhất còn 45%
    seedSellBase: 4,           // giá bán hạt / con giống = seedSellBase × levelMult[cấp] × hệ số gen
    seedLevelMult: [0, 1, 2.5, 6, 14, 32],
    confirmSellMinLevel: 4     // bán vật phẩm từ cấp này trở lên (hoặc có gen) phải xác nhận
  },

  /* ---------------------------------------------------------- ĐƠN HÀNG */
  orders: {
    slots: 4,
    refillDelaySec: 3,
    swapCooldownSec: 45,
    linesByLevel: [ { level: 1, max: 1 }, { level: 3, max: 2 }, { level: 6, max: 3 } ],
    countRange: [1, 3],
    tierWeightsByLevel: [
      { level: 1, weights: [100, 0, 0] },
      { level: 3, weights: [70, 30, 0] },
      { level: 6, weights: [50, 35, 15] },
      { level: 9, weights: [40, 38, 22] }
    ],
    rewardMult: 1.5,           // thưởng = giá trị hàng giao × hệ số này
    xpPerCoin: 0.15,
    minXP: 5,
    vip: {
      unlockLevel: 4,
      chance: 0.18,
      rewardMult: 2.6,
      rpRange: [4, 12],
      gemChance: 0.35,
      gemRange: [2, 6],
      requireGeneChance: 0.6,  // VIP: 60% yêu cầu hàng có gen, còn lại yêu cầu tối thiểu 3★
      minStars: 3
    },
    earth: {                   // Đơn "Gửi về Trái Đất" (cốt truyện)
      unlockLevel: 3,
      chance: 0.2,
      progress: 2,             // mỗi đơn +2% tiến độ hồi sinh Trái Đất
      rp: 3
    }
  },

  /* ---------------------------------------------------------- KINH NGHIỆM & CẤP */
  level: {
    // XP cần để lên từ cấp L lên L+1 (index = L)
    xpToNext: [0, 40, 80, 130, 190, 260, 340, 430, 530, 640, 760, 890, 1030, 1180, 1340],
    xpGrowthAfterTable: 170,   // sau bảng: mỗi cấp cần thêm 170 XP so với cấp trước
    maxLevel: 60
  },
  xp: {
    mergePerLevel: 1,          // merge vật cấp L: +L XP
    harvestPerUnit: 0.5,
    discovery: 20,             // khám phá gen / giống mới
    hybrid: 30,
    labUpgrade: 25
  },

  /* ---------------------------------------------------------- MỞ KHÓA TÍNH NĂNG (theo cấp người chơi) */
  unlocks: {
    blindbox: 2,
    ranch: 3,       // Trại nghiên cứu vật nuôi
    shrine: 3,      // Đền linh vật
    vipOrders: 4,
    hybrid: 5,      // lai chéo 2 loài (cần thêm Viện cấp 2)
    starBox: 5
  },

  /* ---------------------------------------------------------- VIỆN NGHIÊN CỨU */
  // Áp dụng cho cả 🌱 Nhà kính lai tạo (cây) và 🐾 Trại nghiên cứu vật nuôi (động vật), tiến độ tách riêng.
  // success     : cộng vào tỉ lệ giữ gen / lên độ thuần / dung hợp
  // spawnAdd    : cộng vào tỉ lệ xuất hiện gen mới
  // breakAdd    : cộng vào tỉ lệ Đột phá
  // slots       : số ô lai chéo chạy song song
  // discoveryAdd: cộng vào tỉ lệ lai thành công giống mới
  // purityCap   : độ thuần tối đa đạt được     | fusionTier: tầng gen dung hợp tối đa
  // lv2Spawn    : tỉ lệ máy tạo ra thẳng vật phẩm Lv2
  labs: {
    maxLevel: 10,
    levels: [
      null,
      { cost: null,                    success: 0.00, spawnAdd: 0.000, breakAdd: 0.000, slots: 0, discoveryAdd: 0.00, purityCap: 2, fusionTier: 1, lv2Spawn: 0.00 },
      { cost: { coins: 600,   rp: 8 },   success: 0.02, spawnAdd: 0.003, breakAdd: 0.005, slots: 1, discoveryAdd: 0.00, purityCap: 3, fusionTier: 1, lv2Spawn: 0.03 },
      { cost: { coins: 1600,  rp: 20 },  success: 0.04, spawnAdd: 0.006, breakAdd: 0.010, slots: 1, discoveryAdd: 0.03, purityCap: 3, fusionTier: 2, lv2Spawn: 0.05 },
      { cost: { coins: 3200,  rp: 36 },  success: 0.06, spawnAdd: 0.009, breakAdd: 0.015, slots: 1, discoveryAdd: 0.06, purityCap: 4, fusionTier: 2, lv2Spawn: 0.07 },
      { cost: { coins: 5600,  rp: 56 },  success: 0.08, spawnAdd: 0.012, breakAdd: 0.020, slots: 2, discoveryAdd: 0.09, purityCap: 4, fusionTier: 2, lv2Spawn: 0.09 },
      { cost: { coins: 9000,  rp: 80 },  success: 0.10, spawnAdd: 0.016, breakAdd: 0.025, slots: 2, discoveryAdd: 0.12, purityCap: 5, fusionTier: 3, lv2Spawn: 0.11 },
      { cost: { coins: 13500, rp: 110 }, success: 0.12, spawnAdd: 0.020, breakAdd: 0.030, slots: 2, discoveryAdd: 0.15, purityCap: 5, fusionTier: 3, lv2Spawn: 0.13 },
      { cost: { coins: 19500, rp: 150 }, success: 0.14, spawnAdd: 0.025, breakAdd: 0.035, slots: 3, discoveryAdd: 0.18, purityCap: 5, fusionTier: 3, lv2Spawn: 0.15 },
      { cost: { coins: 27000, rp: 200 }, success: 0.17, spawnAdd: 0.030, breakAdd: 0.040, slots: 3, discoveryAdd: 0.22, purityCap: 5, fusionTier: 3, lv2Spawn: 0.18 },
      { cost: { coins: 38000, rp: 270 }, success: 0.20, spawnAdd: 0.040, breakAdd: 0.050, slots: 4, discoveryAdd: 0.27, purityCap: 5, fusionTier: 3, lv2Spawn: 0.22 }
    ]
  },

  /* ---------------------------------------------------------- LAI CHÉO 2 LOÀI (Viện) */
  hybrid: {
    durationSec: 90,          // thời gian lai
    costCoins: 200,           // phí mỗi lần lai
    baseDiscovery: 0.35,      // tỉ lệ thành công với cặp loài TƯƠNG THÍCH (cộng discoveryAdd của Viện)
    vigorBonus: 10,           // "Ưu thế lai": +10 điểm mọi chỉ số cho giống lai
    failRefundRP: 3,          // thất bại: hoàn điểm nghiên cứu
    // Thất bại: trả lại vật bố/mẹ có cấp cao hơn, vật còn lại mất
    hybridSpawnWeight: 6      // sau khi khám phá, giống lai xuất hiện trong máy tạo với trọng số này
  },

  /* ---------------------------------------------------------- PHẦN THƯỞNG ĐĂNG NHẬP (7 ngày, lặp lại) */
  // Kiểu phần thưởng dùng chung: coins, gems, energy, rp, tickets{sprout,star}, boosters{clover,stabilizer,stardust,tonic,loupe}
  login: {
    resetOnMiss: false,       // false = bỏ lỡ ngày không bị reset chuỗi
    days: [
      { coins: 200 },
      { energy: 30, boosters: { clover: 1 } },
      { tickets: { sprout: 1 } },
      { coins: 400, rp: 15 },
      { gems: 15 },
      { energy: 40, boosters: { stabilizer: 1 } },
      { gems: 30, tickets: { star: 1 } }
    ]
  },

  /* ---------------------------------------------------------- PHẦN THƯỞNG LÊN CẤP */
  levelRewards: {
    2:  { coins: 300,  gems: 10, tickets: { sprout: 1 } },
    3:  { coins: 400,  energy: 30, boosters: { clover: 1 } },
    4:  { coins: 500,  rp: 10, boosters: { stabilizer: 1 } },
    5:  { coins: 700,  gems: 20, tickets: { star: 1 } },
    6:  { coins: 800,  energy: 40, boosters: { stardust: 1 } },
    7:  { coins: 1000, rp: 20, tickets: { sprout: 2 } },
    8:  { coins: 1200, gems: 25 },
    9:  { coins: 1400, boosters: { clover: 2, tonic: 2 } },
    10: { coins: 2000, gems: 40, tickets: { star: 2 } }
  },
  // Cấp cao hơn bảng trên: tính theo công thức
  levelRewardFormula: { coinsBase: 1000, coinsPerLevel: 150, gems: 10, energy: 30, starTicketEvery: 5 },

  /* ---------------------------------------------------------- VẬT PHẨM HỖ TRỢ / MAY MẮN */
  boosters: {
    clover:     { geneKeepAdd: 0.15, purityUpAdd: 0.10, fusionAdd: 0.08, spawnMult: 2.5, breakthroughAdd: 0.03 },
    stabilizer: { noGeneLoss: true, noPurityLoss: true },     // Bình ổn gen: không mất gen, không giảm độ thuần
    stardust:   { breakthroughAdd: 0.10, fusionAdd: 0.10 },   // Bụi sao
    tonic:      {},                                           // Thuốc tăng trưởng: xong ngay 1 ô đất / chuồng
    loupe:      {}                                            // Kính lúp gen: soi gen lặn
  },

  /* ---------------------------------------------------------- CỬA HÀNG */
  // price: { coins } = Xu (kiếm trong game) | { gems } = Ngọc (từ nạp tiền / phần thưởng)
  shop: {
    items: [
      { id: 'energy_50',    grant: { energy: 50 },                 price: { gems: 20 } },
      { id: 'energy_small', grant: { energy: 15 },                 price: { coins: 600 } },
      { id: 'clover_1',     grant: { boosters: { clover: 1 } },     price: { coins: 900 } },
      { id: 'clover_5',     grant: { boosters: { clover: 5 } },     price: { gems: 30 } },
      { id: 'stabilizer_1', grant: { boosters: { stabilizer: 1 } }, price: { gems: 25 } },
      { id: 'stardust_1',   grant: { boosters: { stardust: 1 } },   price: { coins: 1500 } },
      { id: 'tonic_3',      grant: { boosters: { tonic: 3 } },      price: { gems: 12 } },
      { id: 'loupe_1',      grant: { boosters: { loupe: 1 } },      price: { coins: 2500 } },
      { id: 'storage_8',    grant: { storage: 8 },                  price: { gems: 40 } },
      { id: 'ticket_star',  grant: { tickets: { star: 1 } },        price: { gems: 55 } }
    ],
    exchange: { gems: 10, coins: 800 }   // đổi 10 Ngọc -> 800 Xu
  },

  /* ---------------------------------------------------------- BLINDBOX (gacha) */
  gacha: {
    rarityOrder: ['common', 'rare', 'epic', 'legendary', 'mythic'],
    // Định nghĩa phần thưởng (dùng chung cho các hộp)
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
      coins_s:       { type: 'currency', coins: 150 },
      gems_s:        { type: 'currency', gems: 10 },
      energy_s:      { type: 'currency', energy: 10 },
      energy_m:      { type: 'currency', energy: 25 },
      mascot_temp:   { type: 'mascot', pool: 'temp' },
      mascot_perm:   { type: 'mascot', pool: 'perm' },
      mascot_rare:   { type: 'mascot', pool: 'permRare' }
    },
    boxes: {
      sprout: {                                   // 🌱 Hộp Mầm Xanh
        cost: { coins: 300 },
        ticket: 'sprout',                         // dùng vé thay cho giá
        multi: { count: 10, costMult: 9, guaranteeMinRarity: 'epic' }, // mở 10: giá ×9, chắc chắn ≥1 Sử thi
        rarityWeights: { common: 6200, rare: 2800, epic: 850, legendary: 150, mythic: 0 },
        pity: { epic: 10, legendary: 60 },        // tối đa 10 lần có Sử thi+, 60 lần có Huyền thoại+
        pool: {
          common:    { seed_lv1: 38, animal_lv1: 30, seed_lv2: 16, coins_s: 10, energy_s: 6 },
          rare:      { seed_lv3: 22, animal_lv2: 26, clover: 20, tonic: 16, energy_m: 16 },
          epic:      { seed_gene1: 32, animal_gene1: 26, mascot_temp: 28, stabilizer: 14 },
          legendary: { mascot_perm: 60, seed_fusion: 20, animal_fusion: 20 },
          mythic:    {}
        }
      },
      star: {                                     // 🌠 Hộp Tinh Tú
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
    // Trọng số linh vật trong từng nhóm
    mascotPools: {
      temp:     { jade_rabbit: 25, ladybug: 25, squirrel: 20, owl: 15, worker_bee: 15 },
      perm:     { fortune_cat: 24, rain_toad: 22, golden_buffalo: 22, farm_dog: 22, white_swan: 6, golden_carp: 4 },
      permRare: { white_swan: 50, golden_carp: 50 }
    },
    duplicatePerm: { maxStars: 5, overflowGems: 20 },  // trùng linh vật vĩnh viễn: +1 sao; đủ 5 sao -> đổi Ngọc
    weightScale: 10000                                // (chỉ để hiển thị) tổng trọng số chuẩn
  },

  /* ---------------------------------------------------------- LINH VẬT */
  // Tạm thời: kích hoạt ngay khi nhận, hết hạn sau durationMin (trùng thì cộng dồn thời gian)
  // Vĩnh viễn: đặt vào Đền linh vật (tối đa shrineSlots) để có hiệu lực mãi mãi; trùng -> +1 sao
  // Hiệu ứng: { key, mult } nhân  |  { key, add } cộng   |  perStar: tăng thêm mỗi sao từ sao thứ 2
  mascots: {
    shrineSlots: 3,
    durationMin: { jade_rabbit: 15, ladybug: 20, squirrel: 30, owl: 15, worker_bee: 20, firefly: 10 },
    effects: {
      jade_rabbit:    [ { key: 'plant.timeMult', mult: 0.75 } ],
      ladybug:        [ { key: 'gene.keep', add: 0.08 }, { key: 'gene.purityUp', add: 0.06 } ],
      squirrel:       [ { key: 'energy.regenMult', mult: 2 } ],
      owl:            [ { key: 'gene.spawn', mult: 2 } ],
      worker_bee:     [ { key: 'harvest.units', mult: 1.3 } ],
      firefly:        [ { key: 'gene.spawn', mult: 1.5 } ],
      fortune_cat:    [ { key: 'coins.mult', mult: 1.10, perStar: 0.02 } ],
      rain_toad:      [ { key: 'plant.timeMult', mult: 0.92, perStar: -0.015 }, { key: 'weather.rain', mult: 1.6 } ],
      golden_buffalo: [ { key: 'harvest.units', mult: 1.12, perStar: 0.03 } ],
      farm_dog:       [ { key: 'energy.max', add: 10, perStar: 5 } ],
      white_swan:     [ { key: 'gene.keep', add: 0.04, perStar: 0.01 } ],
      golden_carp:    [ { key: 'merge.breakthrough', add: 0.03, perStar: 0.01 } ],
      nightingale:    [ { key: 'combo.windowMs', add: 1000 }, { key: 'gene.spawn', mult: 1.1 } ]
    }
  },

  /* ---------------------------------------------------------- THẾ GIỚI: THỜI TIẾT / TRĂNG / SAO BĂNG */
  world: {
    weather: {
      slotMinutes: 6,                                   // thời tiết đổi mỗi 6 phút (thời gian thực)
      weights: { sunny: 40, cloudy: 25, rain: 25, storm: 10 },
      effects: {
        sunny:  { plantTimeMult: 0.95, geneWeights: { solar: 1.5 } },
        cloudy: { plantTimeMult: 1.00, geneWeights: { lunar: 1.2 } },
        rain:   { plantTimeMult: 0.88, geneWeights: { crystal: 1.6 } },
        storm:  { plantTimeMult: 1.00, geneWeights: { blaze: 1.3, crystal: 1.3 } }
      },
      rainbowMinutes: 3,          // sau mưa chuyển nắng: cầu vồng xuất hiện 3 phút
      rainbowFusionMult: 2.0      // trong lúc có cầu vồng: tỉ lệ dung hợp ra gen Cầu Vồng ×2
    },
    moon: {
      synodicDays: 29.530588853,
      epochNewMoonUTC: '2000-01-06T18:14:00Z',
      fullWindowDays: 1.2,        // ± số ngày quanh rằm được tính là "trăng tròn"
      lunarWeightMult: 3,         // đêm trăng tròn: gen Nguyệt Quang xuất hiện ×3
      spawnMult: 1.5              // đêm trăng tròn: tỉ lệ xuất hiện gen ×1.5
    },
    meteor: {
      intervalSec: [25, 60],      // sao băng xuất hiện mỗi 25–60 giây (đêm có mưa sao băng)
      peakIntervalSec: [8, 20],   // đêm cực điểm
      peakWindowDays: 1,
      stardustChance: 0.85,       // chạm sao băng: 85% nhận Bụi sao, còn lại nhận Ngọc
      gemReward: 3,
      stellarFusionMult: 2.0      // trong mưa sao băng: dung hợp ra Tinh Tú ×2
    },
    earth: { maxProgress: 100 },
    idleFirefly: { idleSec: 45, visibleSec: 9 }  // để yên 45 giây -> đom đóm bay qua
  },

  /* ---------------------------------------------------------- BÍ ẨN (kích hoạt ẩn) */
  secrets: {
    thunderChance: 0.35,          // 🔥 Hỏa Diệm + 💧 Thủy Tinh khi trời giông -> ⚡ Lôi Vũ
    whiteTigerChance: 0.30,       // 🐢 Quy + 🦚 Phụng ban đêm có trăng tròn / sao băng -> 🐅 Bạch Hổ
    octaveCombo: 8,               // combo 8 lần merge = trọn 1 quãng tám
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
      fireflyRepeat: { energy: 5 },   // những lần bắt đom đóm sau
      bean:      { tickets: { star: 1 } },
      rename:    { gems: 50 },
      clover4:   { gems: 10 },
      rainbow:   { rp: 15 },
      earthday:  { gems: 22, rp: 22 }   // 22/4 Ngày Trái Đất
    }
  },

  /* ---------------------------------------------------------- TINH CHẤT GEN (tính năng mở rộng — đang TẮT) */
  essence: {
    // Phân rã vật phẩm có gen -> tinh chất của gen đó. [tầng][độ thuần]
    decomposeYield: { 1: [0, 1, 2, 4, 7, 15], 2: [0, 2, 4, 7, 12, 25], 3: [0, 4, 7, 12, 20, 40] },
    injectCost: { 1: 3, 2: 8, 3: 20 },          // tinh chất cần để tiêm 1 gen vào vật thường
    injectChance: { 1: 0.7, 2: 0.45, 3: 0.25 }  // tỉ lệ tiêm thành công
  }
};
