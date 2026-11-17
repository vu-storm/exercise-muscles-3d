// Side plank (chống nghiêng) bên trái — giữ tĩnh.
//
// Dựng: ghim cổ chân trái ở độ cao cạnh ngoài bàn chân; điểm tựa = khuỷu tay trái với
// `axis: 'roll'` → bộ giải nghiêng cả người sang trái (quanh trục trước–sau) đến khi khuỷu
// chạm sàn. Bàn chân theo cẳng chân (relativeFeet) vì đặt nghiêng trên cạnh ngoài.
// Cánh tay trái dạng ra (adduct âm) để thẳng đứng dưới vai, cẳng tay nằm trên sàn;
// tay phải giơ thẳng lên trần. Hai chân khép để bàn chân chồng lên nhau.

const base = {
  LeftArm: { adduct: -45 },
  LeftForeArm: 90,
  RightArm: { adduct: -63 },
  LeftUpLeg: { adduct: 6 },
  RightUpLeg: { adduct: 6 },
  Neck: { adduct: 8 }, // đầu thẳng hàng thân
};
const breathe = { ...base, Spine1: -1, Spine2: -1 };

export default {
  id: 'sidePlank',
  name: 'Side plank (bên trái)',
  category: 'core',
  view: 'front', // góc nhìn gợi ý khi chọn động tác
  cue: 'Khuỷu tay dưới vai, hai chân chồng lên nhau. Đẩy hông lên để thân thẳng từ đầu tới gót, không để hông chùng xuống hay xoay về trước.',
  duration: 4,
  peak: 'none',
  relativeFeet: true,
  pin: { joint: 'LeftFoot', height: 0.114 },
  support: { joint: 'LeftForeArm', height: 0.059, axis: 'roll', range: [0, -120] },
  keyframes: [
    { time: 0, angles: base },
    { time: 2, angles: breathe },
    { time: 4, angles: base },
  ],
  // Bên tì sàn (trái) gánh chính: cơ chéo bụng, mông nhỡ, vuông thắt lưng (thể hiện ở vùng
  // lưng dưới cùng bên).
  muscles: {
    primary: ['obliques.L', 'gluteMed.L'],
    secondary: ['obliques.R', 'abs', 'lowerBack.L', 'shoulders.L'],
  },
  checks: [
    { label: 'Thân thẳng (vai–hông–gối, 3D)', at: 'all', angle: 'line', range: [170, 181] },
    { label: 'Cẳng tay trái tựa sàn', at: 'all', bones: ['LeftForeArm'], range: [-0.003, 0.012] },
    { label: 'Bàn chân trái chạm sàn', at: 'all', bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End'], range: [-0.003, 0.012] },
    { label: 'Hông nhấc khỏi sàn', at: 'all', bones: ['Hips', 'LeftUpLeg'], range: [0.05, 1] },
  ],
};
