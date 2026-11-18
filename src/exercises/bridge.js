// Glute bridge — nằm ngửa, gập gối, nâng hông đến khi đùi thẳng hàng với thân.
//
// Cách dựng (xem build.js):
// • Hai bàn chân phẳng trên sàn (ghim chân trái; chân phải đối xứng).
// • Lưng trên là điểm tựa thứ hai: `support` xoay cả người quanh bàn chân đến khi khớp
//   Spine2 cách sàn `supportHeight` → người tự nằm xuống, tự nghiêng thân khi nâng hông.
//   Độ cao này tăng ở đỉnh vì điểm tiếp xúc của lưng lăn dần lên phía bả vai.
// • Góc tương đối với khớp cha (đùi so với chậu, gối so với đùi); góc Hips do `support` giải.
//
// Các số dưới đây được giải số (tools/check-exercise.mjs kiểm tra lại) để:
//   đỉnh  — vai–hông–gối thẳng hàng 180°, gối 90° (đúng số đo trên bảng), lưng ngực duỗi
//           để bả vai nằm phẳng (hông cao hơn ~6 cm so với cột sống thẳng), lưng trên/đầu/tay
//           vẫn tựa sàn;
//   đầu   — mông và lưng trên chạm sàn, lưng trên nằm ĐÚNG chỗ như ở đỉnh (vai không trượt).
// Vì bàn chân và vai đều cố định, gối không thể 90° ở cả hai mốc: giữ 90° ở đỉnh (tư thế
// chuẩn — cẳng chân thẳng đứng) thì lúc nằm gối gập sâu hơn (bảng hiện ~78°).

export const lying = {
  LeftUpLeg: 53.7,
  RightUpLeg: 53.7,
  LeftLeg: 98.3,
  RightLeg: 98.3,
  Neck: -8.8, // ngửa nhẹ để gáy tựa sàn
  Head: -8.8,
  LeftArm: { flex: -8.9, adduct: 15 }, // tay duỗi dọc thân, đặt trên sàn
  RightArm: { flex: -8.9, adduct: 15 },
};

export const bridgeTop = {
  // Lưng ngực duỗi nhẹ: lưng trên + bả vai nằm phẳng trên sàn trong khi thân dưới nghiêng lên,
  // nên hông lên cao hơn so với giữ cả cột sống thẳng (điểm tựa lăn lên phía vai).
  Spine1: -15,
  Spine2: -20,
  LeftUpLeg: 15.5, // vai–hông–gối thẳng hàng
  RightUpLeg: 15.5,
  LeftLeg: 86.4, // bảng đo hiện 90°
  RightLeg: 86.4,
  Neck: 27.5, // cằm khép để gáy/đầu vẫn tựa sàn khi thân nghiêng lên
  Head: 27.5,
  LeftArm: { flex: -64, adduct: 15 }, // thân nghiêng lên, tay vẫn nằm trên sàn
  RightArm: { flex: -64, adduct: 15 },
};

export const SUPPORT_LYING = 0.1256;
export const SUPPORT_TOP = 0.1974; // giải bằng `node tools/tune-contacts.mjs bridge`

export default {
  id: 'bridge',
  name: 'Glute bridge',
  category: 'strength',
  view: 'side', // góc nhìn gợi ý khi chọn động tác
  cue: 'Nằm ngửa, gối gập, bàn chân phẳng. Siết mông đẩy hông lên đến khi vai–hông–gối thẳng hàng, không ưỡn lưng.',
  duration: 3,
  pinnedFoot: 'Left',
  support: { joint: 'Spine2', height: SUPPORT_LYING },
  peak: 'high', // cơ làm việc mạnh nhất khi hông lên cao nhất
  keyframes: [
    { time: 0, angles: lying, supportHeight: SUPPORT_LYING },
    { time: 1.2, angles: bridgeTop, supportHeight: SUPPORT_TOP },
    { time: 1.8, angles: bridgeTop, supportHeight: SUPPORT_TOP }, // giữ, siết mông
    { time: 3, angles: lying, supportHeight: SUPPORT_LYING },
  ],
  muscles: {
    primary: ['glutes'],
    secondary: ['hamstrings', 'lowerBack'],
  },
  checks: [
    { label: 'Đùi thẳng hàng với thân (vai–hông–gối)', at: 'peak', angle: 'align', range: [177, 183] },
    { label: 'Gối trái 90°', at: 'peak', angle: 'kneeL', range: [87, 93] },
    { label: 'Gối phải 90°', at: 'peak', angle: 'kneeR', range: [87, 93] },
    { label: 'Góc hông duỗi hết ở đỉnh', at: 'peak', angle: 'hipL', range: [165, 185] },
    { label: 'Hông nâng khỏi sàn', at: 'peak', bones: ['Hips', 'LeftUpLeg', 'RightUpLeg', 'Spine'], range: [0.15, 1] },
    { label: 'Mông chạm sàn lúc nằm', at: 'start', bones: ['Hips', 'LeftUpLeg', 'RightUpLeg', 'Spine'], range: [-0.003, 0.01] },
    { label: 'Lưng trên tựa sàn', at: 'all', bones: ['Spine1', 'Spine2', 'LeftShoulder', 'RightShoulder'], range: [-0.003, 0.015] },
    { label: 'Vai không trượt', at: 'all', slide: 'Spine2', range: [0, 0.02] },
    { label: 'Đầu tựa sàn', at: 'all', bones: ['Head', 'HeadTop_End', 'Neck'], range: [-0.003, 0.02] },
    {
      label: 'Hai bàn chân chạm sàn',
      at: 'all',
      bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End', 'RightFoot', 'RightToeBase', 'RightToe_End'],
      range: [-0.01, 0.01],
    },
  ],
};
