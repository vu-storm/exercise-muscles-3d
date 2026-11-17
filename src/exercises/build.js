// build.js — Biến dữ liệu "góc khớp theo mốc thời gian" thành THREE.AnimationClip
// cho khung xương Mixamo.
//
// Nguyên tắc:
// • Không quay quanh trục cục bộ của xương (mỗi xương Mixamo có trục khác nhau).
//   Mọi góc gập đều quay quanh TRỤC NGANG CỦA THẾ GIỚI = trục trái–phải của người ở tư thế đứng.
// • Góc của một khớp là góc TƯƠNG ĐỐI so với khớp cha (giống cách đo giải phẫu):
//   góc tuyệt đối của đoạn chi = tổng các góc từ gốc tới nó. Ví dụ đùi gập 85°, gối gập 85°
//   → cẳng chân thẳng đứng.
// • Bàn chân (Foot) và ngón chân (ToeBase) là khớp TUYỆT ĐỐI: mặc định giữ nguyên hướng như
//   lúc đứng (phẳng trên sàn); nếu dữ liệu ghi góc thì góc đó tính so với sàn.
// • Quaternion cục bộ được tính lại theo thứ tự cha trước, con sau:
//     Q_thếgiới(xương) = R_tíchluỹ(xương) · Q_thếgiới_lúcđứng(xương)
//     q_cụcbộ(xương)   = Q_thếgiới(cha)⁻¹ · Q_thếgiới(xương)
// • Mỗi khung, xương Hips được dời sao cho các điểm ghim (bàn chân, gối…) về đúng vị trí đích.
// • Tuỳ chọn `relativeFeet: true`: Foot/ToeBase cũng là góc tương đối (theo cẳng chân) — dùng
//   khi bàn chân không đặt phẳng trên sàn (plank, nằm nghiêng, quỳ…).

import * as THREE from 'three';

export const FPS = 30;
const DEG = Math.PI / 180;

/** Tên xương rút gọn: "mixamorig:LeftUpLeg" / "mixamorigLeftUpLeg" → "LeftUpLeg". */
export const shortName = (name) => name.replace(/^mixamorig:?/, '');
/** "LeftUpLeg" → { side: 'Left', base: 'UpLeg' } */
function splitName(key) {
  const m = key.match(/^(Left|Right)(.*)$/);
  return m ? { side: m[1], base: m[2] } : { side: null, base: key };
}

/**
 * Quy ước dấu: giá trị DƯƠNG trong dữ liệu = "gập ra trước" theo nghĩa giải phẫu.
 * Hệ số dưới đây đổi sang chiều quay quanh trục ngang `lat` (lat = trước × lên),
 * trong đó góc dương làm đầu dưới của một đoạn thẳng đứng đi ra trước.
 */
const FLEX_SIGN = {
  Hips: -1, // nghiêng khung chậu ra trước
  Spine: -1, Spine1: -1, Spine2: -1, Neck: -1, Head: -1, // cúi thân/đầu ra trước
  UpLeg: +1, // gập hông: đùi đưa ra trước (âm = duỗi ra sau)
  Leg: -1, // gập gối: cẳng chân đi ra sau
  Foot: -1, // (tuyệt đối) gập lòng bàn chân: gót nhấc lên, mũi chân chúc xuống
  ToeBase: -1, // (tuyệt đối) ngón chân quặp xuống
  Shoulder: +1, Arm: +1, ForeArm: +1, Hand: +1, // đưa tay ra trước
};
const ABSOLUTE = new Set(['Foot', 'ToeBase']);

/**
 * Chụp lại tư thế đứng (rest pose của file GLB) làm mốc. Gọi khi xương còn ở tư thế gốc,
 * trước khi AnimationMixer chạy.
 */
