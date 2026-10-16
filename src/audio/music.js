// Background music and ambient sounds made by code.
import { AC, MU, envG, impulse, master, noiseBuf, noiseSrc, onAudioReady, outS, pan, setMU } from './engine.js';
import { screech } from './synth.js';
import { DRONE_VOL, MUSIC_VOL, MU_CFG, SEMI, VOW } from '../config.js';
import { S, settings } from '../state.js';

export function noteHz(deg, oct){ return 73.416 * Math.pow(2, (SEMI[((deg % 7) + 7) % 7] + 12*(oct + Math.floor(deg/7))) / 12); }

function musicInit(){
  const a = AC; if(!a || MU) return;
  const M = { mode:'menu', acc:0, tBox:2, tPad:3, tAmb:9, tChoir:6, nextBeat:0, deg:2, phrase:0, I:0, shift:0, vo:[] };
  setMU(M);
  M.bus = a.createGain(); M.bus.gain.value = 0.0001;
  M.lp = a.createBiquadFilter(); M.lp.type = 'lowpass'; M.lp.frequency.value = 1500; M.lp.Q.value = 0.6;
  M.mg = a.createGain(); M.mg.gain.value = MUSIC_VOL;
  M.bus.connect(M.lp); M.lp.connect(M.mg); M.mg.connect(master);
  M.rev = a.createConvolver(); M.rev.buffer = impulse(a, 3.4, 2.2);
  const rg = a.createGain(); rg.gain.value = 0.9; M.rev.connect(rg); rg.connect(master);
  M.send = a.createGain(); M.send.gain.value = 0.45; M.send.connect(M.rev);
  const ms = a.createGain(); ms.gain.value = 0.5; M.mg.connect(ms); ms.connect(M.rev);
  M.hb = a.createGain(); M.hb.gain.value = 0.9; M.hb.connect(master);

  M.drone = a.createGain(); M.drone.gain.value = 0.0001; M.drone.connect(M.bus);
  const tg = a.createGain(); tg.gain.value = 0.8; tg.connect(M.drone);
  M.df = a.createBiquadFilter(); M.df.type = 'lowpass'; M.df.frequency.value = 200; M.df.Q.value = 3; M.df.connect(tg);
  [[36.71,'sawtooth',0.5,0],[73.42,'sawtooth',0.35,6],[77.78,'sawtooth',0.3,-4],[110,'triangle',0.22,3]].forEach(function(v){
    const o = a.createOscillator(), g = a.createGain();
    o.type = v[1]; o.frequency.value = v[0]; o.detune.value = v[3]; g.gain.value = v[2];
    o.connect(g); g.connect(M.df); o.start(); M.vo.push({ o:o, d0:v[3] });
  });
  const tv = a.createOscillator(); M.tri = a.createGain(); M.tri.gain.value = 0.0001;
  tv.type = 'sawtooth'; tv.frequency.value = 103.83; tv.connect(M.tri); M.tri.connect(M.df); tv.start(); M.vo.push({ o:tv, d0:0 });
  const l1 = a.createOscillator(), l1g = a.createGain();
  l1.frequency.value = 0.07; l1g.gain.value = 90; l1.connect(l1g); l1g.connect(M.df.frequency); l1.start();
  const l2 = a.createOscillator(), l2g = a.createGain();
  l2.frequency.value = 0.19; l2g.gain.value = 0.18; l2.connect(l2g); l2g.connect(tg.gain); l2.start();

  let wl = Math.floor(8*a.sampleRate), cf = Math.floor(0.4*a.sampleRate), wb = a.createBuffer(1, wl, a.sampleRate), wd = wb.getChannelData(0), p1 = 0, p2 = 0, i, mx = 0;
  for(i=0;i<wl;i++){ p1 += ((Math.random()*2-1) - p1)*0.08; p2 += (p1 - p2)*0.08; wd[i] = p2; }
  for(i=0;i<cf;i++){ const k = i/cf; wd[wl-cf+i] = wd[wl-cf+i]*(1-k) + wd[i]*k; }
  for(i=0;i<wl;i++) if(Math.abs(wd[i]) > mx) mx = Math.abs(wd[i]);
  for(i=0;i<wl;i++) wd[i] /= mx;
  const ws = a.createBufferSource(), wf = a.createBiquadFilter(), wl2 = a.createOscillator(), wlg = a.createGain();
  ws.buffer = wb; ws.loop = true; ws.loopStart = cf/a.sampleRate; ws.loopEnd = wl/a.sampleRate;
  wf.type = 'bandpass'; wf.frequency.value = 450; wf.Q.value = 0.9;
  wl2.frequency.value = 0.045; wlg.gain.value = 260; wl2.connect(wlg); wlg.connect(wf.frequency);
  M.wind = a.createGain(); M.wind.gain.value = 0.05;
  ws.connect(wf); wf.connect(M.wind); M.wind.connect(M.bus); ws.start(); wl2.start();

  const wo = a.createOscillator(), wv = a.createOscillator(), wvg = a.createGain();
  M.whine = a.createGain(); M.whine.gain.value = 0.0001;
  wo.type = 'sine'; wo.frequency.value = 2900; wv.frequency.value = 0.3; wvg.gain.value = 40;
  wv.connect(wvg); wvg.connect(wo.detune); wo.connect(M.whine); M.whine.connect(M.bus); wo.start(); wv.start();
}

