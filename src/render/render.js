// Draws one full frame.
import { t } from '../i18n.js';
import { drawFace, drawObj } from './objects.js';
import { drawScare } from './scare.js';
import { decay, drawBackdrop, drawBasket, noise, updateFx, updateVignette } from './scene.js';
import { S, settings } from '../state.js';
import { per, timing } from '../timing.js';
import { DPR, H, W, ctx } from '../view.js';

const MONO = '"IBM Plex Mono", monospace';
const DISP = '"Chakra Petch", sans-serif';
const RED = '#FF1F3D';

// Font size from screen width, kept between min and max (px).
const px = (min, k, max) => Math.round(Math.max(min, Math.min(W*k, max)));

export function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,W,H);

  if(S.mode === 'scare' && S.jump.kind !== 'calm'){ drawScare(); return; }

  drawWorld();

  updateFx();
  if(S.flick > 0 && !settings.reduceFlash && !timing.lowFx && Math.random() < per(0.5)) noise(0.18, 3);
  decay();
  updateVignette();
  if(S.mode === 'scare') drawCalmScare();
}

// Everything here moves with the screen shake.
function drawWorld(){
  let sx = 0, sy = 0;
  if(S.shake > 0){ sx = (Math.random()-0.5)*S.shake; sy = (Math.random()-0.5)*S.shake; }
  ctx.save(); ctx.translate(sx,sy);

  drawBackdrop();
  for(let i=0;i<S.objs.length;i++) drawObj(S.objs[i]);

  if(S.invuln > 0 && Math.floor(S.t*12)%2===0) ctx.globalAlpha = 0.45;
  drawBasket();
  ctx.globalAlpha = 1;

  drawFloats();
  drawParticles();
  drawStatusTexts();
  drawFakeFace();

  ctx.restore();
}

function overlayText(txt, y, alpha, color, font){
  ctx.save();
  ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.font = font; ctx.textAlign = 'center';
  ctx.fillText(txt, W/2, y);
  ctx.restore();
}

function drawFloats(){
  for(let i=0;i<S.floats.length;i++){
    const f = S.floats[i];
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - f.t/0.8);
    ctx.fillStyle = 'hsl('+f.hue+' 90% 72%)';
    ctx.font = '600 16px ' + MONO;
    ctx.textAlign = 'center';
    ctx.fillText(f.txt, f.x, f.y);
    ctx.restore();
  }
}

function drawParticles(){
  for(let i=0;i<S.parts.length;i++){
    const pp = S.parts[i], u = pp.t/pp.life;
    ctx.save(); ctx.globalAlpha = Math.max(0, 1-u);
    if(pp.f){
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'hsl('+(10+u*40)+' 100% '+(60-u*20)+'%)';
      ctx.beginPath(); ctx.arc(pp.x, pp.y, pp.s*(1-u*0.6), 0, 6.2832); ctx.fill();
    } else {
      ctx.strokeStyle = '#DFF8FF'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pp.x,pp.y); ctx.lineTo(pp.x-pp.vx*0.05, pp.y-pp.vy*0.05); ctx.stroke();
    }
    ctx.restore();
  }
}

// Whisper text, inverted-controls warning and phase banner.
function drawStatusTexts(){
  if(S.chaos >= 2 && (S.t % 6) < 0.9){
    overlayText(t('w' + (((S.t/6)|0) % 3 + 1)), H*0.52, 0.16, RED, '600 ' + px(16, 0.06, 34) + 'px ' + MONO);
  }
  if(S.invert > 0) overlayText(t('inv'), H*0.34, 0.85, RED, '700 ' + px(18, 0.05, 28) + 'px ' + DISP);
  else if(S.invertPre > 0) overlayText(t('invWarn'), H*0.34, 0.7, RED, '700 ' + px(16, 0.045, 24) + 'px ' + DISP);
  if(S.banner){
    const bt = S.banner.t, ba = Math.max(0, Math.min(1, bt/0.4, (2.6 - bt)/0.6));
    overlayText(t(S.banner.txt), H*0.2, 0.85*ba, '#8FE3F2', '600 ' + px(13, 0.04, 20) + 'px ' + MONO);
  }
}

// Faint Cireep face for a moment (fake scare).
function drawFakeFace(){
  if(!S.fake) return;
  const fk = S.fake;
  ctx.save();
  ctx.globalAlpha = (settings.reduceFlash ? 0.22 : 0.5) * Math.sin(Math.PI * Math.min(1, fk.t/fk.dur));
  drawFace(fk.x, fk.y, fk.r, S.t, 0.6);
  ctx.restore();
}

// No jump-scare mode: dim the screen and show a small face.
function drawCalmScare(){
  const cp = S.jump.t / S.jump.dur;
  ctx.fillStyle = 'rgba(20,2,8,' + (0.62*(1 - cp*0.4)) + ')'; ctx.fillRect(0,0,W,H);
  drawFace(W/2, H/2, Math.min(W,H)*0.16*(1 + 0.1*cp), S.t, 0.5);
}
