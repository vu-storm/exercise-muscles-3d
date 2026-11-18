// Squat tay không (air squat) — dựng từ góc khớp, cùng tư thế thân dưới với goblet squat.
//
// Điểm thấp nhất (so với phương thẳng đứng, dương = đầu dưới ra trước):
//   thân nghiêng 30° (Hips 30), đùi 95° (hơi dưới song song): UpLeg = 95 + 30 = 125,
//   cẳng chân −32° (gối ra trước mũi chân một chút): Leg = 95 + 32 = 127 → bảng hiện gối ~50°.
// Tay: đưa thẳng ra trước ngang vai làm đối trọng khi hạ xuống (góc giải số: bàn tay trước
// khớp vai ~48 cm, cao hơn vai ~8 cm, cách đường giữa như vai). Góc tay tương đối với thân nên
// lớn hơn 90° khi thân nghiêng.

const armsForward = {
  LeftArm: { flex: 114.5, adduct: 15 },
  RightArm: { flex: 114.5, adduct: 15 },
  LeftForeArm: { flex: 0, adduct: 9 },
  RightForeArm: { flex: 0, adduct: 9 },
};

const bottom = {
  ...armsForward,
  Hips: 30,
  Spine2: -6, // giữ ngực mở
  LeftUpLeg: 125,
  RightUpLeg: 125,
  LeftLeg: 127,
  RightLeg: 127,
};

export default {
  id: 'squat',
  name: 'Squat (tay không)',
  category: 'strength',
  cue: 'Chân rộng bằng hông, đẩy hông ra sau rồi hạ xuống, gối đi theo hướng mũi chân, gót không nhấc, lưng giữ thẳng.',
  duration: 2.6,
  pinnedFoot: 'Both',
  keyframes: [
    { time: 0, angles: {} },
    { time: 1.1, angles: bottom },
    { time: 1.4, angles: bottom },
    { time: 2.6, angles: {} },
  ],
  muscles: {
    primary: ['quads', 'glutes'], // không ghi .L/.R = cả hai chân
    // Đùi sau chỉ đồng co để giữ gối; cơ dép giữ cổ chân; cơ dựng sống giữ lưng thẳng.
    secondary: ['hamstrings', 'soleus', 'lowerBack'],
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
