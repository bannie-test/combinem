# Noa Farm · Tài liệu thiết kế game (GDD) v0.1

> **Tên tạm:** Noa Farm · *Nông trại Hành tinh Hạt giống* / *The Seed Planet*
> **Thể loại:** Merge + nông trại (farming) + lai tạo gen, có yếu tố sưu tập
> **Nền tảng prototype:** Web (HTML/JS, chạy trên điện thoại và máy tính). Toàn bộ dữ liệu và tỉ lệ đã tách khỏi engine để chuyển sang Unity/Cocos sau này.
> **Ngôn ngữ:** Tiếng Việt (mặc định) và Tiếng Anh

Mọi con số trong tài liệu là **giá trị mặc định hiện tại** trong `config/balance.js`. Muốn đổi thì sửa file đó, không cần sửa code.

---

## 0. Tóm tắt một trang

**Câu chốt:** *Ghép các mảnh gen để hồi sinh muôn loài, lai tạo những giống cây và vật nuôi huyền thoại, rồi một ngày mang màu xanh trở về Trái Đất.*

**Bốn trụ cột trải nghiệm**
1. **Merge "đã tay":** kéo, thả, nảy, nổ hạt, mỗi lần merge là một nốt nhạc.
2. **Gen hiếm:** mỗi lần merge là một lần hồi hộp. Gen là phẩm chất hiếm tạo ra siêu giống giá cao.
3. **Khám phá:** giống lai dựa trên sự thật khoa học, cùng các bí ẩn kích hoạt theo trăng, sao băng và thời tiết thật.
4. **Câu chuyện có ý nghĩa:** hành tinh nhỏ giữ gen của Trái Đất. Người chơi hồi sinh Trái Đất từng chút một.

---

## 1. Cốt truyện

### 1.1 Bối cảnh
Năm **2190**, Trái Đất cạn kiệt tài nguyên. Sông cạn đáy, rừng hóa tro, cây xanh cuối cùng đã héo. Con người còn sống sót trong những **mái vòm kín**, ăn thực phẩm tổng hợp. Trẻ con chỉ còn biết đến màu xanh lá qua sách cũ.

Trước khi quá muộn, một nhóm nhà khoa học tự gọi mình là **Hội Người Giữ Hạt** đã biến một tiểu hành tinh thành **NOA**, một "con thuyền hạt giống" bay giữa không gian. Lõi của Noa là **Kho Gen Vĩnh Cửu**, lưu giữ gen của mọi loài cây, loài hoa và loài vật từng sống trên Trái Đất. Ý tưởng lấy cảm hứng từ **Kho Hạt giống Toàn cầu Svalbard** có thật ở Na Uy.

Noa nhỏ đến mức đi bộ một vòng chỉ hết một buổi chiều. Nó bay quanh một ngôi sao trẻ, có một mặt trăng tí hon. Từ bầu trời Noa vẫn nhìn thấy Trái Đất, một chấm nâu xỉn ở xa.

### 1.2 Vì sao phải merge? (lý do của cơ chế)
Trên hành trình 300 năm, **bức xạ vũ trụ làm Kho Gen vỡ thành từng mảnh**. Mỗi hạt giống mà kho "in" ra chỉ là một mảnh gen chưa trọn vẹn. **Merge là ghép hai mảnh gen giống nhau thành một bộ gen đầy đủ và mạnh hơn.** Vì vậy hạt cấp cao cho năng suất cao hơn hẳn.

### 1.3 Vì sao gen mang yếu tố fantasy?
Bà Mai, trưởng Hội Người Giữ Hạt, biết Trái Đất khô cằn sẽ không còn là nơi dễ sống. Để sự sống tồn tại được ngoài không gian và sau này quay về một Trái Đất khắc nghiệt, bà **viết thêm vào kho gen những đoạn mã lấy cảm hứng từ thiên nhiên và truyền thuyết của loài người**:
- **Gen thực vật:** theo thiên thể và nguyên tố (Thái Dương, Nguyệt Quang, Hỏa Diệm, Thủy Tinh).
- **Gen động vật:** theo **Tứ Linh** trong văn hóa Việt (Long, Lân, Quy, Phụng). Bà là người Việt.

Những gen ấy chưa mất, chúng đang **ngủ**. Chỉ khi lai tạo đúng cách chúng mới **thức tỉnh**.

### 1.4 Nhân vật
| Nhân vật | Vai trò |
|---|---|
| **Người chơi · Người Gieo Mầm** | Cháu của bà Mai, tỉnh dậy sau 300 năm ngủ đông trên Noa |
| **Đậu** 🤖 | Robot hình hạt đậu có mầm lá trên đầu, là AI của kho gen. Hơi vụng, hay ngại, dẫn dắt hướng dẫn. Đang giấu một đoạn ghi âm của bà Mai (bí ẩn) |
| **Bà Mai** | Nhà di truyền học, trưởng Hội. Đã mất, để lại 5 lá thư rải rác theo tiến trình |
| **Bác Tư Tàu Ong** | Thương nhân lái "tàu ong vàng" chạy giữa các hành tinh hạt giống, mang đơn hàng |
| **Cô Lan Tiệm Bánh, Anh Bảo Kỹ Sư, Bà Mơ Thảo Dược, Bé Bin** | Khách đặt hàng thường |
| **Lữ Khách Phương Xa** 🧙 | Khách bí ẩn, chỉ đặt hàng VIP (hàng có gen / chất lượng cao) |
| **Bé Na · Vòm Hà Nội** 👧 | Cô bé trên Trái Đất. Đơn "Gửi về Trái Đất" của Na giúp hồi sinh Trái Đất. Là hậu duệ của cô bé mà bà Mai từng hứa |

