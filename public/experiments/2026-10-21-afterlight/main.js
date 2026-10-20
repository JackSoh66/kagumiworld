const canvas = document.querySelector('#light-field');
const ctx = canvas.getContext('2d', { alpha: false });
const palettes = {
  sage: { bg: '#101916', haze: '#263f32', light: [204, 239, 166], core: [252, 251, 193], name: 'Sage' },
  amber: { bg: '#211713', haze: '#54332a', light: [241, 164, 108], core: [255, 233, 181], name: 'Amber' },
  dusk: { bg: '#171421', haze: '#35304e', light: [173, 155, 232], core: [233, 212, 252], name: 'Dusk' },
};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const state = { palette: 'sage', energy: 35, density: 240, seed: 31, paused: reducedMotion.matches };
let width = 0;
let height = 0;
let time = 0;
let frame = null;
let previousTime = 0;
const pointer = { x: 0.67, y: 0.42 };
const smoothed = { ...pointer };
const color = (rgb, alpha) => `rgba(${rgb.join(',')},${alpha})`;

function glow(x, y, rx, ry, rgb, alpha, rotation = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(rx, ry);
  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  gradient.addColorStop(0, color(rgb, alpha));
  gradient.addColorStop(0.25, color(rgb, alpha * 0.7));
  gradient.addColorStop(0.65, color(rgb, alpha * 0.23));
  gradient.addColorStop(1, color(rgb, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(-1, -1, 2, 2);
  ctx.restore();
}

function draw() {
  if (!ctx) return;
  const palette = palettes[state.palette];
  const mobile = width < 700;
  const size = Math.min(width * (mobile ? 0.85 : 0.35), height * 0.57);
  const centerX = width * (mobile ? 0.72 : 0.72) + (smoothed.x - 0.67) * size * 0.3;
  const centerY = height * (mobile ? 0.39 : 0.44) + (smoothed.y - 0.42) * size * 0.22;
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, width, height);
  glow(centerX, centerY, size * 1.6, size * 1.3, palette.light, 0.16, -0.5);
  glow(centerX + size * 0.4, centerY - size * 0.25, size * 0.95, size * 1.2, palette.light, 0.26, 0.7);
  const detail = state.density / 240;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i += 1) {
    const angle = time * 0.17 + state.seed * 0.4 + i * Math.PI * 0.4;
    const x = centerX + Math.cos(angle) * size * (0.24 + i * 0.055);
    const y = centerY + Math.sin(angle) * size * 0.3;
    glow(x, y, size * (0.34 + 0.07 * Math.sin(angle)), size * 0.65, i % 2 ? palette.core : palette.light, 0.25 + detail * 0.045, angle * 0.6 - 0.7);
  }
  ctx.restore();
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(-0.65 + Math.sin(time * 0.16) * 0.15);
  const rings = Math.round(state.density / 12);
  for (let ring = 0; ring < rings; ring += 1) {
    const offset = ring / rings;
    const radius = size * (0.46 + offset * 0.5);
    ctx.beginPath();
    for (let i = 0; i <= 150; i += 1) {
      const a = (i / 150) * Math.PI * 2;
      const ripple = Math.sin(a * 3 + time + ring * 0.08 + state.seed) * size * 0.022;
      const x = Math.cos(a) * (radius + ripple);
      const y = Math.sin(a) * (radius * 0.47 + ripple * 0.6);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = color(palette.light, (1 - offset) * 0.16 + 0.018);
    ctx.lineWidth = ring % 6 === 0 ? 1 : 0.5;
    ctx.stroke();
  }
  ctx.restore();
  for (let i = 0; i < state.density; i += 1) {
    const a = i * 2.399963 + state.seed;
    const distance = Math.sqrt((i + 0.5) / state.density) * size * 1.12;
    const x = centerX + Math.cos(a + time * 0.025) * distance;
    const y = centerY + Math.sin(a + time * 0.025) * distance * 0.72;
    const alpha = 0.05 + (Math.sin(i * 5 + time) + 1) * 0.13;
    ctx.fillStyle = color(palette.light, alpha);
    ctx.beginPath();
    ctx.arc(x, y, i % 23 === 0 ? 1.4 : 0.65, 0, Math.PI * 2);
    ctx.fill();
  }
  // Keep the editorial copy readable without hiding the interactive field.
  const shade = ctx.createLinearGradient(0, 0, width * 0.7, 0);
  shade.addColorStop(0, palette.bg);
  shade.addColorStop(0.45, color([16, 25, 22], state.palette === 'sage' ? 0.6 : 0.15));
  shade.addColorStop(1, 'transparent');
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, width * 0.7, height);
}

