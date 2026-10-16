// Per-frame update: timers, events, spawning, catching.
import { chime, fakeSound, invStart, riser, warble } from '../audio/sfx.js';
import { wrapEl } from '../dom.js';
import { DRIFT_TURN, DRIFT_VMAX, FLASH_STEP, FLASH_TIME } from '../config.js';
import { driftLevel, phaseOf, revealTime, spawnGap } from './difficulty.js';
import { burnAll, freezeAll } from './effects.js';
import { loseLife } from './flow.js';
import { bumpChaos, revealTick, spawnOne } from './spawn.js';
import { updateHUD, updateRec } from '../hud.js';
import { moveBasket } from '../input.js';
import { S, basket, settings } from '../state.js';
import { H, W } from '../view.js';

export function update(dt){
  S.t += dt;
  updateRec();
  advancePhase(dt);
  tickTimers(dt);
  moveBasket(dt);
  decayEffects(dt);
  rollRandomEvents(dt);
  milestoneFlash();
  spawnStep(dt);
  if(stepObjects(dt)) return; // life lost: skip the rest of the frame
  stepParticles(dt);
}

// Frost slow-down, phase change and event countdowns.
function advancePhase(dt){
  S.slow += ((S.frost > 0 ? 0.3 : 1) - S.slow) * Math.min(1, dt*10);
  const ph = phaseOf(S.t);
  if(ph !== S.phase){ S.phase = ph; S.breather = 3.5; S.banner = { txt:'ph' + (ph+1), t:0 }; riser(2); }
  if(S.breather > 0) S.breather -= dt;
  if(S.fakeCd > 0) S.fakeCd -= dt;
  if(S.revCd > 0) S.revCd -= dt;
  if(S.banner){ S.banner.t += dt; if(S.banner.t > 2.6) S.banner = null; }
}

function tickTimers(dt){
  if(S.invuln > 0) S.invuln -= dt;
  if(S.invert > 0) S.invert -= dt;
  if(S.invertCd > 0) S.invertCd -= dt;
  if(S.flickCd > 0) S.flickCd -= dt;
  if(S.boostCd > 0) S.boostCd -= dt;
  if(S.invertPre > 0){ S.invertPre -= dt; if(S.invertPre <= 0){ S.invert = 2.6; invStart(); } }
}

// Fade shake, flash, frost and fire. Noise follows chaos level.
function decayEffects(dt){
  if(S.shake > 0) S.shake = Math.max(0, S.shake - dt*36);
  if(S.flick > 0) S.flick -= dt;
  if(S.frost > 0) S.frost -= dt;
  if(S.fireT > 0) S.fireT -= dt;
  S.nz = Math.min(1, S.chaos*0.1); // noise follows chaos level, not time
  const nzq = Math.round(S.nz*20)/20;
  if(nzq !== S.nzq){ S.nzq = nzq; wrapEl.style.setProperty('--n', nzq); }
}

// Soft red flash each time the score passes a FLASH_STEP mark.
function milestoneFlash(){
  if(S.score < S.nextFlash) return;
  while(S.nextFlash <= S.score) S.nextFlash += FLASH_STEP;
  S.flick = FLASH_TIME; S.flickCol = '#FF1F3D';
}

// Random events: inverted controls and fake faces.
function rollRandomEvents(dt){
  if(S.phase >= 1 && S.invert <= 0 && S.invertPre <= 0 && S.invertCd <= 0 && Math.random() < dt*[0, 0.08, 0.1, 0.16][S.phase]){
    S.invertPre = 0.8; S.invertCd = S.phase >= 3 ? 6 : 8; warble(0.8);
  }

  if(!settings.noScare && S.chaos >= 1 && !S.fake && S.fakeCd <= 0 && Math.random() < dt*(0.03 + S.chaos*0.015)){
    const fr = Math.min(W,H)*(0.12 + Math.random()*0.1);
    S.fake = { t:0, dur:0.3 + Math.random()*0.2, x: fr + Math.random()*(W - fr*2), y: H*0.15 + Math.random()*H*0.4, r: fr };
    S.fakeCd = 14;
    fakeSound();
  }
  if(S.fake){ S.fake.t += dt; if(S.fake.t >= S.fake.dur) S.fake = null; }
}