### 1.5 Mạch truyện (7 chương, đã có trong game: Sổ tay → Cốt truyện)
| Chương | Mở khóa | Nội dung |
|---|---|---|
| 1 · Thức giấc | Cấp 1 | Tỉnh dậy, gặp Đậu, học merge, gieo hạt lúa đầu tiên |
| 2 · Gen đang ngủ | Gen đầu tiên | Một hạt phát sáng. Đậu kể về những đoạn gen bà Mai viết thêm |
| 3 · Tín hiệu từ Trái Đất | Cấp 3 | Radio bắt được "Vòm Hà Nội". Bé Na hỏi *"Hoa hồng có mùi gì ạ?"*. Bắt đầu các đơn gửi về Trái Đất |
| 4 · Tứ Linh | Gen động vật đầu tiên | Sổ tay bà Mai: vì sao gen động vật mang tên Long, Lân, Quy, Phụng |
| 5 · Lá thư thứ năm | Trái Đất 20% | Bé Na gửi ảnh chậu hồng đầu tiên nở trong vòm sau 300 năm |
| 6 · Hạt giống Tinh Tú | Trái Đất 50% | Bản thiết kế cuối của bà Mai: hạt gen thần thoại chịu được hạn hán |
| 7 · Cơn mưa hạt giống | Trái Đất 100% | Noa thả mưa hạt giống phát sáng xuống Trái Đất. Những đốm xanh đầu tiên lan ra |

**Thư của bà Mai** (5 lá): Gửi cháu · Về những gen đang ngủ (Mendel) · Ưu thế lai · Đoạn ghi âm (bí ẩn của Đậu) · Lời hứa (với cô bé Hà Nội 300 năm trước).

**Thông điệp:** gìn giữ, kiên nhẫn, kết nối. Nói một cách nhẹ nhàng, không giảng đạo lý.

### 1.6 Hướng mở rộng cốt truyện
- **Twist dài hạn (gợi ý):** lá thư cuối hé lộ bà Mai không mất mà đang **ngủ đông trong lõi kho gen**, chờ đủ "năng lượng sự sống" để tỉnh lại. Đây là mục tiêu cho một mùa nội dung sau.
- **Quần đảo hạt giống:** các hành tinh hạt giống khác của những Người Giữ Hạt khác, nền tảng cho tính năng xã hội (thăm vườn, trao đổi giống).
- **Thước đo Trái Đất trên bầu trời:** chấm Trái Đất trong HUD chuyển dần từ nâu sang xanh theo % hồi sinh. Đã có trong prototype.

---

## 2. Vòng lặp gameplay

```
 [🌱 Túi hạt / 🐣 Lồng ấp] ── chạm, tốn ⚡ ──▶ hạt / con giống Lv1 (chỉ số ngẫu nhiên, có thể mang gen lặn ẩn)
          │
          ▼
  ① MERGE GIỐNG ─ 2 vật giống hệt → Lv+1 (có % ĐỘT PHÁ Lv+2) · chỉ số di truyền · GEN (xem §4)
          │
          ▼
  ② TRỒNG / NUÔI ─ hạt vào ô đất · con giống vào chuồng (cần thức ăn) · thời gian theo chỉ số Sinh trưởng
          │
          ▼
  ③ THU HOẠCH ─ sản lượng theo Năng suất · số sao theo Phẩm chất · sản phẩm có thể mang gen
          │
          ▼
  ④ MERGE SẢN PHẨM ─ 2 sản phẩm giống nhau → chế biến cấp cao hơn (luôn thành công)
          │
          ▼
  ⑤ GIAO ĐƠN / BÁN ─ 🪙 Xu, XP, 🔬 Điểm nghiên cứu, 💎 (VIP), % hồi sinh Trái Đất
          │
          ▼
  ⑥ NÂNG CẤP ─ Viện (tăng tỉ lệ gen, mở dung hợp, lai chéo) · mở ô đất / chuồng · linh vật · blindbox
          └──────────────────────────── quay lại ① ────────────────────────────┘
```

- **Core loop (giây):** chạm máy tạo → merge → trồng → thu → merge sản phẩm → giao.
- **Mid loop (phút → giờ):** nâng Viện, lai chéo, săn gen, mở hộp, hoàn thành đơn VIP.
- **Meta loop (ngày → tuần):** chuỗi đăng nhập 7 ngày, linh vật, sự kiện bầu trời thật, sưu tập Sổ tay, % hồi sinh Trái Đất và cốt truyện.

---

## 3. Merge & 4 dòng chỉ số

### 3.1 Bốn dòng chỉ số
| # | Chỉ số | Có ở | Tác dụng |
|---|---|---|---|
| 🌾 | **Năng suất** | mọi hạt / con giống | +1% sản lượng mỗi điểm |
| ⏱️ | **Sinh trưởng** | mọi hạt / con giống | −0,5% thời gian mỗi điểm (tối đa −60%) |
| ⭐ | **Phẩm chất** | mọi hạt / con giống | Quyết định **số sao** của sản phẩm (1★–5★), sao làm tăng giá |
| 🧬 | **Gen** | **hiếm** | Phẩm chất hiếm: cộng điểm vào chỉ số sở trường và **nhân giá bán** rất mạnh (xem §4) |

### 3.2 Merge giống (cây & vật nuôi)
- Chỉ merge được **2 vật giống hệt**: cùng loài, cùng cấp. Cấp tối đa: **Lv5**.
- **Chỉ số con** = trung bình bố mẹ + ngẫu nhiên **[4..12]**, giới hạn theo trần của cấp (25/45/65/85/100).
- **Đột phá:** merge 2 vật Lv *n* có xác suất ra thẳng **Lv *n*+2**: Lv1 7%, Lv2 6%, Lv3 5%, cộng thêm 8 điểm mọi chỉ số.
- **Combo:** các lần merge cách nhau dưới 2,4 giây tạo combo. Cao độ âm thanh leo dần theo gam Đô trưởng.

