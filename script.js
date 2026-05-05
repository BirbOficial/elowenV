// ══════════════════════════════════════════
// CURSOR TRAIL — canvas overlay (performático, sem DOM spam)
// ══════════════════════════════════════════
const trailCanvas = document.createElement('canvas');
trailCanvas.id = 'trail-canvas';
trailCanvas.style.cssText =
  'position:fixed;inset:0;pointer-events:none;z-index:99997;';
document.body.appendChild(trailCanvas);
const trailCtx = trailCanvas.getContext('2d');

function resizeTrail() {
  trailCanvas.width  = window.innerWidth;
  trailCanvas.height = window.innerHeight;
}
resizeTrail();
window.addEventListener('resize', resizeTrail);

// Pontos do rastro primário (dot) e secundário (ring)
const dotPoints  = [];  // rastro do cursor principal
const ringPoints = [];  // rastro do ring

const DOT_MAX  = 18;
const RING_MAX = 12;

let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';

  dotPoints.push({ x: mouseX, y: mouseY });
  if (dotPoints.length > DOT_MAX) dotPoints.shift();
});

// Ring follow — mais rápido (0.20)
(function animRing() {
  ringX += (mouseX - ringX) * 0.20;
  ringY += (mouseY - ringY) * 0.20;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';

  ringPoints.push({ x: ringX, y: ringY });
  if (ringPoints.length > RING_MAX) ringPoints.shift();

  requestAnimationFrame(animRing);
})();

// Desenha rastros no canvas a cada frame
(function drawTrails() {
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

  // Rastro primário — linha contínua fina com brilho vermelho
  if (dotPoints.length > 1) {
    for (let i = 1; i < dotPoints.length; i++) {
      const t = i / dotPoints.length;
      const alpha = t * 0.85;
      const width = t * 2.5;
      trailCtx.beginPath();
      trailCtx.moveTo(dotPoints[i - 1].x, dotPoints[i - 1].y);
      trailCtx.lineTo(dotPoints[i].x, dotPoints[i].y);
      trailCtx.strokeStyle = `rgba(220,0,0,${alpha})`;
      trailCtx.lineWidth = width;
      trailCtx.lineCap = 'round';
      trailCtx.shadowColor = '#cc0000';
      trailCtx.shadowBlur = 6;
      trailCtx.stroke();
    }
  }

  // Rastro ring — pontos pequenos neon
  trailCtx.shadowBlur = 0;
  for (let i = 0; i < ringPoints.length; i++) {
    const t = i / ringPoints.length;
    const alpha = t * 0.5;
    const r = t * 3;
    trailCtx.beginPath();
    trailCtx.arc(ringPoints[i].x, ringPoints[i].y, r, 0, Math.PI * 2);
    trailCtx.fillStyle = `rgba(255,60,60,${alpha})`;
    trailCtx.shadowColor = '#ff3030';
    trailCtx.shadowBlur = 8;
    trailCtx.fill();
  }

  requestAnimationFrame(drawTrails);
})();

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
  const ctx    = canvas.getContext('2d');
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
    if (side === 0)      { x = Math.random() * ZONE;      y = Math.random() * H;    dx = spd;  dy = 0; }
    else if (side === 1) { x = W - Math.random() * ZONE;  y = Math.random() * H;    dx = -spd; dy = 0; }
    else if (side === 2) { x = Math.random() * W;          y = Math.random() * ZONE; dx = 0;    dy = spd; }
    else                 { x = Math.random() * W;          y = H - Math.random() * ZONE; dx = 0; dy = -spd; }
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
        ctx.moveTo(p.trail[j].x,     p.trail[j].y);
        ctx.lineTo(p.trail[j + 1].x, p.trail[j + 1].y);
        ctx.strokeStyle = `rgba(204,0,0,${a})`;
        ctx.lineWidth   = p.size * (j / p.trail.length);
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
// AUDIO — toca no primeiro clique real
// ══════════════════════════════════════════
const ambientEl = document.getElementById('ambient');
ambientEl.volume = 0.70;
let audioStarted = false;

function startAudio() {
  if (audioStarted) return;
  ambientEl.play()
    .then(() => { audioStarted = true; })
    .catch(() => {});
}

['click', 'keydown', 'touchstart', 'mousedown'].forEach(ev =>
  document.addEventListener(ev, startAudio, { once: false })
);

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════
const PASS = 'VVVVVE!5';

