// Công cụ giải số góc tiếp xúc (gối/gót/bàn chân chạm sàn, bàn chân lên bục) cho các động tác.
// Chạy: node tools/tune-contacts.mjs <step|path|hip|ham|calf> — in ra góc cần ghi vào dữ liệu.
import * as THREE from 'three';
import { loadNodeModel } from './check-exercise.mjs';
import { buildClip, solvePose } from '../src/exercises/build.js';
import { checkExercise } from '../src/exercises/check.js';
import * as S from '../src/exercises/stretches.js';
import { BOX } from '../src/exercises/stepUp.js';

const model = await loadNodeModel();
const { rig } = model;
// Đo một tư thế tĩnh: trả về giá trị (min) của từng phép đo.
function measure(angles, base, checks) {
  const ex = { id: 'probe', duration: 0.1, ...base, keyframes: [{ time: 0, angles }, { time: 0.1, angles }], checks: checks.map((c) => ({ range: [-1e9, 1e9], at: 'start', ...c })) };
  const r = checkExercise(model, buildClip(ex, rig), ex);
  return Object.fromEntries(r.results.slice(0, checks.length).map((x) => [x.label, x.min]));
}
const jointPos = (angles, pin, key) => solvePose(rig, angles, pin).worldPos[rig.byKey[key]];
function solve1(f, lo, hi, it = 24) { let flo = f(lo); for (let i = 0; i < it; i++) { const m = (lo + hi) / 2, fm = f(m); if (Math.sign(fm) === Math.sign(flo)) { lo = m; flo = fm; } else hi = m; } return (lo + hi) / 2; }
const r1 = (x) => Math.round(x * 10) / 10;
const fwdOf = (p) => p.x * rig.fwd.x + p.z * rig.fwd.z;
const which = process.argv[2];

if (which === 'step') {
  const LF = ['LeftFoot', 'LeftToeBase', 'LeftToe_End'];
  const sole = (a) => measure(a, { pin: 'Right' }, [{ label: 's', bones: LF }]).s;
  const base = { Hips: 10, LeftUpLeg: 110 };
  const K = solve1((k) => sole({ ...base, LeftLeg: k }) - (BOX.height + 0.002), 100, 140);
  const place = { ...base, LeftLeg: r1(K) };
  const ank = jointPos(place, 'Right', 'LeftFoot');
  const P = (k) => rig.joints[rig.byKey[k]].restWorldPos;
  const mid = P('LeftFoot').clone().add(P('RightFoot')).multiplyScalar(0.5);
  console.log('place', place, 'sole', sole(place).toFixed(4), 'ankle forward from feet midpoint', (fwdOf(ank) - fwdOf(mid)).toFixed(3));
}
if (which === 'hip') {
  const near = [{ label: 'k', near: { joint: 'RightLeg', radius: 0.11 } }];
  const clear = (a) => measure(a, { pinnedFoot: 'Left' }, near).k;
  const kneelK = solve1((k) => clear({ ...S.kneel, LeftLeg: k }) - 0.004, 80, 150);
  const kneel = { ...S.kneel, LeftLeg: r1(kneelK) };
  const kneePos = jointPos(kneel, 'Left', 'RightLeg');
  console.log('kneel LeftLeg', r1(kneelK), 'clear', clear(kneel).toFixed(4));
  const Kfor = (U) => solve1((k) => clear({ ...S.kneelStretch, LeftUpLeg: U, LeftLeg: k }) - 0.004, 70, 160, 18);
  const U = solve1((u) => fwdOf(jointPos({ ...S.kneelStretch, LeftUpLeg: u, LeftLeg: Kfor(u) }, 'Left', 'RightLeg')) - fwdOf(kneePos), 40, 100, 16);
  const st = { ...S.kneelStretch, LeftUpLeg: r1(U), LeftLeg: r1(Kfor(U)) };
  console.log('stretch LeftUpLeg', st.LeftUpLeg, 'LeftLeg', st.LeftLeg, 'clear', clear(st).toFixed(4),
    'knee slide', jointPos(st, 'Left', 'RightLeg').distanceTo(kneePos).toFixed(4));
}
if (which === 'ham') {
  const heel = (a) => measure(a, { pinnedFoot: 'Right' }, [{ label: 'h', bones: ['LeftFoot'] }]).h;
  const RK = solve1((k) => heel({ ...S.hamstringPose, RightLeg: k }) - 0.003, 5, 100);
  const pose = { ...S.hamstringPose, RightLeg: r1(RK) };
  console.log('ham RightLeg', r1(RK), 'heel', heel(pose).toFixed(4));
}
if (which === 'calf') {
  const foot = (a) => measure(a, { pinnedFoot: 'Right' }, [{ label: 'f', bones: ['LeftFoot', 'LeftToeBase', 'LeftToe_End'] }]).f;
  const K = solve1((k) => foot({ ...S.calfPose, LeftLeg: k }) - 0.002, 40, 120);
  console.log('calf LeftLeg', r1(K), 'foot', foot({ ...S.calfPose, LeftLeg: r1(K) }).toFixed(4));
}
if (which === 'path') {
  // Tìm đường nhấc chân lên bục (tuck → lift → place) không xuyên bục, chỉ đoạn A.
  const { BOX: B } = await import('../src/exercises/stepUp.js');
  const place = { LeftUpLeg: 110, LeftLeg: 121.2, Hips: 10 };
  const depthOf = (tuck, lift) => {
    const ex = { id: 'p', duration: 0.9, pin: 'Right', props: [{ type: 'box', ...B }], keyframes: [
      { time: 0, angles: {} }, { time: 0.25, angles: tuck }, { time: 0.5, angles: lift }, { time: 0.9, angles: place }], checks: [] };
    const r = checkExercise(model, buildClip(ex, rig), ex);
    return -r.results.find((x) => x.label.startsWith('Không xuyên vào bục')).min;
  };
  let best = null;
  for (const u1 of [15, 30]) for (const k1 of [80, 100]) for (const u2 of [100, 120]) for (const k2 of [130, 145]) {
    const tuck = { LeftUpLeg: u1, LeftLeg: k1, LeftFoot: -10, Hips: 4 };
    const lift = { LeftUpLeg: u2, LeftLeg: k2, LeftFoot: -10, Hips: 6 };
    const d = depthOf(tuck, lift);
    if (!best || d < best.d) best = { d, tuck, lift };
    if (d <= 0.001) { console.log('OK', d.toFixed(4), JSON.stringify(tuck), JSON.stringify(lift)); }
  }
  console.log('best', best.d.toFixed(4), JSON.stringify(best.tuck), JSON.stringify(best.lift));
}
