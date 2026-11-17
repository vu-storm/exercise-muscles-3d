// check.js — Tự kiểm tra một động tác bằng cách skin mô hình trên CPU.
// Chạy được cả trong trình duyệt (in ra console) lẫn Node (tools/check-exercise.mjs).
//
// Mỗi động tác khai báo `checks: [...]`, mỗi mục là một phép đo + khoảng cho phép:
//
//   { label, at, range, ...phépĐo }
//
//   at:    'start' (t = 0) | 'peak' (điểm đỉnh của động tác) | 'all' (quét cả clip) | số giây
//          | [t0, t1] (quét trong khoảng — sequence() tự đổi 'all' của từng đoạn sang dạng này)
//   range: [min, max] — mét với khoảng cách, độ với góc
//
//   Phép đo:
//   • khoảng cách tới sàn (mặc định): y thấp nhất của một vùng lưới
//       near:  { joint: 'RightLeg', radius: 0.11 }   đỉnh trong bán kính quanh khớp
//       bones: ['LeftFoot', 'LeftToeBase']           đỉnh có xương chi phối nằm trong danh sách
//       (dùng một hoặc cả hai; cả hai = giao)
//   • angle: 'kneeL' | 'kneeR' | 'hipL' | 'hipR' | 'align'   (xem src/jointAngles.js)
//   • slide: 'Spine2'   độ trượt ngang của khớp so với t = 0 (mét)
//   • jointY: 'LeftFoot'  độ cao của khớp so với sàn (mét)
//   • com: true         trọng tâm (≈ trọng tâm các đỉnh) ở trước khớp ghim bao nhiêu mét,
//                       theo hướng trước của người — kiểm tra thăng bằng
//
// Luôn kiểm tra thêm: bàn chân ghim không trượt (< 1 cm suốt clip) và không đỉnh nào dưới
// sàn (dung sai 3 mm) ở điểm đỉnh và suốt clip.

import * as THREE from 'three';
import { FPS, pinsAt } from './build.js';
import { propBoxes } from './props.js';
import { measureJointAngles } from '../jointAngles.js';

const FLOOR_TOLERANCE = 0.003;
const PIN_TOLERANCE = 0.01;

/** Ma trận skin của từng xương: đỉnh (không gian geometry) → thế giới. */
function boneSkinMatrices(mesh) {
  const { bones, boneInverses } = mesh.skeleton;
  return bones.map((b, i) =>
    new THREE.Matrix4()
      .multiplyMatrices(mesh.matrixWorld, mesh.bindMatrixInverse)
      .multiply(b.matrixWorld)
      .multiply(boneInverses[i])
      .multiply(mesh.bindMatrix)
  );
}

/** Toạ độ thế giới của mọi đỉnh sau skinning. */
function skinnedPositions(mesh, out) {
  const pos = mesh.geometry.attributes.position.array;
  const si = mesh.geometry.attributes.skinIndex;
  const sw = mesh.geometry.attributes.skinWeight;
  const mats = boneSkinMatrices(mesh).map((m) => m.elements);
  const n = pos.length / 3;
  for (let i = 0; i < n; i++) {
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    let ox = 0, oy = 0, oz = 0;
    for (let k = 0; k < 4; k++) {
      const w = sw.getComponent(i, k);
      if (w === 0) continue;
      const e = mats[si.getComponent(i, k)];
      ox += w * (e[0] * x + e[4] * y + e[8] * z + e[12]);
      oy += w * (e[1] * x + e[5] * y + e[9] * z + e[13]);
      oz += w * (e[2] * x + e[6] * y + e[10] * z + e[14]);
    }
    out[i * 3] = ox; out[i * 3 + 1] = oy; out[i * 3 + 2] = oz;
  }
  return out;
}

/** Xương có trọng số lớn nhất của mỗi đỉnh (tên rút gọn). */
function dominantBone(mesh) {
  const si = mesh.geometry.attributes.skinIndex;
  const sw = mesh.geometry.attributes.skinWeight;
  const names = mesh.skeleton.bones.map((b) => b.name.replace(/^mixamorig:?/, ''));
  const out = new Array(si.count);
  for (let i = 0; i < si.count; i++) {
    let best = 0, bw = -1;
    for (let k = 0; k < 4; k++) if (sw.getComponent(i, k) > bw) { bw = sw.getComponent(i, k); best = si.getComponent(i, k); }
    out[i] = names[best];
  }
  return out;
}

const isDistance = (c) => !c.angle;

/**
 * Dùng một AnimationMixer riêng nên chạy được cả khi ứng dụng đang phát.
 * @param {{root, mesh, bones, rig}} model
 * @param {THREE.AnimationClip} clip
 * @param {object} exercise
 */
