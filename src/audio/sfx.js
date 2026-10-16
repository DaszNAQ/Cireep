// Sound effects: hit, ice, fire, warnings and UI.
import { AC, MU, audio, blip, envG, hum, master, noiseBuf, noiseSrc, outS, panTo } from './engine.js';
import { choirNote, noteHz, whisper } from './music.js';
import { braam, datamosh, sfxSwell } from './synth.js';
import { SEMI } from '../config.js';
import { S } from '../state.js';

function impactAt(t, vol){
  if(!MU) return;
  const a = AC, o = a.createOscillator(), g = a.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(64, t); o.frequency.exponentialRampToValueAtTime(24, t+0.9);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.012); g.gain.exponentialRampToValueAtTime(0.0001, t+0.95);
  o.connect(g); g.connect(master); g.connect(MU.send); o.start(t); o.stop(t+1);
  const s = a.createBufferSource(), lp = a.createBiquadFilter(), g2 = a.createGain();
  s.buffer = noiseBuf; lp.type = 'lowpass'; lp.frequency.value = 400;
  g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(vol*1.2, t+0.01); g2.gain.exponentialRampToValueAtTime(0.0001, t+0.35);
  s.connect(lp); lp.connect(g2); g2.connect(master); s.start(t, Math.random()); s.stop(t+0.4);
}

export function impact(vol){ if(MU) impactAt(AC.currentTime, vol); }

function thump(vol){
  if(!MU) return;
  const a = AC, t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t+0.14);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.008); g.gain.exponentialRampToValueAtTime(0.0001, t+0.2);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+0.22);
}

export function riser(dur){
  if(!MU){ hum(); return; }
  const a = AC, t0 = a.currentTime, src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
  src.buffer = noiseBuf; src.loop = true; bp.type = 'bandpass'; bp.Q.value = 2;
  bp.frequency.setValueAtTime(180, t0); bp.frequency.exponentialRampToValueAtTime(3200, t0+dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.1, t0+dur); g.gain.setValueAtTime(0.0001, t0+dur+0.02);
  src.connect(bp); bp.connect(g); g.connect(master); g.connect(MU.send);
  src.start(t0); src.stop(t0+dur+0.05);
  [0, 17].forEach(function(det){
    const o = a.createOscillator(), lp = a.createBiquadFilter(), og = a.createGain();
    o.type = 'sawtooth'; o.detune.value = det;
    o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(280, t0+dur);
    lp.type = 'lowpass'; lp.frequency.value = 900;
    og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.035, t0+dur); og.gain.setValueAtTime(0.0001, t0+dur+0.02);
    o.connect(lp); lp.connect(og); og.connect(master); og.connect(MU.send); o.start(t0); o.stop(t0+dur+0.05);
  });
  choirNote(noteHz(0, 1), 0.1, dur + 2.5);
  choirNote(noteHz(1, 1), 0.08, dur + 2.5);
  if(S.phase >= 2) braam(t0 + dur, 0.28, 1.3);
  impactAt(t0 + dur, 0.25);
}

export function infect(){
  if(!MU) return;
  const a = AC, t0 = a.currentTime + 0.1, dur = 3.2;
  [0, 23].forEach(function(det){
    const o = a.createOscillator(), lp = a.createBiquadFilter(), g = a.createGain();
    o.type = 'sawtooth'; o.detune.value = det;
    o.frequency.setValueAtTime(130, t0); o.frequency.exponentialRampToValueAtTime(52, t0+dur);
    lp.type = 'lowpass'; lp.frequency.value = 600;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0+0.4); g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    o.connect(lp); lp.connect(g); g.connect(master); g.connect(MU.send); o.start(t0); o.stop(t0+dur+0.05);
  });
  choirNote(noteHz(0, 1), 0.14, 6); choirNote(noteHz(1, 1), 0.12, 6); choirNote(noteHz(0, 2)*1.4142, 0.09, 6);
  datamosh(t0, 0.35, 0.12);
  whisper(0.9, true); whisper(1.9, true); whisper(2.8, true);
}

export function chime(c){
  const k = Math.min(c, 13), f = 587.33 * Math.pow(2, (SEMI[k % 7] + 12*Math.floor(k/7)) / 12);
  blip(f, f*0.985, 0.3, 'sine', 0.2);
  blip(f*2.76, f*2.7, 0.16, 'sine', 0.07);
  blip(f*0.5, f*0.48, 0.45, 'sine', 0.08);
  if(c > 6 && Math.random() < 0.3) blip(f*1.0595, f*1.05, 0.25, 'sine', 0.05);
}

export function stab(){
  const a = audio(); if(!a) return;
  const t0 = a.currentTime, g = envG(a, t0, 0.006, 0.16, 0.22), lp = a.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 1400;
  [220, 311.13, 233.08].forEach(function(f){
    const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (Math.random()-0.5)*20;
    o.connect(lp); o.start(t0); o.stop(t0 + 0.3);
  });
  lp.connect(g); outS(g);
  thump(0.3);
}

