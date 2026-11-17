// Plank cẳng tay — giữ tĩnh, thân thẳng một đường từ vai tới gót.
//
// Dựng: ghim hai ngón chân (ToeBase) ở chỗ lúc đứng; điểm tựa = khuỷu tay trái chạm sàn →
// bộ giải tự ngả cả người ra trước quanh mũi chân đến khi khuỷu tay xuống sàn.
// Cánh tay vuông góc thân (gập 90° so với thân → thẳng đứng khi thân gần nằm ngang),
// cẳng tay gập 90° → nằm dọc trên sàn. Bàn chân dựng gần thẳng đứng, ngón chân gập trên sàn.
// Nhịp thở nhẹ ở thân để thấy đây là tư thế giữ.

const base = {
  LeftArm: { flex: 84, adduct: 27 },
  RightArm: { flex: 84, adduct: 27 },
  LeftForeArm: 90,
  RightForeArm: 90,
  LeftFoot: 72,
  RightFoot: 72,
  Neck: -5,
  LeftUpLeg: 8, // bù cho hông khỏi võng (đo thẳng hàng vai–hông–gối)
  RightUpLeg: 8,
};
const breathe = { ...base, Spine1: -1.2, Spine2: -1.2 };

export default {
  id: 'plank',
  name: 'Plank',
  category: 'core',
  view: 'side', // góc nhìn gợi ý khi chọn động tác
  cue: 'Khuỷu tay ngay dưới vai, siết bụng và mông để thân thẳng từ vai tới gót — hông không võng xuống, không chổng lên.',
  duration: 4,
  peak: 'none', // giữ tĩnh: cơ làm việc suốt thời gian
  pinnedFoot: 'Both',
  pinJoint: 'ToeBase',
  support: { joint: 'LeftForeArm', height: 0.059, range: [0, 120] },
  keyframes: [
    { time: 0, angles: base },
    { time: 2, angles: breathe },
    { time: 4, angles: base },
  ],
  muscles: {
    primary: ['abs'],
    secondary: ['obliques', 'shoulders', 'glutes', 'quads'],
  },
  checks: [
    { label: 'Thân thẳng (vai–hông–gối)', at: 'all', angle: 'align', range: [172, 186] },
    { label: 'Cẳng tay tựa sàn', at: 'all', bones: ['LeftForeArm', 'RightForeArm'], range: [-0.003, 0.012] },
    {
      label: 'Ngón chân trên sàn',
      at: 'all',
      bones: ['LeftToeBase', 'LeftToe_End', 'RightToeBase', 'RightToe_End'],
      range: [-0.003, 0.012],
    },
  ],
};
