# Noa Farm · Bộ prompt vẽ asset (Art Prompt Bible)

Dùng cho Midjourney / DALL·E / Stable Diffusion (SDXL, Flux) / Leonardo / Scenario.
Prompt viết bằng tiếng Anh vì các model vẽ hiểu tiếng Anh tốt nhất. Phần giải thích bằng tiếng Việt.

---

## 1. Cách dùng để mọi asset cùng một phong cách

1. **Mỗi prompt = `[STYLE CORE]` + `[mô tả vật thể]` + `[TECH]`.** Không bao giờ bỏ STYLE CORE.
2. **Vẽ "ảnh chuẩn" trước** (nhà chính + 1 cây lúa + 1 con gà). Chọn tấm đẹp nhất, dùng nó làm ảnh tham chiếu phong cách cho mọi asset sau:
   - Midjourney: `--sref <link ảnh chuẩn> --sw 200`, giữ cùng `--seed`, `--style raw` nếu bị "quá nghệ thuật".
   - Stable Diffusion / Flux: IP-Adapter (style) với ảnh chuẩn, hoặc train 1 LoRA từ 15–30 asset đã duyệt.
   - Leonardo / Scenario: tạo "Style / Model" từ 10–20 ảnh đã duyệt rồi chỉ đổi phần mô tả.
3. **Vẽ theo bộ** (cả 4 giai đoạn của 1 cây, cả 3 sản phẩm của 1 loài) trong cùng một phiên, cùng seed.
4. **Không ghi tên game khác** (Hay Day, Township…) trong prompt: dễ ra bản sao gần giống, có rủi ro bản quyền khi lên store. STYLE CORE đã mô tả đúng chất "cozy mobile farm game".
5. Sau khi vẽ: tách nền (nếu model không ra nền trong suốt), cắt sát viền, chừa 4–8 px trống, xuất PNG.

---

## 2. STYLE CORE (dán vào đầu MỌI prompt)

```
cozy cartoon mobile farm game asset, 3/4 top-down view (camera tilted about 45 degrees from above, slightly from the front-left),
soft rounded chunky shapes, cute and playful proportions, clean thick dark-brown outline (not black),
warm saturated pastel colors, soft cel shading with gentle gradients, light from the top-left,
small soft contact shadow on the ground to the bottom-right, subtle rim highlight,
hand-painted 2D game art, polished, high readability at small size, consistent scale
```

## 3. TECH (dán vào cuối prompt, chọn 1 dòng)

```
single isolated object, centered, full object visible, transparent background, no ground plane except its own soft shadow, 1024x1024
```
```
sprite sheet, 4 frames in one row, same object, same size and position, evenly spaced, transparent background
```
```
seamless tileable texture, top-down, no objects, no shadows from outside, 1024x1024
```

## 4. NEGATIVE PROMPT (Stable Diffusion / Leonardo; Midjourney dùng `--no ...`)

```
realistic, photo, 3d render, low poly, pixel art, voxel, anime character, harsh black outline, flat vector clipart,
isometric grid lines, text, letters, watermark, logo, signature, UI frame, border, cropped, cut off,
multiple objects, busy background, dark gloomy colors, horror, noise, blurry, jpeg artifacts, perspective distortion, side view, top view only
```

## 5. Bảng màu chuẩn (giữ thống nhất)

| Vai trò | Màu |
|---|---|
| Viền | `#4a2f22` nâu đậm |
| Cỏ | `#8fd16a` sáng · `#6dbb4b` giữa · `#4f9a3a` tối |
| Đất ruộng | `#b97a4a` · luống `#9a5f36` |
| Gỗ | `#d79a5b` · tối `#a8693a` |
| Mái đỏ / xanh / vàng | `#e8574a` · `#4fa3e0` · `#f4b63d` |
| Tường kem | `#fff1d6` |
| Nước | `#6fd0f0` · tối `#3fa6d6` |
| Vàng nhấn (Ngọc, sao) | `#ffcf33` |

Thêm vào prompt khi cần khóa màu: `color palette: warm cream walls, red-coral roofs, honey wood, fresh lime grass, sky-blue water`.

---

## 6. Kích thước & quy ước file

