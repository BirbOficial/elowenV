// ══════════════════════════════════════════
// CUSTOM CURSOR + TRAILS
// ══════════════════════════════════════════
const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

// Trail arrays
const dotTrail  = [];  // primary dot trail
const ringTrail = [];  // ring trail

const DOT_TRAIL_LEN  = 12;
const RING_TRAIL_LEN = 8;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';

  // Dot trail
  dotTrail.push({ x: mouseX, y: mouseY, life: 1 });
  if (dotTrail.length > DOT_TRAIL_LEN) dotTrail.shift();
});

// Spawn trail particles for the dot cursor
function spawnDotTrailParticle(x, y, alpha) {
  const el = document.createElement('div');
  el.className = 'cursor-trail-dot';
  el.style.left = x + 'px';
  el.style.top  = y + 'px';
  el.style.opacity = alpha;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 180);
}

// Ring smooth follow — faster now (0.22 instead of 0.12)
let lastRingX = 0, lastRingY = 0;
(function animRing() {
  ringX += (mouseX - ringX) * 0.22;
  ringY += (mouseY - ringY) * 0.22;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';

  // Ring trail
  if (Math.abs(ringX - lastRingX) > 1.5 || Math.abs(ringY - lastRingY) > 1.5) {
    ringTrail.push({ x: ringX, y: ringY });
    if (ringTrail.length > RING_TRAIL_LEN) ringTrail.shift();
    lastRingX = ringX; lastRingY = ringY;

    ringTrail.forEach((pt, i) => {
      const alpha = (i / ringTrail.length) * 0.55;
      const el = document.createElement('div');
      el.className = 'cursor-trail-ring';
      el.style.left    = pt.x + 'px';
      el.style.top     = pt.y + 'px';
      el.style.opacity = alpha;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 120);
    });
  }

  requestAnimationFrame(animRing);
})();

// Dot trail tick
setInterval(() => {
  dotTrail.forEach((pt, i) => {
    const alpha = (i / dotTrail.length) * 0.7;
    spawnDotTrailParticle(pt.x, pt.y, alpha);
  });
}, 30);

