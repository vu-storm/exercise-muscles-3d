// Giãn cơ: gập hông (quỳ một gối), đùi sau (đứng), bắp chân (đứng tư thế lunge).
// Cơ được kéo giãn tô màu XANH. Làm mẫu một bên — đổi bên thực hiện tương tự.
//
// Các góc có ghi "giải số" được tính bằng tools/tune-contacts.mjs để thoả điều kiện tiếp xúc
// (gối chạm sàn, gót chạm sàn, bàn chân phẳng) — `npm run check` kiểm tra lại.

// ---------------------------------------------------------------------------
// Giãn cơ gập hông (half-kneeling hip flexor stretch), gối phải tì sàn.
// Tư thế quỳ: đùi sau thẳng đứng; giãn: đẩy hông ra trước, khung chậu hơi cuộn (Hips âm),
// siết mông bên chân sau → đùi sau duỗi ra sau hông, kéo căng cơ thắt lưng chậu + thẳng đùi.
// Gối sau giữ nguyên chỗ trên sàn: chân trước gập thêm để hông tiến ra trước.
export const kneel = {
  LeftUpLeg: 90,
  LeftLeg: 119.3, // giải số: gối sau cách sàn ~0,4 cm
  RightUpLeg: 0,
  RightLeg: 100,
  RightFoot: 75, // ngón chân sau gập trên sàn (bảo vệ sàn tự chỉnh)
  LeftArm: { adduct: 15 },
  RightArm: { adduct: 15 },
};
export const kneelStretch = {
  ...kneel,
  Hips: -6,
  Spine: 3,
  LeftUpLeg: 74.6, // giải số: gối sau giữ đúng chỗ (trượt 0,4 cm), sát sàn
  LeftLeg: 127.8,
  RightUpLeg: -20,
  RightLeg: 100,
};

export const hipFlexorStretch = {
  id: 'hipFlexorStretch',
  name: 'Giãn cơ gập hông (quỳ 1 gối)',
  category: 'stretch',
  cue: 'Quỳ một gối, siết mông bên chân sau, cuộn nhẹ khung chậu rồi đẩy hông ra trước — căng ở trước hông chân sau. Giữ 20–30 giây, không ưỡn lưng.',
  duration: 4,
  pinnedFoot: 'Left',
  keyframes: [
    { time: 0, angles: kneel },
    { time: 1.2, angles: kneelStretch },
    { time: 2.8, angles: kneelStretch },
    { time: 4, angles: kneel },
  ],
  muscles: { primary: ['hipFlexors.R'], secondary: ['quads.R'] },
  checks: [
    { label: 'Gối sau tì sàn', at: 'all', near: { joint: 'RightLeg', radius: 0.11 }, range: [-0.003, 0.012] },
    { label: 'Gối sau không trượt', at: 'all', slide: 'RightLeg', range: [0, 0.02] },
  ],
};

// ---------------------------------------------------------------------------
// Giãn đùi sau (đứng): chân trái đưa ra trước, gối thẳng, gót chạm sàn, mũi chân hướng lên;
// gối sau hơi khuỵu; gập hông với lưng thẳng (không cúi lưng) cho tới khi căng đùi sau.
const reach = { LeftUpLeg: 35, LeftLeg: 45, RightLeg: 8, RightUpLeg: 6, Hips: 4 };
// Gập hông 45° với lưng thẳng; đùi trước gập 70° so với khung chậu (đùi chỉ ra trước 25°),
// gối thẳng. Gối sau khuỵu để hạ hông cho gót trước chạm sàn (giải số).
export const hamstringPose = {
  Hips: 45,
  LeftUpLeg: 70,
  LeftLeg: 0,
  LeftFoot: -22, // mũi chân hướng lên
  RightUpLeg: 65, // đùi sau nghiêng 20° (gối ra trước)
  RightLeg: 37.7, // giải số: gót trước chạm sàn
  LeftArm: { flex: 40, adduct: 20 }, // hai tay đặt lên đùi trước
  RightArm: { flex: 40, adduct: 20 },
  LeftForeArm: 25,
  RightForeArm: 25,
};

export const hamstringStretch = {
  id: 'hamstringStretch',
  name: 'Giãn đùi sau (đứng)',
  category: 'stretch',
  view: 'side',
  cue: 'Chân trước duỗi thẳng, gót chạm sàn, mũi chân hướng lên. Khuỵu nhẹ gối sau, đẩy hông ra sau với lưng thẳng tới khi căng sau đùi. Giữ 20–30 giây.',
  duration: 4.4,
  pinnedFoot: 'Right',
  keyframes: [
    { time: 0, angles: {} },
    { time: 0.6, angles: reach },
    { time: 1.4, angles: hamstringPose },
    { time: 3.0, angles: hamstringPose },
    { time: 3.8, angles: reach },
    { time: 4.4, angles: {} },
  ],
  muscles: { primary: ['hamstrings.L'], secondary: ['gastroc.L', 'glutes.L'] },
  checks: [
    { label: 'Gót trước chạm sàn', at: 2.2, bones: ['LeftFoot'], range: [-0.003, 0.012] },
    { label: 'Gối trước thẳng', at: 2.2, angle: 'kneeL', range: [160, 181] },
    { label: 'Trọng tâm giữa hai chân', at: 'all', com: true, range: [-0.1, 0.4] },
  ],
};

// ---------------------------------------------------------------------------
// Giãn bắp chân (đứng, tư thế lunge): chân sau duỗi thẳng, gót ép sàn; cả người nghiêng
// trước theo đường thẳng của chân sau → cổ chân sau gập mu → căng cơ bụng chân.
const stepFwd = { LeftUpLeg: 35, LeftLeg: 50, LeftFoot: 0 };
export const calfPose = {
  Hips: 30, // cả thân + chân sau thành một đường thẳng nghiêng 30° ra trước
  RightUpLeg: 0,
  RightLeg: 0,
  LeftUpLeg: 70, // đùi trước chỉ ra trước 40°
  LeftLeg: 64.7, // giải số: bàn chân trước đặt phẳng trên sàn
  LeftArm: { flex: 45, adduct: 20 }, // hai tay chống lên đùi trước
  RightArm: { flex: 45, adduct: 20 },
  LeftForeArm: 20,
  RightForeArm: 20,
};

export const calfStretch = {
  id: 'calfStretch',
  name: 'Giãn bắp chân (đứng)',
  category: 'stretch',
  view: 'side',
  cue: 'Chân sau duỗi thẳng, mũi chân hướng thẳng trước, ép gót sau xuống sàn; dồn người ra trước theo đường thẳng của chân sau tới khi căng bắp chân. Giữ 20–30 giây.',
  duration: 4.4,
  pinnedFoot: 'Right',
  keyframes: [
    { time: 0, angles: {} },
    { time: 0.6, angles: stepFwd },
    { time: 1.4, angles: calfPose },
    { time: 3.0, angles: calfPose },
    { time: 3.8, angles: stepFwd },
    { time: 4.4, angles: {} },
  ],
  // Gối thẳng → căng cơ bụng chân (bám trên gối); cơ dép căng ít hơn.
  muscles: { primary: ['gastroc.R'], secondary: ['soleus.R'] },
  checks: [
    { label: 'Bàn chân trước phẳng trên sàn', at: 2.2, bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End'], range: [-0.003, 0.012] },
    { label: 'Gối sau thẳng', at: 2.2, angle: 'kneeR', range: [160, 181] },
    { label: 'Trọng tâm trong chân đế (gót sau → mũi chân trước)', at: 'all', com: true, range: [-0.07, 0.72] },
  ],
};