| Nhóm | Canvas vẽ | Kích thước trong game (px @1x) | Tên file |
|---|---|---|---|
| Công trình lớn | 1024² | 120–150 rộng | `bld_<id>.png` |
| Chuồng (có hàng rào) | 1024² | 150×150 | `pen_<id>.png` |
| Cây trồng theo giai đoạn | 512² | 40–60 | `crop_<species>_<s1|s2|s3|ready>.png` |
| Vật nuôi | 512² | 34–52 | `ani_<species>_<idle|eat|happy>.png` |
| Sản phẩm / vật phẩm (icon) | 512² | 48–64 | `item_<id>.png` |
| Gen (huy hiệu) | 512² | 40 | `gene_<id>.png` |
| Trang trí | 512² | 20–80 | `deco_<name>.png` |
| Texture nền | 1024² tileable | — | `tex_<name>.png` |
| UI | theo mục 12 | — | `ui_<name>.png` |

Mọi vật thể đứng **cùng một góc camera và cùng hướng sáng**. Đáy vật thể nằm ở 85% chiều cao canvas để xếp lên bản đồ không bị "lơ lửng".

---

## 7. Công trình (buildings)

Mẫu: `[STYLE CORE], <mô tả>, [TECH: single isolated object]`

| id | Mô tả (dán vào chỗ `<mô tả>`) |
|---|---|
| house | `a cozy two-story farmhouse with cream walls, coral-red shingle roof, round attic window, wooden porch with two steps, flower boxes under the windows, small chimney with a puff of smoke` |
| orders | `a small wooden order board kiosk with a little roof, pinned paper notes, a hanging bell, a crate of produce beside it` |
| barn | `a big classic red barn with white trim, large double doors with an X pattern, hay bales peeking out of the loft, a small weather vane on top` |
| market | `a cheerful roadside market stall with a striped red and white awning, wooden counter with baskets of vegetables and fruit, a chalk price sign without text` |
| greenhouse | `a charming plant research greenhouse made of glass panels with a white frame, green plants and glowing seedlings inside, a small science antenna, a DNA-leaf emblem above the door` |
| ranch | `an animal research ranch lab: wooden cabin with a teal roof, paw-print emblem, small glass dome on the side with a cute holographic heart, hay and feed sacks at the entrance` |
| shrine | `a tiny peaceful Vietnamese-style garden shrine with curved roof tips, red pillars, a stone lantern, a small offering incense pot, moss and little flowers` |
| wishtree | `a magical wishing tree with a thick twisted trunk, round fluffy pink and green canopy, hanging paper lanterns and ribbon wishes, sparkles around it` |
| mill | `a tall stone-and-wood windmill with a blue roof cap, flour sacks at the door` (vẽ cánh quạt riêng: `four wooden windmill blades with cream canvas sails, front view, centered hub`) |
| kitchen | `a bakery cottage kitchen with a brick oven chimney, warm glowing window, bread and pie on the windowsill, striped yellow awning` |
| dairy | `a small dairy house with white walls, blue roof, big milk can sign shape, milk bottles and cheese wheels at the door` |
| craft | `a cozy craft workshop with a spinning wheel by the door, wool yarn balls, a honey jar shelf, a candle-shaped sign, green roof` |
| dock | `a wooden landing pad and pier for a delivery spaceship, round platform with glowing guide lights, rope posts, crates and a cargo net` |
| bee-ship | `a cute round bee-shaped delivery spaceship, yellow and brown stripes, glass cockpit bubble, little transparent wings, small landing legs, soft engine glow` |

**Trạng thái phụ** (cùng prompt, thêm cuối):
- Khóa: không cần vẽ — game tự chuyển xám + ổ khóa.
- Nâng cấp cấp 2 / 3: `upgraded version, slightly bigger, extra decorations, golden trim` (giữ nguyên bố cục).
- Đang xây: `under construction, wooden scaffolding, a few planks and a toolbox, partially built`.

---

## 8. Chuồng trại (pens) — vẽ 2 lớp

Chuồng cần **2 file** để con vật đứng giữa: lớp sau (nền + nhà + rào sau) và lớp trước (chỉ rào trước).

```
[STYLE CORE], a fenced animal yard seen from 3/4 top-down, <yard>, small shelter at the back, wooden fence on all sides,
empty yard with no animals, [TECH: single isolated object]
```
Lớp trước: `only the front wooden fence segment of the same yard, nothing else, transparent background`.

| id | `<yard>` |
|---|---|
| coop | `a red chicken coop house with a little ramp, nesting boxes with straw, grain scattered on dirt` |
| cowshed | `a wooden cow shed with a hay feeder, trough of water, grass and dirt patches` |
| apiary | `a flower meadow yard with three cute wooden beehive boxes, painted pastel colors, honey drips` |
| sheepfold | `a cozy sheep barn with a round roof, soft grass, a hay rack` |
| goatpen | `a rocky goat yard with a small wooden climbing platform and stones, a hay rack` |

