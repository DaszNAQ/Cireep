// audio/engine.js
// Audio core: AudioContext, main volume, limiter,
// and small helpers used by the other audio files.
import { settings } from '../state.js';

const readyHooks = [];
export function onAudioReady(fn){ readyHooks.push(fn); }
export function setMU(m){ MU = m; }

export let AC = null;
export let noiseBuf = null;
export let master = null;

export function audio(){
  if(AC){
    if(AC.state === 'suspended'){ const rp = AC.resume(); if(rp && rp.catch) rp.catch(function(){}); }
    return AC;
  }
  try{
    AC = new (window.AudioContext||window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = settings.muted ? 0 : 0.8;
    const comp = AC.createDynamicsCompressor();
    comp.threshold.value = -6; comp.knee.value = 8; comp.ratio.value = 8; comp.attack.value = 0.004; comp.release.value = 0.2;
    const lim = AC.createWaveShaper(); lim.curve = limitCurve();
    master.connect(comp); comp.connect(lim); lim.connect(AC.destination);
    const n = AC.sampleRate * 2, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for(let i=0;i<n;i++) d[i] = Math.random()*2-1;
    noiseBuf = b;
    readyHooks.forEach(function(fn){ fn(); });
  }catch(e){ AC = null; }
  return AC;
}

export function blip(f1,f2,dur,type,vol){
  const a = audio(); if(!a) return;
  const o = a.createOscillator(), g = a.createGain();
  o.type = type||'sine';
  o.frequency.setValueAtTime(f1, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(30,f2), a.currentTime+dur);
  g.gain.setValueAtTime(0.0001, a.currentTime);
  g.gain.exponentialRampToValueAtTime(vol||0.16, a.currentTime+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime+dur);
  o.connect(g); g.connect(master); if(MU) g.connect(MU.send); o.start(); o.stop(a.currentTime+dur+0.02);
}

export function hum(){ blip(70,46,0.5,'triangle',0.1); }

export function stutter(){
  const a = audio(); if(!a || !noiseBuf) return;
  for(let i=0;i<5;i++){
    const t0 = a.currentTime + i*0.09, src = a.createBufferSource();
    src.buffer = noiseBuf;
    const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 + Math.random()*2600; bp.Q.value = 3;
    const g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+0.07);
    src.connect(bp); bp.connect(g); g.connect(master); if(MU) g.connect(MU.send); src.start(t0); src.stop(t0+0.08);
  }
}

export let MU = null;

export function impulse(a, sec, decay){
  const n = Math.floor(a.sampleRate*sec), b = a.createBuffer(2, n, a.sampleRate);
  for(let c=0;c<2;c++){
    let d = b.getChannelData(c), lp = 0;
    for(let i=0;i<n;i++){ lp += ((Math.random()*2-1) - lp)*0.3; d[i] = lp*Math.pow(1 - i/n, decay); }
  }
  return b;
}

export function envG(a, t0, atk, peak, rel){
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0+atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+atk+rel);
  return g;
}

export function pan(a, node, p){
  if(!a.createStereoPanner) return node;
  const sp = a.createStereoPanner(); sp.pan.value = p; node.connect(sp); return sp;
}

const DC = {};

function limitCurve(){
  const n = 4096, c = new Float32Array(n);
  for(let i=0;i<n;i++){
    const x = i*2/(n-1) - 1, ax = Math.abs(x), y = ax < 0.5 ? ax : 0.5 + 0.35*Math.tanh((ax - 0.5)/0.35);
    c[i] = x < 0 ? -y : y;
  }
  return c;
}

function distCurve(k){
  if(DC[k]) return DC[k];
  const n = 2048, c = new Float32Array(n);
  for(let i=0;i<n;i++){ const x = i*2/(n-1) - 1; c[i] = Math.tanh(k*x); }
  return (DC[k] = c);
}

export function dist(a, k){ const w = a.createWaveShaper(); w.curve = distCurve(k); w.oversample = '2x'; return w; }

export function outS(node){ node.connect(master); if(MU) node.connect(MU.send); }

export function panTo(a, node, p0, p1, t0, dur){
  if(!a.createStereoPanner) return node;
  const sp = a.createStereoPanner();
  sp.pan.setValueAtTime(p0 || 0, t0);
  if(p1 !== undefined) sp.pan.linearRampToValueAtTime(p1, t0 + dur);
  node.connect(sp);
  return sp;
}

export function noiseSrc(a, t0, dur){
  const n = a.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
  n.start(t0, Math.random()*1.5); n.stop(t0 + dur + 0.05);
  return n;
}

function unlockAudio(){
  if(!audio()) return;
  ['pointerdown','keydown','touchend'].forEach(function(ev){ window.removeEventListener(ev, unlockAudio, true); });
}

export function initAudio(){
  ['pointerdown', 'keydown', 'touchend'].forEach(function(ev){ window.addEventListener(ev, unlockAudio, true); });
}