### 3.3 Merge sản phẩm
- 2 sản phẩm giống nhau → sản phẩm chế biến cấp cao hơn (3 cấp mỗi loài, ví dụ 🌾 Bó lúa → 🍚 Gạo thơm → 🍙 Cơm nắm). Luôn thành công.
- Sao = trung bình, có 20% được +1★. Gen đi theo cùng quy tắc giữ/mất gen của §4.

---

## 4. Hệ thống Gen

### 4.1 Quy tắc nền (theo yêu cầu)
1. **Mỗi vật phẩm tối đa 1 gen.** Gen thực vật chỉ có trên cây; gen động vật chỉ có trên vật nuôi (**bộ gen riêng**).
2. **Vật phẩm thường không có gen.** Thường + Thường có **1%** cơ hội xuất hiện gen mới. Tỉ lệ này tăng theo cấp Viện, linh vật và sự kiện.
3. **Cao cấp + Thường → tỉ lệ giữ gen THẤP: 22%** (giữ được thì độ thuần −1).
4. **Cao cấp + Cao cấp → tỉ lệ CAO hơn:** cùng gen 88%; khác gen 62% (giữ gen tốt hơn).
5. **Vật phẩm hỗ trợ tăng may mắn** (🍀 🧪 ✨, xem §8). Viện và linh vật cũng cộng thêm.
6. **Gen mất không biến mất hẳn:** nó chìm thành **gen lặn** (ẩn) và có thể thức tỉnh lại (§4.5).
7. **Người chơi mới:** lần merge giống thứ 5 chắc chắn thức tỉnh gen đầu tiên (`gene.firstGeneAtMerge`), để dạy cơ chế.

### 4.2 Bảng gen
**🌱 Gen thực vật**
| Tầng | Gen | Sở trường | Công thức |
|---|---|---|---|
| 1 | ☀️ Thái Dương | Năng suất | nguyên tố |
| 1 | 🌙 Nguyệt Quang | Phẩm chất | nguyên tố |
| 1 | 🔥 Hỏa Diệm | Sinh trưởng | nguyên tố |
| 1 | 💧 Thủy Tinh | mọi chỉ số | nguyên tố |
| 2 | 🌈 Cầu Vồng | mọi chỉ số | ☀️ + 💧 (nắng gặp nước) |
| 2 | 🌗 Nhật Nguyệt | Phẩm chất | ☀️ + 🌙 |
| 2 | ❄️ Sương Bạc | Sinh trưởng | 🌙 + 💧 |
| 2 | 👑 Hoàng Kim | Năng suất | ☀️ + 🔥 |
| 2 | ⚡ Lôi Vũ *(bí ẩn)* | Năng suất | 🔥 + 💧 **khi trời giông** |
| 3 | 🌠 Tinh Tú | mọi chỉ số | 🌗 + 🌈 |

**🐾 Gen động vật (Tứ Linh)**
| Tầng | Gen | Sở trường | Công thức |
|---|---|---|---|
| 1 | 🐉 Long | Phẩm chất | nguyên tố |
| 1 | 🦄 Lân | Năng suất | nguyên tố |
| 1 | 🐢 Quy | mọi chỉ số | nguyên tố |
| 1 | 🦚 Phụng | Sinh trưởng | nguyên tố |
| 2 | ☯️ Long Phụng | Phẩm chất | 🐉 + 🦚 |
| 2 | 🍑 Phúc Thọ | Năng suất | 🦄 + 🐢 |
| 2 | 🌊 Huyền Vũ | mọi chỉ số | 🐉 + 🐢 |
| 2 | 🎐 Cát Tường | Sinh trưởng | 🦄 + 🦚 |
| 2 | 🐅 Bạch Hổ *(bí ẩn)* | Phẩm chất | 🐢 + 🦚 **đêm trăng tròn / sao băng** |
| 3 | 🌟 Tứ Linh | mọi chỉ số | ☯️ + 🍑 |

Tên hiển thị luôn **giữ nguyên tên loài thật** và ghép thêm tên gen: *Hạt Cà chua Nguyệt Quang*, *Gà Phụng*, *Trứng Phụng*. Tiếng Anh: *Moonlight Tomato Seed*, *Phoenix Chicken*.

### 4.3 Độ thuần (◆1 → ◆5)
- Merge 2 vật **cùng gen**: giữ gen 88%. Nếu cùng độ thuần thì có cơ hội lên ◆: 48% (◆1→2), 34% (◆2→3), 22% (◆3→4), 12% (◆4→5). Hai bên lệch độ thuần thì tỉ lệ × 0,5.
- **Độ thuần tối đa bị giới hạn bởi cấp Viện** (◆2 → ◆5).
- **◆5 = SIÊU GIỐNG THUẦN CHỦNG:** viền cầu vồng động, cảnh phim riêng, giá cao nhất.
- **Điểm cộng chỉ số theo ◆:** +8 / +12 / +17 / +23 / +32 (gen "mọi chỉ số" nhận 50% cho từng chỉ số).

### 4.4 Hệ số giá theo gen
| Tầng \ ◆ | ◆1 | ◆2 | ◆3 | ◆4 | ◆5 (Siêu giống) |
|---|---|---|---|---|---|
| Tầng 1 | ×4 | ×6 | ×9 | ×14 | **×40** |
| Tầng 2 | ×9 | ×13 | ×19 | ×28 | **×100** |
| Tầng 3 | ×25 | ×35 | ×55 | ×85 | **×300** |

### 4.5 Gen lặn (tính năng ẩn, dựa trên định luật Mendel)
- 12% vật phẩm mới sinh mang một **gen lặn ẩn**, không hiển thị.
- Hai vật **cùng mang một gen lặn** merge với nhau → **25% biểu hiện**, đúng tỉ lệ 1/4 Mendel tìm ra năm 1866. Không biểu hiện thì con vẫn mang gen lặn ≈ 50%.
- Một bên mang → con mang 50%.
- Gen bị mất khi merge → chìm thành gen lặn.
- **🔍 Kính lúp gen** soi được gen lặn. Khi cả hai vật đã được soi, bảng xem trước hiện tỉ lệ thức tỉnh.