export function createRig(root, skeleton) {
  root.updateMatrixWorld(true);
  const bones = skeleton.bones;
  const indexOf = new Map(bones.map((b, i) => [b, i]));

  const joints = bones.map((b) => {
    const key = shortName(b.name);
    return {
      bone: b,
      name: b.name,
      key,
      ...splitName(key),
      parent: indexOf.has(b.parent) ? indexOf.get(b.parent) : -1,
      restLocalPos: b.position.clone(),
      restWorldQuat: b.getWorldQuaternion(new THREE.Quaternion()),
      restWorldPos: b.getWorldPosition(new THREE.Vector3()),
    };
  });
  const byKey = Object.fromEntries(joints.map((j, i) => [j.key, i]));

  // Thứ tự cha trước con sau (theo độ sâu trong cây).
  const depth = joints.map((j) => {
    let d = 0;
    for (let p = j.parent; p >= 0; p = joints[p].parent) d++;
    return d;
  });
  const order = joints.map((_, i) => i).sort((a, b) => depth[a] - depth[b]);

  const rootIdx = order[0];
  const rootParent = joints[rootIdx].bone.parent;
  const rootParentQuat = rootParent.getWorldQuaternion(new THREE.Quaternion());
  const rootParentInv = rootParent.matrixWorld.clone().invert();

  // Hệ trục cơ thể lúc đứng.
  const P = (k) => joints[byKey[k]].restWorldPos;
  const up = new THREE.Vector3(0, 1, 0);
  const fwd = P('LeftToeBase').clone().sub(P('LeftFoot')).add(P('RightToeBase')).sub(P('RightFoot'));
  fwd.y = 0;
  fwd.normalize();
  const lat = new THREE.Vector3().crossVectors(fwd, up).normalize(); // trục gập
  const left = new THREE.Vector3().crossVectors(up, fwd).normalize(); // phía trái của người

  return { joints, byKey, order, rootIdx, rootParentQuat, rootParentInv, fwd, up, lat, left };
}


/** Chuẩn hoá một giá trị góc: số = gập quanh trục ngang; object = { flex, adduct }. */
function norm(v) {
  if (v == null) return { flex: 0, adduct: 0 };
  if (typeof v === 'number') return { flex: v, adduct: 0 };
  return { flex: v.flex ?? 0, adduct: v.adduct ?? 0 };
}

const easeInOut = (s) => 0.5 - 0.5 * Math.cos(Math.PI * s);

// ---------------------------------------------------------------------------
// Ghim (điểm tiếp xúc cố định)
// ---------------------------------------------------------------------------
//
// `pin` (hoặc tên cũ `pinnedFoot`) ghi trên động tác hoặc trên từng mốc (áp dụng từ mốc đó):
//   'Left' | 'Right' | 'Both'        bàn chân (khớp `pinJoint`, mặc định 'Foot' = cổ chân) ở
//                                    đúng chỗ lúc đứng; 'Both' = cả hai chân
//   { joint, height, forward, left } một khớp bất kỳ, đặt ở chỗ lúc đứng dời đi `forward`/`left`
//                                    mét (theo hướng người) và ở độ cao `height` (mặc định giữ nguyên)
//   { joint, anchor: true }          giữ khớp ở đúng chỗ nó đang ở lúc bắt đầu đoạn
//                                    (vd. bàn chân vừa đặt lên bục)
//   mảng các mục trên                nhiều điểm ghim
// Nhiều điểm ghim: theo phương ngang lấy trung bình, theo phương đứng lấy điểm cần nâng nhiều
// nhất → điểm thấp hơn chạm đúng, các điểm khác không lún (mô hình lệch nhau vài mm).

/** Giá trị theo đoạn: mốc có ghi một trong `fields` áp dụng từ mốc đó trở đi. */
export function segmentValue(exercise, t, ...fields) {
  const pick = (o) => fields.map((f) => o[f]).find((v) => v !== undefined);
  let v = pick(exercise);
  for (const kf of exercise.keyframes ?? []) {
    if (kf.time > t + 1e-6) break;
    const x = pick(kf);
    if (x !== undefined) v = x;
  }
  return v;
}

/** Danh sách mục ghim (chưa có vị trí) từ một khai báo. */
function pinEntries(spec, pinJoint = 'Foot') {
  if (!spec) return [];
  if (Array.isArray(spec)) return spec.flatMap((s) => pinEntries(s, pinJoint));
  if (typeof spec === 'string') {
    if (spec === 'Both') return [{ joint: 'Left' + pinJoint }, { joint: 'Right' + pinJoint }];
    if (spec === 'Left' || spec === 'Right') return [{ joint: spec + pinJoint }];
    return [{ joint: spec }];
  }
  return [spec];
}

/** Vị trí đích của một mục ghim (trừ anchor). */
function pinTarget(rig, e) {
  const ji = rig.byKey[e.joint];
  if (ji === undefined) throw new Error(`pin: không có xương ${e.joint}`);
  const rest = rig.joints[ji].restWorldPos;
  const p = rest.clone().addScaledVector(rig.fwd, e.forward ?? 0).addScaledVector(rig.left, e.left ?? 0);
  if (e.height !== undefined) p.y = e.height;
  return p;
}

