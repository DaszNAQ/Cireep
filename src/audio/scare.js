// audio/scare.js
// Builds the sound for each jump-scare type (calm, lunge, glitch, eyes, face).
import { audio, blip, noiseBuf, stutter } from './engine.js';
import { whisper } from './music.js';
import { braam, datamosh, eyeClick, ring, screech, sfxSwell, shriek } from './synth.js';
import { hash } from '../util.js';

export function scareSound(kind, fatal, j){
  const a = audio(); if(!a || !noiseBuf) return;
  let t0 = a.currentTime + 0.01, D = fatal ? 1.7 : 1.0, h, i;
  if(kind === 'calm'){ blip(fatal ? 120 : 170, 45, fatal ? 0.8 : 0.4, 'triangle', 0.1); return; }
  if(kind === 'lunge'){
    sfxSwell(t0, 0.3, 0.35, 200, 3800, -0.5, 0.5);
    h = t0 + 0.3;
    braam(h, 0.5, D); shriek(h, D, 0.6, 420, 1500, 0.5, -0.5); screech(h, D*0.9, 0.35, 1000, 0.6);
  } else if(kind === 'glitch'){
    stutter(); datamosh(t0, 0.5, 0.35);
    h = t0 + 0.32;
    braam(h, 0.45, D); shriek(h, D, 0.55, 900, 2000, -0.6, 0.6); screech(h, D*0.9, 0.3, 1400, 0.7);
  } else if(kind === 'eyes'){
    const seed = j ? j.seed : 0, dur = j ? j.dur : D;
    sfxSwell(t0, 0.5, 0.25, 90, 900);
    blip(50, 38, 0.9, 'sawtooth', 0.12);
    whisper(0, true); whisper(0.15, true);
    for(i=0;i<16;i++) eyeClick(t0 + hash(seed + i*5.9 + 130)*0.45*dur + 0.04, hash(seed + i*7.3)*2 - 1);
    h = t0 + 0.55*dur;
    braam(h, 0.5, D*0.9); shriek(h, D*0.9, 0.6, 600, 1700, 0, 0); screech(h, D*0.8, 0.35, 1200, 0.55);
  } else {
    braam(t0, 0.55, D); shriek(t0, D, 0.6, 700, 1600, 0, 0); screech(t0, D*0.9, 0.38, 1100, 0.55);
    sfxSwell(t0, 0.9, 0.2, 2400, 160, 0, 0, true);
  }
  ring(t0 + 0.5, fatal ? 4 : 3, fatal ? 0.04 : 0.028);
  if(fatal){ braam(t0 + 0.95, 0.4, 1.2); whisper(1.1, true); whisper(1.7, true); }
}
