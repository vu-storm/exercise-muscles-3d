// Goblet squat — ôm tạ ấm trước ngực, squat sâu với thân thẳng hơn squat tay không
// (tạ phía trước làm đối trọng nên thân ít phải đổ về trước).
//
// Hướng các đoạn ở điểm thấp nhất (so với phương thẳng đứng, dương = đầu dưới ra trước):
//   thân nghiêng 30° (Hips 30), đùi 95° (hơi dưới song song): UpLeg = 95 + 30 = 125,
//   cẳng chân −32° (gối ra trước mũi chân một chút): Leg = 95 + 32 = 127.
// Tay: cánh tay khép sát sườn, cẳng tay gập lên để hai tay ôm tạ trước xương ức.

const hold = {
  LeftArm: { flex: 30, adduct: 40 },
  RightArm: { flex: 30, adduct: 40 },
  LeftForeArm: 135,
  RightForeArm: 135,
};

const bottom = {
  ...hold,
  Hips: 30,
  Spine2: -6, // giữ ngực mở
  LeftUpLeg: 125,
  RightUpLeg: 125,
  LeftLeg: 127,
  RightLeg: 127,
  LeftArm: { flex: 50, adduct: 40 }, // bù độ nghiêng thân để tạ vẫn sát ngực
  RightArm: { flex: 50, adduct: 40 },
};

export default {
  id: 'gobletSquat',
  name: 'Goblet squat',
  category: 'strength',
  cue: 'Ôm tạ sát ngực, khuỷu tay hướng xuống. Hạ sâu giữa hai gót, gối mở theo mũi chân, ngực mở, gót không nhấc.',
  duration: 3,
  pinnedFoot: 'Both',
  keyframes: [
    { time: 0, angles: hold },
    { time: 1.4, angles: bottom },
    { time: 1.7, angles: bottom },
    { time: 3, angles: hold },
  ],
  props: [{ type: 'kettlebell', between: ['LeftHand', 'RightHand'], down: 0.06, radius: 0.09 }],
  // Tạ phía trước buộc cơ bụng + cơ dựng sống giữ thân thẳng.
  muscles: {
    primary: ['quads', 'glutes'],
    secondary: ['lowerBack', 'abs', 'soleus'],
  },
  checks: [
    { label: 'Squat sâu: góc gối', at: 'peak', angle: 'kneeL', range: [45, 80] },
    { label: 'Thân không đổ quá (góc hông)', at: 'peak', angle: 'hipL', range: [50, 90] },
    { label: 'Trọng tâm trên bàn chân', at: 'all', com: true, range: [-0.05, 0.15] },
    {
      label: 'Gót không nhấc (hai bàn chân phẳng)',
      at: 'all',
      bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End', 'RightFoot', 'RightToeBase', 'RightToe_End'],
      range: [-0.005, 0.01],
    },
  ],
};
