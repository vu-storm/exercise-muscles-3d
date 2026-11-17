// Bài khởi động – kỹ thuật chạy tại chỗ: A-skip, B-skip, nâng cao đùi, đá gót.
//
// Mỗi bài = nửa chu kỳ "chân trái trụ, chân phải vung" + bản đối xứng, lặp lại.
// • Chân trụ ghim ở ngón chân (pinJoint 'ToeBase'), gót hơi nhấc — chạy bằng mũi bàn chân.
// • Mốc nối giữa hai nửa là tư thế trung tính hai chân chạm sàn, cân đối → đổi chân trụ
//   không bị giật. (Mô hình không có pha bay; nhịp nảy thể hiện bằng gót nhấc lên.)
// • Tay chạy: khuỷu 90°, tay đối bên với chân vung đánh ra trước.
// • Bàn chân vung: góc so với sàn = hướng cẳng chân để cổ chân trung tính, hoặc âm
//   (mũi chân hướng lên — "dorsiflex") theo yêu cầu kỹ thuật.

import { mirror, repeat, sequence } from './compose.js';

const neutral = {
  LeftUpLeg: 4,
  RightUpLeg: 4,
  LeftLeg: 8,
  RightLeg: 8,
  LeftFoot: 12,
  RightFoot: 12,
  LeftArm: { flex: 10, adduct: 15 },
  RightArm: { flex: 10, adduct: 15 },
  LeftForeArm: 90,
  RightForeArm: 90,
};
const arms = (fwd, back) => ({
  LeftArm: { flex: fwd, adduct: 15 }, // tay trái ra trước khi chân phải vung
  RightArm: { flex: back, adduct: 15 },
});

/** Nửa chu kỳ: chân trái trụ, chân phải vung qua các tư thế `poses` = [[thời điểm, góc]]. */
function half(label, duration, poses, muscles) {
  return {
    label,
    duration,
    pin: 'Left',
    keyframes: [{ time: 0, angles: neutral }, ...poses.map(([time, angles]) => ({ time, angles })), { time: duration, angles: neutral }],
    muscles,
  };
}

const drill = (info, part, reps) =>
  sequence(
    { category: 'drill', pinJoint: 'ToeBase', peak: 'none', view: 'side', ...info },
    repeat([part, mirror(part, part.label.replace('trái', 'phải'))], reps).flat()
  );

// ---------------------------------------------------------------------------
// Nâng cao đùi: đùi lên ngang hông, chân trụ bật trên mũi bàn chân, nhịp nhanh.
const kneeUp = {
  ...neutral,
  ...arms(40, -35),
  RightUpLeg: 90,
  RightLeg: 100,
  RightFoot: -5,
  LeftUpLeg: 0,
  LeftLeg: 4,
  LeftFoot: 25,
};
export const highKnees = drill(
  {
    id: 'highKnees',
    name: 'Nâng cao đùi',
    cue: 'Đùi nâng lên ngang hông, chạm đất bằng mũi bàn chân ngay dưới hông, thân thẳng, tay đánh theo nhịp chân.',
    checks: [{ label: 'Đùi vung lên gần ngang hông (góc hông)', at: 0.15, angle: 'hipR', range: [75, 105] }],
  },
  half('chân trái trụ', 0.3, [[0.15, kneeUp]], {
    primary: ['hipFlexors.R', 'quads.R'],
    secondary: ['gastroc.L', 'glutes.L', 'abs'],
  }),
  2
);

// ---------------------------------------------------------------------------
// Đá gót: gót chân vung lên sát mông, đùi gần thẳng đứng.
const heelUp = {
  ...neutral,
  ...arms(30, -25),
  RightUpLeg: 15,
  RightLeg: 125,
  RightFoot: 110, // theo hướng cẳng chân (15 − 125 = −110°)
  LeftUpLeg: 0,
  LeftLeg: 4,
  LeftFoot: 22,
};
export const buttKicks = drill(
  {
    id: 'buttKicks',
    name: 'Đá gót',
    cue: 'Đùi gần thẳng đứng, gập gối nhanh để gót chân chạm (gần) mông, tiếp đất nhẹ bằng mũi bàn chân.',
    checks: [{ label: 'Gối gập sâu (gót gần mông)', at: 0.15, angle: 'kneeR', range: [30, 70] }],
  },
  half('chân trái trụ', 0.3, [[0.15, heelUp]], {
    primary: ['hamstrings.R'],
    secondary: ['gastroc.L', 'glutes.L', 'hipFlexors.R'],
  }),
  2
);

// ---------------------------------------------------------------------------
// A-skip: nhảy bước — gối dẫn lên ngang hông, mũi chân hướng lên; chân trụ bật mạnh (nhún
// gót cao hơn), nhịp chậm hơn nâng cao đùi.
const aDrive = {
  ...neutral,
  ...arms(50, -40),
  RightUpLeg: 85,
  RightLeg: 95,
  RightFoot: -15, // mũi chân hướng lên
  LeftUpLeg: 0,
  LeftLeg: 2,
  LeftFoot: 35, // bật mạnh trên mũi bàn chân
};
export const aSkip = drill(
  {
    id: 'aSkip',
    name: 'A-skip',
    cue: 'Nhịp "bước – nảy": gối dẫn lên ngang hông, mũi chân hướng lên, chân trụ nảy trên mũi bàn chân; tay đối bên đánh mạnh.',
    checks: [{ label: 'Gối dẫn lên ngang hông', at: 0.2, angle: 'hipR', range: [75, 110] }],
  },
  half('chân trái trụ', 0.5, [[0.2, aDrive]], {
    primary: ['hipFlexors.R', 'gastroc.L'],
    secondary: ['quads.R', 'glutes.L', 'abs'],
  }),
  2
);

// ---------------------------------------------------------------------------
// B-skip: như A-skip nhưng sau khi gối lên thì duỗi cẳng chân ra trước rồi "cào" chân xuống
// và về sau (đùi sau + mông kéo chân về dưới hông).
const bExtend = {
  ...aDrive,
  ...arms(45, -35),
  RightUpLeg: 75,
  RightLeg: 15,
  RightFoot: -15,
  LeftFoot: 28,
};
export const bSkip = drill(
  {
    id: 'bSkip',
    name: 'B-skip',
    cue: 'Gối lên như A-skip, duỗi cẳng chân ra trước rồi chủ động cào chân xuống, kéo về sau dưới hông — cảm nhận đùi sau và mông.',
    checks: [{ label: 'Duỗi gối khi vung ra trước', at: 0.33, angle: 'kneeR', range: [150, 181] }],
  },
  half('chân trái trụ', 0.6, [[0.18, aDrive], [0.33, bExtend]], {
    primary: ['hamstrings.R', 'glutes.R'],
    secondary: ['hipFlexors.R', 'gastroc.L', 'quads.R'],
  }),
  2
);
