// audio/synth.js
// Basic sound makers: screech, shriek, braam (deep horror sound),
// glitch sound, eye click and ring.
import { AC, MU, dist, envG, master, noiseSrc, outS, panTo } from './engine.js';

export function screech(t0, dur, vol, f0, glide, atk, soft){
  const a = AC, at = atk || 0.02, tot = at + dur;
  const g = envG(a, t0, at, vol, dur), mix = a.createGain(), hp = a.createBiquadFilter(), w = dist(a, soft ? 1.1 : 3);
  mix.gain.value = soft ? 0.18 : 0.3;
  hp.type = 'highpass'; hp.frequency.value = 350;
  [1, 1.0595, 1.1225, 1.4142, 1.4983, 2].forEach(function(r, i){
    const o = a.createOscillator(), v = a.createOscillator(), vg = a.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0*r, t0);
    o.frequency.exponentialRampToValueAtTime(f0*r*glide, t0 + tot);
    o.detune.value = (Math.random()-0.5)*30;
    v.frequency.value = 5.5 + Math.random()*2; vg.gain.value = 22 + i*3;
    v.connect(vg); vg.connect(o.detune);
    o.connect(mix); o.start(t0); v.start(t0); o.stop(t0 + tot + 0.05); v.stop(t0 + tot + 0.05);
  });
  mix.connect(hp); hp.connect(w);
  if(soft){
    const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
    w.connect(lp); lp.connect(g); g.connect(MU.bus);
  } else { w.connect(g); outS(g); }
}

export function shriek(t0, dur, vol, f0, f1, p0, p1){
  const a = AC, mix = a.createGain(), w = dist(a, 4), g = envG(a, t0, 0.015, vol, dur);
  [1, 1.007].forEach(function(r){
    const o = a.createOscillator(), v = a.createOscillator(), vg = a.createGain();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(f0*r, t0);
    o.frequency.exponentialRampToValueAtTime(f1*r, t0 + dur*0.35);
    o.frequency.exponentialRampToValueAtTime(f0*0.75*r, t0 + dur);
    v.frequency.value = 6.3; vg.gain.value = 45;
    v.connect(vg); vg.connect(o.detune);
    [[850,9,1],[1250,11,0.9],[2800,13,0.7],[3500,12,0.5]].forEach(function(fo){
      const bp = a.createBiquadFilter(), fg = a.createGain();
      bp.type = 'bandpass'; bp.frequency.value = fo[0]; bp.Q.value = fo[1]; fg.gain.value = fo[2]*6;
      o.connect(bp); bp.connect(fg); fg.connect(mix);
    });
    o.start(t0); v.start(t0); o.stop(t0 + dur + 0.05); v.stop(t0 + dur + 0.05);
  });
  const n = noiseSrc(a, t0, dur), nb = a.createBiquadFilter(), am = a.createGain(), ao = a.createOscillator(), ag = a.createGain();
  nb.type = 'bandpass'; nb.frequency.value = 3000; nb.Q.value = 0.8; am.gain.value = 0.5;
  ao.frequency.value = 68; ag.gain.value = 0.5; ao.connect(ag); ag.connect(am.gain); ao.start(t0); ao.stop(t0 + dur + 0.05);
  n.connect(nb); nb.connect(am); am.connect(mix);
  mix.connect(w); w.connect(g);
  outS(panTo(a, g, p0 || 0, p1, t0, dur));
}

export function braam(t0, vol, dur){
  dur = dur || 1.3;
  const a = AC, lp = a.createBiquadFilter(), w = dist(a, 2.2), g = envG(a, t0, 0.03, vol, dur), mix = a.createGain();
  lp.type = 'lowpass'; lp.Q.value = 2.5;
  lp.frequency.setValueAtTime(3000, t0); lp.frequency.exponentialRampToValueAtTime(180, t0 + dur);
  mix.gain.value = 0.35;
  [55, 55.4, 58.27, 77.78, 110.2].forEach(function(f, i){
    const o = a.createOscillator(); o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = (i-2)*9;
    o.connect(mix); o.start(t0); o.stop(t0 + dur + 0.05);
  });
  mix.connect(lp); lp.connect(w); w.connect(g); outS(g);
}

export function sfxSwell(t0, dur, vol, f0, f1, p0, p1, fall){
  const a = AC, n = noiseSrc(a, t0, dur), bp = a.createBiquadFilter(), g = a.createGain();
  bp.type = 'bandpass'; bp.Q.value = 1.4;
  bp.frequency.setValueAtTime(f0, t0); bp.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  if(fall){ g.gain.exponentialRampToValueAtTime(vol, t0 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); }
  else { g.gain.exponentialRampToValueAtTime(vol, t0 + dur*0.95); g.gain.setValueAtTime(0.0001, t0 + dur); }
  n.connect(bp); bp.connect(g); outS(panTo(a, g, p0 || 0, p1, t0, dur));
}

export function datamosh(t0, dur, vol){
  const a = AC, o = a.createOscillator(), w = dist(a, 6), hp = a.createBiquadFilter(), g = envG(a, t0, 0.01, vol, dur), gate = a.createGain();
  let step = 0.035, steps = Math.floor(dur/step), F = [233, 466, 1109, 1760, 2349, 3520, 880, 311], i;
  o.type = 'square'; hp.type = 'highpass'; hp.frequency.value = 250;
  gate.gain.setValueAtTime(1, t0);
  for(i=0;i<steps;i++){
    o.frequency.setValueAtTime(F[(Math.random()*F.length)|0] * (Math.random() < 0.2 ? 0.5 : 1), t0 + i*step);
    gate.gain.setValueAtTime(Math.random() < 0.28 ? 0 : 1, t0 + i*step);
  }
  o.connect(hp); hp.connect(gate); gate.connect(w); w.connect(g); outS(g);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

export function eyeClick(t, p){
  const a = AC, n = noiseSrc(a, t, 0.03), bp = a.createBiquadFilter(), g = a.createGain(), o = a.createOscillator(), og = a.createGain();
  bp.type = 'bandpass'; bp.frequency.value = 1700 + Math.random()*900; bp.Q.value = 5;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.5, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
  n.connect(bp); bp.connect(g); outS(panTo(a, g, p, undefined, t, 0));
  o.type = 'sine'; o.frequency.setValueAtTime(220, t); o.frequency.exponentialRampToValueAtTime(70, t + 0.06);
  og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(0.16, t + 0.004); og.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  o.connect(og); outS(panTo(a, og, p, undefined, t, 0)); o.start(t); o.stop(t + 0.08);
}

export function ring(t0, dur, vol){
  const a = AC, g = a.createGain();
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.15); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  [4180, 4230].forEach(function(f){
    const o = a.createOscillator(); o.type = 'sine'; o.frequency.value = f; o.connect(g); o.start(t0); o.stop(t0 + dur + 0.05);
  });
  g.connect(master);
}
