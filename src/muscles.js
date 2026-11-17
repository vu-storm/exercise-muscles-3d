// muscles.js — Phân vùng nhóm cơ theo đỉnh (không cần UV).
//
// Ý tưởng: ở tư thế gốc (bind pose), mỗi đỉnh có trọng số skin cho tối đa 4 xương
// và một pháp tuyến. Kết hợp (1) xương chi phối, (2) hướng pháp tuyến trước/sau/bên,
// (3) độ cao so với các khớp, (4) khoảng cách tới đường giữa, ta suy ra đỉnh thuộc nhóm
// cơ nào. Mỗi nhóm cho ra một trọng số mềm 0..1 (smoothstep), sau đó làm mịn thêm bằng
// cách lấy trung bình với các đỉnh láng giềng để ranh giới không bị răng cưa.
//
// Mỗi nhóm có 2 kênh (trái / phải, tách theo đường giữa cơ thể). Các kênh được xếp lần
// lượt vào các thuộc tính vec4 `muscle0`, `muscle1`, … ; kênh c = nhóm * 2 + (0 trái | 1 phải).
// Vertex shader cộng dồn (kênh × độ đậm) thành một số duy nhất rồi trộn màu.
//
// Lưu ý giải phẫu: đây là vùng NHÌN THẤY trên bề mặt. Cơ nằm sâu (thắt lưng chậu, cơ
// ngang bụng, vuông thắt lưng) được thể hiện bằng vùng bề mặt gần nhất — xem MUSCLE_GROUPS.

import * as THREE from 'three';

export const MUSCLE_GROUPS = [
  { key: 'quads', label: 'Đùi trước (cơ tứ đầu)' },
  { key: 'hipFlexors', label: 'Gập hông (thắt lưng chậu, thẳng đùi)' },
  { key: 'glutes', label: 'Mông lớn' },
  { key: 'gluteMed', label: 'Mông nhỡ (hông bên)' },
  { key: 'hamstrings', label: 'Đùi sau (gân kheo)' },
  { key: 'gastroc', label: 'Bắp chân — cơ bụng chân' },
  { key: 'soleus', label: 'Bắp chân — cơ dép' },
  { key: 'abs', label: 'Bụng (thẳng bụng, ngang bụng)' },
  { key: 'obliques', label: 'Cơ chéo bụng' },
  { key: 'lowerBack', label: 'Lưng dưới (cơ dựng sống)' },
  { key: 'shoulders', label: 'Vai (cơ delta)' },
];
const G = MUSCLE_GROUPS.length;
const GROUP_INDEX = Object.fromEntries(MUSCLE_GROUPS.map((g, i) => [g.key, i]));
/** Tên gộp trong dữ liệu động tác → các nhóm thật. */
const ALIASES = { calves: ['gastroc', 'soleus'], core: ['abs', 'obliques'] };
export const ATTR_COUNT = Math.ceil((G * 2) / 4);

