/*
 * NOA FARM — CỜ TÍNH NĂNG (Feature flags)
 * ------------------------------------------------------------
 * Bật / tắt từng tính năng mà không phải sửa code.
 * Tính năng tắt vẫn giữ nguyên logic trong js/systems/, chỉ không hiện ra.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

NOA.FEATURES = {
  // Bảng công cụ dành cho dev (cộng tiền, tua thời gian, đổi tỉ lệ, giả lập...)
  devPanel: true,

  // Thời tiết thay đổi theo thời gian thực (nắng / mây / mưa / giông)
  weather: true,

  // Sự kiện bầu trời theo lịch thật: đêm trăng tròn, mưa sao băng
  realSkyEvents: true,

  // Các bí ẩn / kích hoạt ẩn (xem docs/GDD.md, mục Tính năng ẩn)
  secrets: true,

  // Gen lặn (gen ẩn, di truyền theo tỉ lệ Mendel)
  recessiveGenes: true,

  // Tinh chất gen: phân rã vật phẩm có gen -> tinh chất; tiêm tinh chất -> gắn gen.
  // ĐÃ CÓ KHUNG LOGIC (js/systems/essence.js), mặc định TẮT để mở ở bản cập nhật sau.
  geneEssence: false,

  // Hướng dẫn tân thủ do robot Đậu dẫn dắt
  tutorial: true,

  // Nhạc nền tự sinh (có thể tắt trong Cài đặt)
  music: true
};