const timelines = new WeakMap();
/**
 * Các đoạn ghim của động tác: [{ time, pins: [{ key, target }] }], tính tuần tự để giải
 * `anchor` (cần tư thế ở đầu đoạn theo cách ghim của đoạn trước).
 */
function pinTimeline(exercise, rig) {
  let byRig = timelines.get(exercise);
  if (!byRig) timelines.set(exercise, (byRig = new WeakMap()));
  if (byRig.has(rig)) return byRig.get(rig);

  const starts = [0];
  for (const kf of exercise.keyframes) {
    if (kf.time > 0 && (kf.pin !== undefined || kf.pinnedFoot !== undefined)) starts.push(kf.time);
  }
  const segs = [];
  for (const t of starts) {
    const entries = pinEntries(segmentValue(exercise, t, 'pin', 'pinnedFoot'), exercise.pinJoint);
    let prevPose = null;
    const pins = entries.map((e) => {
      if (!e.anchor) return { key: e.joint, target: pinTarget(rig, e) };
      if (!segs.length) throw new Error('pin anchor không dùng được ở đoạn đầu tiên');
      prevPose ??= solvePose(rig, sampleAngles(exercise.keyframes, t), segs[segs.length - 1].pins, poseOptions(exercise, t));
      return { key: e.joint, target: prevPose.worldPos[rig.byKey[e.joint]].clone() };
    });
    segs.push({ time: t, pins });
  }
  byRig.set(rig, segs);
  return segs;
}

/** Các điểm ghim đã có vị trí tại thời điểm t: [{ key, target }]. */
export function pinsAt(exercise, rig, t) {
  const segs = pinTimeline(exercise, rig);
  let cur = segs[0];
  for (const s of segs) if (s.time <= t + 1e-6) cur = s;
  return cur.pins;
}

/** Tuỳ chọn tư thế tại thời điểm t (điểm tựa, bàn chân tương đối). */
function poseOptions(exercise, t, hint) {
  const support = segmentValue(exercise, t, 'support'); // có thể đổi theo đoạn (bird dog)
  const sup = support && {
    ...support,
    height: sampleScalar(exercise.keyframes, t, 'supportHeight', support.height),
  };
  return { support: sup, relativeFeet: !!exercise.relativeFeet, hint };
}

/** Góc của mọi khớp tại thời điểm t (nội suy ease in-out giữa hai mốc kề nhau). */
export function sampleAngles(keyframes, t) {
  const kfs = keyframes;
  if (t <= kfs[0].time) return mapAngles(kfs[0].angles, {}, 0);
  for (let k = 0; k < kfs.length - 1; k++) {
    const a = kfs[k], b = kfs[k + 1];
    if (t <= b.time) {
      const s = b.time > a.time ? (t - a.time) / (b.time - a.time) : 1;
      return mapAngles(a.angles, b.angles, easeInOut(s));
    }
  }
  return mapAngles(kfs[kfs.length - 1].angles, {}, 0);
}

/** Nội suy một số vô hướng ghi trên mốc (vd. `supportHeight`), cùng kiểu ease in-out. */
export function sampleScalar(keyframes, t, key, fallback) {
  const val = (kf) => kf[key] ?? fallback;
  if (t <= keyframes[0].time) return val(keyframes[0]);
  for (let k = 0; k < keyframes.length - 1; k++) {
    const a = keyframes[k], b = keyframes[k + 1];
    if (t <= b.time) {
      const s = b.time > a.time ? (t - a.time) / (b.time - a.time) : 1;
      return val(a) + (val(b) - val(a)) * easeInOut(s);
    }
  }
  return val(keyframes[keyframes.length - 1]);
}

function mapAngles(A = {}, B = {}, s) {
  const out = {};
  for (const key of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const a = norm(A[key]), b = norm(B[key]);
    out[key] = { flex: a.flex + (b.flex - a.flex) * s, adduct: a.adduct + (b.adduct - a.adduct) * s };
  }
  return out;
}

const _q = new THREE.Quaternion();
const _qa = new THREE.Quaternion();
const _v = new THREE.Vector3();
const _axis = new THREE.Vector3();

/** Chấp nhận khai báo ghim kiểu cũ ('Left', 'LeftFoot', 'Both') hoặc danh sách đã có vị trí. */
function resolvePins(rig, pins) {
  if (!pins) return [];
  if (Array.isArray(pins) && pins.every((p) => p.target)) return pins;
  return pinEntries(pins).map((e) => ({ key: e.joint, target: pinTarget(rig, e) }));
}