export function checkExercise(model, clip, exercise) {
  const { root, mesh, bones, rig } = model;
  const checks = exercise.checks ?? [];

  // Lưu tư thế xương để trả lại sau khi kiểm tra (không làm giật mô hình đang hiển thị).
  const saved = mesh.skeleton.bones.map((b) => [b.position.clone(), b.quaternion.clone(), b.scale.clone()]);
  const mixer = new THREE.AnimationMixer(root);
  const action = mixer.clipAction(clip);
  action.reset().play();
  const poseAt = (t) => {
    action.time = t;
    mixer.update(0);
    root.updateMatrixWorld(true);
  };

  // Điểm đỉnh: Hips thấp nhất (mặc định) hoặc cao nhất (peak: 'high', vd. glute bridge).
  const frames = Math.round(clip.duration * FPS);
  const tmp = new THREE.Vector3();
  const high = exercise.peak === 'high';
  const none = exercise.peak === 'none'; // không có điểm đỉnh: dùng giữa clip
  let peak = 0, peakY = high ? -Infinity : Infinity;
  for (let f = 0; f <= frames; f++) {
    const t = (clip.duration * f) / frames;
    poseAt(t);
    const y = bones.Hips.getWorldPosition(tmp).y;
    if (high ? y > peakY : y < peakY) { peakY = y; peak = t; }
  }
  if (none) peak = +(clip.duration / 2).toFixed(3);

  const n = mesh.geometry.attributes.position.count;
  const P = new Float32Array(n * 3);
  const dom = dominantBone(mesh);

  // Bộ lọc đỉnh cho từng phép đo khoảng cách.
  const filters = checks.map((c) => {
    if (!isDistance(c) || c.slide || c.com || c.jointY) return null;
    const set = c.bones ? new Set(c.bones) : null;
    return (i) => !set || set.has(dom[i]);
  });
  const minY = (filter, near) => {
    let m = Infinity, at = -1;
    let cx, cy, cz, r2;
    if (near) {
      const j = bones[near.joint].getWorldPosition(new THREE.Vector3());
      [cx, cy, cz, r2] = [j.x, j.y, j.z, near.radius * near.radius];
    }
    for (let i = 0; i < n; i++) {
      const y = P[i * 3 + 1];
      if (y >= m || (filter && !filter(i))) continue;
      if (near) {
        const dx = P[i * 3] - cx, dy = y - cy, dz = P[i * 3 + 2] - cz;
        if (dx * dx + dy * dy + dz * dz > r2) continue;
      }
      m = y; at = i;
    }
    return { y: m, bone: at >= 0 ? dom[at] : null };
  };

  // Trọng tâm ≈ trọng tâm các đỉnh lưới (mật độ đỉnh khá đều), chiếu lên hướng trước của người,
  // tính từ khớp đang ghim (cổ chân hoặc ngón chân). Dương = phía trước khớp ghim.
  const comOffset = (t) => {
    let sx = 0, sz = 0;
    for (let i = 0; i < n; i++) { sx += P[i * 3]; sz += P[i * 3 + 2]; }
    const pins = pinsAt(exercise, rig, t);
    const ref = new THREE.Vector3();
    for (const p of pins) ref.add(p.target);
    if (pins.length) ref.multiplyScalar(1 / pins.length);
    return (sx / n - ref.x) * rig.fwd.x + (sz / n - ref.z) * rig.fwd.z;
  };

  const slideRef = {};
  let currentT = 0;
  const measure = (c, k) => {
    if (c.angle) return measureJointAngles(bones)[c.angle];
    if (c.com) return comOffset(currentT);
    if (c.jointY) return bones[c.jointY].getWorldPosition(new THREE.Vector3()).y;
    if (c.slide) {
      const p = bones[c.slide].getWorldPosition(new THREE.Vector3());
      p.y = 0;
      return p.distanceTo(slideRef[c.slide]);
    }
    return minY(filters[k], c.near).y;
  };

  // Ghi nhận [min, max] của từng phép đo theo thời điểm.
  const acc = checks.map(() => ({ min: Infinity, max: -Infinity }));
  const record = (k, v) => {
    acc[k].min = Math.min(acc[k].min, v);
    acc[k].max = Math.max(acc[k].max, v);
  };
  let pinDrift = 0;
  const boxes = propBoxes(exercise, rig);
  let boxWorst = { depth: 0, t: 0, bone: null };
  const pinnedSeen = new Set();
  let worst = { y: Infinity, t: 0, bone: null };
  const peakInfo = {};

  const evaluate = (t, tags) => {
    currentT = t;
    poseAt(t);
    skinnedPositions(mesh, P);
    if (t === 0) for (const c of checks) if (c.slide) {
      slideRef[c.slide] = bones[c.slide].getWorldPosition(new THREE.Vector3()).setY(0);
    }
    checks.forEach((c, k) => {
      const at = c.at ?? 'peak';
      const hit = Array.isArray(at) ? tags.includes('all') && t >= at[0] - 1e-6 && t <= at[1] + 1e-6 : tags.includes(at);
      if (hit) record(k, measure(c, k));
    });
    for (const { key, target } of pinsAt(exercise, rig, t)) {
      pinnedSeen.add(key);
      pinDrift = Math.max(pinDrift, bones[key].getWorldPosition(tmp).distanceTo(target));
    }
    // Xuyên vào đạo cụ (bục): đỉnh nằm trong khối hộp, sâu hơn mặt trên bao nhiêu.
    for (const b of boxes) {
      for (let i = 0; i < n; i++) {
        const dx = P[i * 3] - b.center.x, dz = P[i * 3 + 2] - b.center.z, y = P[i * 3 + 1];
        if (y >= b.top) continue;
        const f = Math.abs(dx * rig.fwd.x + dz * rig.fwd.z), l = Math.abs(dx * rig.left.x + dz * rig.left.z);
        if (f > b.halfDepth || l > b.halfWidth) continue;
        const depth = Math.min(b.top - y, b.halfDepth - f, b.halfWidth - l); // khoảng phải đẩy ra ngoài
        if (depth > boxWorst.depth) boxWorst = { depth, t, bone: dom[i] };
      }
    }
    const m = minY();
    if (m.y < worst.y) worst = { y: m.y, t, bone: m.bone };
    if (tags.includes('peak')) Object.assign(peakInfo, { minY: m.y, bone: m.bone });
  };

  evaluate(0, ['start', 'all']);
  for (let f = 2; f <= frames; f += 2) evaluate((clip.duration * f) / frames, ['all']);
  evaluate(peak, ['peak', 'all']);
  // `at` là số = thời điểm cụ thể (giây), vd. điểm thấp nhất của từng chân trong lunge đổi chân.
  for (const t of new Set(checks.map((c) => c.at).filter((a) => typeof a === 'number'))) evaluate(t, [t, 'all']);

  // --- Đánh giá ---
  const results = checks.map((c, k) => {
    const unit = c.angle ? 'deg' : 'm';
    const { min, max } = acc[k];
    const [lo, hi] = c.range;
    return { label: c.label, at: c.at ?? 'peak', unit, min, max, range: c.range, ok: min >= lo && max <= hi };
  });
  if (pinnedSeen.size) {
    const names = [...pinnedSeen];
    results.push({
      label: `Điểm ghim (${names.join(', ')}) không trượt`, at: 'all', unit: 'm',
      min: pinDrift, max: pinDrift, range: [0, PIN_TOLERANCE], ok: pinDrift < PIN_TOLERANCE,
    });
  }
  if (boxes.length) {
    results.push({
      label: `Không xuyên vào bục (sâu nhất tại t = ${boxWorst.t.toFixed(2)}s, ${boxWorst.bone ?? '—'})`, at: 'all',
      unit: 'm', min: -boxWorst.depth, max: -boxWorst.depth, range: [-FLOOR_TOLERANCE, Infinity],
      ok: boxWorst.depth <= FLOOR_TOLERANCE,
    });
  }
  results.push({
    label: `Không xuyên sàn ở điểm đỉnh (${peakInfo.bone})`, at: 'peak', unit: 'm',
    min: peakInfo.minY, max: peakInfo.minY, range: [-FLOOR_TOLERANCE, Infinity], ok: peakInfo.minY >= -FLOOR_TOLERANCE,
  });
  results.push({
    label: `Không xuyên sàn suốt clip (thấp nhất tại t = ${worst.t.toFixed(2)}s, ${worst.bone})`, at: 'all', unit: 'm',
    min: worst.y, max: worst.y, range: [-FLOOR_TOLERANCE, Infinity], ok: worst.y >= -FLOOR_TOLERANCE,
  });

  action.stop();
  mixer.uncacheRoot(root);
  mesh.skeleton.bones.forEach((b, i) => {
    b.position.copy(saved[i][0]);
    b.quaternion.copy(saved[i][1]);
    b.scale.copy(saved[i][2]);
  });
  root.updateMatrixWorld(true);
  return { exercise: exercise.id, peakTime: +peak.toFixed(3), results, ok: results.every((r) => r.ok) };
}

