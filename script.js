// ══════════════════════════════════════════
// TRON PARTICLE SYSTEM (border-hugging)
// ══════════════════════════════════════════
(function(){
  const canvas = document.getElementById('tron-canvas');
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize(){ W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const ZONE = 70;
  const COUNT = 30;
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
// HOVER SFX
// ══════════════════════════════════════════
const ambientEl = document.getElementById('ambient');

function playHover(){
  const snd = new Audio('ambient.mp3');
  snd.volume = 0.12;
  snd.currentTime = 2.0;
  snd.play().catch(()=>{});
  setTimeout(()=>{ snd.pause(); snd.src=''; }, 400);
}
function attachHover(el){ el.addEventListener('mouseenter', playHover); }

// ══════════════════════════════════════════
// LOGIN
// ══════════════════════════════════════════
const PASS = 'VVVVVE!5';
const loginBtn  = document.getElementById('login-btn');
const loginPass = document.getElementById('login-pass');
attachHover(loginBtn);
loginBtn.addEventListener('click', tryLogin);
loginPass.addEventListener('keydown', e=>{ if(e.key==='Enter') tryLogin(); });

function tryLogin(){
  const user = document.getElementById('login-user').value.trim();
  const pass = document.getElementById('login-pass').value;
  const err  = document.getElementById('login-error');
  if(!user){ err.textContent='⚠ IDENTIFICADOR REQUERIDO'; err.style.opacity=1; return; }
  if(pass !== PASS){
    err.textContent='⛔ ACESSO NEGADO — CREDENCIAIS INVÁLIDAS';
    err.style.opacity=1;
    const fs  = document.getElementById('fractal-screen');
    const img = document.getElementById('fractal-img');
    fs.style.display='block';
    img.style.opacity=1;
    document.getElementById('login-screen').style.pointerEvents='none';
    return;
  }
  err.style.opacity=0;
  acceptLogin();
}

function acceptLogin(){
  document.getElementById('login-screen').style.display='none';
  const fs  = document.getElementById('fractal-screen');
  const img = document.getElementById('fractal-img');
  fs.style.display='block';
  img.style.opacity=1;

  // ── AUDIO: start as soon as the user interacts (login click already counts)
  ambientEl.volume = 0.70;
  ambientEl.play().catch(()=>{});

  setTimeout(()=>{
    img.style.opacity=0;
    setTimeout(()=>{
      fs.style.display='none';
      launchSite();
    }, 2600);
  }, 15000);
}

// ══════════════════════════════════════════
// LAUNCH MAIN SITE
// ══════════════════════════════════════════
function launchSite(){
  document.getElementById('main-site').style.display='block';
  buildClearanceBar();
  initScrollReveal();
  initVolControl();
  setFooterDate();
  loadGIF();
  attachAllHover();
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
  attachHover(slider);
}

function setFooterDate(){
  const d = new Date();
  document.getElementById('footer-date').textContent =
    `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} // DOCUMENTO CONTROLADO`;
}

function attachAllHover(){
  document.querySelectorAll('.info-cell, #vol-slider').forEach(attachHover);
}

// ══════════════════════════════════════════
// GIF SCROLL CONTROL via gifuct-js
// ══════════════════════════════════════════
let gifFrames = [];
let currentGifFrame = -1;
const offscreenCanvas = document.createElement('canvas');
const offCtx = offscreenCanvas.getContext('2d');

function loadGIF(){
  const s = document.createElement('script');
  s.src = 'https://cdn.jsdelivr.net/npm/gifuct-js@2.1.2/dist/gifuct-js.min.js';
  s.onload = fetchAndParseGIF;
  s.onerror = gifFallback;
  document.head.appendChild(s);
}

function fetchAndParseGIF(){
  fetch('character.gif')
    .then(r=>r.arrayBuffer())
    .then(buf=>{
      const gif = window.parseGIF(buf);
      gifFrames = window.decompressFrames(gif, true);
      offscreenCanvas.width  = gifFrames[0].dims.width;
      offscreenCanvas.height = gifFrames[0].dims.height;
      drawGifFrame(0);
      window.addEventListener('scroll', onScrollGIF, {passive:true});
    })
    .catch(gifFallback);
}

function drawGifFrame(index){
  const frame = gifFrames[index];
  if(!frame) return;
  const imageData = offCtx.createImageData(frame.dims.width, frame.dims.height);
  imageData.data.set(frame.patch);
  offCtx.putImageData(imageData, 0, 0);

  const mainCanvas = document.getElementById('char-canvas');
  const ctx = mainCanvas.getContext('2d');
  if(index===0) ctx.clearRect(0,0,720,720);
  ctx.drawImage(
    offscreenCanvas,
    frame.dims.left, frame.dims.top,
    frame.dims.width, frame.dims.height,
    frame.dims.left, frame.dims.top,
    frame.dims.width, frame.dims.height
  );
}

function onScrollGIF(){
  if(!gifFrames.length) return;
  const scrollTop = window.scrollY;
  const maxScroll = Math.max(1, document.body.scrollHeight - window.innerHeight);
  const progress  = Math.min(scrollTop/maxScroll, 1);
  const fi = Math.floor(progress*(gifFrames.length-1));
  if(fi!==currentGifFrame){
    currentGifFrame = fi;
    drawGifFrame(fi);
  }
}

function gifFallback(){
  const canvas = document.getElementById('char-canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.src = 'character.gif';
  img.onload = ()=> ctx.drawImage(img,0,0,720,720);
}
