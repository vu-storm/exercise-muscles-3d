// Glute bridge một chân, hai chân thay phiên.
//
// Chân làm việc giữ y hệt glute bridge (bridge.js) nên tư thế thân, lưng trên, đầu, tay
// không đổi. Chân còn lại duỗi thẳng, đùi song song với đùi chân làm việc, bàn chân ở
// tư thế trung tính so với cẳng chân. Mỗi đoạn bắt đầu và kết thúc bằng tư thế nằm hai bàn
// chân trên sàn, để đổi chân ghim không bị giật.

import { lying, bridgeTop, SUPPORT_LYING, SUPPORT_TOP } from './bridge.js';
import { mirror, sequence } from './compose.js';

// Bàn chân giơ lên: góc so với sàn = hướng cẳng chân (≈ độ nghiêng thân + góc đùi) để cổ
// chân ở tư thế trung tính. Thân nằm ≈ −88°, ở đỉnh ≈ −111° (do điểm tựa giải ra).
const lyingLegUp = {
  ...lying,
  RightUpLeg: lying.LeftUpLeg,
  RightLeg: 0,
  RightFoot: -(88 + lying.LeftUpLeg),
};
const topLegUp = {
  ...bridgeTop,
  RightUpLeg: bridgeTop.LeftUpLeg,
  RightLeg: 0,
  RightFoot: -(111 + bridgeTop.LeftUpLeg),
};

const leftWorking = {
  label: 'chân trái',
  duration: 3.8,
  pinnedFoot: 'Left',
  // Mông nhỡ chân trụ giữ khung chậu ngang; cơ gập hông chân duỗi giữ chân trên cao.
  muscles: { primary: ['glutes.L'], secondary: ['hamstrings.L', 'gluteMed.L', 'hipFlexors.R'] },
  keyframes: [
    { time: 0, angles: lying, supportHeight: SUPPORT_LYING },
    { time: 0.6, angles: lyingLegUp, supportHeight: SUPPORT_LYING }, // duỗi chân phải lên
    { time: 1.6, angles: topLegUp, supportHeight: SUPPORT_TOP }, // nâng hông
    { time: 2.2, angles: topLegUp, supportHeight: SUPPORT_TOP }, // giữ
    { time: 3.2, angles: lyingLegUp, supportHeight: SUPPORT_LYING },
    { time: 3.8, angles: lying, supportHeight: SUPPORT_LYING }, // đặt chân xuống
  ],
  checks: [
    { label: 'Đùi thẳng hàng với thân', at: 1.9, angle: 'align', range: [175, 185] },
    { label: 'Gối chân làm việc 90°', at: 1.9, angle: 'kneeL', range: [87, 93] },
    { label: 'Chân giơ lên duỗi thẳng', at: 1.9, angle: 'kneeR', range: [160, 181] },
    { label: 'Hông nâng khỏi sàn', at: 1.9, bones: ['Hips', 'LeftUpLeg', 'RightUpLeg', 'Spine'], range: [0.08, 1] },
    { label: 'Bàn chân làm việc trên sàn', at: 1.9, bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End'], range: [-0.01, 0.01] },
  ],
};

export default sequence(
  {
    id: 'singleLegBridge',
    name: 'Glute bridge 1 chân (đổi chân)',
    category: 'strength',
    view: 'threeQuarter',
    cue: 'Một chân duỗi thẳng, đùi song song đùi chân kia. Đẩy hông lên bằng chân trụ, giữ hông ngang — không để hông lệch về bên chân duỗi.',
    support: { joint: 'Spine2', height: SUPPORT_LYING },
    peak: 'high',
    checks: [
      { label: 'Lưng trên tựa sàn', at: 'all', bones: ['Spine1', 'Spine2', 'LeftShoulder', 'RightShoulder'], range: [-0.003, 0.015] },
      { label: 'Đầu tựa sàn', at: 'all', bones: ['Head', 'HeadTop_End', 'Neck'], range: [-0.003, 0.02] },
      { label: 'Vai không trượt', at: 'all', slide: 'Spine2', range: [0, 0.02] },
    ],
  },
  [leftWorking, mirror(leftWorking, 'chân phải')]
);
