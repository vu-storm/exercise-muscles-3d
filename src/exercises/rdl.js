// Romanian deadlift (RDL, gập hông) — đứng, gối hơi chùng, đẩy hông ra sau và hạ thân
// gần song song sàn với lưng thẳng; đùi sau và mông kéo thân đứng dậy.
//
// Góc (xem build.js): Hips = nghiêng cả khung chậu ra trước; vì chân là con của Hips nên
// đùi phải gập ngược lại để chân vẫn đứng: hướng đùi so với phương thẳng đứng
// = UpLeg − Hips = 105 − 75 = 30° (gối ra trước hông → hông lùi ra sau để giữ thăng bằng),
// cẳng chân = 30 − Leg = 0° (thẳng đứng, gối trên cổ chân).
// (Bản đầu 100/25 làm trọng tâm vượt 15,7 cm trước cổ chân → đẩy hông ra sau thêm 5°.)
// Tay buông thẳng theo trọng lực: Arm gập 75° để bù độ nghiêng của thân.

const bottom = {
  Hips: 75,
  LeftUpLeg: 105,
  RightUpLeg: 105,
  LeftLeg: 30,
  RightLeg: 30,
  LeftArm: { flex: 75, adduct: 20 },
  RightArm: { flex: 75, adduct: 20 },
};

export default {
  id: 'rdl',
  name: 'Romanian deadlift (gập hông)',
  category: 'strength',
  view: 'side', // góc nhìn gợi ý khi chọn động tác
  cue: 'Gối hơi chùng và giữ nguyên góc, đẩy hông ra sau, lưng thẳng, hạ thân đến khi đùi sau căng rồi siết mông đứng dậy.',
  duration: 3,
  pinnedFoot: 'Both', // hai bàn chân phẳng, giữ nguyên chỗ
  keyframes: [
    { time: 0, angles: {} },
    { time: 1.4, angles: bottom }, // hạ chậm
    { time: 1.8, angles: bottom },
    { time: 3, angles: {} },
  ],
  muscles: {
    primary: ['hamstrings', 'glutes'],
    secondary: ['lowerBack'], // cơ dựng sống giữ lưng thẳng (co tĩnh)
  },
  checks: [
    { label: 'Hông gập (thân–đùi)', at: 'peak', angle: 'hipL', range: [75, 110] },
    { label: 'Gối hơi chùng', at: 'peak', angle: 'kneeL', range: [145, 170] },
    { label: 'Trọng tâm trên bàn chân', at: 'all', com: true, range: [-0.05, 0.15] },
    {
      label: 'Hai bàn chân phẳng trên sàn',
      at: 'all',
      bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End', 'RightFoot', 'RightToeBase', 'RightToe_End'],
      range: [-0.005, 0.01],
    },
  ],
};