// Hover expand
document.querySelectorAll('button, input, a, .info-cell, .redacted').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ══════════════════════════════════════════
// TRON PARTICLE SYSTEM
// ══════════════════════════════════════════
(function () {
  const canvas = document.getElementById('tron-canvas');
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const ZONE = 70, COUNT = 30;
  const particles = [];

  function makeParticle() {
    const side = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    const spd = 0.7 + Math.random() * 1.4;
    if (side === 0)      { x = Math.random() * ZONE; y = Math.random() * H; dx = spd; dy = 0; }
    else if (side === 1) { x = W - Math.random() * ZONE; y = Math.random() * H; dx = -spd; dy = 0; }
    else if (side === 2) { x = Math.random() * W; y = Math.random() * ZONE; dx = 0; dy = spd; }
    else                 { x = Math.random() * W; y = H - Math.random() * ZONE; dx = 0; dy = -spd; }
    return {
      x, y, dx, dy,
      trail: [], maxTrail: 35 + Math.floor(Math.random() * 55),
      life: 1, decay: 0.003 + Math.random() * 0.003,
      size: 1 + Math.random() * 1.2,
      turnIn: 80 + Math.floor(Math.random() * 100)
    };
  }

  for (let i = 0; i < COUNT; i++) particles.push(makeParticle());

  function tick() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.turnIn--;
      if (p.turnIn <= 0) {
        const t = Math.random() < 0.5 ? 1 : -1;
        [p.dx, p.dy] = [-p.dy * t, p.dx * t];
        p.turnIn = 80 + Math.floor(Math.random() * 100);
      }
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > p.maxTrail) p.trail.shift();
      p.x += p.dx; p.y += p.dy; p.life -= p.decay;

      for (let j = 0; j < p.trail.length - 1; j++) {
        const a = (j / p.trail.length) * p.life * 0.75;
        ctx.beginPath();
        ctx.moveTo(p.trail[j].x, p.trail[j].y);
        ctx.lineTo(p.trail[j + 1].x, p.trail[j + 1].y);
        ctx.strokeStyle = `rgba(204,0,0,${a})`;
        ctx.lineWidth = p.size * (j / p.trail.length);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,80,80,${p.life * 0.85})`;
      ctx.fill();

      if (p.life <= 0 || p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) {
        particles[i] = makeParticle();
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

// ══════════════════════════════════════════
// AUDIO — Web Audio API unlock trick
// ══════════════════════════════════════════
const ambientEl = document.getElementById('ambient');
ambientEl.volume = 0.70;
let audioStarted = false;

function startAudio() {
  if (audioStarted) return;
  // Resume AudioContext if suspended (Chrome policy)
  if (window._audioCtx && window._audioCtx.state === 'suspended') {
    window._audioCtx.resume();
  }
  ambientEl.play()
    .then(() => { audioStarted = true; })
    .catch(() => {});
}

// Create AudioContext on load to warm it up
window._audioCtx = new (window.AudioContext || window.webkitAudioContext)();

['click', 'keydown', 'touchstart', 'mousedown'].forEach(ev =>
  document.addEventListener(ev, startAudio)
);

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════
const PASS = 'VVVVVE!5';
const loginBtn  = document.getElementById('login-btn');
const loginPass = document.getElementById('login-pass');

loginBtn.addEventListener('click', tryLogin);
loginPass.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });

function tryLogin() {
  startAudio();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-error');

  if (!user) {
    err.textContent = '⚠ IDENTIFICADOR REQUERIDO';
    err.style.opacity = 1;
    return;
  }

  if (pass !== PASS) {
    err.textContent = '⛔ ACESSO NEGADO — CREDENCIAIS INVÁLIDAS';
    err.style.opacity = 1;
    showFractalError();   // wrong password — locked screen
    return;
  }

  err.textContent = '';
  err.style.opacity = 0;
  acceptLogin();          // correct password
}

// ── Wrong password: show fractal, lock page (F5 to escape)
function showFractalError() {
  const overlay = document.getElementById('fractal-overlay');
  const popup   = document.getElementById('fractal-popup');
  const footer  = document.getElementById('fractal-footer');
  footer.textContent = 'ACESSO NEGADO — REGISTRANDO TENTATIVA // PRESSIONE F5 PARA TENTAR NOVAMENTE';

  overlay.style.display = 'block';
  popup.style.display   = 'block';
  // Force reflow for transition
  popup.getBoundingClientRect();
  requestAnimationFrame(() => popup.classList.add('visible'));

  // Block all login inputs
  document.getElementById('login-user').disabled = true;
  document.getElementById('login-pass').disabled = true;
  loginBtn.disabled = true;
  loginBtn.style.opacity = '0.3';
}

// ── Correct password: fractal success, then launch site
function acceptLogin() {
  document.getElementById('login-screen').style.display = 'none';

  const overlay = document.getElementById('fractal-overlay');
  const popup   = document.getElementById('fractal-popup');
  const footer  = document.getElementById('fractal-footer');
  footer.textContent = 'IDENTIDADE CONFIRMADA — INICIANDO SESSÃO SEGURA';

  overlay.style.display = 'block';
  popup.style.display   = 'block';
  popup.getBoundingClientRect();
  requestAnimationFrame(() => popup.classList.add('visible'));

  // After 4s, fade out fractal, then launch site
  setTimeout(() => {
    hideFractalPopup(() => {
      launchSite();
    });
  }, 4000);
}

function hideFractalPopup(cb) {
  const overlay = document.getElementById('fractal-overlay');
  const popup   = document.getElementById('fractal-popup');
  popup.classList.remove('visible');
  setTimeout(() => {
    overlay.style.display = 'none';
    popup.style.display   = 'none';
    if (cb) cb();
  }, 500);
}

// ══════════════════════════════════════════
// LAUNCH MAIN SITE
// ══════════════════════════════════════════
function launchSite() {
  document.getElementById('main-site').style.display = 'block';
  buildClearanceBar();
  initScrollReveal();
  initVolControl();
  setFooterDate();
  loadGIF();
  attachHoverCursor();
}

function buildClearanceBar() {
  const bar = document.getElementById('cl-bar');
  for (let i = 0; i < 6; i++) {
    const s = document.createElement('div');
    s.className = 'cl-seg on';
    bar.appendChild(s);
  }
}

function initScrollReveal() {
  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.08 });
  document.querySelectorAll('.section').forEach(s => obs.observe(s));
}

function initVolControl() {
  const slider = document.getElementById('vol-slider');
  const pct    = document.getElementById('vol-pct');
  slider.addEventListener('input', () => {
    const v = Math.max(0.10, parseInt(slider.value) / 100);
    ambientEl.volume = v;
    pct.textContent = slider.value + '%';
  });
}

function setFooterDate() {
  const d = new Date();
  document.getElementById('footer-date').textContent =
    `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} // DOCUMENTO CONTROLADO`;
}

