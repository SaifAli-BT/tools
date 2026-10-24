gsap.registerPlugin(ScrollTrigger);
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Preloader ---------- */
window.addEventListener('load', () => {
  const pre = document.getElementById('preloader');
  const helix = pre.querySelector('.helix-strand');
  if(!reduceMotion){
    gsap.to(helix, {rotate: 360, duration: 1.4, ease:'power1.inOut', transformOrigin:'50% 50%'});
  }
  setTimeout(() => { pre.classList.add('done'); startHero(); }, reduceMotion ? 100 : 1500);
});

/* ---------- Lenis smooth scroll ---------- */
if(!reduceMotion && window.Lenis){
  const lenis = new Lenis({smoothWheel:true, lerp:0.11});
  function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
}

/* ---------- Magnetic cursor ---------- */
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');
if(window.matchMedia('(hover:hover)').matches){
  let mx=0,my=0, rx=0, ry=0;
  window.addEventListener('mousemove', e=>{
    mx=e.clientX; my=e.clientY;
    dot.style.left=mx+'px'; dot.style.top=my+'px';
  });
  (function loop(){
    rx += (mx-rx)*0.18; ry += (my-ry)*0.18;
    ring.style.left=rx+'px'; ring.style.top=ry+'px';
    requestAnimationFrame(loop);
  })();
  document.querySelectorAll('a, button, .nav-item, .proj-card-outer').forEach(el=>{
    el.addEventListener('mouseenter', ()=>ring.classList.add('active'));
    el.addEventListener('mouseleave', ()=>ring.classList.remove('active'));
  });
}

/* ---------- Ripple on buttons ---------- */
document.querySelectorAll('.btn, .filter-btn').forEach(btn=>{
  btn.addEventListener('click', function(e){
    const rect = this.getBoundingClientRect();
    const r = document.createElement('span');
    r.className='ripple';
    r.style.left = (e.clientX-rect.left)+'px';
    r.style.top = (e.clientY-rect.top)+'px';
    this.style.position='relative';
    this.appendChild(r);
    setTimeout(()=>r.remove(),650);
  });
});

/* ---------- Card mouse-follow glow + tilt ---------- */
document.querySelectorAll('.glass-card, .proj-card-outer').forEach(card=>{
  card.addEventListener('mousemove', e=>{
    const rect = card.getBoundingClientRect();
    const x = e.clientX-rect.left, y = e.clientY-rect.top;
    const target = card.classList.contains('glass-card') ? card : card.querySelector('.proj-face');
    if(target){ target.style.setProperty('--mx', x+'px'); target.style.setProperty('--my', y+'px'); }
  });
});
/* ---------- Project card flip state + tilt ---------- */
const flipState = new WeakMap(); // outer -> boolean flipped

document.querySelectorAll('.proj-card-outer').forEach(outer=>{
  const inner = outer.querySelector('.proj-card-inner');
  flipState.set(outer, false);
  outer.style.cursor = 'pointer';

  if(!reduceMotion){
    outer.addEventListener('mousemove', e=>{
      if(flipState.get(outer)) return;
      const rect = outer.getBoundingClientRect();
      const px = (e.clientX-rect.left)/rect.width - 0.5;
      const py = (e.clientY-rect.top)/rect.height - 0.5;
      gsap.to(inner, {rotateY: px*10, rotateX: -py*10, duration:.4, ease:'power2.out'});
    });
    outer.addEventListener('mouseleave', ()=>{
      if(flipState.get(outer)){
        gsap.to(inner, {rotateX:0, duration:.5, ease:'power2.out'});
      } else {
        gsap.to(inner, {rotateY:0, rotateX:0, duration:.5, ease:'power2.out'});
      }
    });
  }

  outer.addEventListener('click', ()=>{
    const isFlipped = flipState.get(outer);
    const dur = reduceMotion ? 0 : 0.7;
    if(!isFlipped){
      gsap.to(inner, {rotateY:180, rotateX:0, duration:dur, ease:'power3.inOut'});
      flipState.set(outer, true);
    } else {
      gsap.to(inner, {rotateY:0, rotateX:0, duration:dur, ease:'power3.inOut'});
      flipState.set(outer, false);
    }
  });
});