export function musicMode(m){
  if(!MU) return;
  let c = MU_CFG[m] || MU_CFG.menu, t = AC.currentTime, i;
  MU.mode = m;
  MU.bus.gain.cancelScheduledValues(t);
  MU.bus.gain.setTargetAtTime(c.bus, t, c.tc);
  MU.lp.frequency.setTargetAtTime(c.lp, t, c.tc);
  MU.drone.gain.setTargetAtTime(c.dr*DRONE_VOL, t, c.tc*1.5);
  if(m !== 'play') MU.nextBeat = 0;
  for(i=0;i<MU.vo.length;i++){
    const d = MU.vo[i].o.detune;
    d.cancelScheduledValues(t);
    if(m === 'over'){ d.setValueAtTime(d.value, t); d.linearRampToValueAtTime(-2100, t + 2.8); }
    else d.setTargetAtTime(MU.vo[i].d0 + MU.shift, t, 1.5);
  }
}

function silenceGap(dur, delay){
  if(!MU) return;
  const t = AC.currentTime + (delay || 0), c = MU_CFG[S.mode] || MU_CFG.play;
  MU.bus.gain.setTargetAtTime(0.05, t, 0.12);
  MU.bus.gain.setTargetAtTime(c.bus, t + dur, 0.5);
}

function padNote(f, vol){
  const a = AC, t0 = a.currentTime, atk = 1.6 + Math.random(), rel = 3 + Math.random()*2;
  const g = envG(a, t0, atk, vol, rel), lp = a.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 900; g.connect(lp); lp.connect(MU.bus);
  [['sine',-6],['triangle',6]].forEach(function(v){
    const o = a.createOscillator(); o.type = v[0]; o.frequency.value = f; o.detune.value = v[1];
    o.connect(g); o.start(t0); o.stop(t0 + atk + rel + 0.1);
  });
}

function padStep(){
  const I = MU.I, d = [0,1,2,4,5][(Math.random()*5)|0], oc = 1 + ((Math.random()*2)|0);
  padNote(noteHz(d, oc), 0.05);
  if(Math.random() < 0.25 + I*0.4) padNote(noteHz(d + 1, oc), 0.035);
  if(Math.random() < I*0.35) padNote(207.65, 0.03);
}

