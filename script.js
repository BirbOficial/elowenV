// ══════════════════════════════════════════
// CUSTOM CURSOR
// ══════════════════════════════════════════
const cursorDot  = document.getElementById('cursor-dot');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursorDot.style.left = mouseX + 'px';
  cursorDot.style.top  = mouseY + 'px';
});

// Smooth ring follow
(function animRing(){
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animRing);
})();

// Hover expand
document.querySelectorAll('button, input, a, .info-cell, .redacted').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ══════════════════════════════════════════
// TRON PARTICLE SYSTEM
// ══════════════════════════════════════════
(function(){
  const canvas = document.getElementById('tron-canvas');
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const ZONE = 70, COUNT = 30;
  const particles = [];

  function makeParticle(){
    const side = Math.floor(Math.random()*4);
    let x, y, dx, dy;
    const spd = 0.7 + Math.random()*1.4;
    if(side===0){ x=Math.random()*ZONE; y=Math.random()*H; dx=spd; dy=0; }
    else if(side===1){ x=W-Math.random()*ZONE; y=Math.random()*H; dx=-spd; dy=0; }
    else if(side===2){ x=Math.random()*W; y=Math.random()*ZONE; dx=0; dy=spd; }
    else { x=Math.random()*W; y=H-Math.random()*ZONE; dx=0; dy=-spd; }
    return {
      x, y, dx, dy,
      trail: [], maxTrail: 35+Math.floor(Math.random()*55),
      life: 1, decay: 0.003+Math.random()*0.003,
      size: 1+Math.random()*1.2,
      turnIn: 80+Math.floor(Math.random()*100)
    };
  }

  for(let i=0;i<COUNT;i++) particles.push(makeParticle());

  function tick(){
    ctx.clearRect(0,0,W,H);
    for(let i=0;i<particles.length;i++){
      const p = particles[i];
      p.turnIn--;
      if(p.turnIn<=0){
        const t = Math.random()<0.5?1:-1;
        [p.dx,p.dy] = [-p.dy*t, p.dx*t];
        p.turnIn = 80+Math.floor(Math.random()*100);
      }
      p.trail.push({x:p.x,y:p.y});
      if(p.trail.length>p.maxTrail) p.trail.shift();
      p.x+=p.dx; p.y+=p.dy; p.life-=p.decay;

      for(let j=0;j<p.trail.length-1;j++){
        const a = (j/p.trail.length)*p.life*0.75;
        ctx.beginPath();
        ctx.moveTo(p.trail[j].x,p.trail[j].y);
        ctx.lineTo(p.trail[j+1].x,p.trail[j+1].y);
        ctx.strokeStyle = `rgba(204,0,0,${a})`;
        ctx.lineWidth = p.size*(j/p.trail.length);
        ctx.stroke();
      }
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
      ctx.fillStyle = `rgba(255,80,80,${p.life*0.85})`;
      ctx.fill();

      if(p.life<=0||p.x<-30||p.x>W+30||p.y<-30||p.y>H+30){
        particles[i] = makeParticle();
      }
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

// ══════════════════════════════════════════
// AUDIO — plays on first interaction
// ══════════════════════════════════════════
const ambientEl = document.getElementById('ambient');
ambientEl.volume = 0.70;

let audioStarted = false;
function startAudio(){
  if(audioStarted) return;
  audioStarted = true;
  ambientEl.play().catch(()=>{});
}
// Start audio on ANY interaction — click, keydown, touchstart
['click','keydown','touchstart','mousedown'].forEach(ev =>
  document.addEventListener(ev, startAudio, { once: true })
);

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════
const PASS = 'VVVVVE!5';
const loginBtn  = document.getElementById('login-btn');
const loginPass = document.getElementById('login-pass');

loginBtn.addEventListener('click', tryLogin);
loginPass.addEventListener('keydown', e => { if(e.key==='Enter') tryLogin(); });

function tryLogin(){
  startAudio(); // ensure audio starts on login click
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-error');

  if(!user){
    err.textContent = '⚠ IDENTIFICADOR REQUERIDO';
    err.style.opacity = 1;
    return;
  }
  if(pass !== PASS){
    err.textContent = '⛔ ACESSO NEGADO — CREDENCIAIS INVÁLIDAS';
    err.style.opacity = 1;
    showFractalPopup(false);
    return;
  }
  err.style.opacity = 0;
  acceptLogin();
}

// ── Fractal popup (wrong password)
function showFractalPopup(isSuccess){
  const overlay = document.getElementById('fractal-overlay');
  const popup   = document.getElementById('fractal-popup');
  overlay.style.display = 'block';
  popup.style.display   = 'block';
  requestAnimationFrame(() => popup.classList.add('visible'));

  if(!isSuccess){
    // Wrong password — just show popup, stays until F5
    document.getElementById('login-screen').style.pointerEvents = 'none';
    return;
  }
}

function hideFractalPopup(cb){
  const overlay = document.getElementById('fractal-overlay');
  const popup   = document.getElementById('fractal-popup');
  popup.classList.remove('visible');
  setTimeout(()=>{
    overlay.style.display = 'none';
    popup.style.display   = 'none';
    if(cb) cb();
  }, 500);
}

// ── Accepted login
function acceptLogin(){
  document.getElementById('login-screen').style.display = 'none';
  showFractalPopup(true);
  setTimeout(()=>{
    hideFractalPopup(launchSite);
  }, 5000); // fractal shows for 5s then fades away
}

// ══════════════════════════════════════════
// LAUNCH MAIN SITE
// ══════════════════════════════════════════
function launchSite(){
  document.getElementById('main-site').style.display = 'block';
  buildClearanceBar();
  initScrollReveal();
  initVolControl();
  setFooterDate();
  loadGIF();
  attachHoverCursor();
}

function buildClearanceBar(){
  const bar = document.getElementById('cl-bar');
  for(let i=0;i<6;i++){
    const s = document.createElement('div');
    s.className = 'cl-seg on';
    bar.appendChild(s);
  }
}

function initScrollReveal(){
  const obs = new IntersectionObserver(entries=>{
    entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
  },{threshold:0.08});
  document.querySelectorAll('.section').forEach(s=>obs.observe(s));
}

function initVolControl(){
  const slider = document.getElementById('vol-slider');
  const pct    = document.getElementById('vol-pct');
  slider.addEventListener('input',()=>{
    const v = Math.max(0.10, parseInt(slider.value)/100);
    ambientEl.volume = v;
    pct.textContent = slider.value+'%';
  });
}

function setFooterDate(){
  const d = new Date();
  document.getElementById('footer-date').textContent =
    `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} // DOCUMENTO CONTROLADO`;
}

function attachHoverCursor(){
  document.querySelectorAll('.info-cell, #vol-slider, .login-btn, .redacted').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ══════════════════════════════════════════
// GIF — simple image tag approach
// Uses a hidden <img> tag; canvas renders it frame by frame
// This avoids gifuct-js CDN issues on Vercel/GitHub Pages
// ══════════════════════════════════════════
let gifImage = null;
let gifLoaded = false;

function loadGIF(){
  const canvas = document.getElementById('char-canvas');
  const ctx    = canvas.getContext('2d');

  // Method 1: just draw the gif as a static image to start
  gifImage = new Image();
  gifImage.crossOrigin = 'anonymous';

  gifImage.onload = () => {
    gifLoaded = true;
    ctx.clearRect(0, 0, 720, 720);
    ctx.drawImage(gifImage, 0, 0, 720, 720);
    tryGifuct();
  };

  gifImage.onerror = () => {
    // GIF failed to load — skip silently
    console.warn('character.gif not found');
  };

  gifImage.src = 'character.gif';
}

// ── Try gifuct for scroll-controlled frames
let gifFrames = [];
let currentGifFrame = -1;
const offscreenCanvas = document.createElement('canvas');
const offCtx = offscreenCanvas.getContext('2d');

// Accumulated canvas for disposal method 1
const compositeCanvas = document.createElement('canvas');
compositeCanvas.width = 720;
compositeCanvas.height = 720;
const compositeCtx = compositeCanvas.getContext('2d');

function tryGifuct(){
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.min.js';
  s.onload = fetchAndParseGIF;
  s.onerror = () => console.warn('gifuct-js CDN failed, using static GIF');
  document.head.appendChild(s);
}

function fetchAndParseGIF(){
  fetch('character.gif')
    .then(r => {
      if(!r.ok) throw new Error('GIF fetch failed');
      return r.arrayBuffer();
    })
    .then(buf => {
      const gif = window.parseGIF(buf);
      const frames = window.decompressFrames(gif, true);
      if(!frames || frames.length === 0) return;
      gifFrames = frames;

      // Set offscreen canvas to first frame dimensions
      offscreenCanvas.width  = frames[0].dims.width;
      offscreenCanvas.height = frames[0].dims.height;

      // Draw first frame
      renderGifFrame(0);
      window.addEventListener('scroll', onScrollGIF, {passive:true});
    })
    .catch(err => console.warn('GIF parse error:', err));
}

function renderGifFrame(index){
  if(!gifFrames.length) return;
  const frame = gifFrames[index];
  if(!frame) return;

  const canvas = document.getElementById('char-canvas');
  const ctx    = canvas.getContext('2d');

  // Draw patch to offscreen
  const imageData = offCtx.createImageData(frame.dims.width, frame.dims.height);
  imageData.data.set(frame.patch);
  offCtx.putImageData(imageData, 0, 0);

  // For disposal=2 (restore to background), clear composite first
  if(frame.disposalType === 2){
    compositeCtx.clearRect(0, 0, 720, 720);
  }

  // Scale offscreen patch onto composite canvas at correct position
  compositeCtx.drawImage(
    offscreenCanvas,
    0, 0, frame.dims.width, frame.dims.height,
    frame.dims.left * (720 / gifFrames[0].dims.width),
    frame.dims.top  * (720 / gifFrames[0].dims.height),
    frame.dims.width  * (720 / gifFrames[0].dims.width),
    frame.dims.height * (720 / gifFrames[0].dims.height)
  );

  // Draw composite to main canvas
  ctx.clearRect(0, 0, 720, 720);
  ctx.drawImage(compositeCanvas, 0, 0);
}

function onScrollGIF(){
  if(!gifFrames.length) return;
  const scrollTop  = window.scrollY;
  const maxScroll  = Math.max(1, document.body.scrollHeight - window.innerHeight);
  const progress   = Math.min(scrollTop / maxScroll, 1);
  const fi = Math.floor(progress * (gifFrames.length - 1));
  if(fi !== currentGifFrame){
    currentGifFrame = fi;
    renderGifFrame(fi);
  }
}