### 4.6 Xem trước khi merge
Khi kéo một vật lên vật giống hệt, game hiện **bảng tỉ lệ thật** (đã cộng mọi bonus): lên cấp, đột phá, giữ gen, lên ◆, dung hợp, bùa đang gắn. Người chơi luôn biết mình đang đặt cược bao nhiêu.

---

## 5. Viện nghiên cứu

Có hai cơ sở, tiến độ riêng:
- 🌱 **Nhà Kính Lai Tạo** áp dụng cho mọi hạt giống.
- 🐾 **Trại Nghiên Cứu Vật Nuôi** áp dụng cho mọi con giống. Mở ở cấp 3.

Nâng cấp bằng 🪙 Xu và 🔬 **Điểm nghiên cứu**. RP lấy từ đơn VIP, đơn Trái Đất, thu hoạch hàng có gen, khám phá gen mới và lai chéo thất bại.

| Cấp | Chi phí | +Thành công | Gen mới | +Đột phá | Ô lai | Lai thành công | ◆ tối đa | Dung hợp | Ra thẳng Lv2 |
|---|---|---|---|---|---|---|---|---|---|
| 1 | | +0% | 1,0% | +0% | 0 | 35% | ◆2 | Tầng 1 | 0% |
| 2 | 600🪙 · 8🔬 | +2% | 1,3% | +0,5% | 1 | 35% | ◆3 | Tầng 1 | 3% |
| 3 | 1.600 · 20 | +4% | 1,6% | +1% | 1 | 38% | ◆3 | **Tầng 2** | 5% |
| 4 | 3.200 · 36 | +6% | 1,9% | +1,5% | 1 | 41% | ◆4 | Tầng 2 | 7% |
| 5 | 5.600 · 56 | +8% | 2,2% | +2% | 2 | 44% | ◆4 | Tầng 2 | 9% |
| 6 | 9.000 · 80 | +10% | 2,6% | +2,5% | 2 | 47% | **◆5** | **Tầng 3** | 11% |
| 7–10 | … | … +20% | … 5% | … +5% | 3–4 | … 62% | ◆5 | Tầng 3 | … 22% |

"Thành công" cộng vào: giữ gen, lên độ thuần, dung hợp.

### 5.1 Lai chéo 2 loài (giống lai, giữ nguyên tên loài thật)
Chọn 2 loài **khác nhau** cùng họ, trả 200🪙, chờ 90 giây. Nếu là cặp tương thích, có 35% (cộng bonus Viện) ra **giống lai** mang **ưu thế lai** (+10 mọi chỉ số). Thu hoạch giống lai cho ra **sản phẩm của cả hai loài**. Thất bại thì nhận lại con có cấp cao hơn và +3🔬.

| Giống lai | Bố × Mẹ | Sự thật khoa học (hiện trong Sổ tay) |
|---|---|---|
| 🍅🥔 Cà chua khoai tây (Pomato) | Cà chua × Khoai tây | Cùng họ Cà. Ngoài đời người ta ghép thành "TomTato": trên ra cà chua, dưới ra khoai tây |
| 🍓🌹 Dâu tây hoa hồng | Dâu tây × Hoa hồng | Dâu tây thuộc họ Hoa hồng (Rosaceae) |
| 🐑🐐 Cừu dê (Geep) | Cừu × Dê | Năm 1984 các nhà khoa học tạo ra "geep", một thể khảm cừu–dê |

**Ý tưởng giống lai cho bản sau** (đều có thật): Bưởi × Quýt → **Cam**; Cam × Bưởi → **Bưởi chùm**; Lúa mì × Lúa mạch đen → **Triticale**; Ngựa × Lừa → **La**; Ngựa × Ngựa vằn → **Zorse**; Bạc hà nước × Bạc hà lục → **Bạc hà cay**.

---

## 6. Nông trại

- **Ô đất:** 3 ô ban đầu, tối đa 8 (mua bằng Xu, mở dần theo cấp). Kéo hạt vào để trồng.
- **Chuồng:** 1 chuồng ban đầu, tối đa 5. Kéo con giống vào. **Vật nuôi cần thức ăn:** gà/bò/cừu/dê ăn lúa, ong ăn hoa (hồng, hướng dương). Mỗi đơn vị thức ăn = 1 lứa. Máng chứa tối đa 12.
- **Sản lượng mỗi lần** = đơn vị gốc theo cấp (1/2/4/8/16) × (1 + Năng suất%) × bonus.
- **Thời gian** = thời gian gốc của loài × hệ số theo cấp (1 / 1,5 / 2,1 / 2,7 / 3,3) × (1 − Sinh trưởng × 0,5%) × bonus (thời tiết, linh vật). Hạt cấp cao cho nhiều hàng hơn hẳn trên cùng một ô đất, nên merge luôn có lợi.
- **Đóng gói:** sản lượng lớn tự gộp thành sản phẩm cấp 2 (≥4 đơn vị) hoặc cấp 3 (≥8 đơn vị) để bàn không bị ngập. Bàn đầy thì vào kho, kho đầy thì chờ dọn.
- Mỗi sản phẩm của giống có gen có **60%** mang gen đó, kèm +1🔬.
- 🧃 **Thuốc tăng trưởng** làm ô đất hoặc chuồng xong ngay.

---

## 7. Đơn hàng, bán hàng, thị trường

| Loại | Điều kiện | Thưởng |
|---|---|---|
| Thường | 1–3 dòng hàng, cấp chế biến tăng theo cấp người chơi | Xu = **giá trị thật của hàng giao** × 1,5, kèm XP |
| ✨ VIP (Lữ Khách Phương Xa) | Từ cấp 4, 18%: cần hàng **có gen** hoặc **≥3★** | ×2,6 Xu, 4–12🔬, 35% có 2–6💎 |
| 🌍 Gửi về Trái Đất (Bé Na) | Từ cấp 3, 20% | +2% hồi sinh Trái Đất, +3🔬 |