function boxNote(f, vol){
  const a = AC, t0 = a.currentTime + 0.02, det = (Math.random()-0.5)*40;
  const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), g2 = a.createGain();
  const lf = a.createOscillator(), lg = a.createGain();
  o.type = 'sine'; o.frequency.value = f; o.detune.value = det;
  o2.type = 'sine'; o2.frequency.value = f*2.76; o2.detune.value = det; g2.gain.value = 0.25;
  lf.frequency.value = 3.5 + Math.random()*2; lg.gain.value = 14 + Math.random()*16;
  lf.connect(lg); lg.connect(o.detune); lg.connect(o2.detune);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0+0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0+1.6);
  if(Math.random() < 0.25){ o.frequency.setValueAtTime(f, t0+0.1); o.frequency.exponentialRampToValueAtTime(f*0.94, t0+1.2); }
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(MU.bus);
  o.start(t0); o2.start(t0); lf.start(t0); o.stop(t0+1.7); o2.stop(t0+1.7); lf.stop(t0+1.7);
}

function boxStep(){
  const M = MU, calm = S.mode !== 'play';
  if(!calm && M.I > 0.7){ M.tBox = 8; return; }
  if(M.phrase <= 0) M.phrase = 3 + ((Math.random()*4)|0);
  M.deg = Math.max(-2, Math.min(9, M.deg + [-2,-1,-1,1,1,2][(Math.random()*6)|0]));
  if(Math.random() > 0.12) boxNote(noteHz(M.deg, 3), calm ? 0.16 : 0.09);
  if(Math.random() < 0.14) boxNote(noteHz(M.deg, 3)*1.0595, calm ? 0.11 : 0.06);
  M.phrase--;
  M.tBox = M.phrase > 0 ? 0.45 + Math.random()*0.4 : (calm ? 3 + Math.random()*4 : 9 + Math.random()*9);
}

function creak(){
  const a = AC, t0 = a.currentTime, dur = 0.9 + Math.random()*0.9, f0 = 70 + Math.random()*50;
  const o = a.createOscillator(), bp = a.createBiquadFilter(), am = a.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f0*(0.8 + Math.random()*0.7), t0+dur);
  bp.type = 'bandpass'; bp.Q.value = 6;
  bp.frequency.setValueAtTime(350, t0); bp.frequency.exponentialRampToValueAtTime(1100 + Math.random()*600, t0+dur);
  am.gain.value = 0.5;
  const lf = a.createOscillator(), lg = a.createGain();
  lf.frequency.value = 9 + Math.random()*10; lg.gain.value = 0.5; lf.connect(lg); lg.connect(am.gain);
  const g = envG(a, t0, dur*0.3, 1.0, dur*0.7);
  o.connect(bp); bp.connect(am); am.connect(g);
  pan(a, g, (Math.random()-0.5)*1.6).connect(MU.bus);
  o.start(t0); lf.start(t0); o.stop(t0+dur+0.05); lf.stop(t0+dur+0.05);
}

export function whisper(delay, direct){
  let a = AC, t0 = a.currentTime + 0.05 + (delay || 0), n = 3 + ((Math.random()*3)|0), tt = t0;
  const src = a.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  const f1 = a.createBiquadFilter(), f2 = a.createBiquadFilter(), g = a.createGain(), boost = a.createGain();
  f1.type = 'bandpass'; f1.frequency.value = 900 + Math.random()*300; f1.Q.value = 7;
  f2.type = 'bandpass'; f2.frequency.value = 2600 + Math.random()*700; f2.Q.value = 9;
  boost.gain.value = direct ? 3.5 : 4;
  g.gain.setValueAtTime(0.0001, t0);
  for(let i=0;i<n;i++){
    const d = 0.12 + Math.random()*0.16;
    g.gain.setValueAtTime(0.0001, tt);
    g.gain.exponentialRampToValueAtTime(0.14 + Math.random()*0.08, tt + d*0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, tt + d);
    tt += d + 0.05 + Math.random()*0.12;
  }
  src.connect(f1); src.connect(f2); f1.connect(boost); f2.connect(boost); boost.connect(g);
  const p = pan(a, g, (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random()*0.5));
  if(direct) outS(p); else p.connect(MU.bus);
  src.start(t0); src.stop(tt + 0.1);
}