function spawnStep(dt){
  S.spawn -= dt * S.slow;
  if(S.spawn <= 0){
    spawnOne();
    if(S.phase >= 1 && S.chaos >= 2 && Math.random() < 0.3) spawnOne();
    S.spawn = spawnGap();
  }
}

// Cireep shows its face up close. Normal balls may fake it.
function updateReveal(o, dt){
  if(o.v){
    const rt = (basket.y - o.y) / o.vy, rvT = o.tut ? 1.6 : revealTime();
    o.rev = Math.max(0, Math.min(1, (rvT - rt)/0.12));
    if(o.rev > 0 && !o.seen){ o.seen = 1; revealTick(); }
  } else if(o.faD > 0){
    if(o.flash > 0) o.flash -= dt;
    if(!o.faDone && (basket.y - o.y) / o.vy <= o.faD){ o.faDone = 1; o.flash = 0.14; revealTick(); }
  }
}

// Catch a normal ball: score, ice/fire effect, chaos level.
function catchBall(o){
  if(o.k === 'fire'){
    burnAll(o);
    updateHUD();
    if(S.caught >= S.nextChaos) bumpChaos();
    return;
  }
  if(o.k === 'ice') freezeAll(o);
  S.caught++; S.combo++;
  const pts = 1 + Math.floor(S.combo/10) + S.chaos;
  S.score += pts;
  S.floats.push({ x:o.x, y:basket.y - 10, t:0, txt:'+' + pts, hue:o.hue });
  chime(S.combo);
  updateHUD();
  if(S.caught >= S.nextChaos) bumpChaos();
}

// Random sideways drift: each ball keeps picking a new direction.
function drift(o, lvl, dt){
  o.turn -= dt;
  if(o.turn <= 0){
    o.tg = Math.random()*2 - 1;
    o.turn = DRIFT_TURN[0] + Math.random()*(DRIFT_TURN[1] - DRIFT_TURN[0]);
  }
  o.dv += (o.tg - o.dv) * Math.min(1, dt*4);
  o.x += o.dv * W * DRIFT_VMAX * lvl * dt;
}

// Move balls and check hits. Returns true if a life was lost.
function stepObjects(dt){
  const top = basket.y, half = basket.w/2, dl = driftLevel();
  for(let i = S.objs.length - 1; i >= 0; i--){
    const o = S.objs[i], sm = S.slow;
    if(o.burn > 0){ o.burn -= dt; if(o.burn <= 0) S.objs.splice(i,1); continue; }
    o.y += o.vy * dt * sm;
    o.ph += dt*2.4*sm;
    o.x += Math.sin(o.ph) * o.sway * (o.v ? 1 + (o.rev || 0)*1.4 : 1) * dt * sm;
    if(dl > 0 && o.dl) drift(o, dl*o.dl, dt*sm);
    if(o.x <= o.r){ o.x = o.r; o.tg = Math.abs(o.tg); o.dv = Math.max(o.dv, 0); }
    else if(o.x >= W - o.r){ o.x = W - o.r; o.tg = -Math.abs(o.tg); o.dv = Math.min(o.dv, 0); }
    if(o.dead){ S.objs.splice(i,1); continue; }
    updateReveal(o, dt);

    const hit = o.y + o.r >= top && o.y - o.r <= top + 40 && Math.abs(o.x - basket.x) < half + o.r*0.35;
    if(hit){
      S.objs.splice(i,1);
      if(o.v){
        if(S.invuln > 0) continue;
        loseLife(o);
        return true;
      }
      catchBall(o);
      continue;
    }
    if(o.y - o.r > H){
      S.objs.splice(i,1);
      if(!o.v) S.combo = 0;
    }
  }
  return false;
}

function stepParticles(dt){
  for(let i = S.parts.length - 1; i >= 0; i--){
    const p = S.parts[i]; p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt;
    if(!p.f) p.vy += 300*dt;
    if(p.t > p.life) S.parts.splice(i,1);
  }
  for(let i = S.floats.length - 1; i >= 0; i--){
    const f = S.floats[i]; f.t += dt; f.y -= dt*46;
    if(f.t > 0.8) S.floats.splice(i,1);
  }
}