function animate(timestamp) {
  frame = null;
  if (state.paused || document.hidden) return;
  const delta = previousTime ? Math.min((timestamp - previousTime) / 1000, 0.05) : 0;
  previousTime = timestamp;
  time += delta * (0.12 + state.energy / 30);
  smoothed.x += (pointer.x - smoothed.x) * 0.045;
  smoothed.y += (pointer.y - smoothed.y) * 0.045;
  draw();
  frame = requestAnimationFrame(animate);
}

function start() {
  if (!state.paused && !document.hidden && frame === null) {
    previousTime = 0;
    frame = requestAnimationFrame(animate);
  }
}

function stop() {
  if (frame !== null) cancelAnimationFrame(frame);
  frame = null;
  previousTime = 0;
}

function reflectPause() {
  document.querySelector('#pause').setAttribute('aria-pressed', String(state.paused));
  document.querySelector('#pause').setAttribute('aria-label', state.paused ? 'Resume animation' : 'Pause animation');
  document.querySelector('#pause-icon').innerHTML = state.paused
    ? '<svg class="inline-icon" viewBox="0 0 24 24"><path d="m8 5 12 7-12 7Z"/></svg>'
    : '<svg class="inline-icon" viewBox="0 0 24 24"><path d="M8 5v14M16 5v14"/></svg>';
  document.querySelector('#motion-status').textContent = state.paused ? 'A MOMENT, HELD STILL' : 'LIGHT, IN MOTION';
  if (state.paused) stop(); else start();
}

function resize() {
  width = document.documentElement.clientWidth;
  height = Math.max(document.body.scrollHeight, window.innerHeight);
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  ctx?.setTransform(ratio, 0, 0, ratio, 0, 0);
  draw();
}

document.addEventListener('pointermove', (event) => {
  pointer.x = event.clientX / width;
  pointer.y = event.clientY / height;
  if (state.paused) { Object.assign(smoothed, pointer); draw(); }
}, { passive: true });
document.querySelector('#pause').addEventListener('click', () => {
  state.paused = !state.paused;
  reflectPause();
});
document.querySelectorAll('[data-palette]').forEach((button) => {
  button.addEventListener('click', () => {
    state.palette = button.dataset.palette;
    document.querySelectorAll('[data-palette]').forEach((item) => {
      const selected = item === button;
      item.classList.toggle('selected', selected);
      item.setAttribute('aria-pressed', String(selected));
    });
    document.querySelector('#palette-name').textContent = palettes[state.palette].name;
    document.querySelector('#announcement').textContent = `Mood changed to ${palettes[state.palette].name}.`;
    draw();
  });
});
for (const name of ['energy', 'density']) {
  document.querySelector(`#${name}`).addEventListener('input', (event) => {
    state[name] = Number(event.target.value);
    document.querySelector(`#${name}-value`).textContent = name === 'energy' ? `${state[name]}%` : String(state[name]);
    draw();
  });
}
document.querySelector('#remix').addEventListener('click', () => {
  state.seed = Math.random() * 1000;
  draw();
  document.querySelector('#announcement').textContent = 'A fresh composition, just for you.';
});
document.querySelector('#save').addEventListener('click', () => {
  const link = document.createElement('a');
  link.download = `afterlight-${state.palette}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
  document.querySelector('#announcement').textContent = 'Your light field has been saved as a PNG.';
});
document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); else start(); });
reducedMotion.addEventListener('change', (event) => {
  if (event.matches) { state.paused = true; reflectPause(); }
});
window.addEventListener('resize', resize);
resize();
reflectPause();
