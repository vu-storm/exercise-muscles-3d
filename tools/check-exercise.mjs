// Kiểm tra động tác trong Node (không cần trình duyệt):
//   npm run check            → kiểm tra mọi động tác có khai báo `checks`
//   npm run check -- lunge   → chỉ một động tác
import fs from 'fs';
import { pathToFileURL } from 'url';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { EXERCISES } from '../src/exercises/index.js';
import { createRig, buildClip, shortName } from '../src/exercises/build.js';
import { checkExercise, printCheck } from '../src/exercises/check.js';
import { dequantize } from '../src/model.js';

export async function loadNodeModel(file = new URL('../public/ecorche.glb', import.meta.url)) {
  const buf = fs.readFileSync(file);
  await MeshoptDecoder.ready;
  const gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength), '');
  let mesh;
  gltf.scene.traverse((o) => { if (o.isSkinnedMesh) mesh = o; });
  dequantize(mesh.geometry);
  const bones = Object.fromEntries(mesh.skeleton.bones.map((b) => [shortName(b.name), b]));
  const rig = createRig(gltf.scene, mesh.skeleton);
  return { root: gltf.scene, mesh, bones, rig, mixer: new THREE.AnimationMixer(gltf.scene) };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const only = process.argv[2];
  const model = await loadNodeModel();
  let allOk = true;
  for (const ex of EXERCISES) {
    if (!ex.checks || (only && ex.id !== only)) continue;
    const r = checkExercise(model, buildClip(ex, model.rig), ex);
    printCheck(r);
    allOk &&= r.ok;
  }
  process.exit(allOk ? 0 : 1);
}
