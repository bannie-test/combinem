# Noa Farm · Nông trại Hành tinh Hạt giống

Prototype chơi được của game **merge + nông trại + lai tạo gen**. Nhiều cây, hoa, con giống giữ nguyên tên loài thật, kết hợp gen fantasy. Câu chuyện xoay quanh một hành tinh nhỏ giữ gen của Trái Đất đã khô cằn.

**v0.2:** nông trại là một **bản đồ chia khu** kiểu Hay Day / Township (sân nhà & chợ, ruộng, vườn hoa, khu nghiên cứu, khu chăn nuôi, khu chế biến, bến tàu), kéo để đi và zoom được. Merge diễn ra trong 🌰 **Kho hạt giống** và 🐣 **Chuồng ươm** bên trong các viện nghiên cứu. Thu hoạch cho nông sản **+ hạt giống thế hệ sau + phụ phẩm** (rơm, phấn hoa, phân bón, con non). Nông sản được chế biến ở 4 xưởng rồi giao đơn hoặc chất lên 🚀 Tàu Ong Vàng.

- 📄 Thiết kế đầy đủ (cốt truyện, hệ thống, bản đồ, tính năng ẩn, thanh toán, font, **đề xuất tech stack mobile §20**): [`docs/GDD.md`](docs/GDD.md)
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
js/systems/     ← logic game (không DOM): gen, lưới merge (grids), kho (barn), nông trại & chuồng (farm), chế biến (production),
                   đơn hàng, tàu ong (ship), viện, gacha, linh vật, thế giới, bí ẩn, thanh toán
js/ui/          ← giao diện: bản đồ nông trại (map-view), bàn merge (grid-view), bảng chuồng / xưởng / tàu (panels),
                   đơn hàng, kho, viện, blindbox, cửa hàng, sổ tay, cài đặt, hiệu ứng
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
| `node tests/smoke.mjs [--shots dir]` | Chơi thử tự động cả vòng chơi v2 (Playwright): gieo, vuốt thu hoạch, merge, giao đơn, chuồng, xưởng, tàu, blindbox, đổi ngôn ngữ; bắt lỗi console, chụp màn hình |
| `node tools/build-artifact.mjs` | Đóng gói `dist/noa-farm.html` (Artifact) và `dist/noa-farm-standalone.html` |

## Thanh toán

Đã dựng sẵn luồng `createOrder → pay → verify (server) → grant` với sổ cái chống cộng trùng. Hiện đang **tắt**. Xem `config/payment.js` và mục 12 của GDD để biết checklist tích hợp Google Play / App Store / MoMo / ZaloPay / VNPay / Stripe.