- Giao hàng chất lượng cao (sao, gen) thì nhận nhiều Xu hơn, vì thưởng tính theo giá trị thật.
- Nút **Giao** tự chọn món **rẻ nhất** phù hợp và không bao giờ lấy đồ đã khóa. Cũng có thể kéo từng món thả vào thẻ đơn.
- **Đổi đơn:** miễn phí, hồi chiêu 45 giây (chỉ khi chưa giao món nào).
- **Bán:** kéo vào 🧺. Bão hòa thị trường: mỗi lần bán cùng một loại trong ngày giảm 5% giá, thấp nhất 45%. Vật có gen hoặc Lv4+ phải xác nhận trước khi bán.
- 🔒 **Khóa** vật quý để không merge hay bán nhầm.

---

## 8. Vật phẩm hỗ trợ (bùa may mắn)
| | Vật phẩm | Cách dùng | Hiệu ứng |
|---|---|---|---|
| 🍀 | Cỏ bốn lá | Kéo lên hạt / con giống (gắn bùa) | Lần merge kế: +15% giữ gen, +10% lên ◆, +8% dung hợp, gen mới ×2,5, +3% đột phá |
| 🧪 | Bình ổn gen | Gắn bùa | Lần merge kế **chắc chắn không mất gen, không giảm ◆** |
| ✨ | Bụi sao | Gắn bùa | +10% đột phá, +10% dung hợp |
| 🧃 | Thuốc tăng trưởng | Kéo lên ô đất / chuồng | Xong ngay |
| 🔍 | Kính lúp gen | Kéo lên hạt / con giống | Soi gen lặn |

Bùa của cả hai bên đều tính vào lần merge và bị tiêu hao sau lần đó.

---

## 9. Linh vật
- **Tạm thời** (kích hoạt ngay, trùng thì cộng dồn thời gian): 🐇 Thỏ Ngọc (cây lớn nhanh 25%), 🐞 Bọ Rùa (+8% giữ gen), 🐿️ Sóc (năng lượng hồi ×2), 🦉 Cú Đêm (gen mới ×2), 🐝 Ong Thợ (+30% sản lượng), 💫 Đom Đóm *(bí ẩn)*.
- **Vĩnh viễn** (đặt vào **Đền linh vật**, 3 ô; trùng thì +1★, tối đa 5★, đủ sao thì đổi Ngọc): 🐈 Mèo Thần Tài (+10% Xu), 🐸 Cóc Gọi Mưa ("con cóc là cậu ông Trời": cây nhanh hơn, trời hay mưa hơn), 🐃 Trâu Vàng (+12% sản lượng), 🐕 Chó Giữ Vườn (+10 năng lượng tối đa), 🦢 Thiên Nga (+4% giữ gen), 🐟 Cá Chép Vượt Vũ Môn (+3% đột phá: cá chép hóa rồng), 🐦 Chim Họa Mi *(bí ẩn)*.

---

## 10. Blindbox (gacha)

### 10.1 Hộp
| Hộp | Giá | Nội dung chính | Đảm bảo (pity) |
|---|---|---|---|
| 🌱 Hộp Mầm Xanh | 300🪙 hoặc 1 vé | hạt/con giống, bùa, linh vật tạm thời; hiếm hơn có gen, linh vật vĩnh viễn | Sử thi trong 10 lần, Huyền thoại trong 60 lần |
| 🌠 Hộp Tinh Tú | 60💎 hoặc 1 vé | gen ◆2, gen dung hợp, linh vật vĩnh viễn, **gen thần thoại** | Huyền thoại trong 20 lần, Thần thoại trong 90 lần |

- Mở ×10: giá ×9, **chắc chắn ít nhất 1 Sử thi**.
- Độ hiếm: Thường · Hiếm · Sử thi · Huyền thoại · Thần thoại.
- **Công bố tỉ lệ:** nút "Tỉ lệ" tính trực tiếp từ `config/balance.js` (độ hiếm và từng phần thưởng). Nhiều thị trường bắt buộc công bố khi có bán bằng tiền thật.

### 10.2 Hiệu ứng mở hộp (đã làm trong prototype)
1. **Chờ đợi:** màn đêm có tia sáng xoay, hộp quà bồng bềnh, chữ "Chạm để mở!".
2. **Rung lắc:** 3–5 nhịp, mạnh dần. Ánh sáng sau hộp **đổi màu dần theo độ hiếm thật**: trắng → xanh → tím → vàng → hồng. Mỗi lần đổi màu có tiếng chuông cao hơn. Đây là "leo thang trung thực": màu chỉ lên tới đúng độ hiếm đã roll, không lừa người chơi.
3. **Bung nắp:** nắp bay, chớp sáng, nổ hạt theo màu độ hiếm, rung màn hình từ Sử thi trở lên, pháo giấy từ Huyền thoại trở lên.
4. **Lật thẻ:** thẻ bay lên và lật 3D. Có băng rôn độ hiếm, hình, tên, chỉ số hoặc mô tả gen, nhãn **MỚI!**.
5. **×10:** lưới 2×5 thẻ úp (mặt sau phát sáng theo màu độ hiếm) lật lần lượt. Huyền thoại trở lên có nổ riêng và nhạc riêng.
6. **Âm thanh:** tiếng rung trầm → chuông leo cao → tiếng nổ → hợp âm càng dày theo độ hiếm (Thần thoại thêm lớp "hợp xướng").
7. Nút **Bỏ qua** cho người chơi muốn nhanh.

---

