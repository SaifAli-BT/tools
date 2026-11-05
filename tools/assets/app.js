/* Shared helpers for all tools */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function fmtBytes(b) {
  if (b < 1024) return b + ' B';
  const u = ['KB', 'MB', 'GB']; let i = -1;
  do { b /= 1024; i++; } while (b >= 1024 && i < u.length - 1);
  return b.toFixed(b < 10 ? 2 : 1) + ' ' + u[i];
}
function fmtNum(n, d = 2) {
  if (!isFinite(n)) return '—';
  return Number(n.toFixed(d)).toLocaleString('en-US', { maximumFractionDigits: d });
}
function baseName(n) { return n.replace(/\.[^.]+$/, ''); }
function extFor(type) { return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[type] || 'bin'; }

function download(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
}

let toastTimer;
function toast(msg) {
  let t = $('.toast');
  if (!t) { t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

async function copyText(text, src) {
  try { await navigator.clipboard.writeText(text); toast('Copied to clipboard'); }
  catch (e) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
    ta.remove();
    if (ok) toast('Copied to clipboard');
    else { if (src && src.select) src.select(); toast('Press Ctrl+C to copy'); }
  }
}

function setupDrop(zone, input, onFiles) {
  zone.addEventListener('click', e => { if (e.target !== input) input.click(); });
  zone.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); } });
  ['dragenter', 'dragover'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.add('over'); }));
  ['dragleave', 'drop'].forEach(ev => zone.addEventListener(ev, e => { e.preventDefault(); zone.classList.remove('over'); }));
  zone.addEventListener('drop', e => { const f = [...e.dataTransfer.files]; if (f.length) onFiles(f); });
  input.addEventListener('change', () => { const f = [...input.files]; input.value = ''; if (f.length) onFiles(f); });
}

function loadImage(file) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error('This file could not be read as an image.'));
    img.src = URL.createObjectURL(file);
  });
}
function canvasToBlob(canvas, type, quality) {
  return new Promise(r => canvas.toBlob(r, type, quality));
}
function debounce(fn, ms = 250) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function store(key, val) {
  try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
}

function beep(times = 3) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    for (let i = 0; i < times; i++) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 880;
      o.connect(g); g.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.45;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o.start(t); o.stop(t + 0.4);
    }
  } catch (e) {}
}

/* load a library only when a tool needs it */
const LIBS = {
  pdflib: 'https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js',
  pdfjs: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  pdfjsWorker: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  jszip: 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
  mammoth: 'https://cdn.jsdelivr.net/npm/mammoth@1.6.0/mammoth.browser.min.js',
  xlsx: 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
  html2pdf: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
};
const _loaded = {};
function loadScript(key) {
  const url = LIBS[key] || key;
  if (!_loaded[url]) _loaded[url] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = url;
    s.onload = res; s.onerror = () => { delete _loaded[url]; rej(new Error('Could not load a required component. Check your internet connection and try again.')); };
    document.head.appendChild(s);
  });
  return _loaded[url];
}
async function getPdfjs() {
  await loadScript('pdfjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc = LIBS.pdfjsWorker;
  return pdfjsLib;
}

/* theme toggle */
(function () {
  const root = document.documentElement;
  const saved = store('tk-theme');
  if (saved === 'dark' || saved === 'light') root.setAttribute('data-theme', saved);
  document.addEventListener('DOMContentLoaded', () => {
    const b = $('#themeToggle'); if (!b) return;
    b.addEventListener('click', () => {
      const cur = root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next); store('tk-theme', next);
    });
    const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  });
})();