export const MUSCLE_CONFIG = {
  // Độ đậm tối đa ở điểm đỉnh cho nhóm cơ chính / phụ (0..1).
  levels: { primary: 1.0, secondary: 0.5 },

  // Màu: cơ đang co (bài tập) và cơ đang được kéo giãn (giãn cơ).
  colors: { work: '#c0392b', stretch: '#2e86c1' },

  // Ngưỡng trọng số xương: smoothstep(min, max, tổngTrọngSố).
  boneWeight: [0.3, 0.65],

  // Hướng pháp tuyến: tích vô hướng với hướng "ra trước" (nf) / "sang bên" (nr) của người.
  front: [0.0, 0.4], // đùi trước, gập hông
  back: [0.0, 0.4], // mông, đùi sau (giá trị là -nf)
  calfBack: [-0.15, 0.3], // cơ bụng chân ôm cả hai bên
  soleusBack: [-0.5, 0.0], // cơ dép lộ ra ở hai bên cẳng chân → rộng hơn nữa
  side: [0.35, 0.75], // mông nhỡ, cơ chéo: pháp tuyến hướng sang bên (|nr|)
  trunkFront: [0.45, 0.8], // cơ thẳng bụng
  trunkBack: [0.4, 0.8], // cơ dựng sống

  // Độ cao, tính theo tỉ lệ chiều dài đùi (khớp hông → khớp gối).
  creaseBelowHip: 0.22, // nếp mông nằm dưới khớp hông bao nhiêu
  gluteTopAboveHip: 0.15, // mép trên cơ mông lớn
  gluteMedTopAboveHip: 0.32, // mép trên cơ mông nhỡ (mào chậu)
  quadTopAboveHip: -0.02, // đầu trên cơ tứ đầu (âm = dưới khớp hông)
  hipFlexorBand: [-0.3, 0.12], // vùng gập hông: từ 30% đùi dưới khớp hông tới trên khớp 12%
  kneeMargin: 0.08, // khoảng tránh vùng xương bánh chè / hõm khoeo
  blend: 0.06, // độ rộng vùng chuyển tiếp theo chiều cao

  // Vùng giữa thân (bộ phận sinh dục) không tô cho đùi trước / gập hông.
  // Khoảng cách ngang tới đường giữa, tính theo tỉ lệ khoảng cách hai khớp hông.
  midline: [0.35, 0.75],

  // Bắp chân, tính theo tỉ lệ chiều dài cẳng chân từ cổ chân lên.
  gastroc: [0.42, 0.95], // cơ bụng chân: nửa trên
  soleus: [0.2, 0.62], // cơ dép: phần dưới, hai bên
  // Thân (mét so với khớp hông / Spine2).
  absTopBelowSpine2: 0.02,
  absHalfWidth: [0.085, 0.11], // nửa bề rộng cơ thẳng bụng (mềm)
  backHalfWidth: [0.055, 0.08], // nửa bề rộng khối cơ dựng sống (hai dải sát cột sống)
  lowerBackTopBelowSpine2: 0.06, // "lưng dưới": dừng dưới xương bả vai
  deltoidRadius: [0.11, 0.15], // bán kính vùng cơ delta quanh khớp vai

  // Độ rộng (m) vùng chuyển tiếp trái ↔ phải ở đường giữa.
  sideBlend: 0.012,

  // Số lần làm mịn với láng giềng (0 = tắt).
  smoothIterations: 6,
};

const sm = THREE.MathUtils.smoothstep;
// smoothstep có chiều: 0 khi x<=a, 1 khi x>=b
const ss = (x, [a, b]) => sm(x, a, b);
const band = (y, lo, hi, w) => sm(y, lo - w, lo + w) * (1 - sm(y, hi - w, hi + w));

/** Tên xương không phụ thuộc tiền tố "mixamorig:" (GLTFLoader có thể bỏ dấu ':'). */
export const boneKey = (name) => name.replace(/^mixamorig:?/, '');

/** Vị trí khớp ở tư thế gốc, trong cùng hệ toạ độ với đỉnh của geometry. */
function bindPositions(skeleton) {
  const out = {};
  const m = new THREE.Matrix4();
  skeleton.bones.forEach((b, i) => {
    m.copy(skeleton.boneInverses[i]).invert();
    out[boneKey(b.name)] = new THREE.Vector3().setFromMatrixPosition(m);
  });
  return out;
}

/**
 * Tính trọng số nhóm cơ cho mọi đỉnh và gắn các thuộc tính `muscle0..` vào geometry.
 * Trả về thông tin phụ (thống kê số đỉnh mỗi nhóm) để debug.
 */