/* ---------- Sidebar nav + tab switching ---------- */
const navItems = document.querySelectorAll('.nav-item');
const panels = document.querySelectorAll('.panel');
const navGlow = document.getElementById('navGlow');
const navList = document.getElementById('navList');
const tabOrder = ['home','about','experience','projects','skills','contact'];

function positionGlow(item){
  if(!item) return;
  const listRect = navList.getBoundingClientRect();
  const rect = item.getBoundingClientRect();
  gsap.to(navGlow, {top: rect.top-listRect.top, height: rect.height, duration:.45, ease:'power3.out'});
}

function activateTab(tab, pushHash=true){
  const item = document.querySelector(`.nav-item[data-tab="${tab}"]`);
  navItems.forEach(n=>n.removeAttribute('aria-current'));
  if(item) item.setAttribute('aria-current','page');
  positionGlow(item);

  const current = document.querySelector('.panel.active');
  const next = document.getElementById('panel-'+tab);
  if(!next || next === current) return;

  if(reduceMotion){
    if(current) current.classList.remove('active');
    next.classList.add('active');
  } else {
    const tl = gsap.timeline();
    if(current){
      tl.to(current, {opacity:0, y:-14, duration:.28, ease:'power2.in', onComplete:()=>{current.classList.remove('active'); current.style.cssText='';}});
    }
    tl.set(next, {opacity:0, y:14});
    tl.add(()=>{ next.classList.add('active'); }, current ? '-=0.02' : 0);
    tl.to(next, {opacity:1, y:0, duration:.4, ease:'power2.out'});
  }

  runPanelAnimations(tab);
  if(pushHash) history.replaceState(null,'','#'+tab);
  closeMobileSidebar();
}

navItems.forEach(item=>{
  item.addEventListener('click', e=>{ e.preventDefault(); activateTab(item.dataset.tab); });
});
document.querySelectorAll('.js-tab-link').forEach(link=>{
  link.addEventListener('click', e=>{ e.preventDefault(); activateTab(link.dataset.tab); });
});

navList.addEventListener('keydown', e=>{
  const idx = tabOrder.indexOf(document.querySelector('.nav-item[aria-current="page"]').dataset.tab);
  if(e.key==='ArrowDown'){ e.preventDefault(); activateTab(tabOrder[(idx+1)%tabOrder.length]); }
  if(e.key==='ArrowUp'){ e.preventDefault(); activateTab(tabOrder[(idx-1+tabOrder.length)%tabOrder.length]); }
});

window.addEventListener('resize', ()=>{
  positionGlow(document.querySelector('.nav-item[aria-current="page"]'));
});

/* Mobile sidebar */
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
function openMobileSidebar(){ sidebar.classList.add('open'); sidebarOverlay.classList.add('show'); sidebarToggle.setAttribute('aria-expanded','true'); }
function closeMobileSidebar(){ sidebar.classList.remove('open'); sidebarOverlay.classList.remove('show'); sidebarToggle.setAttribute('aria-expanded','false'); }
sidebarToggle.addEventListener('click', ()=> sidebar.classList.contains('open') ? closeMobileSidebar() : openMobileSidebar());
sidebarOverlay.addEventListener('click', closeMobileSidebar);

/* Initial tab from hash */
const initialTab = tabOrder.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'home';
if(initialTab !== 'home'){
  document.querySelectorAll('.panel').forEach(p=>p.classList.remove('active'));
  document.getElementById('panel-'+initialTab).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${initialTab}"]`).setAttribute('aria-current','page');
}
window.addEventListener('load', ()=>{ positionGlow(document.querySelector('.nav-item[aria-current="page"]')); });

/* ---------- Hero letter stagger + typed.js ---------- */
function startHero(){
  const nameEl = document.getElementById('heroName');
  const text = nameEl.textContent;
  nameEl.innerHTML = text.split('').map(ch=>`<span class="letter">${ch===' '?'&nbsp;':ch}</span>`).join('');
  if(!reduceMotion){
    gsap.from(nameEl.querySelectorAll('.letter'), {opacity:0, y:26, duration:.6, stagger:.028, ease:'power3.out'});
  }
  if(window.Typed){
    new Typed('#typedRoles', {
      strings:['Biotechnology Student','Bioinformatics Enthusiast','Computational Genomics Explorer','PCR &amp; Primer Design Specialist'],
      typeSpeed:42, backSpeed:22, backDelay:1400, loop:true,
      cursorChar:'|', autoInsertCss:true
    });
  }
  runPanelAnimations('home');
}

