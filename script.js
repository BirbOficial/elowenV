// ══════════════════════════════════════════
// CURSOR TRAIL — canvas overlay
// ══════════════════════════════════════════
const trailCanvas = document.createElement('canvas');
trailCanvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:99997;';
document.body.appendChild(trailCanvas);
const trailCtx = trailCanvas.getContext('2d');

function resizeTrail() {
  trailCanvas.width  = window.innerWidth;
  trailCanvas.height = window.innerHeight;
}
resizeTrail();
window.addEventListener('resize', resizeTrail);

const dotPoints  = [];
const ringPoints = [];
const DOT_MAX    = 18;
const RING_MAX   = 12;

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

// Ring — mais rápido (0.22)
(function animRing() {
  ringX += (mouseX - ringX) * 0.22;
  ringY += (mouseY - ringY) * 0.22;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  ringPoints.push({ x: ringX, y: ringY });
  if (ringPoints.length > RING_MAX) ringPoints.shift();
  requestAnimationFrame(animRing);
})();

// Desenha rastros no canvas
(function drawTrails() {
  trailCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);

  // Rastro primário — linha com brilho
  if (dotPoints.length > 1) {
    for (let i = 1; i < dotPoints.length; i++) {
      const t = i / dotPoints.length;
      trailCtx.beginPath();
      trailCtx.moveTo(dotPoints[i - 1].x, dotPoints[i - 1].y);
      trailCtx.lineTo(dotPoints[i].x,     dotPoints[i].y);
      trailCtx.strokeStyle = `rgba(220,0,0,${t * 0.85})`;
      trailCtx.lineWidth   = t * 2.5;
      trailCtx.lineCap     = 'round';
      trailCtx.shadowColor = '#cc0000';
      trailCtx.shadowBlur  = 6;
      trailCtx.stroke();
    }
  }

  // Rastro ring — pontos neon
  for (let i = 0; i < ringPoints.length; i++) {
    const t = i / ringPoints.length;
    trailCtx.beginPath();
    trailCtx.arc(ringPoints[i].x, ringPoints[i].y, t * 3, 0, Math.PI * 2);
    trailCtx.fillStyle   = `rgba(255,60,60,${t * 0.5})`;
    trailCtx.shadowColor = '#ff3030';
    trailCtx.shadowBlur  = 8;
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

  const COUNT = 30;
  const particles = [];

  function makeParticle() {
    const side = Math.floor(Math.random() * 4);
    let x, y, dx, dy;
    const spd = 0.7 + Math.random() * 1.4;
    if      (side === 0) { x = Math.random() * 70;     y = Math.random() * H;      dx = spd;  dy = 0; }
    else if (side === 1) { x = W - Math.random() * 70; y = Math.random() * H;      dx = -spd; dy = 0; }
    else if (side === 2) { x = Math.random() * W;       y = Math.random() * 70;     dx = 0;    dy = spd; }
    else                 { x = Math.random() * W;       y = H - Math.random() * 70; dx = 0;    dy = -spd; }
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
// AUDIO — toca no clique do login (primeira interação)
// ══════════════════════════════════════════
const ambientEl = document.getElementById('ambient');
if (ambientEl) ambientEl.volume = 0.70;
let audioStarted = false;
// ══════════════════════════════════════════
// HOVER SFX — hover.mp3
// ══════════════════════════════════════════
const hoverPool = [];
for (let i = 0; i < 4; i++) {
  const a = new Audio('hover.mp3');
  a.volume = 0.35;
  hoverPool.push(a);
}
let hoverPoolIdx = 0;

function playHover() {
  const snd = hoverPool[hoverPoolIdx % 4];
  hoverPoolIdx++;
  snd.currentTime = 0;
  snd.play().catch(() => {});
}

function attachHover(el) {
  el.addEventListener('mouseenter', playHover);
}
function startAudio() {
  if (audioStarted || !ambientEl) return;
  ambientEl.play()
    .then(() => { audioStarted = true; })
    .catch(() => {});
}

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════
const PASS = 'VVVVVE!5';

document.getElementById('login-btn').addEventListener('click', tryLogin);
document.getElementById('login-pass').addEventListener('keydown', e => {
  if (e.key === 'Enter') tryLogin();
});

function tryLogin() {
  startAudio(); // clique no botão = primeira interação, áudio libera aqui

  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-error');

  if (!user) {
    err.textContent   = '⚠ IDENTIFICADOR REQUERIDO';
    err.style.opacity = 1;
    return;
  }

  if (pass !== PASS) {
    err.textContent   = '⛔ ACESSO NEGADO — CREDENCIAIS INVÁLIDAS';
    err.style.opacity = 1;
    showFractalError();
    return;
  }

  err.textContent   = '';
  err.style.opacity = 0;
  acceptLogin();
}

// ── Senha ERRADA — fractal aparece, tela trava, precisa de F5
function showFractalError() {
  const overlay = document.getElementById('fractal-overlay');
  const popup   = document.getElementById('fractal-popup');
  const footer  = document.getElementById('fractal-footer');

  footer.textContent    = 'ACESSO NEGADO — REGISTRANDO TENTATIVA // F5 PARA TENTAR NOVAMENTE';
  overlay.style.display = 'block';
  popup.style.display   = 'block';

  void popup.offsetWidth; // força reflow para a transição CSS disparar
  popup.classList.add('visible');

  document.getElementById('login-user').disabled     = true;
  document.getElementById('login-pass').disabled     = true;
  document.getElementById('login-btn').disabled      = true;
  document.getElementById('login-btn').style.opacity = '0.3';
}

// ── Senha CORRETA — fractal de sucesso por 4s, depois lança o site
function acceptLogin() {
  document.getElementById('login-screen').style.display = 'none';

  const overlay = document.getElementById('fractal-overlay');
  const popup   = document.getElementById('fractal-popup');
  const footer  = document.getElementById('fractal-footer');

  footer.textContent    = 'IDENTIDADE CONFIRMADA — INICIANDO SESSÃO SEGURA';
  overlay.style.display = 'block';
  popup.style.display   = 'block';

  void popup.offsetWidth;
  popup.classList.add('visible');

  setTimeout(() => {
    popup.classList.remove('visible');
    overlay.style.transition = 'opacity 0.5s ease';
    overlay.style.opacity    = '0';
    setTimeout(() => {
      overlay.style.display    = 'none';
      overlay.style.opacity    = '';
      overlay.style.transition = '';
      popup.style.display      = 'none';
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
  initCharVideo();
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
  if (!slider) return;
  slider.addEventListener('input', () => {
    if (ambientEl) ambientEl.volume = Math.max(0.10, parseInt(slider.value) / 100);
    if (pct) pct.textContent = slider.value + '%';
  });
}

function setFooterDate() {
  const d  = new Date();
  const el = document.getElementById('footer-date');
  if (el) el.textContent =
    `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} // DOCUMENTO CONTROLADO`;
}

function attachHoverCursor() {
  document.querySelectorAll('.info-cell, #vol-slider, .login-btn, .redacted, button, input, a').forEach(el => {
    el.addEventListener('mouseenter', () => { document.body.classList.add('cursor-hover'); playHover(); });
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ══════════════════════════════════════════
// PERSONAGEM — MP4 com chroma key no canvas
// ══════════════════════════════════════════
//
// AJUSTE AQUI se necessário:
//   CHROMA_THRESH mais alto  → remove menos verde (borda verde aparece)
//   CHROMA_THRESH mais baixo → remove mais verde (pode comer a personagem)
//
const CHROMA_THRESH = 0.30;

function initCharVideo() {
  const canvas  = document.getElementById('char-canvas');
  const ctx     = canvas.getContext('2d', { willReadFrequently: true });
  const wrapper = document.getElementById('char-wrapper');

  // Vídeo oculto — apenas usado como fonte de frames
  const video       = document.createElement('video');
  video.src         = 'character.mp4';
  video.muted       = true;
  video.playsInline = true;
  video.preload     = 'auto';
  video.style.display = 'none';
  wrapper.appendChild(video);

  let videoReady = false;

  video.addEventListener('loadeddata', () => {
    videoReady = true;
    video.currentTime = 0; // vai ao frame 0, dispara 'seeked'
  });

  // Toda vez que o vídeo termina de buscar um frame, renderiza com chroma key
  video.addEventListener('seeked', () => {
    if (videoReady) drawChromaFrame(canvas, ctx, video);
  });

  // Se não tiver mp4, cai no GIF como antes
  video.addEventListener('error', () => {
    console.warn('character.mp4 não encontrado — usando GIF fallback');
    wrapper.removeChild(video);
    loadGIFFallback();
  });

  // Controle de scroll
  window.addEventListener('scroll', () => {
    if (!videoReady || !video.duration) return;
    const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
    const progress  = Math.min(window.scrollY / maxScroll, 1);
    video.currentTime = progress * video.duration;
  }, { passive: true });
}

function drawChromaFrame(canvas, ctx, video) {
  const W = canvas.width;
  const H = canvas.height;

  ctx.drawImage(video, 0, 0, W, H);

  const imageData = ctx.getImageData(0, 0, W, H);
  const data      = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]     / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    // Quanto esse pixel é "verde" em relação a r e b
    // Verde puro (0,1,0)      → greenness ≈ 1 → removido totalmente
    // Verde de sombra (0,.4,0) → greenness parcial → alpha reduzido (sombra preservada)
    // Cores da personagem      → greenness baixo  → intocado
    const greenness = (2 * g - r - b) / 2;
    const amount    = Math.max(0, (greenness - CHROMA_THRESH) / (1 - CHROMA_THRESH));

    if (amount > 0) {
      // Corrige o "derrame" de verde nas bordas antes de tornar transparente
      data[i]     = Math.min(255, data[i]     + data[i + 1] * amount);
      data[i + 2] = Math.min(255, data[i + 2] + data[i + 1] * amount);
      data[i + 1] = Math.round(data[i + 1] * (1 - amount));
      data[i + 3] = Math.round(255 * (1 - amount));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

// ══════════════════════════════════════════
// GIF FALLBACK
// ══════════════════════════════════════════
let gifFrames       = [];
let gifGlobalWidth  = 720;
let gifGlobalHeight = 720;
let currentGifFrame = -1;

const offscreenCanvas = document.createElement('canvas');
const offCtx          = offscreenCanvas.getContext('2d');
const compositeCanvas = document.createElement('canvas');
compositeCanvas.width  = 720;
compositeCanvas.height = 720;
const compositeCtx = compositeCanvas.getContext('2d');

function loadGIFFallback() {
  const canvas   = document.getElementById('char-canvas');
  const ctx      = canvas.getContext('2d');
  const gifImage = new Image();
  gifImage.crossOrigin = 'anonymous';
  gifImage.onload  = () => { ctx.clearRect(0, 0, 720, 720); ctx.drawImage(gifImage, 0, 0, 720, 720); tryGifuct(); };
  gifImage.onerror = () => console.warn('character.gif também não encontrado');
  gifImage.src = 'character.gif';
}

function tryGifuct() {
  const s   = document.createElement('script');
  s.src     = 'https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.min.js';
  s.onload  = fetchAndParseGIF;
  s.onerror = () => console.warn('gifuct-js CDN failed');
  document.head.appendChild(s);
}

function fetchAndParseGIF() {
  fetch('character.gif')
    .then(r => { if (!r.ok) throw new Error('fetch failed'); return r.arrayBuffer(); })
    .then(buf => {
      const gif       = window.parseGIF(buf);
      gifGlobalWidth  = gif.lsd.width;
      gifGlobalHeight = gif.lsd.height;
      const frames    = window.decompressFrames(gif, true);
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
  compositeCtx.drawImage(patchCanvas,
    frame.dims.left * scaleX, frame.dims.top * scaleY,
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