export function buildMuscleAttribute(mesh, cfg = MUSCLE_CONFIG) {
  const geo = mesh.geometry;
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const skinIndex = geo.attributes.skinIndex;
  const skinWeight = geo.attributes.skinWeight;
  const n = pos.count;

  const P = bindPositions(mesh.skeleton);
  const avg = (a) => P['Left' + a].clone().add(P['Right' + a]).multiplyScalar(0.5);

  // Hướng "ra trước": từ cổ chân tới mũi chân, chiếu lên mặt phẳng ngang.
  const fwd = avg('ToeBase').sub(avg('Foot'));
  fwd.y = 0;
  fwd.normalize();

  const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)).normalize();
  const center = avg('UpLeg');
  const hipHalfWidth = Math.abs(P.LeftUpLeg.clone().sub(center).dot(right));

  const hipY = center.y;
  const kneeY = avg('Leg').y;
  const ankleY = avg('Foot').y;
  const spine2Y = P.Spine2.y;
  const thigh = hipY - kneeY;
  const shin = kneeY - ankleY;

  const creaseY = hipY - cfg.creaseBelowHip * thigh;
  const gluteTop = hipY + cfg.gluteTopAboveHip * thigh;
  const gluteMedTop = hipY + cfg.gluteMedTopAboveHip * thigh;
  const quadTop = hipY + cfg.quadTopAboveHip * thigh;
  const kneeTop = kneeY + cfg.kneeMargin * thigh;
  const w = cfg.blend * thigh;
  const shinAt = (f) => ankleY + f * shin;

  // Phân loại xương
  const CAT = { other: 0, hips: 1, upLeg: 2, leg: 3, trunk: 4, arm: 5 };
  const cat = mesh.skeleton.bones.map((b) => {
    const k = boneKey(b.name);
    if (k === 'Hips') return CAT.hips;
    if (k.endsWith('UpLeg')) return CAT.upLeg;
    if (k === 'LeftLeg' || k === 'RightLeg') return CAT.leg;
    if (/^Spine/.test(k)) return CAT.trunk;
    if (/^(Left|Right)Arm$/.test(k)) return CAT.arm; // chỉ xương cánh tay trên (không lấy xương vai → cơ thang)
    return CAT.other;
  });
  const shoulderJoint = { Left: P.LeftArm, Right: P.RightArm };

  let data = new Float32Array(n * G);
  const v = new THREE.Vector3();
  const p = new THREE.Vector3();
  const wsum = new Float32Array(6);
  for (let i = 0; i < n; i++) {
    wsum.fill(0);
    for (let k = 0; k < 4; k++) wsum[cat[skinIndex.getComponent(i, k)]] += skinWeight.getComponent(i, k);
    const wHips = wsum[CAT.hips], wUp = wsum[CAT.upLeg], wLeg = wsum[CAT.leg];
    const wTrunk = wsum[CAT.trunk], wArm = wsum[CAT.arm];

    p.fromBufferAttribute(pos, i);
    const y = p.y;
    v.fromBufferAttribute(nor, i);
    const nf = v.x * fwd.x + v.z * fwd.z; // >0: hướng ra trước
    const nr = Math.abs(v.x * right.x + v.z * right.z); // hướng sang bên
    const lateral = Math.abs((p.x - center.x) * right.x + (p.z - center.z) * right.z);
    const offMidline = ss(lateral / hipHalfWidth, cfg.midline);

    const front = ss(nf, cfg.front);
    const back = ss(-nf, cfg.back);
    const above = sm(y, creaseY - w, creaseY + w); // trên nếp mông
    const legW = ss(wUp + 0.5 * wHips, cfg.boneWeight);
    const trunkW = ss(wTrunk + wHips * sm(y, hipY + 0.04, hipY + 0.1), cfg.boneWeight);

    const g = new Float32Array(G);
    // Đùi trước: chủ yếu UpLeg (gần háng có lẫn Hips), mặt trước, từ trên gối tới háng.
    g[0] = legW * front * band(y, kneeTop, quadTop, w) * offMidline;
    // Gập hông: mặt trước, quanh nếp háng (phần trên của cơ thẳng đùi + thắt lưng chậu lộ ra).
    g[1] = ss(wUp + wHips, cfg.boneWeight) * front * offMidline *
      band(y, hipY + cfg.hipFlexorBand[0] * thigh, hipY + cfg.hipFlexorBand[1] * thigh, w * 0.6);
    // Mông lớn: Hips/UpLeg, mặt sau, trên nếp mông và dưới mào chậu.
    g[2] = ss(wUp + wHips, cfg.boneWeight) * back * above * (1 - sm(y, gluteTop - w, gluteTop + w));
    // Mông nhỡ: mặt bên hông, từ mấu chuyển lớn (≈ ngang khớp hông) tới mào chậu.
    g[3] = ss(wUp + wHips, cfg.boneWeight) * ss(nr, cfg.side) * (1 - sm(nf, 0.3, 0.6)) *
      band(y, hipY - 0.05 * thigh, gluteMedTop, w * 0.6);
    // Đùi sau: UpLeg, mặt sau, dưới nếp mông, trên khoeo.
    g[4] = ss(wUp, cfg.boneWeight) * back * (1 - above) * sm(y, kneeTop - w, kneeTop + w);
    // Cơ bụng chân: xương Leg, mặt sau, nửa trên cẳng chân.
    g[5] = ss(wLeg, cfg.boneWeight) * ss(-nf, cfg.calfBack) * band(y, shinAt(cfg.gastroc[0]), shinAt(cfg.gastroc[1]), w);
    // Cơ dép: phần dưới, lộ ra hai bên dưới cơ bụng chân.
    g[6] = ss(wLeg, cfg.boneWeight) * ss(-nf, cfg.soleusBack) * band(y, shinAt(cfg.soleus[0]), shinAt(cfg.soleus[1]), w);
    // Bụng: mặt trước thân, sát đường giữa, từ xương mu tới bờ sườn.
    g[7] = trunkW * ss(nf, cfg.trunkFront) * (1 - ss(lateral, cfg.absHalfWidth)) *
      band(y, hipY + 0.05, spine2Y - cfg.absTopBelowSpine2, 0.025);
    // Chéo bụng: hai bên thân, giữa mào chậu và xương sườn.
    g[8] = trunkW * Math.max(ss(nr, cfg.side), ss(lateral, cfg.absHalfWidth) * ss(nf, [-0.1, 0.3])) *
      (1 - sm(-nf, 0.3, 0.6)) * band(y, hipY + 0.07, spine2Y - 0.04, 0.025);
    // Lưng dưới: mặt sau thân, hai dải dọc cột sống, từ mông lên ngang Spine2.
    g[9] = trunkW * ss(-nf, cfg.trunkBack) * (1 - ss(lateral, cfg.backHalfWidth)) *
      band(y, gluteTop, spine2Y - cfg.lowerBackTopBelowSpine2, 0.03);
    // Vai (cơ delta): xương cánh tay trên / vai, quanh khớp vai.
    const sj = shoulderJoint[p.x * right.x + p.z * right.z - (center.x * right.x + center.z * right.z) > 0 ? 'Right' : 'Left'];
    g[10] = ss(wArm, cfg.boneWeight) * (1 - ss(p.distanceTo(sj), cfg.deltoidRadius));

    data.set(g, i * G);
  }

  if (cfg.smoothIterations > 0 && geo.index) {
    data = smoothOverNeighbors(data, geo.index.array, n, G, cfg.smoothIterations);
  }

  const stats = new Array(G).fill(0);
  for (let i = 0; i < n; i++) for (let k = 0; k < G; k++) if (data[i * G + k] > 0.5) stats[k]++;

  // Tách trái / phải theo vị trí ngang so với đường giữa, xếp vào các vec4.
  const attrs = Array.from({ length: ATTR_COUNT }, () => new Float32Array(n * 4));
  for (let i = 0; i < n; i++) {
    const s = (pos.getX(i) - center.x) * right.x + (pos.getZ(i) - center.z) * right.z; // >0: bên phải người
    const fl = 1 - sm(s, -cfg.sideBlend, cfg.sideBlend);
    for (let k = 0; k < G; k++) {
      const val = data[i * G + k];
      for (const [side, f] of [[0, fl], [1, 1 - fl]]) {
        const ch = k * 2 + side;
        attrs[ch >> 2][i * 4 + (ch & 3)] = val * f;
      }
    }
  }
  attrs.forEach((a, j) => geo.setAttribute(`muscle${j}`, new THREE.BufferAttribute(a, 4)));
  return { stats: Object.fromEntries(MUSCLE_GROUPS.map((g, k) => [g.key, stats[k]])) };
}

