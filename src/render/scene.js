// Draws background, basket, noise and screen effects.
import { FLASH_ALPHA } from '../config.js';
import { $, cv, wrapEl } from '../dom.js';
import { sprite } from './sprites.js';
import { S, basket, settings } from '../state.js';
import { per, timing } from '../timing.js';
import { DPR, H, W, ctx } from '../view.js';

let gbuf = null;
let gctx = null;
let vigA = -1;
let fxFrost = null;
let fxFire = null;
let fxFlick = null;
const fxS = { frost:-1, fire:-1, flick:-1, col:'' };

function setFx(el, key, a){
  a = Math.round(a*50)/50;
  if(fxS[key] !== a){ fxS[key] = a; el.style.opacity = a; }
}

export function updateFx(){
  if(!fxFrost){ fxFrost = $('fxFrost'); fxFire = $('fxFire'); fxFlick = $('fxFlick'); }
  let off = S.mode === 'scare' && S.jump && S.jump.kind !== 'calm', fa = 0;
  setFx(fxFrost, 'frost', (!off && S.frost > 0) ? Math.min(1, S.frost/1.2) * (settings.reduceFlash ? 0.12 : 0.28) : 0);
  setFx(fxFire, 'fire', (!off && S.fireT > 0) ? S.fireT/0.5*(settings.reduceFlash ? 0.06 : 0.22) : 0);
  if(!off && S.flick > 0) fa = FLASH_ALPHA * (settings.reduceFlash ? 0.5 : 1);
  if(fa > 0 && fxS.col !== S.flickCol){ fxS.col = S.flickCol; fxFlick.style.background = S.flickCol; }
  setFx(fxFlick, 'flick', fa);
}

export function glitchSlices(l){
  let n = 1 + ((l*4)|0), sl = [], off = 0, i;
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  for(i=0;i<n;i++){
    const h = ((8 + Math.random()*60*l)*DPR)|0, y = (Math.random()*(cv.height-h))|0, dx = ((Math.random()-0.5)*60*l*DPR)|0;
    sl.push([y, h, dx, off]); off += h;
  }
  if(!gbuf){ gbuf = document.createElement('canvas'); gctx = gbuf.getContext('2d'); }
  if(gbuf.width !== cv.width){ gbuf.width = cv.width; gbuf.height = Math.ceil(5*68*DPR) + 4; }
  for(i=0;i<n;i++) gctx.drawImage(cv, 0, sl[i][0], cv.width, sl[i][1], 0, sl[i][3], cv.width, sl[i][1]);
  for(i=0;i<n;i++){
    ctx.drawImage(gbuf, 0, sl[i][3], cv.width, sl[i][1], sl[i][2], sl[i][0], cv.width, sl[i][1]);
    if(Math.random() < 0.4){
      ctx.globalAlpha = 0.25; ctx.fillStyle = Math.random() < 0.5 ? '#FF1F3D' : '#8FE3F2';
      ctx.fillRect(0, sl[i][0], cv.width, Math.max(1, sl[i][1]*0.15)); ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}

export function decay(){
  const l = S.nz; if(l <= 0) return;
  if(settings.reduceFlash){ if(Math.random() < per(l*0.3)) noise(0.03, 2); return; }
  if(timing.lowFx){ if(Math.random() < per(l*0.15)) noise(0.03 + l*0.1, 3); return; }
  if(Math.random() < per(0.1 + l*0.5)) noise(0.03 + l*0.12, 2 + l*2);
  if(l > 0.12 && Math.random() < per(l*0.55)) glitchSlices(l);
}

export function drawBasket(){
  const x = basket.x, y = basket.y, w = basket.w, h = Math.max(26, w*0.26), pad = 32, sw = w + pad*2 + 12;
  const sp = sprite('k:' + w.toFixed(1), sw, h*1.5 + pad*2, sw/2, pad, function(g){
    g.shadowColor='rgba(143,227,242,.7)'; g.shadowBlur=22;
    g.beginPath();
    g.moveTo(-w/2, 0);
    g.lineTo(-w/2*0.78, h);
    g.quadraticCurveTo(0, h*1.45, w/2*0.78, h);
    g.lineTo(w/2, 0);
    g.closePath();
    const gr = g.createLinearGradient(0,0,0,h);
    gr.addColorStop(0,'#8FE3F2'); gr.addColorStop(1,'#0E3A44');
    g.fillStyle=gr; g.fill();
    g.shadowBlur=0;
    g.beginPath(); g.moveTo(-w/2-4,0); g.lineTo(w/2+4,0);
    g.strokeStyle='#EAFBFF'; g.lineWidth=4; g.lineCap='round'; g.stroke();
    g.strokeStyle='rgba(5,7,10,.35)'; g.lineWidth=1.5;
    for(let i=1;i<5;i++){
      const px = -w/2 + i*(w/5);
      g.beginPath(); g.moveTo(px,2); g.lineTo(px*0.8, h*1.1); g.stroke();
    }
  });
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(basket.lean);
  ctx.drawImage(sp.c, -sp.ox, -sp.oy, sp.sw, sp.sh);
  ctx.restore();
}

export function drawBackdrop(){
  ctx.strokeStyle='rgba(143,227,242,.06)'; ctx.lineWidth=1; ctx.beginPath();
  const off = settings.reduceFlash ? 0 : (S.t*18)%40;
  for(let gy=off; gy<H; gy+=40){ ctx.moveTo(0,gy); ctx.lineTo(W,gy); }
  for(let gx=0; gx<W; gx+=40){ ctx.moveTo(gx,0); ctx.lineTo(gx,H); }
  ctx.stroke();
  if(!settings.reduceFlash){
    const by = (S.t*90)%(H+160) - 80, bg = ctx.createLinearGradient(0,by-60,0,by+60);
    bg.addColorStop(0,'rgba(143,227,242,0)'); bg.addColorStop(0.5,'rgba(143,227,242,.07)'); bg.addColorStop(1,'rgba(143,227,242,0)');
    ctx.fillStyle=bg; ctx.fillRect(0,by-60,W,120);
  }
  // Faint red eyes in the background, more as chaos grows.
  const n = Math.min(10, S.chaos*2);
  for(let i=0;i<n;i++){
    const sx = ((i*137.5)%100)/100*W, sy = ((i*79.3)%70)/100*H + H*0.08;
    const a = 0.05 + 0.05*Math.abs(Math.sin(S.t*1.3 + i));
    ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#FF1F3D';
    ctx.beginPath(); ctx.ellipse(sx,sy,26,13,0,0,6.2832); ctx.fill();
    ctx.fillStyle='#0A0208';
    ctx.beginPath(); ctx.arc(sx,sy,6,0,6.2832); ctx.fill();
    ctx.restore();
  }
  // Thin floor line
  ctx.strokeStyle='rgba(107,118,132,.25)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,H-12); ctx.lineTo(W,H-12); ctx.stroke();
}

export function noise(alpha, cell){
  ctx.save(); ctx.globalAlpha = alpha;
  for(let pass=0; pass<2; pass++){
    ctx.fillStyle = pass ? '#FF1F3D' : '#FFFFFF';
    ctx.beginPath();
    for(let i=0;i<70;i++) ctx.rect(Math.random()*W, Math.random()*H, cell*(0.5+Math.random()*2), cell*0.6);
    ctx.fill();
  }
  ctx.restore();
}

export function updateVignette(){
  const va = Math.round((0.5 + S.nz*0.35)*50)/50;
  if(va !== vigA){ vigA = va; wrapEl.style.setProperty('--vig', va); }
}