/* ---------- Stat counters ---------- */
let statsCounted = false;
function countStats(){
  if(statsCounted) return; statsCounted=true;
  document.querySelectorAll('.stat-num').forEach(el=>{
    const target = +el.dataset.count;
    const obj = {v:0};
    gsap.to(obj, {v:target, duration:1.4, ease:'power2.out', onUpdate:()=>{ el.textContent = Math.round(obj.v); }});
  });
}

/* ---------- Scroll / entry reveals per panel ---------- */
const animatedPanels = new Set();
function runPanelAnimations(tab){
  if(tab==='home') countStats();

  const panel = document.getElementById('panel-'+tab);
  if(!panel) return;
  const cards = panel.querySelectorAll('.glass-card, .proj-card-outer, .tl-item, .exp-item');
  if(!reduceMotion){
    gsap.fromTo(cards, {opacity:0, y:22}, {opacity:1, y:0, duration:.55, stagger:.06, ease:'power2.out', overwrite:'auto'});
  }

  if(tab==='skills') animateSkillBars(panel);
  if(tab==='skills' && !animatedPanels.has('radar')){ animatedPanels.add('radar'); initRadarChart(); }

  scrambleHeadings(panel);
}

/* ---------- Skill bars ---------- */
let skillsFilled = false;
function animateSkillBars(panel){
  if(skillsFilled) return; skillsFilled = true;
  panel.querySelectorAll('.skill-row').forEach(row=>{
    const fill = row.querySelector('.skill-fill');
    const val = row.dataset.value;
    if(reduceMotion){ fill.style.width = val+'%'; }
    else gsap.to(fill, {width: val+'%', duration:1.1, ease:'elastic.out(1,0.75)', delay:.1});
  });
}

/* ---------- Radar chart ---------- */
function initRadarChart(){
  const ctx = document.getElementById('radarChart');
  if(!ctx || !window.Chart) return;
  new Chart(ctx, {
    type:'radar',
    data:{
      labels:['Lab Techniques','Bioinformatics','Programming','Analytical'],
      datasets:[{
        label:'Proficiency',
        data:[85,75,66,68],
        backgroundColor:'rgba(0,229,255,0.14)',
        borderColor:'#00e5ff',
        pointBackgroundColor:'#9d4edd',
        borderWidth:2
      }]
    },
    options:{
      responsive:true,
      scales:{
        r:{
          angleLines:{color:'rgba(255,255,255,.08)'},
          grid:{color:'rgba(255,255,255,.08)'},
          pointLabels:{color:'#93a1bd', font:{size:11}},
          ticks:{display:false, backdropColor:'transparent'},
          min:0, max:100
        }
      },
      plugins:{legend:{display:false}}
    }
  });
}

/* ---------- Text scramble on headings ---------- */
const scrambled = new WeakSet();
function scrambleHeadings(panel){
  const chars='ACGT0123456789';
  panel.querySelectorAll('h2, .exp-org').forEach(h=>{
    if(scrambled.has(h) || reduceMotion) return;
    scrambled.add(h);
    const original = h.textContent;
    let frame = 0;
    const totalFrames = 16;
    const interval = setInterval(()=>{
      frame++;
      h.textContent = original.split('').map((c,i)=>{
        if(c===' ') return ' ';
        if(i < (frame/totalFrames)*original.length) return original[i];
        return chars[Math.floor(Math.random()*chars.length)];
      }).join('');
      if(frame>=totalFrames){ clearInterval(interval); h.textContent = original; }
    }, 28);
  });
}

/* ---------- Project filter + search ---------- */
const filterBtns = document.querySelectorAll('.filter-btn');
const projSearch = document.getElementById('projSearch');
const projCards = document.querySelectorAll('.proj-card-outer');
let currentFilter = 'all';