/** Làm mịn Laplace: mỗi vòng, giá trị = trung bình của chính nó và các đỉnh kề. */
function smoothOverNeighbors(data, index, n, C, iterations) {
  const deg = new Uint32Array(n + 1);
  for (let t = 0; t < index.length; t += 3) {
    deg[index[t]] += 2; deg[index[t + 1]] += 2; deg[index[t + 2]] += 2;
  }
  const start = new Uint32Array(n + 1);
  for (let i = 0; i < n; i++) start[i + 1] = start[i] + deg[i];
  const fill = start.slice(0, n);
  const adj = new Uint32Array(start[n]);
  for (let t = 0; t < index.length; t += 3) {
    const a = index[t], b = index[t + 1], c = index[t + 2];
    adj[fill[a]++] = b; adj[fill[a]++] = c;
    adj[fill[b]++] = a; adj[fill[b]++] = c;
    adj[fill[c]++] = a; adj[fill[c]++] = b;
  }
  let src = data;
  let dst = new Float32Array(data.length);
  for (let it = 0; it < iterations; it++) {
    for (let i = 0; i < n; i++) {
      const s0 = start[i], s1 = start[i + 1];
      const cnt = s1 - s0 + 1;
      for (let k = 0; k < C; k++) {
        let s = src[i * C + k];
        for (let j = s0; j < s1; j++) s += src[adj[j] * C + k];
        dst[i * C + k] = s / cnt;
      }
    }
    [src, dst] = [dst, src];
  }
  return src;
}

