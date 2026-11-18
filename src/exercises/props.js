// props.js — Đạo cụ của động tác (bục, tạ ấm…). Khai báo trong dữ liệu động tác:
//
//   props: [
//     { type: 'box', forward: 0.45, left: 0, width: 0.6, depth: 0.4, height: 0.5 },
//     { type: 'kettlebell', between: ['LeftHand', 'RightHand'], down: 0.1, radius: 0.09 },
//   ]
//
// • box: hộp đặt trên sàn; tâm mặt đáy = giữa hai cổ chân lúc đứng dời `forward`/`left` mét
//   (theo hướng người). check.js kiểm tra không đỉnh nào xuyên vào hộp.
// • kettlebell: chỉ để minh hoạ — bám giữa hai khớp `between`, thấp hơn `down` mét (âm = cao hơn).
//   `grip: 'bell'` = hai lòng bàn tay ôm thân tạ, quai chúc xuống (goblet); mặc định cầm quai.

import * as THREE from 'three';

/** Hình học các hộp (dùng chung cho kiểm tra và hiển thị). */
export function propBoxes(exercise, rig) {
  const P = (k) => rig.joints[rig.byKey[k]].restWorldPos;
  const base = P('LeftFoot').clone().add(P('RightFoot')).multiplyScalar(0.5).setY(0);
  return (exercise.props ?? [])
    .filter((p) => p.type === 'box')
    .map((p) => ({
      center: base.clone().addScaledVector(rig.fwd, p.forward ?? 0).addScaledVector(rig.left, p.left ?? 0),
      top: p.height,
      halfDepth: p.depth / 2,
      halfWidth: p.width / 2,
      spec: p,
    }));
}

/**
 * Tạo các đối tượng 3D cho đạo cụ của một động tác.
 * @returns {{ group: THREE.Group, update(bones): void }}
 */
export function createProps(exercise, rig) {
  const group = new THREE.Group();
  const followers = [];

  for (const b of propBoxes(exercise, rig)) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(b.halfWidth * 2, b.top, b.halfDepth * 2),
      new THREE.MeshStandardMaterial({ color: 0xc9b79c, roughness: 0.9 })
    );
    mesh.position.copy(b.center).setY(b.top / 2);
    mesh.lookAt(mesh.position.clone().add(rig.fwd)); // trục z của hộp theo hướng người
    mesh.castShadow = mesh.receiveShadow = true;
    const edges = new THREE.LineSegments(
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: 0x8a7a62 })
    );
    mesh.add(edges);
    group.add(mesh);
  }

  for (const p of exercise.props ?? []) {
    if (p.type !== 'kettlebell') continue;
    const r = p.radius ?? 0.09;
    const mat = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.45, metalness: 0.6 });
    const bell = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), mat);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(r * 0.62, r * 0.14, 12, 32, Math.PI), mat);
    handle.position.y = r * 0.75;
    if (p.grip === 'bell') {
      handle.rotation.z = Math.PI; // quai chúc xuống
      handle.position.y = -r * 0.75;
    }
    body.castShadow = handle.castShadow = true;
    bell.add(body, handle);
    group.add(bell);
    const a = new THREE.Vector3(), c = new THREE.Vector3();
    followers.push((bones) => {
      bones[p.between[0]].getWorldPosition(a);
      bones[p.between[1]].getWorldPosition(c);
      bell.position.copy(a).add(c).multiplyScalar(0.5);
      bell.position.y -= p.down ?? r;
      // tay cầm nằm ngang, song song với đường nối hai tay
      const dir = c.sub(a).setY(0);
      if (dir.lengthSq() > 1e-6) bell.rotation.y = Math.atan2(dir.x, dir.z) - Math.PI / 2;
    });
  }

  return { group, update: (bones) => followers.forEach((f) => f(bones)) };
}