/**
 * Tính tư thế cho một bộ góc.
 *
 * Bảo vệ sàn cho bàn chân KHÔNG ghim: nếu dữ liệu ghi góc nhấc gót (Foot > 0) mà ngón chân
 * bị kéo xuống thấp hơn lúc đứng (tức là xuyên sàn), góc bàn chân được giảm vừa đủ để ngón
 * chân chạm sàn. Tư thế vốn đã hợp lệ thì không bị thay đổi. Tắt bằng `floorGuard: false`.
 *
 * Điểm tựa (`support: { joint, height, axis, range }`): cả người được xoay quanh điểm ghim
 * (giải góc của `Hips`) đến khi khớp `joint` cách sàn đúng `height` mét — dùng cho động tác
 * nằm / chống. `axis: 'pitch'` (mặc định) = ngả trước–sau (glute bridge, plank);
 * `axis: 'roll'` = nghiêng sang bên (side plank). `range` = khoảng góc quét tìm nghiệm.
 *
 * @param pins  khai báo ghim kiểu cũ hoặc [{ key, target }]
 * @returns {{ localQuats, worldPos, hipsLocalPos, angles }}
 */
export function solvePose(rig, angles, pins, { floorGuard = true, support = null, relativeFeet = false, hint } = {}) {
  pins = resolvePins(rig, pins);
  const opts = { relativeFeet };
  if (support) angles = solveSupport(rig, angles, pins, support, opts, hint);
  let pose = solveRaw(rig, angles, pins, opts);
  pose.angles = angles;
  if (!floorGuard || relativeFeet) return pose;

  for (const side of ['Left', 'Right']) {
    if (pins.some((p) => p.key.startsWith(side))) continue;
    const key = side + 'Foot';
    const a = norm(angles[key]);
    if (a.flex <= 0) continue;
    const toeKeys = [side + 'ToeBase', side + 'Toe_End'].filter((k) => k in rig.byKey);
    const below = (p) =>
      Math.min(...toeKeys.map((k) => p.worldPos[rig.byKey[k]].y - rig.joints[rig.byKey[k]].restWorldPos.y));
    if (below(pose) >= 0) continue;

    // Tìm góc lớn nhất trong [0, flex] mà ngón chân không thấp hơn lúc đứng.
    const withFlex = (f) => solveRaw(rig, { ...angles, [key]: { ...a, flex: f } }, pins, opts);
    let lo = 0, hi = a.flex;
    if (below(withFlex(0)) < 0) continue; // không cứu được bằng bàn chân → để check.js báo
    for (let it = 0; it < 20; it++) {
      const mid = (lo + hi) / 2;
      if (below(withFlex(mid)) >= 0) lo = mid;
      else hi = mid;
    }
    angles = { ...angles, [key]: { ...a, flex: lo } };
    pose = withFlex(lo);
    pose.angles = angles;
  }
  return pose;
}

/** Giải góc Hips (ngả hoặc nghiêng) để khớp tựa cách sàn đúng `height`. */
function solveSupport(rig, angles, pins, { joint, height, axis = 'pitch', range = [30, -170] }, opts, hint) {
  const ji = rig.byKey[joint];
  if (ji === undefined) throw new Error(`support: không có xương ${joint}`);
  const field = axis === 'roll' ? 'adduct' : 'flex';
  const hips = norm(angles.Hips);
  const withP = (p) => ({ ...angles, Hips: { ...hips, [field]: p } });
  const f = (p) => solveRaw(rig, withP(p), pins, opts).worldPos[ji].y - height;

  const bisect = (a, fa, b) => {
    for (let it = 0; it < 30; it++) {
      const m = (a + b) / 2, fm = f(m);
      if (Math.sign(fm) === Math.sign(fa)) { a = m; fa = fm; } else b = m;
    }
    return withP((a + b) / 2);
  };
  const scan = (from, to, step) => {
    let p0 = from, f0 = f(p0);
    if (f0 === 0) return withP(p0);
    const n = Math.ceil(Math.abs(to - from) / step);
    for (let i = 1; i <= n; i++) {
      const p1 = from + Math.sign(to - from) * Math.min(i * step, Math.abs(to - from));
      const f1 = f(p1);
      if (Math.sign(f1) !== Math.sign(f0)) return bisect(p0, f0, p1);
      p0 = p1; f0 = f1;
    }
    return null;
  };
  // Khởi đầu từ nghiệm khung trước (nhanh, liên tục); không thấy thì quét cả khoảng.
  if (hint !== undefined) {
    const r = scan(hint - 4, hint + 4, 1);
    if (r) return r;
  }
  const r = scan(range[0], range[1], 2);
  if (r) return r;
  throw new Error(`support: không đặt được ${joint} ở độ cao ${height} m`);
}

