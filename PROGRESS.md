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
- [ ] Push lên GitHub: bị chặn 403 (Claude GitHub App chưa có quyền với bannie-test/combinem). Commit nằm trong máy.