## 11. Phần thưởng đăng nhập & lên cấp
- **Đăng nhập 7 ngày** (lặp lại, không reset khi bỏ lỡ): 200🪙 · 30⚡+🍀 · Vé Mầm Xanh · 400🪙+15🔬 · 15💎 · 40⚡+🧪 · **30💎 + Vé Tinh Tú**. Tự hiện khi mở game, nút 🎁 trên bầu trời có chấm đỏ báo.
- **Lên cấp:** bảng riêng cho cấp 2–10, sau đó theo công thức (Xu tăng dần, 10💎, vé Tinh Tú mỗi 5 cấp). Màn hình lên cấp liệt kê phần thưởng và **tính năng mới mở**.
- **Mở khóa theo cấp:** Blindbox (2) · Trại vật nuôi & Đền linh vật (3) · Đơn VIP (4) · Lai chéo & Hộp Tinh Tú (5). Loài mới mở dần từ cấp 1 đến 7.

---

## 12. Cửa hàng, 2 loại tiền, thanh toán

### 12.1 Hai loại tiền
- 🪙 **Xu** (soft): kiếm trong game từ đơn hàng, bán hàng, đăng nhập, lên cấp.
- 💎 **Ngọc** (hard): **từ nạp tiền**, ngoài ra có ít từ đăng nhập, lên cấp, VIP, bí ẩn.

### 12.2 Cửa hàng
- **Vật phẩm:** năng lượng, bùa may mắn, thuốc, kính lúp, mở rộng kho, vé Tinh Tú. Mỗi món mua bằng Xu hoặc Ngọc.
- **Đổi Ngọc → Xu:** 10💎 = 800🪙.
- **Ngọc (nạp tiền):** 4 gói, giá hiển thị VND (tiếng Việt) hoặc USD (tiếng Anh).
- **Ưu đãi:** Gói Khởi Đầu (mua 1 lần), Thẻ Tháng (100💎 ngay, sau đó 15💎 + 20⚡ mỗi ngày trong 30 ngày).

### 12.3 Kiến trúc thanh toán (đã dựng sẵn, CHƯA BẬT)
`config/payment.js` chứa `enabled: false`, provider, **endpoint server**, **liên kết** (Google Play, App Store, cổng web, điều khoản, quyền riêng tư, hỗ trợ) và **danh mục sản phẩm** (sku, giá VND/USD, mã sản phẩm trên từng store).

```
purchase(sku)
  → adapter.createOrder(product)      server tạo đơn
  → adapter.pay(order)                SDK store / cổng thanh toán web
  → adapter.verify(receipt)           SERVER xác thực hóa đơn
  → grant(product, transactionId)     cộng Ngọc, idempotent (sổ cái chống cộng trùng)
```
- Adapter có sẵn: `disabled` (mặc định), `mock` (giả lập thành công, để test), và khung cho `googlePlay`, `appStore`, `web` (MoMo / ZaloPay / VNPay / Stripe).
- **Bảo mật:** chỉ cộng Ngọc **sau khi server xác thực**. Không bao giờ để client tự quyết.
- **Checklist tích hợp:** (1) dựng server có 3 endpoint `orders` / `verify` / `restore` và webhook; (2) khai báo sản phẩm trên Google Play Console / App Store Connect đúng `storeIds`; (3) viết phần `TODO` trong adapter tương ứng; (4) đặt `enabled: true` và `provider`; (5) test bằng tài khoản sandbox; (6) công bố tỉ lệ gacha và điều khoản hoàn tiền.
- Trong bảng Dev có thể chuyển sang `mock` để thử toàn bộ luồng cộng Ngọc.

---

## 13. Tính năng ẩn (kích hoạt bí mật)

Nguyên tắc: **gợi ý mơ hồ, khám phá bằng quan sát.** Sổ tay → Bí ẩn hiện "Đã khám phá x/12" và một câu gợi ý cho mỗi bí ẩn chưa tìm ra.

| # | Bí ẩn | Kích hoạt | Gợi ý trong game | Thưởng |
|---|---|---|---|---|
| 1 | 🌕 **Đêm Rằm** | Mở game ban đêm đúng **trăng tròn theo lịch thật** (tính pha Mặt Trăng) | "Có những đêm ánh trăng tròn vành vạnh…" | 10💎 · đêm rằm: gen Nguyệt Quang ×3, gen mới ×1,5 |
| 2 | 🌠 **Điều ước sao băng** | Chạm sao băng bay qua bầu trời trong **đợt mưa sao băng có thật** (Lạp Hộ, Anh Tiên, Song Tử, Sư Tử…) | "Vào những đêm nhất định trong năm, bầu trời không đứng yên." | Bụi sao / Ngọc · dung hợp Tinh Tú ×2 |
| 3 | 🌈 **Cầu vồng sau mưa** | Có mặt trong game lúc trời chuyển từ mưa sang nắng | "Sau cơn mưa, trời lại sáng." | 15🔬 · dung hợp Cầu Vồng ×2 trong 3 phút |
| 4 | ⚡ **Gen Lôi Vũ** | Merge 🔥 + 💧 **khi trời giông** (35%) | "Lửa và nước vốn không ưa nhau…" | Gen bí ẩn + 30🔬 |
| 5 | 🐅 **Gen Bạch Hổ** | Merge 🐢 + 🦚 **đêm trăng tròn hoặc mưa sao băng** (30%) | "Linh thú phương Tây chỉ hiện ra khi trời đêm rực sáng." | Gen bí ẩn + 30🔬 |
| 6 | 🎵 **Bản nhạc Trái Đất** | Merge **8 lần liên tiếp trong 1 combo** (trọn quãng tám Đô→Đô) | "Mỗi lần merge là một nốt nhạc. Hãy chơi trọn một khúc." | Linh vật 🐦 Chim Họa Mi |
| 7 | 🧬 **Định luật Mendel** | Lần đầu gen lặn thức tỉnh | "Có những gen đang ngủ, ẩn sâu trong dòng giống." | 25🔬 + 🔍 |
| 8 | 💫 **Đom đóm lạc** | Để yên màn nông trại ~45 giây, đom đóm bay qua, chạm vào | "Đôi khi, ngồi yên một chút cũng đáng." | Linh vật 💫 Đom Đóm |
| 9 | 🤖 **Bí mật của Đậu** | Chạm robot Đậu 7 lần thật nhanh | "Robot Đậu có vẻ đang giấu điều gì đó…" | Đoạn ghi âm của bà Mai + Vé Tinh Tú + mở Thư số 4 |
| 10 | 🌍 **Nhớ nguồn** | Đặt tên nông trại là "Trái Đất" / "Earth" | "Tên gọi của quê nhà." | 50💎 |
| 11 | 🍀 **Cỏ bốn lá tự nhiên** | 0,2% mỗi lần thu hoạch (ngoài đời ≈ 1/5.000) | "Một trong năm nghìn…" | 10💎 + 🍀 |
| 12 | 🗓️ **Ngày của Trái Đất** | Vào game ngày 22/4 (Ngày Trái Đất) hoặc 5/6 (Môi trường Thế giới) | "Có những ngày cả thế giới cùng nghĩ về hành tinh xanh." | 22💎 + 22🔬 |

