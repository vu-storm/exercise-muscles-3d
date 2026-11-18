// model.js — Tải GLB, gán vật liệu, chụp tư thế đứng (rig) và quản lý các clip động tác.

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { boneKey } from './muscles.js';
import { createRig } from './exercises/build.js';

export async function loadModel(url, material, onProgress) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder); // lưới nén meshopt
  const gltf = await loader.loadAsync(url, (e) => {
    if (onProgress && e.total) onProgress(e.loaded / e.total);
  });
  const root = gltf.scene;

  let mesh = null;
  root.traverse((o) => {
    if (o.isSkinnedMesh) mesh = o;
  });
  if (!mesh) throw new Error('Không tìm thấy SkinnedMesh trong GLB');

  dequantize(mesh.geometry);
  mesh.material = material;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false; // bounding box tĩnh không theo animation

  // Tra xương theo tên rút gọn: bones.LeftUpLeg, bones.Hips ...
  const bones = {};
  mesh.skeleton.bones.forEach((b) => (bones[boneKey(b.name)] = b));

  // Chụp tư thế đứng TRƯỚC khi mixer chạy — làm mốc cho động tác dựng bằng góc khớp.
  const rig = createRig(root, mesh.skeleton);

  return {
    root,
    mesh,
    bones,
    rig,
    mixer: new THREE.AnimationMixer(root),
  };
}

/** Phát nhiều clip trên cùng một mixer, chuyển mượt bằng cross-fade. */
export class ExercisePlayer {
  constructor(model) {
    this.model = model;
    this.entries = new Map(); // id → { action, clip, minY, maxY }
    this.current = null;
    this.paused = false;
    this.speed = 1;
    this._tmp = new THREE.Vector3();
    // Hộp bao lúc đứng yên (chưa chọn động tác) — tạo khi xương còn ở tư thế gốc.
    model.root.updateMatrixWorld(true);
    this.restBounds = new THREE.Box3();
    for (const b of model.mesh.skeleton.bones) this.restBounds.expandByPoint(b.getWorldPosition(this._tmp));
  }

  // Tạm dừng / tốc độ đặt trên từng action (không trên mixer), để thời gian của mixer
  // vẫn trôi và cross-fade luôn chạy hết kể cả khi đang dừng.
  _applyState(action) {
    action.paused = this.paused;
    action.timeScale = this.speed;
  }
  setPaused(p) {
    this.paused = p;
    for (const e of this.entries.values()) e.action.paused = p;
  }
  setSpeed(s) {
    this.speed = s;
    for (const e of this.entries.values()) e.action.timeScale = s;
  }

  /**
   * Thêm clip. Lấy mẫu cả clip để:
   *  • chuẩn hoá biên độ 0..1 theo độ cao Hips (peak 'low': 1 khi Hips thấp nhất — squat, lunge;
   *    peak 'high': 1 khi Hips cao nhất — glute bridge);
   *  • tính hộp bao các khớp để camera đóng khung đúng động tác (đứng hay nằm).
   */
  add(id, clip, { peak = 'low' } = {}) {
    const { mixer, root, mesh } = this.model;
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);

