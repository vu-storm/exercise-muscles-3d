// jointAngles.js — Số đo góc khớp từ vị trí thế giới của xương.
// Dùng chung cho bảng số đo (angles.js) và phần tự kiểm tra (exercises/check.js).

import * as THREE from 'three';

const DEG = 180 / Math.PI;
const _p = new THREE.Vector3();
const _q = new THREE.Vector3();

/** Góc tại đỉnh `at` giữa hai tia at→p và at→q (độ). */
export function angleAt(at, p, q) {
  return _p.subVectors(p, at).angleTo(_q.subVectors(q, at)) * DEG;
}

/**
 * @returns {{kneeL, kneeR, hipL, hipR, align}} (độ)
 *  - knee: góc trong của gối (hông–gối–cổ chân), 180° = duỗi thẳng
 *  - hip: góc giữa thân (Hips→Spine2) và đùi (hông→gối), 180° = thẳng như lúc đứng
 *  - align: góc vai–hông–gối nhìn từ bên (chiếu lên mặt phẳng dọc giữa), 180° = thẳng hàng,
 *           < 180° = hông còn gập, > 180° = hông duỗi quá
 *  - line:  góc vai–hông–gối trong không gian 3D (không dấu), 180° = thẳng hàng
 */
export function measureJointAngles(bones) {
  const w = (name) => bones[name].getWorldPosition(new THREE.Vector3());
  const trunk = w('Spine2').sub(w('Hips'));
  const out = {};
  for (const [side, s] of [['Left', 'L'], ['Right', 'R']]) {
    const hip = w(side + 'UpLeg');
    const knee = w(side + 'Leg');
    const ankle = w(side + 'Foot');
    out['knee' + s] = angleAt(knee, hip, ankle);
    out['hip' + s] = angleAt(hip, hip.clone().add(trunk), knee);
  }

  const mid = (a, b) => w(a).add(w(b)).multiplyScalar(0.5);
  // Thẳng hàng trong không gian (không chiếu): bắt cả hông võng sang bên (side plank).
  out.line = angleAt(mid('LeftUpLeg', 'RightUpLeg'), mid('LeftArm', 'RightArm'), mid('LeftLeg', 'RightLeg'));
  const lat = w('LeftUpLeg').sub(w('RightUpLeg')).normalize();
  const flat = (v) => v.addScaledVector(lat, -v.dot(lat));
  const shoulder = flat(mid('LeftArm', 'RightArm'));
  const hip = flat(mid('LeftUpLeg', 'RightUpLeg'));
  const knee = flat(mid('LeftLeg', 'RightLeg'));
  // Có dấu: < 180° = gập hông (hông võng/gập), > 180° = duỗi quá (hông vượt đường thẳng).
  const a = angleAt(hip, shoulder, knee);
  const flexed = _p.subVectors(shoulder, hip).cross(_q.subVectors(knee, hip)).dot(lat) >= 0;
  out.align = flexed ? a : 360 - a;
  return out;
}