function attachHoverCursor() {
  document.querySelectorAll('.info-cell, #vol-slider, .login-btn, .redacted').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ══════════════════════════════════════════
// GIF
// ══════════════════════════════════════════
let gifFrames = [];
let gifGlobalWidth = 720, gifGlobalHeight = 720;
let currentGifFrame = -1;
const offscreenCanvas = document.createElement('canvas');
const offCtx = offscreenCanvas.getContext('2d');
const compositeCanvas = document.createElement('canvas');
compositeCanvas.width = 720; compositeCanvas.height = 720;
const compositeCtx = compositeCanvas.getContext('2d');

function loadGIF() {
  const canvas = document.getElementById('char-canvas');
  const ctx    = canvas.getContext('2d');
  const gifImage = new Image();
  gifImage.crossOrigin = 'anonymous';
  gifImage.onload = () => {
    ctx.clearRect(0, 0, 720, 720);
    ctx.drawImage(gifImage, 0, 0, 720, 720);
    tryGifuct();
  };
  gifImage.onerror = () => console.warn('character.gif not found');
  gifImage.src = 'character.gif';
}

function tryGifuct() {
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.min.js';
  s.onload = fetchAndParseGIF;
  s.onerror = () => console.warn('gifuct-js CDN failed');
  document.head.appendChild(s);
}

function fetchAndParseGIF() {
  fetch('character.gif')
    .then(r => { if (!r.ok) throw new Error('GIF fetch failed'); return r.arrayBuffer(); })
    .then(buf => {
      const gif = window.parseGIF(buf);
      gifGlobalWidth  = gif.lsd.width;
      gifGlobalHeight = gif.lsd.height;
      const frames = window.decompressFrames(gif, true);
      if (!frames || !frames.length) return;
      gifFrames = frames;
      offscreenCanvas.width  = gifGlobalWidth;
      offscreenCanvas.height = gifGlobalHeight;
      compositeCtx.clearRect(0, 0, 720, 720);
      renderGifFrame(0);
      window.addEventListener('scroll', onScrollGIF, { passive: true });
    })
    .catch(err => console.warn('GIF parse error:', err));
}

function renderGifFrame(index) {
  if (!gifFrames.length) return;
  const frame = gifFrames[index];
  if (!frame) return;
  const canvas = document.getElementById('char-canvas');
  const ctx    = canvas.getContext('2d');
  if (frame.disposalType === 2) compositeCtx.clearRect(0, 0, 720, 720);
  const imageData = offCtx.createImageData(frame.dims.width, frame.dims.height);
  imageData.data.set(frame.patch);
  const patchCanvas = document.createElement('canvas');
  patchCanvas.width  = frame.dims.width;
  patchCanvas.height = frame.dims.height;
  patchCanvas.getContext('2d').putImageData(imageData, 0, 0);
  const scaleX = 720 / gifGlobalWidth, scaleY = 720 / gifGlobalHeight;
  compositeCtx.drawImage(patchCanvas, frame.dims.left * scaleX, frame.dims.top * scaleY,
    frame.dims.width * scaleX, frame.dims.height * scaleY);
  ctx.clearRect(0, 0, 720, 720);
  ctx.drawImage(compositeCanvas, 0, 0);
}

function onScrollGIF() {
  if (!gifFrames.length) return;
  const progress = Math.min(window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight), 1);
  const fi = Math.floor(progress * (gifFrames.length - 1));
  if (fi !== currentGifFrame) { currentGifFrame = fi; renderGifFrame(fi); }
}