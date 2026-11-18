// Chuẩn bị file mô hình cho web từ file gốc xuất ra Blender:
//   npm run model -- <file gốc.glb>      (mặc định assets-src/ecorche_air_squat.glb)
//
// • Bỏ mọi animation (animation Mixamo không được phân phối lại; động tác dựng bằng code).
// • Sửa pháp tuyến lỗi: đỉnh có pháp tuyến lệch > 20° so với trung bình láng giềng
//   (lưới tạo tự động có vài trăm đỉnh như vậy → chấm tối li ti trên da) lấy pháp tuyến
//   trung bình của láng giềng; phần còn lại giữ nguyên để bề mặt vẫn mịn.
// • Nén lưới bằng meshopt (EXT_meshopt_compression) → file nhỏ hơn nhiều, tải nhanh trên điện thoại.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { prune, dedup, reorder, quantize, meshopt } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';
import fs from 'fs';

const input = process.argv[2] ?? 'assets-src/ecorche_air_squat.glb';
const output = process.argv[3] ?? 'public/ecorche.glb';
const MAX_DEVIATION = 12; // độ

await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder,
  'meshopt.encoder': MeshoptEncoder,
});
const doc = await io.read(input);
const root = doc.getRoot();

for (const anim of root.listAnimations()) {
  console.log(`bỏ animation: ${anim.getName()}`);
  anim.dispose();
}

for (const mesh of root.listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const normal = prim.getAttribute('NORMAL');
    const indices = prim.getIndices();
    if (!normal || !indices) continue;
    const n = normal.getArray();
    const idx = indices.getArray();
    const acc = new Float32Array(n.length);
    for (let t = 0; t < idx.length; t += 3) {
      for (let a = 0; a < 3; a++) {
        for (let b = 0; b < 3; b++) {
          if (a === b) continue;
          const i = idx[t + a] * 3, j = idx[t + b] * 3;
          acc[i] += n[j]; acc[i + 1] += n[j + 1]; acc[i + 2] += n[j + 2];
        }
      }
    }
    const cosMax = Math.cos((MAX_DEVIATION * Math.PI) / 180);
    let fixed = 0;
    for (let i = 0; i < n.length; i += 3) {
      const l = Math.hypot(acc[i], acc[i + 1], acc[i + 2]);
      if (!l) continue;
      const x = acc[i] / l, y = acc[i + 1] / l, z = acc[i + 2] / l;
      if (x * n[i] + y * n[i + 1] + z * n[i + 2] < cosMax) {
        n[i] = x; n[i + 1] = y; n[i + 2] = z;
        fixed++;
      }
    }
    normal.setArray(n);
    console.log(`sửa pháp tuyến: ${fixed} / ${n.length / 3} đỉnh`);
  }
}

await doc.transform(
  dedup(),
  prune(),
  reorder({ encoder: MeshoptEncoder }),
  quantize(),
  meshopt({ encoder: MeshoptEncoder, level: 'medium' }),
);
await io.write(output, doc);
const kb = (f) => (fs.statSync(f).size / 1024).toFixed(0) + ' KB';
console.log(`${input} (${kb(input)}) → ${output} (${kb(output)})`);
