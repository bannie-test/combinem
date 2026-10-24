# Noa Farm · Tài liệu thiết kế game (GDD) v0.2

> **Tên tạm:** Noa Farm · *Nông trại Hành tinh Hạt giống* / *The Seed Planet*
> **Thể loại:** Merge + nông trại (farming) + lai tạo gen, có yếu tố sưu tập
> **Nền tảng prototype:** Web (HTML/JS, chạy trên điện thoại và máy tính). Toàn bộ dữ liệu và tỉ lệ đã tách khỏi engine để chuyển sang Unity/Cocos sau này.
> **Ngôn ngữ:** Tiếng Việt (mặc định) và Tiếng Anh
> **v0.2:** merge diễn ra trong **Kho hạt giống / Chuồng ươm** của các viện nghiên cứu; thu hoạch sinh ra **hạt giống thế hệ sau và phụ phẩm**; nông trại thành **bản đồ chia khu** kiểu Hay Day / Township (ruộng, vườn hoa, chuồng trại, xưởng chế biến, bến tàu); bỏ năng lượng và máy tạo. Đề xuất công nghệ cho bản mobile ở §20.

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
| **Bé Na · Vòm Hà Nội** 👧 | Cô bé trên Trái Đất. Mỗi chuyến **Tàu Ong Vàng** chở đầy hàng về cho Na giúp hồi sinh Trái Đất. Là hậu duệ của cô bé mà bà Mai từng hứa |

### 1.5 Mạch truyện (7 chương, đã có trong game: Sổ tay → Cốt truyện)
| Chương | Mở khóa | Nội dung |
|---|---|---|
| 1 · Thức giấc | Cấp 1 | Tỉnh dậy, gặp Đậu, học merge, gieo hạt lúa đầu tiên |
| 2 · Gen đang ngủ | Gen đầu tiên | Một hạt phát sáng. Đậu kể về những đoạn gen bà Mai viết thêm |
| 3 · Tín hiệu từ Trái Đất | Cấp 3 | Radio bắt được "Vòm Hà Nội". Bé Na hỏi *"Hoa hồng có mùi gì ạ?"*. Tàu Ong Vàng bắt đầu chở hàng về Trái Đất |
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
 🌰 KHO HẠT GIỐNG (trong 🌱 Nhà kính)        🐣 CHUỒNG ƯƠM (trong 🐾 Trại nghiên cứu)
      │  ① MERGE: kéo 2 hạt / con giống GIỐNG HỆT chồng lên nhau → Lv+1 (có % ĐỘT PHÁ Lv+2) · chỉ số di truyền · GEN (§4)
      ▼                                              ▼
 🌾 RUỘNG / 🌸 VƯỜN HOA: gieo hạt             🐔 CHUỒNG TRẠI: thả con giống, cho ăn bằng hàng trong kho
      │  ② chờ lớn (chỉ số Sinh trưởng)              │  ② ăn xong thì sản xuất theo lứa
      ▼                                              ▼
 ③ THU HOẠCH: nông sản (Năng suất; số sao theo Phẩm chất; có thể mang gen)
      + 🌰 HẠT GIỐNG THẾ HỆ SAU → Kho hạt giống (cấp mẹ − 2, ~75% chỉ số, 35% giữ gen) · §3.3
      + PHỤ PHẨM: 🧹 Rơm (lúa) · 🌼 Phấn hoa (hoa) · 💩 Phân bón (bò, dê) · 🐣 Con non (vật nuôi → Chuồng ươm)
      ▼
 📦 KHO NÔNG SẢN (sức chứa chung, nâng cấp được)
      │  ④ CHẾ BIẾN ở Khu chế biến: 🏭 Nhà xay · 🍳 Bếp · 🧀 Lò sữa · 🧵 Xưởng thủ công (công thức nhiều nguyên liệu, hàng chờ)
      ▼
 ⑤ GIAO / BÁN: 📋 Bảng đơn hàng (Xu, XP; VIP thêm 🔬 💎) · 🚀 Tàu Ong Vàng (chất đủ thùng → 💎 🔬 + % hồi sinh Trái Đất) · 🧺 Sạp chợ
      ▼
 ⑥ NÂNG CẤP: Viện (tỉ lệ gen, dung hợp, lai chéo) · mở ruộng / luống hoa / ô nuôi / hàng chờ xưởng · nâng kho · linh vật · blindbox
      └──────────────────────────────────── quay lại ① ────────────────────────────────────┘
