/*
 * NOA FARM — CẤU HÌNH THANH TOÁN (Payment / IAP)
 * ============================================================
 * TÍNH NĂNG NẠP TIỀN CHƯA ÁP DỤNG.  Toàn bộ luồng đã được dựng sẵn trong
 * js/systems/payment.js — khi tích hợp chỉ cần:
 *   1. Điền các liên kết / endpoint thật bên dưới (thay example.com)
 *   2. Viết phần "TODO" trong adapter tương ứng (googlePlay / appStore / web)
 *   3. Đặt enabled: true và provider: '<tên adapter>'
 *
 * provider:
 *   'disabled'   – mặc định: nút nạp hiện "Sắp ra mắt", không gọi gì ra ngoài
 *   'mock'       – giả lập thanh toán thành công để test luồng cộng Ngọc (chỉ dùng khi dev)
 *   'googlePlay' – Google Play Billing (qua plugin Capacitor/Cordova khi đóng gói app)
 *   'appStore'   – Apple StoreKit
 *   'web'        – cổng thanh toán web (MoMo / ZaloPay / VNPay / Stripe...) qua server của bạn
 *
 * AN TOÀN: Ngọc chỉ được cộng SAU KHI server xác thực hóa đơn (verifyReceipt).
 * Không bao giờ để client tự quyết định cộng tiền ở bản phát hành.
 */
var NOA = globalThis.NOA = globalThis.NOA || {};

NOA.PAYMENT = {
  enabled: false,
  provider: 'disabled',
  mockSuccessRate: 1,          // chỉ cho provider 'mock'
  mockDelayMs: 900,

  // Đơn vị tiền hiển thị theo ngôn ngữ
  displayCurrency: { vi: 'VND', en: 'USD' },

  // Server của bạn (bắt buộc cho appStore / googlePlay / web)
  endpoints: {
    createOrder:   'https://api.example.com/v1/payments/orders',    // TODO: thay bằng endpoint thật
    verifyReceipt: 'https://api.example.com/v1/payments/verify',    // TODO
    restore:       'https://api.example.com/v1/payments/restore',   // TODO
    webhook:       'https://api.example.com/v1/payments/webhook'    // TODO: cổng thanh toán gọi về server
  },

  // Liên kết hiển thị trong game
  links: {
    googlePlay:  'https://play.google.com/store/apps/details?id=com.example.noafarm', // TODO
    appStore:    'https://apps.apple.com/app/id0000000000',                          // TODO
    webCheckout: 'https://pay.example.com/checkout',                                 // TODO
    terms:       'https://example.com/terms',                                        // TODO
    privacy:     'https://example.com/privacy',                                      // TODO
    support:     'support@example.com'                                               // TODO
  },

  // Danh mục sản phẩm nạp. storeIds = mã sản phẩm khai báo trên từng cửa hàng.
  products: [
    { sku: 'gems_60',   type: 'consumable', grant: { gems: 60 },               priceVND: 22000,  priceUSD: 0.99,
      storeIds: { googlePlay: 'noa_gems_60',   appStore: 'com.example.noafarm.gems60' } },
    { sku: 'gems_330',  type: 'consumable', grant: { gems: 330 },  bonus: 30,  priceVND: 109000, priceUSD: 4.99,
      storeIds: { googlePlay: 'noa_gems_330',  appStore: 'com.example.noafarm.gems330' } },
    { sku: 'gems_700',  type: 'consumable', grant: { gems: 700 },  bonus: 100, priceVND: 219000, priceUSD: 9.99,
      storeIds: { googlePlay: 'noa_gems_700',  appStore: 'com.example.noafarm.gems700' } },
    { sku: 'gems_1500', type: 'consumable', grant: { gems: 1500 }, bonus: 300, priceVND: 439000, priceUSD: 19.99,
      storeIds: { googlePlay: 'noa_gems_1500', appStore: 'com.example.noafarm.gems1500' } },
    { sku: 'starter_pack', type: 'one_time', badge: 'starter',
      grant: { gems: 120, coins: 3000, tickets: { star: 2 }, boosters: { clover: 3, stabilizer: 1 } },
      priceVND: 49000, priceUSD: 1.99,
      storeIds: { googlePlay: 'noa_starter', appStore: 'com.example.noafarm.starter' } },
    { sku: 'monthly_card', type: 'subscription', badge: 'monthly',
      grant: { gems: 100 }, daily: { gems: 15, boosters: { tonic: 1 } }, durationDays: 30,
      priceVND: 109000, priceUSD: 4.99,
      storeIds: { googlePlay: 'noa_monthly', appStore: 'com.example.noafarm.monthly' } }
  ]
};