/** In kết quả kiểm tra ra console (tiếng Việt; cm cho khoảng cách, độ cho góc). */
export function printCheck(r, log = console) {
  const fmt = (v, unit) =>
    !Number.isFinite(v) ? (v > 0 ? '∞' : '-∞') : unit === 'deg' ? `${v.toFixed(1)}°` : `${(v * 100).toFixed(1)} cm`;
  const AT = { start: 'đầu', peak: 'đỉnh', all: 'cả clip' };
  const atLabel = (a) => (typeof a === 'number' ? `t = ${a}s` : Array.isArray(a) ? `${a[0]}–${a[1]}s` : AT[a]);
  const lines = [`[kiểm tra] ${r.exercise}: ${r.ok ? 'ĐẠT' : 'CHƯA ĐẠT'} — điểm đỉnh t = ${r.peakTime}s`];
  for (const x of r.results) {
    const val = x.min === x.max ? fmt(x.min, x.unit) : `${fmt(x.min, x.unit)} … ${fmt(x.max, x.unit)}`;
    const range = `[${fmt(x.range[0], x.unit)}, ${fmt(x.range[1], x.unit)}]`;
    lines.push(`  ${x.ok ? '✓' : '✗'} ${x.label} (${atLabel(x.at)}): ${val}  cho phép ${range}`);
  }
  (r.ok ? log.info : log.warn).call(log, lines.join('\n'));
}
