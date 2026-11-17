# Exercise Muscles 3D — Web 3D mô phỏng nhóm cơ trong các động tác thể dục

Trang web 3D (three.js + Vite, JavaScript thuần) dùng mô hình người écorché để minh hoạ
nhóm cơ hoạt động trong 20 động tác: sức mạnh thân dưới, core, khởi động kỹ thuật chạy và
giãn cơ. Cơ đang co tô **đỏ**, cơ đang được kéo giãn tô **xanh**; độ đậm theo biên độ động tác.
Squat lấy animation từ file GLB; mọi động tác khác được **dựng bằng code từ góc khớp** và tự
kiểm tra tiếp xúc sàn trên lưới mô hình.

## Yêu cầu

- Node.js 18 trở lên (đã thử với Node 20)
- Trình duyệt hỗ trợ WebGL 2 (Chrome, Edge, Firefox, Safari bản mới)

## Chạy dự án

```bash
npm install
npm run dev       # mở địa chỉ Vite in ra (mặc định http://localhost:5173)
npm run build     # đóng gói vào dist/
npm run preview   # xem thử bản đóng gói
npm run check     # tự kiểm tra mọi động tác (Node, không cần trình duyệt)
npm run check -- lunge   # chỉ một động tác
```

## Danh sách động tác

| Nhóm | Động tác | Cơ chính | Cơ phụ |
|---|---|---|---|
| Sức mạnh thân dưới | Squat (tay không, từ GLB) | đùi trước, mông lớn | đùi sau, cơ dép, lưng dưới |
| | Goblet squat (ôm tạ ấm) | đùi trước, mông lớn | lưng dưới, bụng, cơ dép |
| | Lunge lùi (đổi chân) | đùi trước + mông lớn chân trước | đùi sau + mông nhỡ chân trước, đùi trước chân sau |
| | Romanian deadlift | đùi sau, mông lớn | lưng dưới |
| | Step-up lên bục 50 cm (đổi chân) | đùi trước + mông lớn chân trên bục | đùi sau, mông nhỡ chân trên bục, bắp chân chân dưới |
| | Glute bridge | mông lớn | đùi sau, lưng dưới |
| | Glute bridge 1 chân (đổi chân) | mông lớn chân trụ | đùi sau + mông nhỡ chân trụ, gập hông chân duỗi |
| | Nhón gót – gối thẳng | cơ bụng chân | cơ dép |
| | Nhón gót – gối cong | cơ dép | cơ bụng chân, đùi trước |
| Core – ổn định thân | Plank | bụng | chéo bụng, vai, mông, đùi trước |
| | Side plank (bên trái) | chéo bụng + mông nhỡ bên tì sàn | chéo bụng bên kia, bụng, lưng dưới, vai |
| | Dead bug (đổi bên) | bụng | chéo bụng, gập hông chân duỗi |
| | Bird dog (đổi bên) | lưng dưới, mông lớn chân duỗi | bụng, chéo bụng, vai tay duỗi, đùi sau, mông nhỡ chân trụ |
| Khởi động – kỹ thuật chạy | A-skip | gập hông chân vung, bắp chân chân trụ | đùi trước, mông, bụng |
| | B-skip | đùi sau + mông chân vung | gập hông, bắp chân chân trụ, đùi trước |
| | Nâng cao đùi | gập hông + đùi trước chân vung | bắp chân, mông chân trụ, bụng |
| | Đá gót | đùi sau chân vung | bắp chân, mông chân trụ, gập hông |
| Giãn cơ | Giãn cơ gập hông (quỳ 1 gối) | gập hông chân sau | đùi trước (cơ thẳng đùi) chân sau |
| | Giãn đùi sau (đứng) | đùi sau chân trước | cơ bụng chân, mông chân trước |
| | Giãn bắp chân (đứng) | cơ bụng chân chân sau | cơ dép chân sau |

Bài đổi chân / đổi bên đổi màu theo bên đang làm việc. Giãn cơ làm mẫu một bên.
Bài giữ tĩnh (plank…) và bài chạy tô cơ đầy đủ suốt động tác.

## Cách dùng