function ping(){
  const a = AC, t0 = a.currentTime, f = 500 + Math.random()*1200;
  const c = a.createOscillator(), m = a.createOscillator(), mg = a.createGain(), g = a.createGain();
  c.type = 'sine'; c.frequency.value = f; m.type = 'sine'; m.frequency.value = f*1.414;
  mg.gain.setValueAtTime(f*3, t0); mg.gain.exponentialRampToValueAtTime(1, t0+0.9);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.28, t0+0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0+1.1);
  m.connect(mg); mg.connect(c.frequency); c.connect(g);
  pan(a, g, (Math.random()-0.5)*1.8).connect(MU.bus);
  c.start(t0); m.start(t0); c.stop(t0+1.2); m.stop(t0+1.2);
}

function swell(dur){
  const a = AC, t0 = a.currentTime, src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
  src.buffer = noiseBuf; src.loop = true;
  bp.type = 'bandpass'; bp.Q.value = 1.5;
  bp.frequency.setValueAtTime(200, t0); bp.frequency.exponentialRampToValueAtTime(2400, t0+dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0+dur*0.92); g.gain.setValueAtTime(0.0001, t0+dur);
  src.connect(bp); bp.connect(g); g.connect(MU.bus);
  src.start(t0); src.stop(t0+dur+0.05);
}

function ambient(){
  let m = S.mode, I = MU.I, c = [['creak',1],['whisper',1.4],['ping',0.7],['swell',0.7]], tot = 0, r, i;
  if(I > 0.2) c.push(['breath',1.2]);
  if(I > 0.35) c.push(['strings',1.2]);
  if(m === 'play' && I > 0.3) c.push(['silence',0.6]);
  for(i=0;i<c.length;i++) tot += c[i][1];
  r = Math.random()*tot;
  for(i=0;i<c.length;i++){ r -= c[i][1]; if(r <= 0) break; }
  const k = c[Math.min(i, c.length-1)][0];
  if(k === 'creak') creak(); else if(k === 'whisper') whisper(); else if(k === 'ping') ping();
  else if(k === 'swell') swell(2.2); else if(k === 'breath') breath(); else if(k === 'strings') stringSwell();
  else { swell(1.8); silenceGap(1.6, 1.8); }
  MU.tAmb = (m === 'play' ? 14 - I*7 : 14) + Math.random()*8;
}

export function choirNote(f, vol, dur){
  const a = AC, t0 = a.currentTime, atk = dur*0.45, g = envG(a, t0, atk, vol, dur - atk), mix = a.createGain(), vw = VOW[(Math.random()*VOW.length)|0];
  [-14, 0, 13].forEach(function(c, i){
    const o = a.createOscillator(), v = a.createOscillator(), vg = a.createGain();
    o.type = 'sawtooth'; o.frequency.value = f; o.detune.value = c;
    v.frequency.value = 4.8 + i*0.5; vg.gain.value = 14;
    v.connect(vg); vg.connect(o.detune);
    vw.forEach(function(fo){
      const bp = a.createBiquadFilter(), fg = a.createGain();
      bp.type = 'bandpass'; bp.frequency.value = fo[0]; bp.Q.value = fo[1]; fg.gain.value = 2.2;
      o.connect(bp); bp.connect(fg); fg.connect(mix);
    });
    o.start(t0); v.start(t0); o.stop(t0 + dur + 0.1); v.stop(t0 + dur + 0.1);
  });
  mix.connect(g); g.connect(MU.bus);
}

function choirStep(){
  const I = MU.I, d = [0,1,2,4][(Math.random()*4)|0], f = noteHz(d, 1), dur = 7 + Math.random()*4;
  choirNote(f, 0.1, dur);
  if(Math.random() < 0.55) choirNote(noteHz(d + 1, 1), 0.08, dur);
  if(Math.random() < I*0.6) choirNote(f*1.4142, 0.07, dur);
}

function stringSwell(){
  const dur = 4 + Math.random()*2.5;
  screech(AC.currentTime, dur, 0.06, 700 + Math.random()*500, 0.82 + Math.random()*0.1, dur*0.5, true);
}

