// angles.js — Đo góc gối / góc hông (cả hai chân) từ vị trí thế giới của xương
// và vẽ cung góc gối cho cả hai gối khi tạm dừng.

import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { measureJointAngles } from './jointAngles.js';

const DEG = 180 / Math.PI;
const ARC_SEGMENTS = 32;
const ARC_RADIUS = 0.13;
const SIDE_LABEL = { Left: 'trái', Right: 'phải' };
const SIDE_COLOR = { Left: 0xf1c40f, Right: 0x48c9b0 };


/** Cung + hình quạt + hai cạnh + nhãn cho một gối. Vẽ đè lên mô hình (depthTest: false). */
class KneeArc {
  constructor(side, parent) {
    this.side = side;
    const color = SIDE_COLOR[side];
    this.group = new THREE.Group();
    parent.add(this.group);

    const lineMat = (c, opacity = 1) =>
      new THREE.LineBasicMaterial({ color: c, depthTest: false, transparent: true, opacity });

    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_SEGMENTS + 1) * 3), 3));
    this.arc = new THREE.Line(arcGeo, lineMat(color));

    const fanGeo = new THREE.BufferGeometry();
    fanGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array((ARC_SEGMENTS + 2) * 3), 3));
    const idx = [];
    for (let i = 1; i <= ARC_SEGMENTS; i++) idx.push(0, i, i + 1);
    fanGeo.setIndex(idx);
    this.fan = new THREE.Mesh(
      fanGeo,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.35, depthTest: false, side: THREE.DoubleSide })
    );

    const legGeo = new THREE.BufferGeometry();
    legGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    this.legLines = new THREE.Line(legGeo, lineMat(0xffffff, 0.95));

    for (const o of [this.fan, this.arc, this.legLines]) {
      o.renderOrder = 10;
      o.frustumCulled = false;
    }

    // Nhãn lồng trong một div bọc: CSS2DRenderer ghi đè transform của div ngoài, còn div trong
    // được dịch lên/xuống theo bên để hai nhãn không chồng nhau.
    const wrap = document.createElement('div');
    this.labelEl = document.createElement('div');
    this.labelEl.className = `angle-label angle-${side.toLowerCase()}`;
    wrap.appendChild(this.labelEl);
    this.label = new CSS2DObject(wrap);
    this.group.add(this.fan, this.arc, this.legLines, this.label);
  }

  setVisible(v) {
    this.group.visible = v;
    this.label.visible = v; // CSS2DRenderer không kế thừa visible của cha
  }

  update(bones) {
    const s = this.side;
    const knee = bones[s + 'Leg'].getWorldPosition(new THREE.Vector3());
    const hip = bones[s + 'UpLeg'].getWorldPosition(new THREE.Vector3());
    const ankle = bones[s + 'Foot'].getWorldPosition(new THREE.Vector3());

    const u = hip.sub(knee);
    const v = ankle.sub(knee);
    const thighLen = u.length();
    const shinLen = v.length();
    u.normalize();
    v.normalize();
    const angle = u.angleTo(v);
    // Trục vuông góc với u trong mặt phẳng (u, v)
    const perp = v.clone().addScaledVector(u, -u.dot(v));
    if (perp.lengthSq() < 1e-10) perp.set(0, 0, 1).cross(u);
    perp.normalize();

    const arcPos = this.arc.geometry.attributes.position;
    const fanPos = this.fan.geometry.attributes.position;
    fanPos.setXYZ(0, knee.x, knee.y, knee.z);
    const p = new THREE.Vector3();
    for (let i = 0; i <= ARC_SEGMENTS; i++) {
      const t = (angle * i) / ARC_SEGMENTS;
      p.copy(knee).addScaledVector(u, ARC_RADIUS * Math.cos(t)).addScaledVector(perp, ARC_RADIUS * Math.sin(t));
      arcPos.setXYZ(i, p.x, p.y, p.z);
      fanPos.setXYZ(i + 1, p.x, p.y, p.z);
    }
    arcPos.needsUpdate = true;
    fanPos.needsUpdate = true;

    const legPos = this.legLines.geometry.attributes.position;
    const a = knee.clone().addScaledVector(u, Math.min(0.25, thighLen));
    const c = knee.clone().addScaledVector(v, Math.min(0.25, shinLen));
    legPos.setXYZ(0, a.x, a.y, a.z);
    legPos.setXYZ(1, knee.x, knee.y, knee.z);
    legPos.setXYZ(2, c.x, c.y, c.z);
    legPos.needsUpdate = true;

    const mid = angle / 2;
    this.label.position
      .copy(knee)
      .addScaledVector(u, (ARC_RADIUS + 0.07) * Math.cos(mid))
      .addScaledVector(perp, (ARC_RADIUS + 0.07) * Math.sin(mid));
    this.labelEl.textContent = `Gối ${SIDE_LABEL[s]}: ${Math.round(angle * DEG)}°`;
  }
}

export class AngleTracker {
  constructor(bones, scene) {
    this.bones = bones;
    this.values = { kneeL: 180, kneeR: 180, hipL: 180, hipR: 180, align: 180 };
    this.group = new THREE.Group();
    scene.add(this.group);
    this.arcs = [new KneeArc('Left', this.group), new KneeArc('Right', this.group)];
    this.arcs.forEach((a) => a.setVisible(false));
  }

  /** Cập nhật số đo. Gọi sau khi mixer đã cập nhật xương trong khung hình. */
  update() {
    this.values = measureJointAngles(this.bones);
    return this.values;
  }

  /** Vẽ cung góc cho cả hai gối (chỉ khi `visible`). */
  updateArcs(visible) {
    for (const arc of this.arcs) {
      arc.setVisible(visible);
      if (visible) arc.update(this.bones);
    }
  }
}
