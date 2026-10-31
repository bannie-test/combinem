# PROGRESS · Noa Farm prototype

Checklist để tiếp tục công việc nếu phiên bị ngắt.

## v0.1
- [x] config/, i18n/, js/core, js/systems, js/ui, css, tools, tests, docs/GDD.md, README.md
- [x] Publish artifact: https://claude.ai/artifact/NG1HrQxXtGhR5JJPiggPAj

## v0.2 · bản đồ chia khu, merge trong kho giống, hạt thế hệ sau, chế biến
- [x] balance.js / content.js v2: ruộng, luống hoa, chuồng, phụ phẩm, công thức chế biến, tàu ong, bản đồ (`content.map`), hướng dẫn v2
- [x] systems mới: grids (Kho hạt giống / Chuồng ươm), barn (kho nông sản), production (xưởng), ship (tàu ong); farm / orders / state / items viết lại
- [x] genetics.offspring: hạt giống / con non thế hệ sau (cấp mẹ − 2, 75% chỉ số, 35% giữ gen)
- [x] i18n: ~800 khóa mỗi ngôn ngữ, đủ cả hai
- [x] UI mới: map-view (camera kéo / zoom / quán tính, vuốt ✂️ thu hoạch), grid-view (merge kéo thả), panels (chọn hạt, chuồng, xưởng, tàu, kho), orders-view, barn-view; shop có tab Blindbox + Hạt & con giống
- [x] tools/simulate.mjs: thêm kiểm tra di truyền hạt con; mọi tỉ lệ khớp cấu hình
- [x] tests/smoke.mjs v2: 29/29 bước qua, không lỗi console, không còn khóa i18n thô
- [x] docs/GDD.md v0.2 + §20 tech stack mobile; README
- [x] Build & publish lại artifact (cùng URL)
- [x] Push lên GitHub: nhánh `claude/adoring-shannon-a7paup` (bannie-test/combinem)

## v0.3 · đồ họa bản đồ 2D nghiêng có đổ bóng, skin UI hoạt hình, ẩn thông tin nội bộ
Yêu cầu: bản đồ tự nhiên, 2D góc nhìn nghiêng từ trên xuống có đổ bóng, hoạt hình ngộ nghĩnh như Hay Day / Township;
ẩn mọi chú thích / nút dẫn tới thông tin nội bộ (tỉ lệ ra đồ, công cụ dev). Có lịch tự tiếp tục: trig_015nmT7t9iEs9rNNwQye4nz6 (xóa khi xong).
- [x] Ẩn thông tin nội bộ: công cụ Dev tách ra js/dev/ (chỉ bản dev, không vào bản build), bỏ nút "Tỉ lệ" gacha, preview merge / bảng Viện / mô tả bùa dùng mức định tính
- [~] Bộ vẽ hoạt hình bằng canvas: js/ui/art/ (địa hình, công trình 3/4, cây trồng, vật nuôi, cache sprite) — tạm dừng; chuyển sang asset vẽ bằng AI theo docs/ART_PROMPTS.md
- [ ] Bản đồ mới: địa hình tự nhiên + sprite + bong bóng kiểu Hay Day, cối xay gió quay, con vật đi lại
- [ ] Skin UI: HUD, nút bóng, bảng gỗ / giấy da, thanh tab
- [ ] Kiểm thử + ảnh chụp, tài liệu, build (không có code dev), publish cùng URL, commit + push
