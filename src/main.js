// main.js — Dựng cảnh, ánh sáng, camera và vòng lặp render.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { loadModel, ExercisePlayer } from './model.js';
import {
  buildMuscleAttribute, applyMuscleShader, setMuscleIntensity, muscleTargets, MUSCLE_CONFIG, MUSCLE_GROUPS, ATTR_COUNT,
} from './muscles.js';
import { EXERCISES, CATEGORIES } from './exercises/index.js';
import { buildClip, segmentValue } from './exercises/build.js';
import { createProps } from './exercises/props.js';
import { checkExercise, printCheck } from './exercises/check.js';
import { AngleTracker } from './angles.js';
import { createUI } from './ui.js';
import './style.css';

const BG = 0xe4e4e4;

// ---------- Renderer ----------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
document.body.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(window.innerWidth, window.innerHeight);
labelRenderer.domElement.className = 'label-layer';
document.body.appendChild(labelRenderer.domElement);

// ---------- Cảnh ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG);
scene.fog = new THREE.Fog(BG, 8, 18);

const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.05, 50);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 1.2;
controls.maxDistance = 9;
controls.maxPolarAngle = Math.PI * 0.53; // không chui xuống dưới sàn
const TARGET = new THREE.Vector3(0, 0.8, 0);
controls.target.copy(TARGET);

// Ánh sáng studio mềm
scene.add(new THREE.HemisphereLight(0xffffff, 0xb8b2a8, 1.1));

const key = new THREE.DirectionalLight(0xfff6ec, 2.4);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
// Hộp bóng đủ rộng cho cả tư thế nằm (người dài ~1,8 m trên sàn).
key.shadow.camera.left = -2.2;
key.shadow.camera.right = 2.2;
key.shadow.camera.top = 2.6;
key.shadow.camera.bottom = -1.4;
key.shadow.camera.near = 0.5;
key.shadow.camera.far = 12;
key.shadow.bias = -0.0004;
key.shadow.normalBias = 0.02;
key.shadow.radius = 5;
scene.add(key, key.target);

const rim = new THREE.DirectionalLight(0xdfe8ff, 1.3);
scene.add(rim, rim.target);

// Sàn nhận bóng
const floor = new THREE.Mesh(
  new THREE.CircleGeometry(12, 64),
  new THREE.MeshStandardMaterial({ color: 0xd9d9d9, roughness: 1 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// ---------- Vật liệu đất sét ----------
const clay = new THREE.MeshStandardMaterial({ color: 0x9a9a9a, roughness: 0.85, metalness: 0, flatShading: false });
const muscleUniforms = applyMuscleShader(clay);

// ---------- Camera presets (tính theo hướng nhìn của người) ----------
let forward = new THREE.Vector3(0, 0, 1);
let viewDist = 3.4;
let currentView = 'threeQuarter';
function viewPosition(name) {
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
  let dir;
  if (name === 'front') dir = forward.clone();
  else if (name === 'side') dir = right.clone().negate(); // nhìn từ bên trái người tập
  else dir = forward.clone().multiplyScalar(Math.cos(0.7)).addScaledVector(right, -Math.sin(0.7)); // chéo 3/4
  dir.normalize();
  return TARGET.clone().addScaledVector(dir, viewDist).add(new THREE.Vector3(0, 0.35, 0));
}

let camTween = null;
function goToView(name, instant = false) {
  currentView = name;
  const to = viewPosition(name);
  if (instant) {
    camera.position.copy(to);
    controls.target.copy(TARGET);
    controls.update();
    return;
  }
  camTween = { from: camera.position.clone(), fromT: controls.target.clone(), to, t: 0 };
}

function placeLights() {
  const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0));
  // Đèn chính: phía trước–trái–cao; đèn hắt: phía sau–phải.
  key.position.copy(forward).multiplyScalar(2.5).addScaledVector(right, -2.2).setY(4.2);
  rim.position.copy(forward).multiplyScalar(-3).addScaledVector(right, 2).setY(2.6);
  key.position.add(TARGET).sub(new THREE.Vector3(0, 0.8, 0)).setY(4.2);
  rim.position.add(TARGET).sub(new THREE.Vector3(0, 0.8, 0)).setY(2.6);
  key.target.position.copy(TARGET);
  rim.target.position.copy(TARGET).setY(TARGET.y + 0.2);
}

/** Đóng khung camera theo hộp bao các khớp của động tác (đứng hay nằm). */
function frameExercise(bounds) {
  const c = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  TARGET.set(c.x, THREE.MathUtils.clamp(c.y, 0.3, 0.85), c.z);
  viewDist = Math.max(3.0, size.length() * 1.65);
  placeLights();
}

// ---------- Tải mô hình ----------
const params = new URLSearchParams(location.search);
const loadingEl = document.getElementById('loading');
const model = await loadModel(`${import.meta.env.BASE_URL}ecorche_air_squat.glb`, clay, (p) => {
  loadingEl.textContent = `Đang tải mô hình… ${Math.round(p * 100)}%`;
});
const seg = buildMuscleAttribute(model.mesh);
console.info('[muscles] số đỉnh >50% mỗi nhóm:', seg.stats);
scene.add(model.root);

// ---------- Động tác (dựng clip khi cần lần đầu) ----------
const player = new ExercisePlayer(model);
const byId = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));
const catOf = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const clips = new Map();
const propsOf = new Map();
function ensureExercise(ex) {
  if (clips.has(ex.id)) return clips.get(ex.id);
  const clip = ex.source === 'glb' ? model.glbClip : buildClip(ex, model.rig);
  clips.set(ex.id, clip);
  player.add(ex.id, clip, { peak: ex.peak });
  const props = createProps(ex, model.rig);
  props.group.visible = false;
  scene.add(props.group);
  propsOf.set(ex.id, props);
  return clip;
}