---

## 9. Cây trồng — 4 giai đoạn (sprite sheet)

```
[STYLE CORE], growth stages of a <crop> plant growing out of a small mound of brown soil, from left to right:
(1) tiny sprout with two leaves, (2) small young plant, (3) grown plant without fruit, (4) fully ripe plant with <ripe>,
[TECH: sprite sheet, 4 frames]
```

| species | `<crop>` | `<ripe>` |
|---|---|---|
| rice | `rice` | `drooping golden rice ears` |
| tomato | `tomato vine on a little wooden stake` | `shiny round red tomatoes` |
| strawberry | `strawberry bush` | `glossy red strawberries with white flowers` |
| potato | `potato` | `leafy top with a few plump potatoes peeking out of the soil` |
| rose | `rose bush` | `big blooming pink-red roses` |
| sunflower | `sunflower` | `a huge smiling-bright yellow sunflower head` |
| pomato (lai) | `pomato hybrid plant, tomato vine on top and potato roots below` | `red tomatoes on top and potatoes visible at the roots` |
| rosaberry (lai) | `rosaberry hybrid, a rose bush that grows strawberries` | `pink roses mixed with heart-shaped strawberries` |

Ô đất: `tilled farm field plot, 4 neat rows of dark soil furrows with a soft raised edge, small wooden border, empty, [TECH: single isolated object]`
— biến thể: `fertilized` (thêm `scattered sparkles and darker rich soil`), `for sale` (`overgrown grass lot with a wooden for-sale sign without text`), `wild` (`overgrown with weeds, small rocks and a stump`).
Luống hoa: như trên nhưng `raised flower bed with a stone border`.

---

## 10. Vật nuôi

```
[STYLE CORE], a cute chubby cartoon <animal>, big friendly eyes, small body with oversized head, standing pose facing 3/4 front-left,
[TECH: single isolated object]
```
Bộ chuyển động: thay `standing pose` bằng sprite sheet `idle, eating from the ground, happy jumping with a heart, sleeping`.

| species | `<animal>` |
|---|---|
| chicken | `white hen with a red comb and orange beak` |
| cow | `black-and-white spotted cow with a pink nose and a little bell` |
| sheep | `fluffy cream sheep with a cloud-like wool coat and a dark face` |
| goat | `light brown goat with small curved horns and a beard` |
| bee | `round fuzzy honey bee with tiny wings` (con bay quanh tổ, 64 px) |
| geep (lai) | `sheep-goat hybrid with a half fluffy wool coat and small goat horns` |

**Linh vật** (mascots): `jade rabbit with a tiny glowing moon charm`, `ladybug`, `squirrel holding an acorn`, `owl with round glasses`, `worker bee with a little cap`, `firefly glowing softly`, `lucky fortune cat waving a paw`, `rain toad with a leaf umbrella`, `golden water buffalo`, `loyal farm dog with a red scarf`.

---

## 11. Vật phẩm / icon (kho, đơn hàng, cửa hàng)

```
[STYLE CORE], game item icon of <item>, chunky and appetizing, slight 3/4 angle, glossy highlight,
[TECH: single isolated object]
```
Cấp 1 = nguyên liệu, cấp 2 = sơ chế, cấp 3 = món cao cấp (thêm `on a small plate` / `with a ribbon`).

| Loài | Cấp 1 | Cấp 2 | Cấp 3 |
|---|---|---|---|
| rice | bundle of rice ears | bowl of steamed rice | rice ball onigiri trio |
| tomato | ripe tomato | jar of tomato sauce | slice of pizza |
| strawberry | strawberry | strawberry smoothie | strawberry cake slice |
| potato | potato | basket of fries | potato stew pot |
| rose | single rose | rose bouquet | heart gift box with rose |
| sunflower | sunflower head | handful of sunflower seeds | sunflower seed cookies |
| chicken | brown egg | fried egg in a pan | caramel pudding |
| cow | milk bottle | butter block | ice cream cone |
| sheep | wool yarn ball | knitted scarf | cozy sweater |
| goat | goat milk bottle | cheese wedge | cheese sandwich |
| bee | honey jar | beeswax candle | honey pancakes stack |