export function iceSound(){
  const a = audio(); if(!a || !noiseBuf) return;
  const t0 = a.currentTime;
  [2200, 3320, 4950, 6200].forEach(function(f, i){
    const o = a.createOscillator(), g = a.createGain(), ts = t0 + i*0.03;
    o.type = 'sine'; o.frequency.value = f*(1 + (Math.random()-0.5)*0.01);
    g.gain.setValueAtTime(0.0001, ts); g.gain.exponentialRampToValueAtTime(0.07, ts + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, ts + 0.6);
    o.connect(g); outS(g); o.start(ts); o.stop(ts + 0.65);
  });
  const n = noiseSrc(a, t0, 0.3), hp = a.createBiquadFilter(), g2 = a.createGain();
  hp.type = 'highpass'; hp.frequency.value = 3500;
  g2.gain.setValueAtTime(0.0001, t0); g2.gain.exponentialRampToValueAtTime(0.25, t0 + 0.004); g2.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
  n.connect(hp); hp.connect(g2); outS(g2);
  sfxSwell(t0, 0.7, 0.12, 6000, 700, -0.3, 0.3, true);
  blip(120, 40, 0.5, 'sine', 0.2);
}

export function fireSound(){
  const a = audio(); if(!a || !noiseBuf) return;
  const t0 = a.currentTime;
  sfxSwell(t0, 0.5, 0.5, 300, 2600);
  const n = noiseSrc(a, t0, 0.9), lp = a.createBiquadFilter(), g = a.createGain();
  lp.type = 'lowpass'; lp.frequency.value = 260;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.6, t0 + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.9);
  n.connect(lp); lp.connect(g); outS(g);
  for(let i=0;i<14;i++){
    const tc = t0 + 0.05 + Math.random()*0.85, cn = noiseSrc(a, tc, 0.012), cb = a.createBiquadFilter(), cg = a.createGain();
    cb.type = 'bandpass'; cb.frequency.value = 2500 + Math.random()*2000; cb.Q.value = 3;
    cg.gain.setValueAtTime(0.0001, tc); cg.gain.exponentialRampToValueAtTime(0.2 + Math.random()*0.25, tc + 0.002); cg.gain.exponentialRampToValueAtTime(0.0001, tc + 0.012);
    cn.connect(cb); cb.connect(cg); outS(panTo(a, cg, (Math.random()-0.5)*1.4, undefined, tc, 0));
  }
  blip(180, 50, 0.6, 'sawtooth', 0.1);
}

export function warble(dur){
  const a = audio(); if(!a) return;
  const t0 = a.currentTime, g = envG(a, t0, dur*0.85, 0.16, dur*0.15), am = a.createGain(), lf = a.createOscillator(), lg = a.createGain();
  am.gain.value = 0.6; lf.frequency.value = 7; lg.gain.value = 0.4; lf.connect(lg); lg.connect(am.gain);
  [130.8, 138.6].forEach(function(f){
    const o = a.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(f, t0); o.frequency.linearRampToValueAtTime(f*1.18, t0 + dur);
    o.connect(am); o.start(t0); o.stop(t0 + dur + 0.05);
  });
  lf.start(t0); lf.stop(t0 + dur + 0.05); am.connect(g); outS(g);
}

export function invStart(){
  const a = audio(); if(!a || !noiseBuf) return;
  blip(260, 40, 0.35, 'sawtooth', 0.18);
  sfxSwell(a.currentTime, 0.2, 0.2, 400, 4000);
  whisper(0.05, true);
}

export function fakeSound(){
  const a = audio(); if(!a || !noiseBuf) return;
  const t0 = a.currentTime;
  whisper(0, true);
  [1900, 2010].forEach(function(f){
    const o = a.createOscillator(), g = envG(a, t0, 0.02, 0.04, 0.25);
    o.type = 'sine'; o.frequency.value = f; o.connect(g); outS(g); o.start(t0); o.stop(t0 + 0.3);
  });
}

export function countTick(n){
  const a = audio(); if(!a || !noiseBuf) return;
  const t0 = a.currentTime, s = noiseSrc(a, t0, 0.03), bp = a.createBiquadFilter(), g = a.createGain();
  blip(n > 1 ? 110 : 150, n > 1 ? 50 : 58, 0.16, 'sine', 0.4);
  bp.type = 'bandpass'; bp.frequency.value = 1300; bp.Q.value = 4;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.25, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.03);
  s.connect(bp); bp.connect(g); outS(g);
}

export function pauseSound(){ blip(300, 60, 0.4, 'sine', 0.14); thump(0.3); }

export function uiClick(){ if(AC) blip(170, 80, 0.07, 'sine', 0.3); }

export function omen(){
  const a = audio(); if(!a || !noiseBuf) return;
  thump(0.5); sfxSwell(a.currentTime, 1.4, 0.16, 120, 700); whisper(0.2, true);
}

export function startSound(){
  const a = audio(); if(!a || !noiseBuf) return;
  thump(0.5); braam(a.currentTime + 0.05, 0.14, 1.6);
}
