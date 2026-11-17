// Lunge lùi (reverse lunge), hai chân thay phiên: 0–2 s chân phải lùi (chân trái trước),
// 2–4 s chân trái lùi. Chân sau nhấc khỏi sàn, lùi ra sau, hạ gối gần sàn rồi bước về.
// Chỉ khai báo đoạn chân trái trước; đoạn còn lại là bản đối xứng (compose.js → mirror).
//
// Quy ước (xem build.js):
// • Số = góc gập (độ) quanh trục ngang của cơ thể; DƯƠNG = gập ra trước
//   (hông: đùi đưa ra trước; gối: gập gối; thân: cúi trước). Âm = duỗi ra sau.
// • Góc là tương đối so với khớp cha, trừ Foot/ToeBase là góc so với sàn
//   (không ghi = giữ phẳng như lúc đứng; Foot dương = nhấc gót, mũi chân chúc xuống).
// • { flex, adduct }: adduct = khép vào thân (độ) quanh trục trước–sau.
// • Khớp không ghi trong một mốc = 0 (tư thế đứng).

import { mirror, sequence } from './compose.js';

// Nhấc chân sau: gập gối để bàn chân rời sàn, chân trước chùng nhẹ.
const stepBack = {
  LeftUpLeg: 10,
  LeftLeg: 12,
  RightUpLeg: -8,
  RightLeg: 55,
  RightFoot: 20,
  LeftArm: { adduct: 9 },
  RightArm: { adduct: 9 },
};

const leftForward = {
  label: 'chân trái trước',
  duration: 2,
  pinnedFoot: 'Left', // bàn chân trước giữ chặt trên sàn
  keyframes: [
    { time: 0, angles: {} },
    { time: 0.3, angles: stepBack }, // nhấc chân sau khỏi sàn
    {
      time: 1,
      // Góc đã được chỉnh theo kết quả tự kiểm tra (npm run check). Bộ góc ban đầu
      // (85/85/-12/60/72) cho gối sau cách sàn 10,8 cm và mũi chân sau xuyên sàn 8,4 cm:
      // • đùi trước nằm ngang + cẳng chân thẳng đứng giữ hông ở ~57 cm, đùi sau dài 42 cm
      //   nên gối sau không thể xuống gần sàn → hạ hông: đùi trước 94°, cẳng chân nghiêng
      //   trước 15° (gối trước 109°).
      // • gối sau 60° làm cổ chân sau thấp hơn gối (xuyên sàn) → gối sau 85° để cẳng chân
      //   hướng lên phía cổ chân; khi đó bàn chân 72° vừa đặt ngón chân lên sàn.
      angles: {
        LeftUpLeg: 94, // ban đầu 85
        LeftLeg: 109, // ban đầu 85
        RightUpLeg: -12,
        RightLeg: 85, // ban đầu 60
        RightFoot: 72,
        Spine: 3,
        LeftArm: { adduct: 18 },
        RightArm: { adduct: 18 },
      },
    },
    { time: 1.7, angles: stepBack }, // nhấc chân sau, bước về
    { time: 2, angles: {} },
  ],
  // Chân trước làm việc chính. Mông nhỡ giữ gối không đổ vào trong; đùi trước chân sau
  // (cơ thẳng đùi) kéo chân về khi bước lên.
  muscles: {
    primary: ['quads.L', 'glutes.L'],
    secondary: ['hamstrings.L', 'gluteMed.L', 'quads.R'],
  },
  // Tự kiểm tra ở điểm thấp nhất của đoạn (t = 1 s; xem check.js). Khoảng cách theo mét.
  checks: [
    { label: 'Gối sau cách sàn', at: 1, near: { joint: 'RightLeg', radius: 0.11 }, range: [0, 0.04] },
    {
      label: 'Bàn chân trước chạm sàn',
      at: 1,
      bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End'],
      range: [-0.01, 0.01],
    },
  ],
};

export default sequence(
  {
    id: 'lunge',
    name: 'Lunge lùi (đổi chân)',
    category: 'strength',
    cue: 'Bước một chân ra sau, hạ thẳng người xuống đến khi gối sau gần chạm sàn; gối trước không đổ vào trong, đẩy gót chân trước để đứng lên.',
  },
  [leftForward, mirror(leftForward, 'chân phải trước')]
);