Phụ phẩm: `bundle of golden straw`, `pile of glowing yellow pollen`, `sack of organic fertilizer` (không vẽ phân).
Hạt giống: `small seed packet with a picture of <crop>, no text` · Con giống: `<animal> baby in a woven basket`.
Tiền tệ: `shiny gold coin with a leaf emblem` · `faceted cyan-green gem (Ngọc)` · `research point flask, bubbling green`.
Blindbox: `cute gift box with a question mark shape made of ribbon, pastel` (3 bậc: `wooden`, `silver`, `golden glowing`).

---

## 12. Gen (huy hiệu hiếm)

```
[STYLE CORE], round magical gene badge emblem, a <motif> inside a glowing <color> ring, DNA helix accents, sparkling,
[TECH: single isolated object]
```
Bậc 1 viền bạc, bậc 2 viền vàng, bậc 3 viền cầu vồng + hào quang.

Thực vật: solar `sun` vàng · lunar `crescent moon` xanh nhạt · blaze `small flame` cam · crystal `water droplet` cyan · rainbow `rainbow arc` hồng · eclipse `half sun half moon` tím · frost `snowflake` xanh băng · golden `golden crown leaf` vàng kim · thunder `lightning bolt` vàng · stellar `shooting star` hồng.
Động vật (tứ linh, phong cách Á Đông dễ thương): dragon `cute chibi dragon` · qilin `cute qilin` · tortoise `wise tortoise` · phoenix `phoenix` · harmony `dragon and phoenix circling` · fortune `peach of longevity and bat` · xuanwu `tortoise with a snake` · auspice `auspicious cloud` · whitetiger `white tiger cub` · foursacred `four sacred beasts in a circle`.

---

## 13. Địa hình & trang trí bản đồ

Texture (tileable): `lush cartoon grass with tiny flowers and clover`, `light sandy dirt path`, `cobblestone plaza`, `pond water with soft ripples`.
Trang trí (single object): `round fluffy tree`, `fruit tree with red apples`, `pine tree`, `flowering bush`, `mossy rock cluster`, `wooden fence segment horizontal` + `vertical`, `wooden signpost without text`, `pond with lily pads`, `duck`, `stone lantern`, `hay bale`, `wheelbarrow`, `mailbox`, `log bench`, `mushroom cluster`.

Ảnh tổng thể (dùng làm concept, KHÔNG cắt dùng trực tiếp):
```
[STYLE CORE], full farm map concept art, a winding dirt road, a farmhouse at the center, crop fields in neat rows,
fenced animal pens, a windmill, a pond, trees around the edges, a landing pad for a bee spaceship, sunny morning, no text
```

---

## 14. UI skin

```
cozy cartoon mobile game UI element, <element>, glossy, chunky rounded shapes, thick soft outline, warm wood and cream parchment,
front view, flat (not 3/4), transparent background, no text
```
- `big green glossy button, pill shape, bottom darker edge for 3D press effect` (thêm bản cam, xanh dương, xám)
- `wooden panel frame with rounded corners and a cream parchment center, 9-slice friendly, even border`
- `red ribbon banner title plate, empty`
- `round star level badge, gold`
- `currency pill bar background, dark wood with inset slot`
- `speech bubble, white, rounded, small tail at the bottom` (bong bóng "sẵn sàng thu hoạch")
- `round timer progress ring, empty`, `checkmark badge green`, `lock badge`
- `bottom tab bar, wooden plank strip`, icon tab: `seed bag`, `barn`, `shop cart`, `book codex`, `gear`

Với UI, ghi chú thêm: vẽ khung **đều 4 cạnh** để cắt 9-slice; không để chữ trên ảnh — chữ do game render (song ngữ VI/EN).

---

## 15. Nhân vật cốt truyện

Bean (trợ lý robot hạt giống): `a small round seed-shaped robot with a sprout antenna, big glowing friendly eyes, tiny arms, cream and leaf-green colors`, vẽ thêm biểu cảm `happy, surprised, thinking, worried, cheering` trên cùng một sheet.

---

## 16. Checklist duyệt asset

- [ ] Cùng góc camera 3/4, cùng hướng sáng (trên-trái), bóng về dưới-phải
- [ ] Viền nâu đậm, độ dày tương đương các asset khác khi thu nhỏ
- [ ] Đọc được ở kích thước thật trong game (thu ảnh về 48 px để thử)
- [ ] Nền trong suốt, không chữ, không watermark
- [ ] Màu nằm trong bảng màu mục 5
- [ ] Đặt cạnh nhà chính + gà + cây lúa chuẩn: tỉ lệ hợp lý, không "lạc tông"