    // Lấy mẫu bằng mixer tạm để không làm dừng động tác đang phát (clip dựng lúc cần);
    // lưu rồi trả lại tư thế xương hiện tại để mô hình không bị giật (nhất là khi đứng yên).
    const restore = saveBonePose(mesh.skeleton.bones);
    const tmpMixer = new THREE.AnimationMixer(root);
    const probe = tmpMixer.clipAction(clip);
    probe.play();
    let minY = Infinity, maxY = -Infinity;
    const bounds = new THREE.Box3();
    const N = Math.max(90, Math.round(clip.duration * 30));
    for (let i = 0; i <= N; i++) {
      probe.time = (clip.duration * i) / N;
      tmpMixer.update(0);
      root.updateMatrixWorld(true);
      const y = this._hipsY();
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      if (i % 6 === 0) for (const b of mesh.skeleton.bones) bounds.expandByPoint(b.getWorldPosition(this._tmp));
    }
    probe.stop();
    tmpMixer.uncacheRoot(root);
    restore();
    this.entries.set(id, { action, clip, minY, maxY, peak, bounds });
  }

  /** Chuyển sang động tác `id`, cross-fade trong `fade` giây. */
  play(id, fade = 0.3) {
    const next = this.entries.get(id);
    if (!next || next === this.current) return;
    next.action.reset().setEffectiveWeight(1).play();
    this._applyState(next.action);
    if (this.current && fade > 0) {
      this.current.action.crossFadeTo(next.action, fade, false);
    } else if (this.current) {
      this.current.action.stop();
    } else if (fade > 0) {
      next.action.fadeIn(fade); // từ tư thế đứng yên chuyển dần vào động tác
    }
    this.current = next;
  }

  /** Về tư thế đứng yên: động tác hiện tại mờ dần (mixer trộn với tư thế gốc). */
  stop(fade = 0.3) {
    if (!this.current) return;
    if (fade > 0) this.current.action.fadeOut(fade);
    else this.current.action.stop();
    this.current = null;
  }

  update(dt) {
    this.model.mixer.update(dt);
  }

  get duration() {
    return this.current?.clip.duration ?? 0;
  }
  get time() {
    return this.current?.action.time ?? 0;
  }
  /** Tua tới thời điểm t của động tác hiện tại. */
  seek(t) {
    if (!this.current) return;
    this.current.action.time = t;
    this.model.mixer.update(0);
  }

  _hipsY() {
    return this.model.bones.Hips.getWorldPosition(this._tmp).y;
  }
  /** Biên độ 0..1 của động tác hiện tại: 0 ở tư thế đầu, 1 ở điểm đỉnh (xem `add`). */
  depth() {
    const c = this.current;
    if (!c) return 0;
    if (c.peak === 'none') return 1; // giữ tĩnh / bài chạy: cơ làm việc suốt động tác
    const range = c.maxY - c.minY;
    if (range <= 1e-6) return 0;
    const y = this._hipsY();
    const d = c.peak === 'high' ? (y - c.minY) / range : (c.maxY - y) / range;
    return THREE.MathUtils.clamp(d, 0, 1);
  }

  /** Hộp bao các khớp của động tác hiện tại (để đóng khung camera). */
  get bounds() {
    return this.current?.bounds ?? this.restBounds;
  }

  /** Hướng "ra trước" của người (mặt phẳng ngang) — lấy từ rig lúc đứng. */
  forward() {
    return this.model.rig.fwd.clone();
  }
}

/**
 * File GLB được lượng tử hoá (npm run model): vị trí/pháp tuyến/trọng số là số nguyên chuẩn hoá.
 * Đổi lại sang Float32 để các phép tính trên CPU (vùng cơ, kiểm tra) đọc thẳng mảng như trước.
 */
export function dequantize(geometry) {
  for (const [name, attr] of Object.entries(geometry.attributes)) {
    if (!attr.normalized) continue;
    const out = new Float32Array(attr.count * attr.itemSize);
    for (let i = 0; i < attr.count; i++)
      for (let k = 0; k < attr.itemSize; k++) out[i * attr.itemSize + k] = attr.getComponent(i, k);
    geometry.setAttribute(name, new THREE.BufferAttribute(out, attr.itemSize));
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
}

/** Lưu vị trí/quay/tỉ lệ cục bộ của các xương; trả về hàm khôi phục. */
export function saveBonePose(bones) {
  const saved = bones.map((b) => [b.position.clone(), b.quaternion.clone(), b.scale.clone()]);
  return () =>
    bones.forEach((b, i) => {
      b.position.copy(saved[i][0]);
      b.quaternion.copy(saved[i][1]);
      b.scale.copy(saved[i][2]);
    });
}
