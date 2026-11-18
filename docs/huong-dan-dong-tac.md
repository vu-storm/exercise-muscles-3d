# Hướng dẫn kỹ thuật — nhóm cơ & dựng động tác

Tài liệu tra cứu cho người muốn chỉnh vùng cơ hoặc **thêm động tác mới**. Tổng quan dự án: xem [README](../README.md).

## Thêm một động tác mới

1. Tạo file trong `src/exercises/` (xem mẫu ở phần [Dựng động tác từ góc khớp](#dựng-động-tác-từ-góc-khớp)), khai báo `category`, `cue`, `keyframes`, `muscles`, `checks`.
2. Thêm vào `EXERCISES` trong `src/exercises/index.js` (nhóm mới thì thêm vào `CATEGORIES`).
3. Chạy `npm run check -- <id>` cho tới khi ĐẠT. Góc cần chạm sàn/bục: giải số bằng `tools/tune-contacts.mjs` (thêm một nhánh cho động tác) thay vì đoán tay.
4. Mở `npm run dev`, xem từ nhiều góc; `?ex=<id>&t=<giây>&view=side` để dừng ở đúng khung hình.

Bài đối xứng / đổi chân: chỉ viết một bên rồi dùng `mirror()` + `sequence()` (`compose.js`).

## Nhóm cơ (muscles.js)

Mô hình không có UV nên nhóm cơ được suy ra **một lần lúc tải**, cho từng đỉnh, từ xương chi
phối (trọng số skin), hướng pháp tuyến (trước / sau / bên), độ cao so với các khớp và khoảng
cách tới đường giữa; sau đó làm mịn với đỉnh láng giềng. Mỗi nhóm có kênh trái và phải.

| Khoá | Nhóm | Vùng trên mô hình |
|---|---|---|
| `quads` | Đùi trước (cơ tứ đầu) | mặt trước đùi, trên gối tới háng |
| `hipFlexors` | Gập hông | quanh nếp háng (phần trên cơ thẳng đùi + thắt lưng chậu lộ ra) |
| `glutes` | Mông lớn | mặt sau, trên nếp mông |
| `gluteMed` | Mông nhỡ | mặt bên hông, mấu chuyển lớn → mào chậu |
| `hamstrings` | Đùi sau | mặt sau đùi, dưới nếp mông |
| `gastroc` | Cơ bụng chân | nửa trên bắp chân (bám trên gối → làm việc chính khi gối thẳng) |
| `soleus` | Cơ dép | phần dưới, hai bên bắp chân (gánh chính khi gối cong) |
| `abs` | Bụng | dải giữa bụng, xương mu → bờ sườn |
| `obliques` | Chéo bụng | hai bên bụng |
| `lowerBack` | Lưng dưới | hai dải cơ dựng sống sát cột sống thắt lưng |
| `shoulders` | Vai (delta) | đầu cánh tay quanh khớp vai |

Cơ nằm sâu (thắt lưng chậu, ngang bụng, vuông thắt lưng) được thể hiện bằng vùng bề mặt gần
nhất. Trong dữ liệu có thể dùng tên gộp `calves` (= gastroc + soleus) và `core` (= abs +
obliques). Ngưỡng nằm trong `MUSCLE_CONFIG`. Xem từng vùng: `?force=gluteMed`.

## Dựng động tác từ góc khớp

Mỗi động tác là một file dữ liệu:

```js
export default {
  id: 'rdl',
  name: 'Romanian deadlift (gập hông)',
  category: 'strength',          // strength | core | drill | stretch
  cue: 'Gối hơi chùng…',         // gợi ý kỹ thuật hiện trên bảng
  view: 'side',                  // góc nhìn gợi ý (tuỳ chọn)
  duration: 3,
  pinnedFoot: 'Both',            // điểm ghim (xem dưới)
  keyframes: [
    { time: 0, angles: {} },     // {} = tư thế đứng
    { time: 1.4, angles: { Hips: 75, LeftUpLeg: 105, RightUpLeg: 105, LeftLeg: 30, RightLeg: 30 } },
    { time: 3, angles: {} },
  ],
  muscles: { primary: ['hamstrings', 'glutes'], secondary: ['lowerBack'] },
  checks: [{ label: 'Trọng tâm trên bàn chân', at: 'all', com: true, range: [-0.05, 0.15] }],
};
```

**Góc** (độ, tên xương bỏ tiền tố `mixamorig`). Dương = gập ra trước theo nghĩa giải phẫu:
`Hips`/`Spine…`/`Neck`/`Head` cúi trước; `…UpLeg` gập hông (âm = duỗi ra sau); `…Leg` gập gối;
`…Arm`/`…ForeArm`/`…Hand` đưa ra trước; `{ flex, adduct }` — `adduct` = khép vào thân (âm = dạng
ra; với `Hips` = nghiêng sang phải). Góc tương đối so với khớp cha, quay quanh **trục ngang
thế giới** (không dùng trục cục bộ của xương Mixamo). `Foot`/`ToeBase` là góc so với sàn
(không ghi = phẳng); `relativeFeet: true` để chúng theo cẳng chân (plank, quỳ, nằm nghiêng).

**Tuỳ chọn khác**

| Trường | Ý nghĩa |
|---|---|
| `pin` / `pinnedFoot` | `'Left'`/`'Right'`/`'Both'`: bàn chân ở chỗ lúc đứng (khớp `pinJoint`, mặc định cổ chân). `{ joint, height, forward, left }`: ghim khớp bất kỳ (vd. gối tì sàn). `{ joint, anchor: true }`: giữ khớp tại chỗ nó đang ở đầu đoạn (bàn chân vừa đặt lên bục). Ghi trên một mốc = đổi điểm ghim từ mốc đó. |
| `pinJoint` | `'ToeBase'` = ghim ở mũi bàn chân (nhón gót, chạy). |
| `support: { joint, height, axis, range }` | Điểm tựa thứ hai: giải góc `Hips` để `joint` cách sàn `height` m — `axis: 'pitch'` ngả trước/sau (bridge, plank, bird dog), `'roll'` nghiêng bên (side plank). `supportHeight` trên mốc để đổi độ cao theo thời gian. |
| `peak` | `'low'` (mặc định: Hips thấp nhất là điểm đỉnh), `'high'` (bridge, nhón gót, step-up), `'none'` (giữ tĩnh / bài chạy: tô cơ suốt động tác). |
| `props` | `{ type: 'box', forward, width, depth, height }`, `{ type: 'kettlebell', between: ['LeftHand', 'RightHand'], grip: 'bell' }` (`grip: 'bell'` = hai lòng bàn tay ôm thân tạ, quai chúc xuống; `down` âm = tạ cao hơn cổ tay). |
| `muscles` trên mốc | Đổi nhóm cơ theo đoạn (bên đang làm việc). |

**Ghép động tác** (`compose.js`): `mirror(part)` đổi trái ↔ phải mọi thứ (góc, ghim, điểm tựa,
nhóm cơ, kiểm tra); `reverse(part)` phát ngược (bước xuống bục); `sequence(info, parts)` nối
các đoạn; `repeat(part, n)`. Ví dụ lunge lùi = `sequence(info, [chânTráiTrước, mirror(chânTráiTrước)])`.

**Bảo vệ sàn:** với bàn chân không ghim có góc nhấc gót, nếu ngón chân xuống thấp hơn lúc đứng
thì góc được giảm vừa đủ để ngón chân chạm sàn.

## Tự kiểm tra (check.js)

Mỗi mục `checks`: `{ label, at, range, …phép đo }`. `at`: `'start'`, `'peak'`, `'all'`, số giây,
hoặc `[t0, t1]` (`sequence` tự đổi `'all'` của từng đoạn sang khoảng của đoạn đó).

| Phép đo | Giá trị |
|---|---|
| `bones: [...]` và/hoặc `near: { joint, radius }` | y thấp nhất (m) của vùng lưới |
| `angle: 'kneeL'…'hipR' \| 'align' \| 'line'` | góc (độ); `align` = vai–hông–gối nhìn từ bên (có dấu), `line` = trong 3D |
| `slide: 'Spine2'` | trượt ngang so với t = 0 |
| `jointY: 'LeftFoot'` | độ cao khớp |
| `com: true` | trọng tâm (≈ trọng tâm các đỉnh) trước điểm ghim bao nhiêu mét |

Luôn kiểm tra thêm: điểm ghim không trượt, không xuyên sàn, không xuyên vào bục.
Mọi động tác dựng bằng code đều phải ĐẠT `npm run check` trước khi đưa vào danh sách.

Các góc tiếp xúc được **giải số** chứ không ước lượng tay (lý do và giá trị ban đầu ghi chú
trong từng file): lunge (gối sau 3 cm trên sàn), glute bridge (vai–hông–gối 180°, gối 90°,
lưng ngực duỗi để bả vai nằm phẳng — `node tools/tune-contacts.mjs bridge`),
step-up (bàn chân đặt đúng mặt bục 50 cm, đường nhấc chân không chạm mép bục), giãn gập hông
(gối sau tì sàn, không trượt khi đẩy hông), giãn đùi sau (gót chạm sàn), giãn bắp chân (bàn
chân trước phẳng).

> **Góc trên bảng ≠ góc trong dữ liệu.** Bảng hiện *góc trong* của khớp (180° = thẳng), dữ liệu
> là *góc gập* (0° = thẳng); tư thế đứng của mô hình vốn hơi gập (~170°) nên không cộng trừ đúng 180°.
