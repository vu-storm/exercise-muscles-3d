// compose.js — Ghép, đảo chiều và lật đối xứng động tác.
//
//   mirror(part, label)       đổi trái ↔ phải: tên khớp, điểm ghim, điểm tựa, nhóm cơ (.L ↔ .R),
//                             đạo cụ, các phép kiểm tra (khớp, xương, góc kneeL ↔ kneeR…)
//   reverse(part, label)      phát ngược thời gian (vd. bước xuống bục = bước lên đảo ngược);
//                             điểm ghim / nhóm cơ của mỗi đoạn được giữ đúng với đoạn đó
//   sequence(info, parts)     nối các đoạn liên tiếp thành một động tác (vd. lunge chân trái
//                             rồi chân phải). Mỗi đoạn mang theo điểm ghim và nhóm cơ riêng;
//                             mốc nối giữa hai đoạn phải là cùng một tư thế.
//   repeat(part, n)           lặp một đoạn n lần

const swapSide = (s) =>
  typeof s === 'string' ? s.replace(/^(Left|Right)/, (m) => (m === 'Left' ? 'Right' : 'Left')) : s;
const swapMuscle = (m) => m.replace(/\.(L|R)$/, (x) => (x === '.L' ? '.R' : '.L'));
const swapAngleKey = (a) => a?.replace(/(L|R)$/, (x) => (x === 'L' ? 'R' : 'L'));

function mirrorAngles(angles = {}) {
  return Object.fromEntries(
    Object.entries(angles).map(([k, v]) => {
      // Hips không có bên: nghiêng sang bên (adduct) phải đổi dấu.
      if (k === 'Hips' && typeof v === 'object' && v.adduct) v = { ...v, adduct: -v.adduct };
      return [swapSide(k), v];
    })
  );
}
function mirrorPin(p) {
  if (p == null) return p;
  if (Array.isArray(p)) return p.map(mirrorPin);
  if (typeof p === 'string') return p === 'Both' ? p : swapSide(p);
  return { ...p, joint: swapSide(p.joint), ...(p.left ? { left: -p.left } : {}) };
}
function mirrorMuscles(m) {
  if (!m) return m;
  return Object.fromEntries(Object.entries(m).map(([lvl, list]) => [lvl, list.map(swapMuscle)]));
}
function mirrorCheck(c) {
  const out = { ...c };
  if (c.near) out.near = { ...c.near, joint: swapSide(c.near.joint) };
  if (c.bones) out.bones = c.bones.map(swapSide);
  if (c.angle && !['align', 'line'].includes(c.angle)) out.angle = swapAngleKey(c.angle);
  if (c.slide) out.slide = swapSide(c.slide);
  if (c.jointY) out.jointY = swapSide(c.jointY);
  return out;
}
function mirrorSupport(s) {
  if (!s) return s;
  const out = { ...s, joint: swapSide(s.joint) };
  if (s.axis === 'roll' && s.range) out.range = s.range.map((x) => -x);
  return out;
}
const mirrorProp = (p) => ({ ...p, ...(p.left ? { left: -p.left } : {}), ...(p.between ? { between: p.between.map(swapSide) } : {}) });

/** Bản đối xứng trái ↔ phải của một đoạn động tác. */
export function mirror(part, label) {
  return {
    ...part,
    label: label ?? part.label,
    pin: mirrorPin(part.pin),
    pinnedFoot: mirrorPin(part.pinnedFoot),
    support: mirrorSupport(part.support),
    muscles: mirrorMuscles(part.muscles),
    props: part.props?.map(mirrorProp),
    keyframes: part.keyframes.map((kf) => ({
      ...kf,
      angles: mirrorAngles(kf.angles),
      ...(kf.pin !== undefined ? { pin: mirrorPin(kf.pin) } : {}),
      ...(kf.pinnedFoot !== undefined ? { pinnedFoot: mirrorPin(kf.pinnedFoot) } : {}),
      ...(kf.muscles ? { muscles: mirrorMuscles(kf.muscles) } : {}),
      ...(kf.support ? { support: mirrorSupport(kf.support) } : {}),
    })),
    checks: part.checks?.map(mirrorCheck),
  };
}