function breath(){
  const a = AC, t0 = a.currentTime + 0.05, n = noiseSrc(a, t0, 2.6), bp = a.createBiquadFilter(), g = a.createGain();
  bp.type = 'bandpass'; bp.Q.value = 0.9;
  bp.frequency.setValueAtTime(600, t0); bp.frequency.linearRampToValueAtTime(1500, t0 + 0.9); bp.frequency.linearRampToValueAtTime(700, t0 + 2.3);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.7, t0 + 0.85); g.gain.exponentialRampToValueAtTime(0.04, t0 + 1.05);
  g.gain.exponentialRampToValueAtTime(0.5, t0 + 1.35); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 2.5);
  n.connect(bp); bp.connect(g); pan(a, g, (Math.random()-0.5)*1.6).connect(MU.bus);
}

function heartbeat(t, vol){
  const a = AC;
  [[0,1],[0.23,0.7]].forEach(function(b){
    const tt = t + b[0], v = vol*b[1];
    const o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(95, tt); o.frequency.exponentialRampToValueAtTime(38, tt+0.14);
    g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(v, tt+0.012); g.gain.exponentialRampToValueAtTime(0.0001, tt+0.2);
    o.connect(g); g.connect(MU.hb); o.start(tt); o.stop(tt+0.22);
    const s = a.createBufferSource(), lp = a.createBiquadFilter(), g2 = a.createGain();
    s.buffer = noiseBuf; lp.type = 'lowpass'; lp.frequency.value = 260;
    g2.gain.setValueAtTime(0.0001, tt); g2.gain.exponentialRampToValueAtTime(v*3, tt+0.008); g2.gain.exponentialRampToValueAtTime(0.0001, tt+0.09);
    s.connect(lp); lp.connect(g2); g2.connect(MU.hb); s.start(tt, Math.random()); s.stop(tt+0.1);
  });
}

export function musicUpdate(dt){
  if(!MU || !AC || AC.state !== 'running') return;
  let M = MU, m = S.mode, now = AC.currentTime, i;
  const live = m === 'play' || m === 'scare' || m === 'pause' || m === 'resume';
  const I = live ? Math.min(1, S.phase*0.2 + S.chaos*0.05 + (3 - S.lives)*0.12) : (m === 'over' ? 0.35 : 0.1);
  M.I += (I - M.I) * Math.min(1, dt*0.8);
  M.acc += dt;
  if(M.acc >= 0.5){
    M.acc = 0;
    M.df.frequency.setTargetAtTime(170 + M.I*520, now, 0.6);
    M.tri.gain.setTargetAtTime(0.0001 + M.I*0.35, now, 0.8);
    M.whine.gain.setTargetAtTime(M.I > 0.45 ? (M.I - 0.45)*0.05 : 0.0001, now, 1.5);
    if(m !== 'over'){
      M.shift = live ? -(S.phase*30 + (3 - S.lives)*25) : 0;
      for(i=0;i<M.vo.length;i++) M.vo[i].o.detune.setTargetAtTime(M.vo[i].d0 + M.shift, now, 4);
    }
  }
  if(settings.muted) return;
  if(m === 'play'){
    const period = 60 / (50 + M.I*68);
    if(M.nextBeat < now - 0.5) M.nextBeat = now + 0.05;
    while(M.nextBeat < now + 0.15){
      heartbeat(M.nextBeat, 0.1 + 0.14*M.I);
      M.nextBeat += period;
      if(Math.random() < M.I*0.1) M.nextBeat += period*0.45;
      else if(Math.random() < M.I*0.08) M.nextBeat -= period*0.35;
    }
  }
  if(m === 'scare' || m === 'resume') return;
  M.tPad -= dt; if(M.tPad <= 0){ padStep(); M.tPad = (m === 'play' ? 5 : 4) + Math.random()*4; }
  M.tChoir -= dt; if(M.tChoir <= 0){ choirStep(); M.tChoir = (m === 'play' ? 11 : 9) + Math.random()*7; }
  M.tBox -= dt; if(M.tBox <= 0) boxStep();
  if(m !== 'pause'){ M.tAmb -= dt; if(M.tAmb <= 0) ambient(); }
}

export function initMusic(){
  onAudioReady(function(){ musicInit(); musicMode(S.mode); });
}
