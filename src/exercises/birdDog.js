// Bird dog — quỳ bốn điểm (tay dưới vai, gối dưới hông), duỗi tay và chân ĐỐI BÊN thẳng
// ra trước / ra sau, giữ lưng phẳng; đổi bên.
//
// Dựng: ghim gối của chân trụ (đúng độ cao gối tì sàn) + điểm tựa = bàn tay trụ chạm sàn →
// bộ giải ngả người ra trước quanh gối. Đổi bên thì đổi cả gối ghim lẫn tay tựa (mirror);
// mốc nối là tư thế bốn điểm cân đối nên chuyển không bị giật.

import { mirror, sequence } from './compose.js';

export const KNEE_HEIGHT = 0.062; // tâm khớp gối khi gối tì sàn
export const HAND_HEIGHT = 0.06; // khớp cổ tay khi bàn tay úp trên sàn

const quad = {
  LeftUpLeg: 90, // đùi thẳng đứng
  RightUpLeg: 90,
  LeftLeg: 90, // cẳng chân nằm trên sàn
  RightLeg: 90,
  LeftFoot: 62, // mu bàn chân hướng xuống sàn
  RightFoot: 62,
  LeftArm: { flex: 90, adduct: 27 }, // tay thẳng đứng dưới vai
  RightArm: { flex: 90, adduct: 27 },
  LeftHand: 85, // bàn tay úp trên sàn, ngón hướng trước
  RightHand: 85,
  Neck: -8,
};
// Duỗi tay phải ra trước, chân trái ra sau, cùng thẳng hàng với thân.
const reach = {
  ...quad,
  RightArm: { flex: 175, adduct: 27 },
  RightHand: 0,
  LeftUpLeg: 0,
  LeftLeg: 0,
  LeftFoot: 30,
};

const rightArmLeftLeg = {
  label: 'tay phải + chân trái',
  duration: 2.6,
  pin: { joint: 'RightLeg', height: KNEE_HEIGHT },
  support: { joint: 'LeftHand', height: HAND_HEIGHT, range: [30, 150] },
  keyframes: [
    { time: 0, angles: quad },
    { time: 1.0, angles: reach },
    { time: 1.6, angles: reach },
    { time: 2.6, angles: quad },
  ],
  // Cơ dựng sống + mông (chân duỗi) giữ thân và chân thẳng; bụng chống xoay/võng lưng;
  // vai giữ tay duỗi; mông nhỡ bên chân trụ giữ hông ngang.
  muscles: {
    primary: ['lowerBack', 'glutes.L'],
    secondary: ['abs', 'obliques', 'shoulders.R', 'hamstrings.L', 'gluteMed.R'],
  },
  checks: [
    { label: 'Chân duỗi thẳng hàng thân (góc hông)', at: 1.3, angle: 'hipL', range: [165, 192] },
    { label: 'Gối trụ tì sàn', at: 'all', bones: ['RightLeg'], range: [-0.003, 0.015] },
    { label: 'Tay trụ chạm sàn', at: 'all', bones: ['LeftHand'], range: [-0.003, 0.015] },
  ],
};

export default sequence(
  {
    id: 'birdDog',
    name: 'Bird dog (đổi bên)',
    category: 'core',
    view: 'side',
    cue: 'Lưng phẳng như mặt bàn. Duỗi tay và chân đối bên thẳng hàng với thân, không xoay hông, không ưỡn lưng; giữ 1–2 nhịp rồi thu về.',
    peak: 'none',
    relativeFeet: true,
  },
  [rightArmLeftLeg, mirror(rightArmLeftLeg, 'tay trái + chân phải')]
);