function solveRaw(rig, angles, pins, { relativeFeet = false } = {}) {
  const { joints, order, lat, fwd } = rig;
  const n = joints.length;
  const Rc = new Array(n); // phép quay tích luỹ (thế giới) so với lúc đứng
  const Qw = new Array(n);
  const Pw = new Array(n);
  const localQuats = new Array(n);

  for (const i of order) {
    const j = joints[i];
    const a = norm(angles[j.key]);
    const sign = FLEX_SIGN[j.base] ?? 1;
    const flexQ = _q.setFromAxisAngle(lat, sign * a.flex * DEG);

    let r;
    if (ABSOLUTE.has(j.base) && !relativeFeet) {
      r = flexQ.clone(); // hướng so với sàn, không kế thừa cha
    } else {
      r = j.parent >= 0 ? Rc[j.parent].clone() : new THREE.Quaternion();
      r.multiply(flexQ);
      if (a.adduct) {
        // Khép (adduct) quanh trục trước–sau; chiều phụ thuộc bên trái/phải.
        // Với Hips (không có bên): dương = nghiêng sang phải người.
        _axis.copy(fwd).multiplyScalar(j.side === 'Left' ? -1 : 1);
        r.multiply(_qa.setFromAxisAngle(_axis, a.adduct * DEG));
      }
    }
    Rc[i] = r;
    Qw[i] = r.clone().multiply(j.restWorldQuat);

    if (j.parent >= 0) {
      const p = joints[j.parent];
      Pw[i] = _v.copy(j.restWorldPos).sub(p.restWorldPos).applyQuaternion(Rc[j.parent]).add(Pw[j.parent]).clone();
      localQuats[i] = Qw[j.parent].clone().invert().multiply(Qw[i]);
    } else {
      Pw[i] = j.restWorldPos.clone();
      localQuats[i] = rig.rootParentQuat.clone().invert().multiply(Qw[i]);
    }
  }

  // Ghim: dời cả cơ thể (qua Hips) để các khớp ghim về đúng vị trí đích.
  if (pins.length) {
    const d = new THREE.Vector3();
    let dy = -Infinity;
    for (const { key, target } of pins) {
      const di = target.clone().sub(Pw[rig.byKey[key]]);
      d.add(di);
      dy = Math.max(dy, di.y);
    }
    d.multiplyScalar(1 / pins.length);
    d.y = dy;
    for (const p of Pw) p.add(d);
  }
  const hipsLocalPos = Pw[rig.rootIdx].clone().applyMatrix4(rig.rootParentInv);
  return { localQuats, worldPos: Pw, hipsLocalPos };
}

/** Dựng AnimationClip 30 khung/giây từ dữ liệu động tác. */
export function buildClip(exercise, rig) {
  const frames = Math.round(exercise.duration * FPS) + 1;
  const times = new Float32Array(frames);
  const n = rig.joints.length;
  const quat = rig.joints.map(() => new Float32Array(frames * 4));
  const hips = new Float32Array(frames * 3);
  let hint;
  for (let f = 0; f < frames; f++) {
    const t = Math.min(f / FPS, exercise.duration);
    times[f] = t;
    const pose = solvePose(rig, sampleAngles(exercise.keyframes, t), pinsAt(exercise, rig, t), poseOptions(exercise, t, hint));
    const sup = segmentValue(exercise, t, 'support');
    if (sup) hint = pose.angles.Hips[sup.axis === 'roll' ? 'adduct' : 'flex'];
    for (let i = 0; i < n; i++) pose.localQuats[i].toArray(quat[i], f * 4);
    pose.hipsLocalPos.toArray(hips, f * 3);
  }

  const tracks = [];
  rig.joints.forEach((j, i) => {
    tracks.push(new THREE.QuaternionKeyframeTrack(`${j.name}.quaternion`, times, quat[i]));
    if (i === rig.rootIdx) {
      tracks.push(new THREE.VectorKeyframeTrack(`${j.name}.position`, times, hips));
    } else {
      // Vị trí cố định = lúc đứng; cần khi chuyển từ clip khác có track vị trí.
      const p = j.restLocalPos;
      tracks.push(
        new THREE.VectorKeyframeTrack(`${j.name}.position`, [0, exercise.duration], [p.x, p.y, p.z, p.x, p.y, p.z])
      );
    }
  });
  return new THREE.AnimationClip(exercise.id, exercise.duration, tracks);
}