**Thú vị:** hôm nay (24/10) đang trong đợt mưa sao băng **Lạp Hộ (Orionids)**, nên tối nay mở game sẽ thấy sao băng thật.

**Ý tưởng bí ẩn cho bản sau**
- 🏮 **Trung Thu:** tính theo lịch âm (rằm tháng 8). Thỏ Ngọc xuất hiện trong hộp, có đơn của chú Cuội.
- 🎂 **Sinh nhật người chơi:** nhập ngày sinh, đúng ngày có quà và lời chúc từ Đậu.
- 🕰️ **Hạt giống ký ức:** 7 ngày không vào game thì khi quay lại nhận một hạt kèm thư của bà Mai (vừa là quà quay lại, vừa là lore).
- 🔤 **Câu đố Sổ tay:** gõ đúng tên khoa học của một loài (ví dụ *Oryza sativa*) để mở hình nền bí mật.
- 🎶 **Giai điệu ẩn:** merge theo đúng giai điệu "Trống cơm" (theo cao độ combo) để nhận âm nhạc hiếm.

---

## 14. Thế giới thời gian thực
- **Ngày / đêm** theo giờ máy người chơi (đêm 18:00–06:00): đổi màu bầu trời, nhạc nền trầm hơn ban đêm.
- **Thời tiết** đổi mỗi 6 phút, xác định theo khung thời gian nên mọi lần tải lại đều giống nhau. Nắng: gen ☀️ ×1,5, cây nhanh 5%. Mưa: gen 💧 ×1,6, cây nhanh 12%. Giông: mở bí ẩn Lôi Vũ. Mây: gen 🌙 ×1,2.
- **Trăng:** tính pha thật (chu kỳ 29,53 ngày). Rằm ±1,2 ngày là trăng tròn.
- **Mưa sao băng:** 7 đợt có thật trong năm, có đêm cực điểm (sao băng dày hơn).

---