/** Phát ngược thời gian. Thông tin theo đoạn (pin, muscles) chuyển sang mốc mở đầu đoạn mới. */
export function reverse(part, label) {
  const kfs = part.keyframes;
  const D = part.duration;
  const active = (k, field) => {
    let v;
    for (let i = 0; i <= k; i++) {
      const x = field === 'pin' ? kfs[i].pin ?? kfs[i].pinnedFoot : kfs[i][field];
      if (x !== undefined) v = x;
    }
    return v ?? (field === 'pin' ? part.pin ?? part.pinnedFoot : part[field]);
  };
  const out = [];
  for (let j = kfs.length - 1; j >= 0; j--) {
    const kf = kfs[j];
    const { pin, pinnedFoot, muscles, ...rest } = kf;
    const k = { ...rest, time: +(D - kf.time).toFixed(4) };
    // Mốc này mở đầu khoảng tương ứng với khoảng gốc [j-1, j] → dùng thông tin của mốc j-1.
    if (j > 0) {
      k.pin = active(j - 1, 'pin');
      k.muscles = active(j - 1, 'muscles');
    }
    out.push(k);
  }
  return {
    ...part,
    label: label ?? part.label,
    keyframes: out,
    checks: part.checks?.map((c) => (typeof c.at === 'number' ? { ...c, at: +(D - c.at).toFixed(4) } : c)),
  };
}

/** Lặp một đoạn n lần (mốc cuối của lần trước trùng mốc đầu của lần sau). */
export const repeat = (part, n) => Array.from({ length: n }, () => part);

/**
 * Nối các đoạn thành một động tác. Thời gian của mỗi đoạn được dời tiếp nối nhau.
 * Kiểm tra có `at` là số được dời theo đoạn; nhãn được thêm tên đoạn (kiểm tra trùng
 * lặp — cùng nhãn, cùng điều kiện — chỉ giữ một).
 */
export function sequence(info, parts) {
  const keyframes = [];
  const checks = [];
  const seenChecks = new Set();
  let offset = 0;
  for (const part of parts) {
    part.keyframes.forEach((kf, i) => {
      const k = {
        ...kf,
        time: +(kf.time + offset).toFixed(4),
        // Mốc đầu đoạn mang điểm ghim / nhóm cơ của đoạn (áp dụng tới hết đoạn).
        ...(i === 0
          ? {
              // chỉ ghi khi đoạn có khai báo — không thì giữ cách ghim của động tác
              ...((kf.pin ?? kf.pinnedFoot ?? part.pin ?? part.pinnedFoot) !== undefined
                ? { pin: kf.pin ?? kf.pinnedFoot ?? part.pin ?? part.pinnedFoot }
                : {}),
              muscles: kf.muscles ?? part.muscles,
              ...(kf.support ?? part.support ? { support: kf.support ?? part.support } : {}),
            }
          : {}),
      };
      delete k.pinnedFoot;
      const last = keyframes[keyframes.length - 1];
      if (last && Math.abs(last.time - k.time) < 1e-6) keyframes[keyframes.length - 1] = k; // mốc nối
      else keyframes.push(k);
    });
    for (const c of part.checks ?? []) {
      // 'all' / 'start' của một đoạn chỉ áp dụng trong khoảng thời gian của đoạn đó.
      const at =
        typeof c.at === 'number'
          ? +(c.at + offset).toFixed(3)
          : c.at === 'all'
            ? [+offset.toFixed(3), +(offset + part.duration).toFixed(3)]
            : c.at === 'start'
              ? +offset.toFixed(3)
              : c.at;
      const label = part.label && c.at !== 'peak' ? `${c.label} — ${part.label}` : c.label;
      const sig = JSON.stringify({ ...c, at, label });
      if (seenChecks.has(sig)) continue;
      seenChecks.add(sig);
      checks.push({ ...c, at, label });
    }
    offset += part.duration;
  }
  const first = parts[0];
  return {
    ...info,
    duration: +offset.toFixed(4),
    pin: info.pin ?? first.pin ?? first.pinnedFoot,
    pinJoint: info.pinJoint ?? first.pinJoint,
    support: info.support ?? first.support,
    relativeFeet: info.relativeFeet ?? first.relativeFeet,
    props: info.props ?? first.props,
    muscles: first.muscles,
    keyframes,
    checks: [...checks, ...(info.checks ?? [])],
  };
}