```

- **Core loop (giây → phút):** gieo → thu (✂️ vuốt qua nhiều ruộng) → merge hạt mới trong kho → gieo lại; cho ăn → thu trứng, sữa; chế biến → giao đơn.
- **Mid loop (phút → giờ):** nuôi một **dòng giống**: merge lên Lv cao để thu nhiều, giữ gen qua nhiều thế hệ hạt, nâng Viện, lai chéo, chất hàng lên tàu, đơn VIP.
- **Meta loop (ngày → tuần):** chuỗi đăng nhập 7 ngày, mở rộng bản đồ (ruộng, luống hoa, chuồng, xưởng), linh vật, sự kiện bầu trời thật, Sổ tay, % hồi sinh Trái Đất và cốt truyện.
- **Nguồn hạt / con giống:** thu hoạch (thế hệ sau), vật nuôi đẻ con non, Sạp chợ (Lv1 giá rẻ), blindbox, phần thưởng. Không còn năng lượng hay máy tạo: hạt giống là tài nguyên tái tạo, người chơi tự quyết giữ hạt tốt để merge hay bán bớt.

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

### 3.3 Hạt giống thế hệ sau (di truyền khi thu hoạch)
Mỗi lần thu hoạch một ô ruộng, ngoài nông sản còn có **hạt giống con** bay về 🌰 Kho hạt giống:

| | Quy tắc (mặc định trong `balance.harvest.seeds`) |
|---|---|
| Số hạt | theo cấp cây mẹ: Lv1 1 · Lv2 1 · Lv3 2 · Lv4 2 · Lv5 3, cộng 30% (+0,4% mỗi điểm Năng suất) có thêm 1 hạt; ruộng bón 💩 thêm 1 hạt |
| Cấp hạt con | **cấp mẹ − 2** (tối thiểu Lv1): hạt Lv5 cho hạt Lv3 → muốn giữ Lv5 phải tiếp tục merge |
| Chỉ số | ≈ 75% chỉ số mẹ ± 5 (đột biến), không vượt trần của cấp |
| Gen | mẹ có gen: mỗi hạt con **35%** giữ gen (◆ −1); không giữ thì 50% thành **gen lặn** ẩn. Mẹ mang gen lặn: con mang tiếp 50% |
| Kho đầy | tối đa 12 hạt chờ trong 🧺 giỏ, quá nữa thì mất (có cảnh báo) |

- **Vật nuôi:** mỗi lứa có **14% + 2% × cấp** đẻ một **con non** về 🐣 Chuồng ươm, di truyền theo cùng quy tắc.
- **Ý đồ thiết kế:** hạt giống là tài nguyên tái tạo nhưng "xuống cấp" theo thế hệ, nên merge luôn có việc để làm; một dòng gen quý có thể được nhân giống qua nhiều thế hệ nếu người chơi kiên nhẫn (đúng tinh thần Kho Gen của câu chuyện).
- **Sản phẩm không merge nữa:** nông sản đi vào Kho nông sản và được **chế biến** ở xưởng (§6.4).

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

Có hai cơ sở ở **Khu nghiên cứu** trên bản đồ, tiến độ riêng. Bên trong mỗi viện là **bàn merge**:
- 🌱 **Nhà Kính Lai Tạo** chứa 🌰 **Kho hạt giống** (24 ô, mở rộng tới 48) và áp dụng cho mọi hạt giống.
- 🐾 **Trại Nghiên Cứu Vật Nuôi** chứa 🐣 **Chuồng ươm** (12 ô, tới 30) và áp dụng cho mọi con giống.

Chạm viện trên bản đồ (hoặc tab 🧬 Lai tạo) để mở bàn merge; nút ⬆️ là bảng nâng cấp, nút 🧪 là bàn lai chéo.

Nâng cấp bằng 🪙 Xu và 🔬 **Điểm nghiên cứu**. RP lấy từ đơn VIP, đơn Trái Đất, thu hoạch hàng có gen, khám phá gen mới và lai chéo thất bại.

| Cấp | Chi phí | +Thành công | Gen mới | +Đột phá | Ô lai | Lai thành công | ◆ tối đa | Dung hợp |
|---|---|---|---|---|---|---|---|---|
| 1 | | +0% | 1,0% | +0% | 0 | 35% | ◆2 | Tầng 1 |
| 2 | 600🪙 · 8🔬 | +2% | 1,3% | +0,5% | 1 | 35% | ◆3 | Tầng 1 |
| 3 | 1.600 · 20 | +4% | 1,6% | +1% | 1 | 38% | ◆3 | **Tầng 2** |
| 4 | 3.200 · 36 | +6% | 1,9% | +1,5% | 1 | 41% | ◆4 | Tầng 2 |
| 5 | 5.600 · 56 | +8% | 2,2% | +2% | 2 | 44% | ◆4 | Tầng 2 |
| 6 | 9.000 · 80 | +10% | 2,6% | +2,5% | 2 | 47% | **◆5** | **Tầng 3** |
| 7–10 | … | … +20% | … 5% | … +5% | 3–4 | … 62% | ◆5 | Tầng 3 |

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

## 6. Bản đồ nông trại (kiểu Hay Day / Township)

Nông trại là **một bản đồ cuộn và phóng to được** (kéo để đi, chụm hai ngón hoặc nút ＋/－ để zoom, có quán tính). Mỗi khu là một mảnh đất riêng có **biển tên treo**, nên người chơi nhìn là biết đâu là ruộng, đâu là chuồng. Thanh chip ở đáy bản đồ đưa camera bay tới từng khu.

### 6.1 Các khu (từ trên xuống)
| Khu | Có gì | Chạm vào để |
|---|---|---|
| 🏡 Sân nhà & Chợ | Nhà của Đậu · 📋 Bảng đơn hàng · 📦 Kho nông sản · 🧺 Sạp chợ | Cốt truyện · giao đơn · xem kho · mua hạt / con giống, bán hàng |
| 🌾 Ruộng | 4 ô đầu → tối đa 12 (300 → 8.000🪙, mở dần cấp 2–12) | gieo, thu, bón phân |
| 🌸 Vườn hoa | luống hoa (2 luống miễn phí ở cấp 2, tối đa 6) | trồng hoa hồng, hướng dương, dâu tây hoa hồng |
| 🔬 Khu nghiên cứu | 🌱 Nhà kính · 🐾 Trại nghiên cứu · ⛩️ Đền linh vật · 🎋 Cây điều ước (blindbox) | merge, nâng viện, lai chéo · đặt linh vật · mở hộp |
| 🐄 Khu chăn nuôi | 🐔 Chuồng gà · 🐄 Chuồng bò · 🐝 Trại ong · 🐑 Bãi cừu · 🐐 Chuồng dê · ao vịt | thả con giống, cho ăn, thu hoạch |
| 🏭 Khu chế biến | 🏭 Nhà xay · 🍳 Bếp · 🧀 Lò sữa · 🧵 Xưởng thủ công | chế biến theo công thức |
| 🚀 Bến tàu | 🚀 Tàu Ong Vàng | chất hàng gửi về Trái Đất |

- **Trạng thái hiện ngay trên bản đồ** (bong bóng): ruộng chín sáng vàng kèm "✂️ Thu!"; con vật đói có bong bóng nghĩ hình thức ăn, xong thì nảy sản phẩm; xưởng hiện món đang làm + đồng hồ, xong thì "✓"; bảng đơn hiện số đơn giao được; viện hiện số cặp merge được hoặc 🧪 lai xong; kho đầy thì cảnh báo.
- Ô / chuồng / xưởng **chưa mở** vẫn hiện trên bản đồ (bụi cỏ, khóa, giá hoặc "🔒 Lv*n*"), để người chơi luôn thấy mục tiêu tiếp theo.
- **Robot Đậu** đứng ở góc bản đồ với bong bóng lời thoại; ngoài lúc hướng dẫn, bong bóng tự thu gọn để không che bản đồ. Ngày / đêm, mưa, giông, cầu vồng phủ lên cả bản đồ; sao băng bay ngang qua.

### 6.2 Ruộng & vườn hoa
- **Gieo:** chạm ô trống → bảng chọn hạt (hạt có gen và cấp cao lên đầu, hiện thời gian lớn). Gieo xong bảng tự chuyển sang ô trống kế tiếp.
- **Thu hoạch:** chạm ô chín, hoặc **giữ và vuốt ✂️ qua nhiều ô** (như liềm của Hay Day). Nông sản bay về tab 📦 Kho, hạt giống bay về tab 🧬 Lai tạo.
- **Sản lượng mỗi lần** = đơn vị gốc theo cấp (2 / 4 / 7 / 12 / 20) × (1 + Năng suất%) × bonus. **Thời gian** = thời gian gốc của loài × hệ số theo cấp (1 / 1,4 / 1,9 / 2,4 / 3,0) × (1 − Sinh trưởng × 0,5%) × bonus (thời tiết, linh vật).
- Mỗi nông sản của giống có gen có **50%** mang gen đó, kèm +1🔬.
- **Phụ phẩm:** lúa cho 🧹 Rơm, hoa cho 🌼 Phấn hoa: `1 + ⌊nông sản / 3⌋`.
- **💩 Bón phân** (từ bò, dê, hoặc cửa hàng): lần thu tới ×1,5 nông sản và thêm 1 hạt giống.
- Kho nông sản thiếu chỗ thì **chưa cho thu** (cây vẫn đứng chờ, không mất).

### 6.3 Chăn nuôi
| Chuồng | Loài (mở ở cấp) | Ăn | Ra | Phụ phẩm |
|---|---|---|---|---|
| 🐔 Chuồng gà (2 → 6 ô) | Gà (1) | 🌾 Bó lúa | 🥚 Trứng | con non |
| 🐄 Chuồng bò (1 → 5) | Bò (3) | 🧹 Rơm | 🥛 Sữa | 💩 60% mỗi lứa, con non |
| 🐝 Trại ong (1 → 4) | Ong (4) | 🌼 Phấn hoa | 🍯 Mật ong | con non |
| 🐑 Bãi cừu (1 → 5) | Cừu (5), Cừu dê (lai) | 🧹 Rơm | 🧶 Len | con non |
| 🐐 Chuồng dê (1 → 5) | Dê (6) | 🧹 Rơm | 🍼 Sữa dê | 💩, con non |

- Chạm chuồng: có con xong thì **thu cả chuồng**; nếu không thì mở bảng chuồng (cho ăn tất cả, thêm con giống từ Chuồng ươm, đưa con về, mở ô nuôi, dùng 🧃).
- Chuỗi phụ thuộc kiểu Hay Day: **lúa → rơm → bò → phân bón → ruộng** và **hoa → phấn → ong**, nên các khu gắn bó với nhau.

### 6.4 Chế biến (kiểu Township)
Mỗi xưởng chạy **một món một lúc**, các món khác xếp hàng chờ (2 ô, mua thêm tới 5). Giá trị thành phẩm = tổng giá nguyên liệu × 1,3. Sao = trung bình nguyên liệu (+15% được thêm 1★). Gen chỉ giữ nếu mọi nguyên liệu cùng gen (tỉ lệ "cao cấp + cao cấp"), còn lại dùng tỉ lệ thấp "cao cấp + thường".

| Xưởng (mở ở cấp) | Công thức tiêu biểu |
|---|---|
| 🏭 Nhà xay (1) | 3 Bó lúa → 🍚 Gạo thơm · 3 Hoa hướng dương → 🌰 Hạt hướng dương |
| 🍳 Bếp (3) | 2 Gạo thơm → 🍙 Cơm nắm · 3 Cà chua → 🥫 Sốt cà chua · 2 Trứng → 🍳 Trứng ốp la · 3 Trứng + Sữa → 🍮 Bánh flan · Mật ong + Gạo thơm + Trứng → 🥞 Bánh mật ong … |
| 🧀 Lò sữa (4) | 3 Sữa → 🧈 Bơ · 2 Sữa + Mật ong → 🍦 Kem · 3 Sữa dê → 🧀 Phô mai dê |
| 🧵 Xưởng thủ công (5) | 3 Cành hồng → 💐 Bó hồng · 2 Mật ong → 🕯️ Nến · 3 Len → 🧣 Khăn len … |

Toàn bộ 22 công thức ở `balance.recipes`; thêm công thức mới chỉ cần thêm một dòng.

### 6.5 Kho
- 📦 **Kho nông sản:** 100 chỗ dùng chung cho nông sản, thành phẩm và vật liệu; mỗi lần nâng +25 (tối đa 400), giá 400🪙 × 1,5ⁿ. Món khác sao / khác gen là chồng riêng.
- 🌰 **Kho hạt giống** và 🐣 **Chuồng ươm** là lưới merge (6 cột), mở rộng bằng 💎 ở Cửa hàng.

---

## 7. Đơn hàng, tàu, bán hàng, thị trường

| Loại | Điều kiện | Thưởng |
|---|---|---|
| 📋 Thường (6 đơn trên bảng) | 1–3 dòng hàng; cấp càng cao càng hay đòi hàng chế biến tầng 2–3 | Xu = **giá trị thật của hàng giao** × 1,5, kèm XP |
| ✨ VIP (Lữ Khách Phương Xa) | Từ cấp 4, 18%: cần hàng **có gen** hoặc **≥3★** | ×2,6 Xu, 4–12🔬, 35% có 2–6💎 |
| 🚀 Tàu Ong Vàng (Bác Tư chở về cho Bé Na) | Từ cấp 3. Tàu đậu 8 phút với 3 thùng hàng, đi 4 phút rồi quay lại | Mỗi thùng: giá trị × 1,8 Xu. **Chất đủ cả 3 thùng:** +5💎 +10🔬 và **+3% hồi sinh Trái Đất** |

- Giao hàng chất lượng cao (sao, gen) thì nhận nhiều Xu hơn, vì thưởng tính theo giá trị thật. Nút **Giao** tự lấy món **rẻ nhất** phù hợp trong kho.
- **Đổi đơn:** hồi chiêu chung 60 giây.
- **Bán:** ở Kho nông sản (bán 1 / bán hết) hoặc kéo hạt / con giống vào 🧺 ở bàn merge. Bão hòa thị trường: mỗi lần bán cùng một loại trong ngày giảm 5% giá, thấp nhất 45%. Vật có gen hoặc Lv4+ phải xác nhận trước khi bán.
- 🔒 **Khóa** hạt / con giống quý để không merge hay bán nhầm.

---

## 8. Vật phẩm hỗ trợ (bùa may mắn)
| | Vật phẩm | Cách dùng | Hiệu ứng |
|---|---|---|---|
| 🍀 | Cỏ bốn lá | Kéo lên hạt / con giống (gắn bùa) | Lần merge kế: +15% giữ gen, +10% lên ◆, +8% dung hợp, gen mới ×2,5, +3% đột phá |
| 🧪 | Bình ổn gen | Gắn bùa | Lần merge kế **chắc chắn không mất gen, không giảm ◆** |
| ✨ | Bụi sao | Gắn bùa | +10% đột phá, +10% dung hợp |
| 🧃 | Thuốc tăng trưởng | Dùng ở bảng ô ruộng / chuồng / xưởng | Xong ngay 1 ô ruộng, cả chuồng hoặc món đang chế biến |
| 🔍 | Kính lúp gen | Kéo lên hạt / con giống | Soi gen lặn |

Bùa của cả hai bên đều tính vào lần merge và bị tiêu hao sau lần đó.

---

## 9. Linh vật
- **Tạm thời** (kích hoạt ngay, trùng thì cộng dồn thời gian): 🐇 Thỏ Ngọc (cây lớn nhanh 25%), 🐞 Bọ Rùa (+8% giữ gen), 🐿️ Sóc (chế biến nhanh 20%), 🦉 Cú Đêm (gen mới ×2), 🐝 Ong Thợ (+30% sản lượng), 💫 Đom Đóm *(bí ẩn)*.
- **Vĩnh viễn** (đặt vào **Đền linh vật**, 3 ô; trùng thì +1★, tối đa 5★, đủ sao thì đổi Ngọc): 🐈 Mèo Thần Tài (+10% Xu), 🐸 Cóc Gọi Mưa ("con cóc là cậu ông Trời": cây nhanh hơn, trời hay mưa hơn), 🐃 Trâu Vàng (+12% sản lượng), 🐕 Chó Giữ Vườn (+20 chỗ trong Kho nông sản, +10 mỗi sao), 🦢 Thiên Nga (+4% giữ gen), 🐟 Cá Chép Vượt Vũ Môn (+3% đột phá: cá chép hóa rồng), 🐦 Chim Họa Mi *(bí ẩn)*.

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
- **Đăng nhập 7 ngày** (lặp lại, không reset khi bỏ lỡ): 200🪙 · 3💩+🍀 · Vé Mầm Xanh · 400🪙+15🔬 · 15💎 · 10🧹+🧪 · **30💎 + Vé Tinh Tú**. Tự hiện khi mở game, nút 🎁 ở góc bản đồ có chấm đỏ báo.
- **Lên cấp:** bảng riêng cho cấp 2–10 (có hạt hoa hồng, con bò, rơm, phấn hoa, phân bón…), sau đó theo công thức (Xu tăng dần, 10💎, 3💩, vé Tinh Tú mỗi 5 cấp). Màn hình lên cấp liệt kê phần thưởng và **loài, công trình, ô đất mới mở**.
- **Mở khóa theo cấp:** Vườn hoa & Blindbox (2) · Bếp, Tàu Ong Vàng & Đền linh vật (3) · Lò sữa & Đơn VIP (4) · Xưởng thủ công, Lai chéo & Hộp Tinh Tú (5). Loài mới mở dần từ cấp 1 đến 6, ruộng tới cấp 12.

---

## 12. Cửa hàng, 2 loại tiền, thanh toán

### 12.1 Hai loại tiền
- 🪙 **Xu** (soft): kiếm trong game từ đơn hàng, bán hàng, đăng nhập, lên cấp.
- 💎 **Ngọc** (hard): **từ nạp tiền**, ngoài ra có ít từ đăng nhập, lên cấp, VIP, bí ẩn.

### 12.2 Cửa hàng
- **🌱 Hạt & con giống Lv1** của mọi loài đã mở (cũng là Sạp chợ trên bản đồ).
- **🧰 Vật tư:** phân bón, rơm, phấn hoa, bùa may mắn, thuốc, kính lúp, mở rộng Kho hạt giống / Chuồng ươm, vé Tinh Tú. Mỗi món mua bằng Xu hoặc Ngọc.
- **🎁 Blindbox** (cũng là Cây điều ước trên bản đồ).
- **Đổi Ngọc → Xu:** 10💎 = 800🪙.
- **Ngọc (nạp tiền):** 4 gói, giá hiển thị VND (tiếng Việt) hoặc USD (tiếng Anh).
- **Ưu đãi:** Gói Khởi Đầu (mua 1 lần), Thẻ Tháng (100💎 ngay, sau đó 15💎 + 1🧃 mỗi ngày trong 30 ngày).

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
- **Hooks (điểm mở rộng):** `item.actions` (thêm nút cho thẻ hạt / con giống), `labs.sections` (thêm khu trong Viện), `gene.secretFusion` (công thức gen bí ẩn), `merge.result`, `order.generated`.
- **Sự kiện:** `merge.done`, `plot.planted`, `harvest`, `pen.fed`, `production.started`, `order.complete`, `ship.departed`, `gacha.opened`, `level.up`, `secret.unlocked`, `payment.completed`…
- **Bản đồ là dữ liệu:** vị trí khu, công trình, ô ruộng nằm ở `content.map`; thêm một chuồng / xưởng mới = thêm dòng `content.buildings` + `content.map.buildings` + số liệu ở `balance`.
- **Ví dụ thật: Tinh chất gen** (`js/systems/essence.js`, đang TẮT): phân rã vật có gen → tinh chất; tiêm tinh chất vào vật thường → có tỉ lệ gắn gen. Module này cắm vào game hoàn toàn qua hooks, số liệu ở `balance.essence`. Bật bằng `features.geneEssence = true` hoặc trong bảng Dev.
- **Lưu game:** `NOA.save` có adapter đổi được (mặc định localStorage). Muốn lưu đám mây chỉ cần viết adapter `get/set/remove`. Có `saveVersion` và bảng **migrations** để nâng cấp save cũ.
- **Thêm nội dung:** loài mới = 1 dòng `content.species` + 3 sản phẩm + 1 dòng `balance.species` + tên ở 2 file i18n. Gen mới = 1 dòng `content.genes` (có `parents` nếu là gen dung hợp). Linh vật mới = `content.mascots` + `balance.mascots.effects`.

---

## 19. Lộ trình gợi ý & rủi ro
**Bước tiếp theo**
1. Playtest prototype: đo thời gian tới gen đầu tiên, tới cấp 5, tần suất kho đầy, số hạt dư mỗi giờ.
2. Chốt engine sản phẩm thật (đề xuất ở §20). `config/*` và `i18n/*` chuyển nguyên trạng.
3. Thay emoji bằng art thật (cùng id), giữ ngôn ngữ hình viền mực dày.
4. Server: tài khoản, lưu đám mây, xác thực thanh toán, chống gian lận (tỉ lệ gacha phải roll trên server ở bản thật).
5. LiveOps: sự kiện theo mùa (Trung Thu, Tết), hội chợ giống (bảng xếp hạng siêu giống).

**Rủi ro & cách giảm**
- **Gen quá khó lấy làm người chơi nản:** có gen đầu tiên chắc chắn, bảng xem trước tỉ lệ, gen lặn, bùa may mắn. Theo dõi số liệu "thời gian tới gen đầu tiên".
- **Lạm phát Xu từ hàng gen:** bão hòa thị trường, chi phí Viện tăng mạnh, hạt siêu giống khó nhân bản.
- **Kho đầy / hạt dư:** giỏ hạt chờ, cảnh báo trước khi mất, nút bán nhanh hạt Lv1 thường (giữ 2 mỗi loài), nâng kho, khóa vật quý.
- **Pháp lý gacha:** công bố tỉ lệ (đã có), pity, không bán hộp cho trẻ em ở thị trường cấm. Roll phải nằm trên server ở bản phát hành.

---

## 20. Đề xuất tech stack cho bản mobile

**Mục tiêu:** chạy mượt 60 khung hình/giây trên máy Android tầm trung và thấp, nhẹ (dung lượng tải, RAM, pin), **chơi offline và lưu dữ liệu trong máy**, chuyển được nhiều nhất phần đã làm ở prototype.

### 20.1 Đề xuất chính: **Cocos Creator 3.8 (bản LTS) + TypeScript**
- Engine chuyên game 2D trên di động, xuất Android / iOS / Web / mini-game từ một mã nguồn. Bản build 2D thường nhẹ hơn Unity đáng kể.
- **Tái sử dụng tối đa prototype:** toàn bộ `config/`, `i18n/` và `js/systems/` (logic không phụ thuộc DOM) chuyển sang TypeScript gần như 1:1. Chỉ phải làm lại lớp giao diện (`js/ui/`) bằng scene và prefab của Cocos.
- Có sẵn editor cảnh / prefab / animation, đóng gói texture atlas tự động, hỗ trợ Spine và DragonBones cho hoạt ảnh xương (con vật, robot Đậu), hệ hạt (particle) 2D.
- Miễn phí; nhiều studio ở Việt Nam và châu Á dùng nên dễ tuyển người.
- Lưu dữ liệu: `sys.localStorage` cho dữ liệu nhỏ, hoặc ghi file JSON vào `jsb.fileUtils.getWritablePath()` cho save chính (xem 20.3).

### 20.2 Phương án khác
| | Cocos Creator 3.8 + TS | Unity 6 LTS (2D) + C# | Godot 4 | Flutter (Flame) / React Native / WebView |
|---|---|---|---|---|
| Hiệu năng 2D trên máy yếu | Tốt | Tốt | Tốt | Trung bình – kém (giật khi nhiều hạt, kéo thả) |
| Dung lượng bản build 2D (ước lượng) | nhẹ | nặng hơn (runtime lớn) | nhẹ – vừa | nhẹ |
| Dùng lại logic JS của prototype | **Rất cao** (TS) | Viết lại sang C# | Viết lại (GDScript / C#) | Cao (JS / Dart phải viết lại) |
| SDK (IAP, quảng cáo, Firebase) | Khá, có plugin | **Mạnh nhất** | Trung bình | Khá |
| Chi phí | Miễn phí | Miễn phí dưới ngưỡng doanh thu của gói Personal | Miễn phí (MIT) | Miễn phí |
| Khi nào nên chọn | Đội nhỏ, muốn ra nhanh từ prototype này | Đội đã quen Unity, cần nhiều SDK, có kế hoạch 3D | Thích mã nguồn mở hoàn toàn | **Không khuyến nghị** cho game merge kéo thả nhiều hiệu ứng |

*Defold* (Lua) cũng rất nhẹ và nhanh, phù hợp nếu đội quen Lua.

### 20.3 Lưu dữ liệu trong máy (offline-first)
1. **Định dạng:** một file JSON (khoảng 5–50 KB), có `saveVersion` và bảng **migrations** như prototype (`js/core/save.js`).
2. **Ghi an toàn:** gom ghi sau ~0,4 giây và ghi ngay khi app vào nền (onPause / visibility); **ghi nguyên tử** (ghi file tạm rồi đổi tên) và giữ 1 bản sao lưu; thêm **checksum** (CRC32 hoặc HMAC) để phát hiện file hỏng / bị sửa, hỏng thì tự quay về bản sao lưu.
3. **Vị trí:** Cocos: thư mục ghi được của ứng dụng; Unity: `Application.persistentDataPath`. Không nhét save lớn vào PlayerPrefs.
4. **Tiến trình khi tắt app:** mọi đồng hồ (ruộng, chuồng, xưởng, tàu) lưu **mốc thời gian tuyệt đối** như prototype, nên mở lại là thấy cây đã chín. **Chống chỉnh giờ:** lưu "lần cuối thấy giờ"; nếu giờ máy lùi quá ngưỡng thì tạm dừng phần thưởng theo ngày cho tới khi giờ bắt kịp; khi có mạng thì lấy giờ server cho quà đăng nhập.
5. **Lưu đám mây (sau này):** Google Play Games Saved Games / iCloud hoặc server riêng, dùng đúng giao diện adapter `get / set / remove` đã có (`NOA.save.setAdapter`).
6. Mã hóa nhẹ phía client chỉ chống sửa file "cho vui"; thứ có giá trị thật (Ngọc mua bằng tiền) phải xác thực ở server.

### 20.4 Tối ưu tài nguyên & độ mượt
- **Đồ họa:** texture atlas theo khu bản đồ; nén ASTC (iOS, Android đời mới) và ETC2 dự phòng; ảnh tối đa 2048 px; hai bộ độ phân giải (thường / HD).
- **Draw call:** gom sprite cùng atlas, bong bóng trạng thái và chữ dùng chung atlas / font bitmap; mục tiêu < 50 draw call trên bản đồ.
- **Bản đồ:** chỉ cập nhật đối tượng trong khung nhìn (culling), camera có quán tính; đồng hồ cập nhật 4 lần/giây như prototype thay vì mỗi khung hình.
- **Bộ nhớ:** pool đối tượng cho hạt, chữ bay, xu bay; tránh tạo object mỗi khung hình; tải khu bản đồ theo nhu cầu. Mục tiêu RAM < 300 MB trên máy yếu.
- **Hoạt ảnh:** Spine cho con vật và Đậu (nhẹ hơn ảnh từng khung); hiệu ứng merge bằng particle + tween.
- **Âm thanh:** SFX ngắn (OGG / M4A) + 1 bản nhạc stream; giữ ý tưởng "mỗi merge một nốt nhạc" bằng các mẫu âm theo cao độ.
- **Chữ tiếng Việt:** font SDF / bitmap tạo từ Baloo 2, Nunito, Coiny với đủ bộ ký tự có dấu (kiểm tra tự động như `tests/smoke.mjs`).
- **Pin:** giảm FPS xuống 30 khi không có tương tác, dừng render khi app ở nền.
- **Dung lượng tải:** Android App Bundle + Play Asset Delivery cho phần nghệ thuật lớn.

### 20.5 Dịch vụ & công cụ
- **Phân tích & lỗi:** Firebase Analytics + Crashlytics (đo thời gian tới gen đầu tiên, tỉ lệ kho đầy, hạt bị mất).
- **Cân bằng từ xa:** Firebase Remote Config hoặc file `balance.json` tải về, vì mọi số đã tách khỏi code.
- **Thanh toán:** Google Play Billing và StoreKit 2. Game chơi offline một người có thể xác thực hóa đơn tại máy ở giai đoạn đầu, nhưng nên chuyển sang **xác thực ở server** (luồng `createOrder → pay → verify → grant` đã dựng ở §12.3) trước khi phát hành rộng.
- **Kiểm thử:** unit test cho logic (Jest cho TS), mô phỏng tỉ lệ như `tools/simulate.mjs`, kiểm thử giao diện tự động.

### 20.6 Lộ trình chuyển đổi gợi ý
1. **Giai đoạn 1:** dựng dự án Cocos, port `config/`, `i18n/`, `js/systems/` sang TS kèm unit test; lưu file JSON trong máy.
2. **Giai đoạn 2:** làm lại giao diện: scene bản đồ (các khu, camera), bàn merge kéo thả, bảng chuồng / xưởng / tàu, HUD.
3. **Giai đoạn 3:** nghệ thuật thật thay emoji (giữ nguyên id), Spine, âm thanh, hiệu ứng.
4. **Giai đoạn 4:** IAP sandbox, Analytics, Crashlytics, Remote Config, thử nghiệm kín trên máy Android tầm thấp.