| Điều khiển | Tác dụng |
|---|---|
| **Danh sách động tác** | Mặc định mô hình **đứng yên**; chọn động tác để bắt đầu, chọn "— Tư thế đứng —" để quay về. Chọn theo nhóm; chuyển mượt 0,3 giây, camera tự đóng khung và chuyển sang góc nhìn gợi ý. Nhãn nhóm (đỏ = bài tập, xanh = giãn cơ) và gợi ý kỹ thuật hiện ngay dưới. |
| **Phát / Tạm dừng**, **0.25x / 0.5x / 1x**, **thanh tua** | Điều khiển animation (kéo thanh tua sẽ tự dừng). Khi dừng hiện cung đo góc hai gối. |
| **Trước / Bên / Chéo** | Góc nhìn. |
| **Cơ làm việc / Cơ được kéo giãn** | Nhóm cơ của động tác đang chọn, tách *chính* (đậm) và *phụ* (nhạt), có công tắc bật/tắt từng nhóm. |
| **Số đo trực tiếp** | Góc gối, góc hông hai chân; biên độ (0% tư thế đầu → 100% điểm đỉnh). |

Tham số URL (trình chiếu / chụp hình): `?ex=plank&t=1&view=side&ui=0&force=abs`
— `ex` động tác, `t` dừng ở giây, `view` front/side/threeQuarter, `ui=0` ẩn bảng,
`force` tô cố định một nhóm cơ (hoặc `all`), `check=0` tắt tự kiểm tra trong console.

## Cấu trúc mã

```
src/main.js          cảnh, camera, ánh sáng, vòng lặp; dựng clip khi cần lần đầu
src/model.js         tải GLB, chụp tư thế đứng (rig), ExercisePlayer (cross-fade, biên độ, khung camera)
src/muscles.js       phân vùng 11 nhóm cơ theo đỉnh (trái/phải) + vá shader tô màu
src/jointAngles.js   công thức đo góc (dùng chung cho bảng số đo và tự kiểm tra)
src/angles.js        bảng số đo + cung góc hai gối
src/ui.js            bảng điều khiển
src/exercises/
  index.js           nhóm động tác (CATEGORIES) và danh sách (EXERCISES)
  build.js           dữ liệu góc khớp → THREE.AnimationClip (ghim, điểm tựa, bảo vệ sàn)
  compose.js         mirror / reverse / sequence / repeat — đổi chân, đảo chiều, ghép đoạn
  check.js           tự kiểm tra trên lưới đã skin (tiếp xúc, xuyên sàn/bục, góc, thăng bằng)
  props.js           đạo cụ: bục, tạ ấm
  squat.js gobletSquat.js lunge.js rdl.js stepUp.js bridge.js singleLegBridge.js
  calfRaise.js plank.js sidePlank.js deadBug.js birdDog.js drills.js stretches.js
tools/check-exercise.mjs   chạy check.js trong Node (npm run check)
tools/tune-contacts.mjs    giải số các góc tiếp xúc (gối/gót chạm sàn, chân lên bục)
```

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
| `props` | `{ type: 'box', forward, width, depth, height }`, `{ type: 'kettlebell', between: ['LeftHand', 'RightHand'] }`. |
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
Hiện tại **19/19 động tác dựng bằng code đều ĐẠT** (`npm run check`).

Các góc tiếp xúc được **giải số** chứ không ước lượng tay (lý do và giá trị ban đầu ghi chú
trong từng file): lunge (gối sau 3 cm trên sàn), glute bridge (vai–hông–gối 180°, gối 90°),
step-up (bàn chân đặt đúng mặt bục 50 cm, đường nhấc chân không chạm mép bục), giãn gập hông
(gối sau tì sàn, không trượt khi đẩy hông), giãn đùi sau (gót chạm sàn), giãn bắp chân (bàn
chân trước phẳng).

> **Góc trên bảng ≠ góc trong dữ liệu.** Bảng hiện *góc trong* của khớp (180° = thẳng), dữ liệu
> là *góc gập* (0° = thẳng); tư thế đứng của mô hình vốn hơi gập (~170°) nên không cộng trừ đúng 180°.
