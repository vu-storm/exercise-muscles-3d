// Dead bug — nằm ngửa, tay chỉ lên trần, hông–gối 90° (tabletop). Duỗi tay và chân ĐỐI
// BÊN ra xa (sát sàn nhưng không chạm) trong khi lưng dưới vẫn áp sàn; đổi bên.
//
// Dựng: không có bàn chân trên sàn → ghim khớp Hips ở độ cao cố định và đặt góc khung chậu
// −90° (nằm ngửa) trực tiếp. Lưng dưới áp sàn là điều kiện kiểm tra chính.

import { mirror, sequence } from './compose.js';

export const HIPS_HEIGHT = 0.151; // khớp hông khi nằm ngửa, lưng áp sàn

const table = {
  // Cuộn khung chậu ra sau (−95°) + gập nhẹ cột sống thắt lưng: xoá đường cong thắt lưng
  // để lưng dưới áp sàn ("ép lưng xuống sàn").
  Hips: -95,
  Spine: 7,
  LeftUpLeg: 90, // đùi thẳng đứng
  RightUpLeg: 90,
  LeftLeg: 90, // cẳng chân nằm ngang
  RightLeg: 90,
  LeftArm: { flex: 90, adduct: 27 }, // tay chỉ thẳng lên trần, song song nhau
  RightArm: { flex: 90, adduct: 27 },
  Neck: 6,
};
// Duỗi tay trái ra sau đầu và chân phải ra xa, cả hai lơ lửng trên sàn.
const reach = {
  ...table,
  LeftArm: { flex: 165, adduct: 27 },
  RightUpLeg: 8,
  RightLeg: 4,
};

const leftArmRightLeg = {
  label: 'tay trái + chân phải',
  duration: 2.4,
  keyframes: [
    { time: 0, angles: table },
    { time: 1.0, angles: reach },
    { time: 1.4, angles: reach },
    { time: 2.4, angles: table },
  ],
  muscles: { primary: ['abs'], secondary: ['obliques', 'hipFlexors.R'] },
  checks: [
    { label: 'Gót duỗi không chạm sàn', at: 1.2, bones: ['RightFoot', 'RightToeBase', 'RightToe_End'], range: [0.02, 0.2] },
    { label: 'Tay duỗi không chạm sàn', at: 1.2, bones: ['LeftHand', 'LeftForeArm'], range: [0.0, 0.25] },
  ],
};

export default sequence(
  {
    id: 'deadBug',
    name: 'Dead bug',
    category: 'core',
    view: 'side',
    cue: 'Ép lưng dưới xuống sàn suốt động tác. Duỗi tay và chân đối bên ra xa thật chậm, thở ra khi duỗi; lưng bắt đầu cong lên là dừng.',
    peak: 'none',
    relativeFeet: true,
    pin: { joint: 'Hips', height: HIPS_HEIGHT, forward: -0.5 },
    checks: [
      { label: 'Lưng dưới áp sàn', at: 'all', bones: ['Spine', 'Spine1'], range: [-0.003, 0.012] },
      { label: 'Lưng trên tựa sàn', at: 'all', bones: ['Spine2', 'LeftShoulder', 'RightShoulder'], range: [-0.003, 0.015] },
    ],
  },
  [leftArmRightLeg, mirror(leftArmRightLeg, 'tay phải + chân trái')]
);