// Mặc định mô hình đứng yên (exercise = null); chỉ chuyển động khi người dùng chọn động tác.
let exercise = byId[params.get('ex')] ?? null;
if (exercise) {
  ensureExercise(exercise);
  player.play(exercise.id, 0);
  propsOf.get(exercise.id).group.visible = true;
}
loadingEl.remove();

forward = player.forward();
frameExercise(player.bounds);

const angles = new AngleTracker(model.bones, scene);

let playing = true;
let enabled = {};
// Độ đậm nhóm cơ và màu (co = đỏ, giãn = xanh) chuyển mượt khi đổi động tác / đổi đoạn.
const MUSCLE_FADE = 0.3;
let musclesSpec = null;
let muscleTarget = new Float32Array(ATTR_COUNT * 4);
const muscleNow = new Float32Array(ATTR_COUNT * 4);
const colorOf = (ex) =>
  new THREE.Color(catOf[ex?.category]?.kind === 'stretch' ? MUSCLE_CONFIG.colors.stretch : MUSCLE_CONFIG.colors.work);
let colorTarget = colorOf(exercise);
muscleUniforms.uMuscleColor.value.copy(colorTarget);
const refreshMuscles = () => (muscleTarget = muscleTargets(musclesSpec, enabled));

/** Chọn động tác theo id; id rỗng = về tư thế đứng yên. */
function selectExercise(id, fade = 0.3) {
  const prev = exercise;
  exercise = byId[id] ?? null;
  if (prev) propsOf.get(prev.id).group.visible = false;
  if (exercise) {
    ensureExercise(exercise);
    player.play(id, fade);
    propsOf.get(id).group.visible = true;
  } else {
    player.stop(fade);
  }
  ui.setExercise(exercise, player.duration);
  frameExercise(player.bounds);
  const view = exercise?.view ?? currentView; // góc nhìn gợi ý của động tác (nếu có)
  ui.setView(view);
  goToView(view);
  colorTarget = colorOf(exercise);
  musclesSpec = null; // tính lại ở khung tới
}