function applyProjectFilters(){
  const q = projSearch.value.trim().toLowerCase();
  let visibleCount = 0;
  projCards.forEach(card=>{
    const matchesCat = currentFilter==='all' || card.dataset.cat===currentFilter;
    const matchesSearch = !q || card.dataset.title.includes(q);
    const show = matchesCat && matchesSearch;
    card.classList.toggle('hidden', !show);
    if(show) visibleCount++;
  });
  let noRes = document.getElementById('noResultsMsg');
  if(visibleCount===0){
    if(!noRes){
      noRes = document.createElement('div');
      noRes.id='noResultsMsg'; noRes.className='no-results';
      noRes.textContent='No projects match your search.';
      document.getElementById('projGrid').appendChild(noRes);
    }
  } else if(noRes){ noRes.remove(); }
}
filterBtns.forEach(btn=>{
  btn.addEventListener('click', ()=>{
    filterBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    applyProjectFilters();
  });
});
projSearch.addEventListener('input', applyProjectFilters);

/* ---------- Contact form validation + submit ---------- */
const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');

function setError(fieldId, msg){
  const row = document.getElementById(fieldId).closest('.form-row');
  const err = document.getElementById('err-'+fieldId.replace('cf-',''));
  if(msg){ row.classList.add('error'); err.textContent = msg; }
  else { row.classList.remove('error'); err.textContent = ''; }
}

function validateForm(){
  let valid = true;
  const name = document.getElementById('cf-name').value.trim();
  const email = document.getElementById('cf-email').value.trim();
  const subject = document.getElementById('cf-subject').value.trim();
  const message = document.getElementById('cf-message').value.trim();

  if(name.length < 2){ setError('cf-name','Please enter your name.'); valid=false; } else setError('cf-name','');
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if(!emailRe.test(email)){ setError('cf-email','Please enter a valid email address.'); valid=false; } else setError('cf-email','');
  if(subject.length < 2){ setError('cf-subject','Please add a subject.'); valid=false; } else setError('cf-subject','');
  if(message.length < 10){ setError('cf-message','Message should be at least 10 characters.'); valid=false; } else setError('cf-message','');

  return valid;
}
['cf-name','cf-email','cf-subject','cf-message'].forEach(id=>{
  document.getElementById(id).addEventListener('blur', validateForm);
});

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  statusEl.className='form-status';
  if(!validateForm()) return;

  const btn = document.getElementById('cf-submit');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending…';
  btn.disabled = true;

  try{
    const res = await fetch(form.action, {
      method:'POST',
      headers:{'Accept':'application/json'},
      body:new FormData(form)
    });
    if(res.ok){
      statusEl.textContent = "Message sent — thanks for reaching out! I'll reply soon.";
      statusEl.className='form-status success';
      form.reset();
      fireConfetti();
    } else {
      statusEl.textContent = 'Something went wrong sending your message. Please try emailing directly.';
      statusEl.className='form-status failure';
    }
  } catch(err){
    statusEl.textContent = 'Network error — please try emailing saifali15874@gmail.com directly.';
    statusEl.className='form-status failure';
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
});

/* ---------- Confetti (only on successful submit) ---------- */
function fireConfetti(){
  if(reduceMotion) return;
  const canvas = document.getElementById('confetti-canvas');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
  const ctx = canvas.getContext('2d');
  const colors = ['#00e5ff','#9d4edd','#39ff14','#f0f4ff'];
  const pieces = Array.from({length:120}, ()=>({
    x: canvas.width/2, y: canvas.height/2,
    vx:(Math.random()-0.5)*14, vy:(Math.random()-1.4)*14,
    size: Math.random()*6+3, color: colors[Math.floor(Math.random()*colors.length)],
    rot: Math.random()*360, vr:(Math.random()-0.5)*14, life:0
  }));
  let frame=0;
  function tick(){
    frame++;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    pieces.forEach(p=>{
      p.vy += 0.32; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life++;
      ctx.save();
      ctx.translate(p.x,p.y); ctx.rotate(p.rot*Math.PI/180);
      ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, 1-p.life/90);
      ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);
      ctx.restore();
    });
    if(frame<90) requestAnimationFrame(tick);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  tick();
}
window.addEventListener('resize', ()=>{
  const canvas = document.getElementById('confetti-canvas');
  canvas.width = window.innerWidth; canvas.height = window.innerHeight;
});