## 15. Âm thanh & cảm giác (juice)
- **Merge:** nhặt lên (pop) → hút vào ô (snap) → va chạm (lóe, nén giãn, nổ hạt, vòng sáng) → vật mới nảy lên. Rung nhẹ trên điện thoại.
- **Combo:** mỗi merge trong 2,4 giây leo một bậc gam Đô trưởng. 8 merge thành trọn một quãng tám (bí ẩn #6).
- **Gen thức tỉnh:** cảnh phim toàn màn hình: tia sáng xoay theo màu gen, vật phẩm phóng to, chữ "GEN THỨC TỈNH!", tiếng ngân và hợp âm maj9.
- **Đột phá:** chớp sáng, rung bàn, chữ "ĐỘT PHÁ!".
- **Xu bay** theo đường cong vào ví, ví nảy lên, có tiếng xu.
- **Nhạc nền** tự sinh (ngũ cung, có tiếng vang), có thể tắt. Toàn bộ âm thanh tổng hợp bằng WebAudio, không cần file.
- Tôn trọng `prefers-reduced-motion`: giảm hạt, tắt rung màn hình.

---

## 16. Ngôn ngữ & font chữ

### 16.1 Song ngữ
- `i18n/vi.js` và `i18n/en.js`: khóa phẳng (`'stat.yield': 'Năng suất'`), tham số `{x}`. Thiếu khóa thì tự rơi về tiếng Việt.
- Ngữ pháp tên khác nhau theo ngôn ngữ: VI `{base} {gene}` → *Hạt Cà chua Nguyệt Quang*; EN `{gene} {base}` → *Moonlight Tomato Seed*.
- Định dạng số theo locale (vi: 1.250 · en: 1,250). Giá nạp: VND / USD.
- Thêm ngôn ngữ mới: tạo `i18n/xx.js` cùng bộ khóa, thêm vào `NOA.i18n.langs` và nút chọn trong Cài đặt. Trình kiểm tra cấu hình báo khóa thiếu.

### 16.2 Font: dễ đọc, dễ thương, KHÔNG lỗi dấu tiếng Việt
| Vai trò | Font | Lý do |
|---|---|---|
| Display (logo, "GEN THỨC TỈNH!", băng rôn độ hiếm) | **Coiny** | Tròn, mập, rất "game". Có bộ ký tự Vietnamese |
| UI (nút, số, tiêu đề) | **Baloo 2** (500–800) | Bo tròn, số đẹp, đọc rõ ở cỡ nhỏ. Có bộ Vietnamese |
| Nội dung (mô tả, cốt truyện) | **Nunito** (500–800) | Rất dễ đọc, thân thiện. Có bộ Vietnamese |

- Đã kiểm tra bằng Google Fonts API (subset `vietnamese` có mặt) và bằng trình duyệt (`document.fonts.check` với chuỗi "Thức tỉnh… ẩn ỗ ữ ặ"). Xem `tests/smoke.mjs`.
- Font dự phòng: `system-ui, -apple-system, Segoe UI, Roboto`, đều hỗ trợ tiếng Việt.
- **Quy tắc tránh lỗi dấu:** line-height tối thiểu 1,25 cho chữ hoa có dấu chồng (Ỉ, Ứ, Ẩ); không cắt `overflow: hidden` sát chiều cao dòng; viền chữ dùng `paint-order: stroke fill` để dấu không bị nét viền nuốt; **không dùng font không có subset Vietnamese** (ví dụ Fredoka, Lilita One, Luckiest Guy, Chewy).

---

## 17. Cấu hình & cân bằng ("mọi tỉ lệ ở một chỗ")

| File | Nội dung |
|---|---|
| `config/balance.js` | **MỌI** con số: xác suất, trọng số, giá, thời gian, bảng cấp, gacha, linh vật, sự kiện |
| `config/content.js` | Cái gì tồn tại: loài, sản phẩm, gen, giống lai, linh vật, hộp, NPC, lịch sao băng, bí ẩn, chương truyện, các bước hướng dẫn |
| `config/payment.js` | Thanh toán: bật/tắt, provider, endpoint, liên kết, gói nạp |
| `config/features.js` | Cờ tính năng: devPanel, weather, realSkyEvents, secrets, recessiveGenes, **geneEssence**, tutorial, music |

**Công cụ**
- `node tools/simulate.mjs [n]`: mô phỏng Monte Carlo, so tỉ lệ thực tế với cấu hình (sai lệch quá 4 sai số chuẩn thì báo lỗi) và kiểm tra pity.
- Trong game: ⚙️ → 🛠️ **Công cụ Dev**: cộng tài nguyên, lên cấp, sang ngày mới, tua thời gian, tốc độ ×5 / ×20, ép sự kiện (đêm, trăng tròn, sao băng, giông, cầu vồng), đổi thanh toán sang mock, bật tính năng, tạo giống có gen, giả lập 1.000 lần mở hộp, kiểm tra cấu hình.
- Trình kiểm tra cấu hình (`js/core/validate.js`) chạy mỗi lần mở game: xác suất ngoài 0..1, tham chiếu sai id, thiếu tên i18n…

---

## 18. Kiến trúc mở rộng

```
config/  →  js/core (noa: util, rng, events, hooks, MODS)  →  js/systems (logic, không DOM)  →  js/ui (giao diện)
```
- **Bộ cộng dồn tỉ lệ (`NOA.mods`):** mọi tỉ lệ đọc qua `NOA.mods.chance(key, base, ctx)`. Viện, linh vật, bùa, thời tiết, sự kiện đều chỉ là **nhà cung cấp** (provider). Tính năng mới muốn cộng tỉ lệ thì đăng ký provider, không sửa hệ thống gen.
- **Hooks (điểm mở rộng):** `item.actions` (thêm nút cho thẻ vật phẩm), `labs.sections` (thêm khu trong Viện), `gene.secretFusion` (công thức gen bí ẩn), `merge.result`, `spawn.species`, `order.generated`.
- **Sự kiện:** `merge.done`, `harvest`, `order.complete`, `gacha.opened`, `level.up`, `secret.unlocked`, `payment.completed`…
- **Ví dụ thật: Tinh chất gen** (`js/systems/essence.js`, đang TẮT): phân rã vật có gen → tinh chất; tiêm tinh chất vào vật thường → có tỉ lệ gắn gen. Module này cắm vào game hoàn toàn qua hooks, số liệu ở `balance.essence`. Bật bằng `features.geneEssence = true` hoặc trong bảng Dev.
- **Lưu game:** `NOA.save` có adapter đổi được (mặc định localStorage). Muốn lưu đám mây chỉ cần viết adapter `get/set/remove`. Có `saveVersion` và bảng **migrations** để nâng cấp save cũ.
- **Thêm nội dung:** loài mới = 1 dòng `content.species` + 3 sản phẩm + 1 dòng `balance.species` + tên ở 2 file i18n. Gen mới = 1 dòng `content.genes` (có `parents` nếu là gen dung hợp). Linh vật mới = `content.mascots` + `balance.mascots.effects`.

---

## 19. Lộ trình gợi ý & rủi ro
**Bước tiếp theo**
1. Playtest prototype: đo thời gian tới gen đầu tiên, tới cấp 5, tần suất kẹt bàn.
2. Chốt engine sản phẩm thật (Unity / Cocos / web). `config/*` và `i18n/*` chuyển nguyên trạng.
3. Thay emoji bằng art thật (cùng id), giữ ngôn ngữ hình viền mực dày.
4. Server: tài khoản, lưu đám mây, xác thực thanh toán, chống gian lận (tỉ lệ gacha phải roll trên server ở bản thật).
5. LiveOps: sự kiện theo mùa (Trung Thu, Tết), hội chợ giống (bảng xếp hạng siêu giống).

**Rủi ro & cách giảm**
- **Gen quá khó lấy làm người chơi nản:** có gen đầu tiên chắc chắn, bảng xem trước tỉ lệ, gen lặn, bùa may mắn. Theo dõi số liệu "thời gian tới gen đầu tiên".
- **Lạm phát Xu từ hàng gen:** bão hòa thị trường, chi phí Viện tăng mạnh, hạt siêu giống khó nhân bản.
- **Bàn bị nghẽn:** kho chứa, đóng gói sản lượng, bán nhanh, khóa vật.
- **Pháp lý gacha:** công bố tỉ lệ (đã có), pity, không bán hộp cho trẻ em ở thị trường cấm. Roll phải nằm trên server ở bản phát hành.