const ui = createUI({
  categories: CATEGORIES,
  exercises: EXERCISES,
  initial: exercise,
  onExercise: (id) => selectExercise(id),
  onPlayToggle: (p) => {
    playing = p;
    player.setPaused(!p);
  },
  onSpeed: (s) => player.setSpeed(s),
  onSeek: (t) => player.seek(t),
  onView: (v) => goToView(v),
  onMuscles: (e) => {
    enabled = e;
    refreshMuscles();
  },
});
ui.setExercise(exercise, player.duration);

// Tham số URL (minh hoạ / chụp ảnh): ?ex=lunge&t=1&view=side&ui=0&force=glutes
const initialView = params.get('view') ?? exercise?.view ?? 'threeQuarter';
ui.setView(initialView);
goToView(initialView, true);
if (params.has('t')) {
  ui.setPlaying(false);
  player.seek(parseFloat(params.get('t')));
}
if (params.get('ui') === '0') ui.hide();

/** Tô cố định một nhóm (hoặc 'all') ở độ đậm tối đa — để kiểm tra vùng cơ. */
function forceChannels(arg) {
  if (!arg) return null;
  if (arg instanceof Float32Array || Array.isArray(arg)) return arg;
  const out = new Float32Array(ATTR_COUNT * 4);
  MUSCLE_GROUPS.forEach((g, k) => {
    if (arg === 'all' || arg.split(',').includes(g.key)) out[k * 2] = out[k * 2 + 1] = 1;
  });
  return out;
}

// ---------- Vòng lặp ----------
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);

  player.update(dt); // tạm dừng/tốc độ nằm ở từng action nên cross-fade vẫn chạy hết khi dừng
  model.root.updateMatrixWorld(true);
  if (exercise) propsOf.get(exercise.id).update(model.bones);

  if (camTween) {
    camTween.t = Math.min(1, camTween.t + dt / 0.7);
    const e = camTween.t * camTween.t * (3 - 2 * camTween.t);
    camera.position.lerpVectors(camTween.from, camTween.to, e);
    controls.target.lerpVectors(camTween.fromT, TARGET, e);
    if (camTween.t >= 1) camTween = null;
  }
  controls.update();

  // Nhóm cơ theo đoạn hiện tại (vd. lunge đổi chân → đổi bên).
  const spec = exercise ? segmentValue(exercise, player.time, 'muscles') ?? exercise.muscles : null;
  if (spec !== musclesSpec) {
    musclesSpec = spec;
    refreshMuscles();
  }
  const k = Math.min(1, (dt / MUSCLE_FADE) * 3);
  for (let i = 0; i < muscleNow.length; i++) muscleNow[i] += (muscleTarget[i] - muscleNow[i]) * k;
  muscleUniforms.uMuscleColor.value.lerp(colorTarget, k);
  const depth = player.depth();
  const force = forceChannels(window.__squat?.forceIntensity ?? params.get('force'));
  setMuscleIntensity(muscleUniforms, force ? 1 : depth, force ?? muscleNow);

  ui.setTime(player.time);
  ui.setDepth(depth);
  ui.setAngles(angles.update());
  angles.updateArcs(!playing);

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  labelRenderer.setSize(window.innerWidth, window.innerHeight);
});

// ---------- Tự kiểm tra (chỉ khi chạy dev; tắt bằng ?check=0) ----------
// Chạy nền sau khi trang đã hiện, mỗi động tác một lượt, dùng mixer riêng nên không ảnh hưởng
// động tác đang phát. Đầy đủ hơn: `npm run check`.
if (import.meta.env.DEV && params.get('check') !== '0') {
  const queue = EXERCISES.filter((e) => e.checks);
  const runNext = () => {
    const ex = queue.shift();
    if (!ex) return;
    const t0 = performance.now();
    printCheck(checkExercise(model, ensureExercise(ex), ex));
    console.info(`[kiểm tra] ${ex.id}: ${(performance.now() - t0).toFixed(0)} ms`);
    setTimeout(runNext, 150);
  };
  setTimeout(runNext, 1500);
}

// Hỗ trợ kiểm thử / gỡ lỗi từ console
window.__squat = { model, player, angles, seg, camera, controls, checkExercise, buildClip, EXERCISES, selectExercise };
