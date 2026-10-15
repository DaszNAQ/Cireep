// game/difficulty.js
// Difficulty curves. Speed, Cireep chance, spawn gap and reveal time
// change over time and with the chaos level.
import { CT, C_CIR, C_GAP, C_SPD, REV } from '../config.js';
import { S } from '../state.js';

function curve(a){
  const t = S.t;
  for(let i=1;i<CT.length;i++) if(t < CT[i]) return a[i-1] + (a[i]-a[i-1]) * (t-CT[i-1]) / (CT[i]-CT[i-1]);
  return a[a.length-1];
}

export function phaseOf(t){ return t < 45 ? 0 : t < 100 ? 1 : t < 170 ? 2 : 3; }

export function speedMul(){ return Math.min(2.8, curve(C_SPD) + S.chaos*0.05); }

export function cireepChance(){ return Math.min(0.42, curve(C_CIR) + S.chaos*0.015); }

export function spawnGap(){ return Math.max(0.36, curve(C_GAP) - S.chaos*0.02); }

export function revealTime(){ return Math.max(0.36, REV[S.phase] - S.chaos*0.01); }
