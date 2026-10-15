// game/update.js
// Updates the game every frame while playing: timers, random events,
// spawning, movement and catching.
import { chime, fakeSound, invStart, riser, warble } from '../audio/sfx.js';
import { wrapEl } from '../dom.js';
import { phaseOf, revealTime, spawnGap } from './difficulty.js';
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
  spawnStep(dt);
  if(stepObjects(dt)) return; // Player lost a life: skip the rest of this frame
  stepParticles(dt);
}

// Smooth slow-down when frozen, difficulty phase change, and event countdowns.
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

// Shake, flicker, frost and fire fade out. Noise grows with time and chaos level.
function decayEffects(dt){
  if(S.shake > 0) S.shake = Math.max(0, S.shake - dt*36);
  if(S.flick > 0) S.flick -= dt;
  if(S.frost > 0) S.frost -= dt;
  if(S.fireT > 0) S.fireT -= dt;
  S.nz = Math.min(1, S.t/150 + S.chaos*0.1);
  const nzq = Math.round(S.nz*20)/20;
  if(nzq !== S.nzq){ S.nzq = nzq; wrapEl.style.setProperty('--n', nzq); }
}

// Random scary events: light flicker, inverted controls and fake scare faces.
function rollRandomEvents(dt){
  if(S.chaos >= 1 && S.flick <= 0 && S.flickCd <= 0 && Math.random() < dt * (0.5 + S.chaos*0.45 + S.nz*2)){
    S.flick = 0.06 + Math.random()*0.16; S.flickCd = 0.4;
    S.flickCol = Math.random() < 0.6 ? '#000000' : '#FF1F3D';
  }
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

// Cireep shows its face when it gets close. A normal ball may flash a fake face.
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

// Player catches a normal ball: add score, ice/fire effect, raise chaos level.
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

// Move falling objects and check hits. Returns true if the player just lost a life.
function stepObjects(dt){
  const top = basket.y, half = basket.w/2;
  for(let i = S.objs.length - 1; i >= 0; i--){
    const o = S.objs[i], sm = S.slow;
    if(o.burn > 0){ o.burn -= dt; if(o.burn <= 0) S.objs.splice(i,1); continue; }
    o.y += o.vy * dt * sm;
    o.ph += dt*2.4*sm;
    o.x += Math.sin(o.ph) * o.sway * (o.v ? 1 + (o.rev || 0)*1.4 : 1) * dt * sm;
    o.x = Math.max(o.r, Math.min(W - o.r, o.x));
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