document.getElementById('login-btn').addEventListener('click', tryLogin);
document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') tryLogin();
});

function tryLogin() {
  startAudio();
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-error');

  if (!user) {
    err.textContent  = '⚠ IDENTIFICADOR REQUERIDO';
    err.style.opacity = 1;
    return;
  }

  if (pass !== PASS) {
    err.textContent  = '⛔ ACESSO NEGADO — CREDENCIAIS INVÁLIDAS';
    err.style.opacity = 1;
    showFractalError();
    return;
  }

  err.textContent  = '';
  err.style.opacity = 0;
  acceptLogin();
}

// ── Senha ERRADA — fractal de erro, tela travada (F5 para sair)
function showFractalError() {
  const overlay = document.getElementById('fractal-overlay');
  const popup   = document.getElementById('fractal-popup');
  const footer  = document.getElementById('fractal-footer');

  footer.textContent = 'ACESSO NEGADO — REGISTRANDO TENTATIVA // F5 PARA TENTAR NOVAMENTE';

  overlay.style.display = 'block';
  popup.style.display   = 'block';

  // força reflow antes de adicionar classe de transição
  void popup.offsetWidth;
  popup.classList.add('visible');

  // Trava inputs
  document.getElementById('login-user').disabled = true;
  document.getElementById('login-pass').disabled = true;
  document.getElementById('login-btn').disabled  = true;
  document.getElementById('login-btn').style.opacity = '0.3';
}

// ── Senha CORRETA — fractal de sucesso, depois lança o site
function acceptLogin() {
  // Esconde tela de login imediatamente
  document.getElementById('login-screen').style.display = 'none';

  const overlay = document.getElementById('fractal-overlay');
  const popup   = document.getElementById('fractal-popup');
  const footer  = document.getElementById('fractal-footer');

  footer.textContent = 'IDENTIDADE CONFIRMADA — INICIANDO SESSÃO SEGURA';

  overlay.style.display = 'block';
  popup.style.display   = 'block';

  void popup.offsetWidth;
  popup.classList.add('visible');

  // Após 4s, fade-out e lança o site
  setTimeout(() => {
    popup.classList.remove('visible');
    overlay.style.transition = 'opacity 0.5s ease';
    overlay.style.opacity    = '0';
    setTimeout(() => {
      overlay.style.display   = 'none';
      overlay.style.opacity   = '';
      overlay.style.transition = '';
      popup.style.display     = 'none';
      launchSite();
    }, 500);
  }, 4000);
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
    pct.textContent  = slider.value + '%';
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
// GIF — scroll-controlled
// ══════════════════════════════════════════
let gifFrames = [];
let gifGlobalWidth = 720, gifGlobalHeight = 720;
let currentGifFrame = -1;

const offscreenCanvas = document.createElement('canvas');
const offCtx = offscreenCanvas.getContext('2d');
const compositeCanvas = document.createElement('canvas');
compositeCanvas.width  = 720;
compositeCanvas.height = 720;
const compositeCtx = compositeCanvas.getContext('2d');

function loadGIF() {
  const canvas   = document.getElementById('char-canvas');
  const ctx      = canvas.getContext('2d');
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
  s.src    = 'https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.min.js';
  s.onload  = fetchAndParseGIF;
  s.onerror = () => console.warn('gifuct-js CDN failed');
  document.head.appendChild(s);
}

function fetchAndParseGIF() {
  fetch('character.gif')
    .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.arrayBuffer(); })
    .then(buf => {
      const gif    = window.parseGIF(buf);
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
  compositeCtx.drawImage(
    patchCanvas,
    frame.dims.left  * scaleX, frame.dims.top * scaleY,
    frame.dims.width * scaleX, frame.dims.height * scaleY
  );
  ctx.clearRect(0, 0, 720, 720);
  ctx.drawImage(compositeCanvas, 0, 0);
}

function onScrollGIF() {
  if (!gifFrames.length) return;
  const progress = Math.min(window.scrollY / Math.max(1, document.body.scrollHeight - window.innerHeight), 1);
  const fi = Math.floor(progress * (gifFrames.length - 1));
  if (fi !== currentGifFrame) { currentGifFrame = fi; renderGifFrame(fi); }
}