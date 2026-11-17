// Step-up lên bục cao ngang gối (≈ 50 cm), hai chân thay phiên làm chân dẫn.
//
// Chia đoạn theo điểm tựa:
//   A  đặt chân dẫn (trái) lên bục — chân phải trụ trên sàn
//   B  đẩy người lên bục bằng chân trái (ghim tại chỗ vừa đặt: anchor), kéo chân phải lên
//   B' (B đảo ngược) hạ chân phải xuống sàn          A' (A đảo ngược) hạ chân trái xuống
// rồi lặp lại với chân phải dẫn (mirror). Góc đặt chân được giải số để lòng bàn chân trái
// nằm đúng trên mặt bục (xem `npm run check`).

import { mirror, reverse, sequence } from './compose.js';

// forward: tâm bục cách giữa hai cổ chân lúc đứng 50 cm → mép gần cách 30 cm, không chạm mũi
// chân trụ; bàn chân trái đặt xuống có cổ chân cách 43,5 cm (giải số) → nằm giữa mặt bục.
export const BOX = { height: 0.5, depth: 0.4, width: 0.6, forward: 0.5 };

// Đường nhấc chân (tìm bằng tools/tune-contacts.mjs path để không xuyên mép bục): gập gối kéo gót
// lên sau trước, rồi mới nâng đùi đưa bàn chân qua mép bục, mũi chân hướng lên.
const tuck = { LeftUpLeg: 30, LeftLeg: 100, LeftFoot: -10, Hips: 4 };
const knee = { LeftUpLeg: 100, LeftLeg: 145, LeftFoot: -10, Hips: 6 };
const place = { LeftUpLeg: 110, LeftLeg: 121.2, Hips: 10 }; // bàn chân trái đặt phẳng trên bục (giải số)
const drive = {
  // chân trái duỗi dần, thân nghiêng trước, chân phải rời sàn phía sau
  Hips: 18,
  LeftUpLeg: 48,
  LeftLeg: 52,
  RightUpLeg: -12,
  RightLeg: 55,
  RightFoot: 30,
};
const kneeUp = { Hips: 4, LeftUpLeg: 6, LeftLeg: 6, RightUpLeg: 75, RightLeg: 95 }; // kéo gối phải lên

const stepOn = {
  label: 'đặt chân trái lên bục',
  duration: 0.9,
  pin: 'Right',
  keyframes: [
    { time: 0, angles: {} },
    { time: 0.25, angles: tuck },
    { time: 0.5, angles: knee },
    { time: 0.9, angles: place },
  ],
  muscles: { primary: ['hipFlexors.L'], secondary: ['gluteMed.R'] },
  checks: [
    {
      label: 'Bàn chân trái nằm trên mặt bục',
      at: 0.9,
      bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End'],
      range: [BOX.height - 0.003, BOX.height + 0.012],
    },
  ],
};

const pushUp = {
  label: 'đẩy lên bằng chân trái',
  duration: 1.3,
  pin: { joint: 'LeftFoot', anchor: true },
  keyframes: [
    { time: 0, angles: place },
    { time: 0.55, angles: drive },
    { time: 0.95, angles: kneeUp },
    { time: 1.3, angles: {} }, // đứng thẳng trên bục
  ],
  muscles: {
    primary: ['quads.L', 'glutes.L'],
    secondary: ['hamstrings.L', 'gluteMed.L', 'gastroc.R'],
  },
  checks: [
    {
      label: 'Hai bàn chân trên mặt bục',
      at: 1.3,
      bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End', 'RightFoot', 'RightToeBase', 'RightToe_End'],
      range: [BOX.height - 0.003, BOX.height + 0.012],
    },
  ],
};

const leftLead = [stepOn, pushUp, reverse(pushUp, 'hạ chân phải xuống'), reverse(stepOn, 'hạ chân trái xuống')];
const rightLead = leftLead.map((p) => mirror(p, p.label.replace(/trái|phải/g, (w) => (w === 'trái' ? 'phải' : 'trái'))));

export default sequence(
  {
    id: 'stepUp',
    name: 'Step-up lên bục (đổi chân)',
    category: 'strength',
    view: 'side',
    cue: 'Đặt cả bàn chân lên bục, dồn trọng tâm lên chân trên bục và đẩy bằng gót chân đó — hạn chế nhún bằng chân dưới sàn. Bước xuống có kiểm soát.',
    peak: 'high',
    props: [{ type: 'box', ...BOX }],
  },
  [...leftLead, ...rightLead]
);
