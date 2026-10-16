// Spawns balls and Cireep, and keeps spawns fair.
import { hum } from '../audio/engine.js';
import { stab } from '../audio/sfx.js';
import { BASKET_V, FALSE_RATE, HUES } from '../config.js';
import { DRIFT_VMAX } from '../config.js';
import { cireepChance, driftLevel, revealTime, speedMul } from './difficulty.js';
import { t } from '../i18n.js';
import { S, basket } from '../state.js';
import { H, W } from '../view.js';
import { $ } from '../dom.js';

export function revealTick(){
  if(S.revCd > 0) return;
  S.revCd = 0.12;
  stab();
}

function ttl(o){ return (basket.y - o.y) / Math.max(1, o.vy * S.slow); }

function spaceFree(o){
  for(let i=0;i<S.objs.length;i++){
    const q = S.objs[i], gap = q.r + o.r*1.5;
    if(Math.abs(q.y - o.y) < gap && Math.abs(q.x - o.x) < gap) return false;
  }
  return true;
}

function laneSafe(c){
  let tc = ttl(c), wave = [c], tmin = tc, i, o, ti;
  for(i=0;i<S.objs.length;i++){
    o = S.objs[i];
    if(!o.v || o.dead || o.burn > 0) continue;
    ti = ttl(o);
    if(ti > -0.15 && Math.abs(ti - tc) <= 0.6){ wave.push(o); if(ti < tmin) tmin = ti; }
  }
  const lo = basket.w/2, hi = W - basket.w/2, iv = [], reach = W * DRIFT_VMAX * driftLevel() * 0.3;
  for(i=0;i<wave.length;i++){
    const pad = basket.w/2 + wave[i].r*0.35 + 6 + reach;
    iv.push([wave[i].x - pad, wave[i].x + pad]);
  }
  iv.sort(function(a,b){ return a[0] - b[0]; });
  let gaps = [], cur = lo;
  for(i=0;i<iv.length;i++){
    if(iv[i][0] - cur >= 6) gaps.push([cur, Math.min(iv[i][0], hi)]);
    if(iv[i][1] > cur) cur = iv[i][1];
  }
  if(hi - cur >= 6) gaps.push([cur, hi]);
  if(!gaps.length) return false;
  let worst = gaps[0][0] - lo;
  for(i=1;i<gaps.length;i++) worst = Math.max(worst, (gaps[i][0] - gaps[i-1][1]) / 2);
  worst = Math.max(worst, hi - gaps[gaps.length-1][1]);
  return worst <= W * BASKET_V * Math.max(0, Math.min(tmin, revealTime()) - 0.1);
}

export function spawnOne(){
  const r = Math.max(15, Math.min(W*0.036, 29));
  let isV = S.breather <= 0 && Math.random() < cireepChance(), kind = isV ? 'v' : 'n';
  if(!isV && S.t > 6 && S.boostCd <= 0){
    const q = Math.random();
    if(q < 0.03) kind = 'ice'; else if(q < 0.06) kind = 'fire';
    if(kind !== 'n') S.boostCd = 8;
  }
  const o = {
    v: isV, k: kind, burn: 0,
    x: 0,
    y: -r*2 - Math.random()*40,
    r: r,
    vy: (H*0.32) * speedMul() * (0.85 + Math.random()*0.3),
    hue: kind==='ice' ? 196 : kind==='fire' ? 24 : HUES[(Math.random()*HUES.length)|0],
    sp: (Math.random()-0.5)*2,
    ph: Math.random()*Math.PI*2,
    sway: (Math.random()-0.5) * 18 * (1 + S.chaos*0.25),
    dead: 0,
    dl: 1, dv: Math.random()*2 - 1, tg: Math.random()*2 - 1, turn: 0.3 + Math.random()*0.8
  };
  if(isV) o.tut = S.cNum < 2;
  if(o.tut) o.dl = 0; // first two Cireep fall straight (tutorial)
  else if(kind === 'n' && S.breather <= 0 && Math.random() < FALSE_RATE[S.phase]) o.faD = revealTime() + 0.15 + Math.random()*0.45;
  let ok = false;
  for(let n=0;n<8 && !ok;n++){
    o.x = r + Math.random()*(W - r*2);
    ok = spaceFree(o) && (!isV || laneSafe(o));
  }
  if(!ok && isV) return;
  if(isV) S.cNum++;
  S.objs.push(o);
}

export function bumpChaos(){
  S.chaos++;
  S.nextChaos = S.caught + 20;
  S.shake = 14;
  hum();
  const tag = $('chaosTag');
  tag.textContent = t('chaos', S.chaos);
  tag.classList.add('on');
}
