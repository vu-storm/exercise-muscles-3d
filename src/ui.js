// ui.js — Bảng điều khiển tiếng Việt ở góc phải.

import { musclesInSpec, MUSCLE_CONFIG } from './muscles.js';

const SIDE = { both: '', L: ' (trái)', R: ' (phải)' };
/** Khổ màn hình dùng bảng dạng thanh dưới đáy — phải khớp với @media trong style.css. */
export const SHEET_QUERY = '(max-width: 600px)';

/**
 * @param {object} opts
 * @param {{id,label,kind}[]} opts.categories          nhóm động tác (thứ tự hiển thị)
 * @param {{id,name,category}[]} opts.exercises        danh sách động tác
 * @param {object} opts.initial                        động tác ban đầu
 * @param {(id:string)=>void} opts.onExercise
 * @param {(playing:boolean)=>void} opts.onPlayToggle
 * @param {(speed:number)=>void} opts.onSpeed
 * @param {(time:number)=>void} opts.onSeek
 * @param {(view:string)=>void} opts.onView
 * @param {(enabled:object)=>void} opts.onMuscles
 */
export function createUI(opts) {
  const cats = Object.fromEntries(opts.categories.map((c) => [c.id, c]));
  const options = opts.categories
    .map((c) => {
      const items = opts.exercises.filter((e) => e.category === c.id);
      if (!items.length) return '';
      return `<optgroup label="${c.label}">${items
        .map((e) => `<option value="${e.id}">${e.name}</option>`)
        .join('')}</optgroup>`;
    })
    .join('');

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML = `
    <button class="sheet-toggle" data-id="sheetToggle" aria-expanded="false">▲ Chi tiết</button>
    <h1>Nhóm cơ hoạt động</h1>

    <section class="s-exercise">
      <select data-id="exercise" aria-label="Động tác">
        <option value="">— Tư thế đứng (chọn động tác) —</option>${options}
      </select>
      <div class="ex-info">
        <span class="badge" data-id="badge"></span>
        <p class="cue" data-id="cue"></p>
      </div>
    </section>

    <section class="s-controls">
      <div class="row row-play">
        <button class="btn primary" data-id="play" disabled>▶ Phát</button>
      </div>
      <div class="row seg" data-id="speed">
        <span class="lbl">Tốc độ</span>
        <button class="btn" data-speed="0.25">0.25x</button>
        <button class="btn" data-speed="0.5">0.5x</button>
        <button class="btn active" data-speed="1">1x</button>
      </div>
      <div class="row">
        <input type="range" data-id="seek" min="0" max="1" step="0.001" value="0" aria-label="Tua" />
        <span class="time" data-id="time">0.00 s</span>
      </div>
      <div class="row seg" data-id="views">
        <span class="lbl">Góc nhìn</span>
        <button class="btn" data-view="front">Trước</button>
        <button class="btn" data-view="side">Bên</button>
        <button class="btn active" data-view="threeQuarter">Chéo</button>
      </div>
    </section>

    <section class="s-muscles">
      <h2 data-id="musclesTitle">Nhóm cơ</h2>
      <div data-id="muscles"></div>
    </section>

    <section class="s-metrics">
      <h2>Số đo trực tiếp</h2>
      <table class="metrics">
        <tr><th></th><th>Trái</th><th>Phải</th></tr>
        <tr><td>Góc gối</td><td data-id="kneeL">–</td><td data-id="kneeR">–</td></tr>
        <tr><td>Góc hông</td><td data-id="hipL">–</td><td data-id="hipR">–</td></tr>
      </table>
      <div class="depth">
        <span class="lbl">Biên độ</span>
        <div class="bar"><div data-id="depthBar"></div></div>
        <span data-id="depth">0%</span>
      </div>
      <p class="hint">Tạm dừng để xem cung góc gối trên mô hình.</p>
    </section>
  `;
  document.body.appendChild(panel);

  const $ = (id) => panel.querySelector(`[data-id="${id}"]`);
  const playBtn = $('play');
  const seek = $('seek');
  const timeEl = $('time');
  let playing = true;
  let scrubbing = false;
  let hasExercise = false;

  // Chưa chọn động tác: nút mờ và ghi "Phát" (không có gì đang chạy để tạm dừng).
  const renderPlay = () => {
    playBtn.disabled = !hasExercise;
    playBtn.textContent = hasExercise && playing ? '⏸ Tạm dừng' : '▶ Phát';
  };
  const setPlaying = (p) => {
    playing = p;
    renderPlay();
    opts.onPlayToggle(p);
  };

  // Điện thoại: bảng điều khiển là thanh dưới đáy, bấm để mở rộng / thu gọn.
  const sheetToggle = $('sheetToggle');
  sheetToggle.addEventListener('click', () => {
    const open = panel.classList.toggle('expanded');
    sheetToggle.textContent = open ? '▼ Thu gọn' : '▲ Chi tiết';
    sheetToggle.setAttribute('aria-expanded', String(open));
  });
  playBtn.addEventListener('click', () => setPlaying(!playing));

  $('exercise').addEventListener('change', (e) => opts.onExercise(e.target.value));

  const activate = (container, btn) => {
    container.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b === btn));
  };
  $('speed').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-speed]');
    if (!b) return;
    activate($('speed'), b);
    opts.onSpeed(parseFloat(b.dataset.speed));
  });
  $('views').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-view]');
    if (!b) return;
    activate($('views'), b);
    opts.onView(b.dataset.view);
  });

  // Tua: tự tạm dừng để người học quan sát từng khung hình.
  seek.addEventListener('input', () => {
    scrubbing = true;
    if (playing) setPlaying(false);
    opts.onSeek(parseFloat(seek.value));
  });
  seek.addEventListener('change', () => (scrubbing = false));

  // Công tắc nhóm cơ: trạng thái giữ nguyên khi đổi động tác.
  const enabled = {};
  const musclesEl = $('muscles');
  musclesEl.addEventListener('change', (e) => {
    const cb = e.target.closest('input[data-muscle]');
    if (!cb) return;
    enabled[cb.dataset.muscle] = cb.checked;
    opts.onMuscles({ ...enabled });
  });

  function renderMuscles(ex) {
    const stretch = cats[ex.category]?.kind === 'stretch';
    const color = stretch ? MUSCLE_CONFIG.colors.stretch : MUSCLE_CONFIG.colors.work;
    $('musclesTitle').textContent = stretch ? 'Cơ được kéo giãn' : 'Cơ làm việc';
    const list = musclesInSpec(ex.muscles);
    const row = (m, level) => {
      const sides = m[level];
      if (!sides) return '';
      const on = enabled[m.key] !== false;
      return `<label class="check">
        <input type="checkbox" data-muscle="${m.key}" ${on ? 'checked' : ''} />
        <span class="swatch ${level}" style="--c:${color}"></span>
        ${m.label}${SIDE[sides]}
      </label>`;
    };
    const primary = list.map((m) => row(m, 'primary')).join('');
    const secondary = list.map((m) => row(m, 'secondary')).join('');
    musclesEl.innerHTML =
      `<div class="mlevel">${stretch ? 'Giãn chính' : 'Cơ chính'}</div>${primary}` +
      (secondary ? `<div class="mlevel">${stretch ? 'Giãn phụ' : 'Cơ phụ'}</div>${secondary}` : '');
  }

  const cells = ['kneeL', 'kneeR', 'hipL', 'hipR'].map((k) => [k, $(k)]);
  const depthEl = $('depth');
  const depthBar = $('depthBar');

  const api = {
    enabled,
    /** Cập nhật phần thông tin khi đổi động tác. */
    setExercise(ex, duration) {
      $('exercise').value = ex?.id ?? '';
      const badge = $('badge');
      hasExercise = !!ex;
      renderPlay();
      if (!ex) {
        // Đứng yên: chưa có động tác nào được chọn.
        badge.style.display = 'none';
        $('cue').textContent = 'Mô hình đang đứng yên. Chọn một động tác trong danh sách để bắt đầu.';
        $('musclesTitle').textContent = 'Nhóm cơ';
        musclesEl.innerHTML = '<p class="hint">Chưa chọn động tác.</p>';
        seek.max = 1;
        seek.disabled = true;
        return;
      }
      const cat = cats[ex.category];
      badge.style.display = '';
      badge.textContent = cat ? cat.label : '';
      badge.className = `badge ${cat?.kind === 'stretch' ? 'stretch' : 'work'}`;
      $('cue').textContent = ex.cue ?? '';
      seek.max = duration;
      seek.disabled = false;
      renderMuscles(ex);
    },
    setTime(t) {
      if (!scrubbing) seek.value = t;
      timeEl.textContent = `${t.toFixed(2)} s`;
    },
    setAngles(v) {
      for (const [k, el] of cells) el.textContent = `${Math.round(v[k])}°`;
    },
    setDepth(d) {
      const pct = Math.round(d * 100);
      depthEl.textContent = `${pct}%`;
      depthBar.style.width = `${pct}%`;
    },
    setPlaying,
    setView(v) {
      const b = $('views').querySelector(`[data-view="${v}"]`);
      if (b) activate($('views'), b);
    },
    hide() {
      panel.style.display = 'none';
    },
    /** Phần màn hình bị bảng che ở đáy (px) khi bảng ở dạng thanh dưới đáy và đang thu gọn. */
    bottomInset() {
      if (panel.style.display === 'none' || !matchMedia(SHEET_QUERY).matches) return 0;
      // Đang mở rộng thì đo tạm ở dạng thu gọn: khung hình không nhảy theo mỗi lần mở bảng.
      const open = panel.classList.contains('expanded');
      if (open) panel.classList.remove('expanded');
      const inset = window.innerHeight - panel.getBoundingClientRect().top;
      if (open) panel.classList.add('expanded');
      return inset;
    },
  };
  api.setExercise(opts.initial, 1);
  return api;
}
