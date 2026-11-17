// Nhón gót (calf raise) — hai biến thể:
//   • gối thẳng: cơ bụng chân (gastrocnemius, bám trên khớp gối) làm việc chính
//   • gối cong ~45°: cơ bụng chân bị chùng nên cơ dép (soleus) gánh chính
//
// Ghim ở NGÓN CHÂN (pinJoint: 'ToeBase') thay vì cổ chân: khi Foot gập (nhấc gót), ngón chân
// giữ nguyên trên sàn, cổ chân và cả người được nâng lên. 'Both' = cả hai chân.

const common = {
  pinnedFoot: 'Both',
  pinJoint: 'ToeBase',
  peak: 'high', // cơ làm việc mạnh nhất khi gót lên cao nhất
  category: 'strength',
};

const up = { LeftFoot: 35, RightFoot: 35 };

export const calfRaiseStraight = {
  ...common,
  id: 'calfRaise',
  name: 'Nhón gót – gối thẳng',
  cue: 'Gối thẳng, nhón lên trên mũi bàn chân cao hết mức, giữ 1 nhịp, hạ chậm gót xuống.',
  duration: 2.4,
  keyframes: [
    { time: 0, angles: {} },
    { time: 0.8, angles: up },
    { time: 1.3, angles: up }, // giữ
    { time: 2.4, angles: {} }, // hạ chậm
  ],
  muscles: { primary: ['gastroc'], secondary: ['soleus'] },
  checks: [
    // Cổ chân lúc đứng cao 12,1 cm; nhón gót nâng cổ chân lên ≥ 5 cm.
    { label: 'Cổ chân trái nâng lên', at: 'peak', jointY: 'LeftFoot', range: [0.171, 0.25] },
    { label: 'Cổ chân phải nâng lên', at: 'peak', jointY: 'RightFoot', range: [0.171, 0.25] },
    { label: 'Gối thẳng', at: 'peak', angle: 'kneeL', range: [160, 181] },
    {
      label: 'Ngón chân luôn trên sàn',
      at: 'all',
      bones: ['LeftToeBase', 'LeftToe_End', 'RightToeBase', 'RightToe_End'],
      range: [-0.005, 0.01],
    },
    { label: 'Trọng tâm trên mũi bàn chân', at: 'peak', com: true, range: [-0.12, 0.05] },
  ],
};

// Gối cong: cẳng chân nghiêng trước 20°, đùi nghiêng 30° (hông lùi), thân nghiêng 15°
// để trọng tâm vẫn trên mũi bàn chân. Clip bắt đầu ở tư thế khuỵu (không đứng thẳng) để
// "điểm đỉnh" là lúc gót cao nhất.
const bent = {
  Hips: 15,
  LeftUpLeg: 45,
  RightUpLeg: 45,
  LeftLeg: 50,
  RightLeg: 50,
  LeftArm: { flex: 15 },
  RightArm: { flex: 15 },
};
const bentUp = { ...bent, LeftFoot: 30, RightFoot: 30 };

export const calfRaiseBent = {
  ...common,
  id: 'calfRaiseBent',
  name: 'Nhón gót – gối cong',
  cue: 'Khuỵu gối khoảng 45° và giữ nguyên góc gối suốt động tác, nhón gót lên rồi hạ chậm — nhấn vào cơ dép.',
  duration: 2.4,
  keyframes: [
    { time: 0, angles: bent },
    { time: 0.8, angles: bentUp },
    { time: 1.3, angles: bentUp },
    { time: 2.4, angles: bent },
  ],
  muscles: { primary: ['soleus'], secondary: ['gastroc', 'quads'] },
  checks: [
    { label: 'Cổ chân trái nâng lên ≥ 4 cm', at: 'peak', jointY: 'LeftFoot', range: [0.161, 0.25] },
    { label: 'Gối cong', at: 'all', angle: 'kneeL', range: [110, 150] },
    {
      label: 'Ngón chân luôn trên sàn',
      at: 'all',
      bones: ['LeftToeBase', 'LeftToe_End', 'RightToeBase', 'RightToe_End'],
      range: [-0.005, 0.01],
    },
    { label: 'Trọng tâm trên bàn chân', at: 'all', com: true, range: [-0.2, 0.05] },
  ],
};
