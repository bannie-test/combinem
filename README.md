# Noa Farm · Nông trại Hành tinh Hạt giống

Prototype chơi được của game **merge + nông trại + lai tạo gen**. Nhiều cây, hoa, con giống giữ nguyên tên loài thật, kết hợp gen fantasy. Câu chuyện xoay quanh một hành tinh nhỏ giữ gen của Trái Đất đã khô cằn.

- 📄 Thiết kế đầy đủ (cốt truyện, hệ thống, tính năng ẩn, thanh toán, font): [`docs/GDD.md`](docs/GDD.md)
- 🇻🇳 / 🇬🇧 Song ngữ Việt / Anh, font đã kiểm tra hiển thị dấu tiếng Việt (Baloo 2, Nunito, Coiny)

## Chạy thử

Không cần cài đặt gì: mở `index.html` bằng trình duyệt (Chrome, Safari, Edge, Firefox). Trên điện thoại, mở file `dist/noa-farm-standalone.html` (một file duy nhất).

## Cấu trúc

```
config/
  balance.js    ← MỌI tỉ lệ, xác suất, giá, thời gian (chỉnh ở đây)
  content.js    ← loài, sản phẩm, gen, giống lai, linh vật, hộp, bí ẩn, cốt truyện
  payment.js    ← thanh toán (đang tắt): provider, endpoint, liên kết, gói nạp
  features.js   ← bật / tắt tính năng (dev panel, thời tiết, bí ẩn, tinh chất gen…)
i18n/vi.js, en.js   ← toàn bộ chữ trong game
js/core/        ← tiện ích, RNG, sự kiện, hooks, bộ cộng dồn tỉ lệ (mods), i18n, thời gian, lưu game, âm thanh
js/systems/     ← logic game (không DOM): gen, merge, nông trại, đơn hàng, viện, gacha, linh vật, thế giới, bí ẩn, thanh toán
js/ui/          ← giao diện: nông trại (kéo thả), viện, blindbox, cửa hàng, sổ tay, cài đặt, hiệu ứng
css/            ← giao diện & hiệu ứng (base, game, gacha)
tools/          ← simulate.mjs (kiểm tra tỉ lệ), build-artifact.mjs (đóng gói 1 file)
tests/smoke.mjs ← kiểm thử end-to-end bằng Playwright
```

## Chỉnh tỉ lệ

1. Sửa số trong `config/balance.js`. Mỗi biến đều có chú thích tiếng Việt.
2. Kiểm chứng bằng mô phỏng:
   ```bash
   node tools/simulate.mjs 50000
   ```
3. Hoặc trong game: ⚙️ → 🛠️ **Công cụ Dev** → "Giả lập 1.000 lần mở hộp" / "Kiểm tra cấu hình".

## Lệnh

| Lệnh | Việc |
|---|---|
| `node tools/simulate.mjs [n]` | Mô phỏng Monte Carlo tỉ lệ gen / đột phá / gacha / pity |
| `node tests/smoke.mjs [--shots dir]` | Chơi thử tự động (Playwright), bắt lỗi console, chụp màn hình |
| `node tools/build-artifact.mjs` | Đóng gói `dist/noa-farm.html` (Artifact) và `dist/noa-farm-standalone.html` |

## Thanh toán

Đã dựng sẵn luồng `createOrder → pay → verify (server) → grant` với sổ cái chống cộng trùng. Hiện đang **tắt**. Xem `config/payment.js` và mục 12 của GDD để biết checklist tích hợp Google Play / App Store / MoMo / ZaloPay / VNPay / Stripe.