/**
 * Vá shader của MeshStandardMaterial: trộn màu theo các thuộc tính `muscle0..`.
 * Trả về uniforms để cập nhật mỗi khung hình.
 */
export function applyMuscleShader(material, cfg = MUSCLE_CONFIG) {
  const uniforms = {
    uMuscleColor: { value: new THREE.Color(cfg.colors.work) },
    uMuscle: { value: Array.from({ length: ATTR_COUNT }, () => new THREE.Vector4()) },
  };
  const attrDecl = Array.from({ length: ATTR_COUNT }, (_, j) => `attribute vec4 muscle${j};`).join('\n');
  const sum = Array.from({ length: ATTR_COUNT }, (_, j) => `dot(muscle${j}, uMuscle[${j}])`).join(' + ');
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        ${attrDecl}
        uniform vec4 uMuscle[${ATTR_COUNT}];
        varying float vMuscle;`
      )
      .replace('#include <begin_vertex>', `#include <begin_vertex>\n        vMuscle = clamp(${sum}, 0.0, 1.0);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n        uniform vec3 uMuscleColor;\n        varying float vMuscle;`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>\n        diffuseColor.rgb = mix(diffuseColor.rgb, uMuscleColor, vMuscle);`
      );
  };
  material.customProgramCacheKey = () => `muscle-v3-${ATTR_COUNT}`;
  return uniforms;
}

/** Danh sách nhóm (đã mở rộng tên gộp) của một mục 'nhóm' hoặc 'nhóm.L'. */
export function expandEntry(entry) {
  const [group, side] = entry.split('.');
  return (ALIASES[group] ?? [group]).map((g) => ({ group: g, side }));
}

/**
 * Độ đậm mục tiêu (ở điểm đỉnh) cho từng kênh, từ khai báo của động tác:
 *   { primary: ['quads.L', 'glutes.L'], secondary: ['quads.R', 'hamstrings'] }
 * Nhóm không ghi .L/.R = cả hai bên. Nhóm bị tắt bằng công tắc → 0.
 * @returns {Float32Array} ATTR_COUNT*4 kênh
 */
export function muscleTargets(spec = {}, enabled = {}, cfg = MUSCLE_CONFIG) {
  const out = new Float32Array(ATTR_COUNT * 4);
  for (const level of ['secondary', 'primary']) {
    for (const entry of spec[level] ?? []) {
      for (const { group, side } of expandEntry(entry)) {
        const k = GROUP_INDEX[group];
        if (k === undefined) throw new Error(`Nhóm cơ không tồn tại: ${group}`);
        if (enabled[group] === false) continue;
        const v = cfg.levels[level];
        if (side !== 'R') out[k * 2] = Math.max(out[k * 2], v);
        if (side !== 'L') out[k * 2 + 1] = Math.max(out[k * 2 + 1], v);
      }
    }
  }
  return out;
}

/** Ghi uniform: độ đậm = biên độ (0 → 1 ở điểm đỉnh) × độ đậm mục tiêu. */
export function setMuscleIntensity(uniforms, depth, targets) {
  const d = THREE.MathUtils.clamp(depth, 0, 1);
  uniforms.uMuscle.value.forEach((v, j) => v.fromArray(targets, j * 4).multiplyScalar(d));
}

/**
 * Các nhóm cơ (đã mở rộng) xuất hiện trong khai báo, kèm bên của từng mức:
 *   [{ key, label, primary: 'both'|'L'|'R'|null, secondary: … }]  — xếp nhóm chính trước.
 */
export function musclesInSpec(spec = {}) {
  const seen = new Map();
  for (const level of ['primary', 'secondary']) {
    for (const entry of spec[level] ?? []) {
      for (const { group, side } of expandEntry(entry)) {
        if (!seen.has(group)) seen.set(group, { primary: new Set(), secondary: new Set() });
        const s = seen.get(group)[level];
        if (side) s.add(side);
        else s.add('L').add('R');
      }
    }
  }
  const sides = (s) => (s.size === 2 ? 'both' : s.size === 1 ? [...s][0] : null);
  return [...seen.entries()]
    .map(([key, v]) => {
      const primary = sides(v.primary);
      // Bên nào đã là cơ chính thì không ghi lại ở mức phụ.
      for (const x of v.primary) v.secondary.delete(x);
      return { key, label: MUSCLE_GROUPS[GROUP_INDEX[key]].label, primary, secondary: sides(v.secondary) };
    })
    .sort((a, b) => (a.primary ? 0 : 1) - (b.primary ? 0 : 1));
}
