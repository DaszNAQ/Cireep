// Draws the jump-scare screens.
import { drawFace } from './objects.js';
import { glitchSlices, noise } from './scene.js';
import { S, settings } from '../state.js';
import { hash } from '../util.js';
import { DPR, H, W, ctx } from '../view.js';

function scareTail(r){
  noise(settings.reduceFlash ? 0.08 : 0.3, 4);
  const v = ctx.createRadialGradient(W/2,H/2,r*0.6,W/2,H/2,Math.max(W,H)*0.8);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.85)');
  ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
}

function scareFace(j, p){
  const flash = settings.reduceFlash ? 0.55 : (p < 0.12 ? 1 : 0.8);
  ctx.fillStyle = p < 0.1 && !settings.reduceFlash ? '#9AA3AF' : 'rgba(30,2,10,'+flash+')';
  ctx.fillRect(0,0,W,H);
  const sh = settings.reduceFlash ? 4 : 22*(1-p*0.4);
  const ox = (Math.random()-0.5)*sh, oy = (Math.random()-0.5)*sh;
  const r = Math.min(W,H) * (0.22 + 0.42*Math.min(1,p*2.6)) * (j.fatal?1.15:1);
  const cx = W/2 + ox, cy = H/2 + oy;
  if(!settings.reduceFlash){
    ctx.save(); ctx.globalAlpha=0.5; ctx.globalCompositeOperation='screen';
    ctx.translate(6,0); drawFace(cx,cy,r,S.t,1); ctx.restore();
    ctx.save(); ctx.globalAlpha=0.5; ctx.globalCompositeOperation='screen';
    ctx.translate(-6,0); drawFace(cx,cy,r,S.t+0.3,1); ctx.restore();
  }
  drawFace(cx, cy, r, S.t, 1);
  scareTail(r);
}

function scareLunge(j, p){
  let m = Math.min(W,H), e = Math.min(1, p/0.38); e = e*e*e;
  ctx.fillStyle = 'rgba(8,0,3,.94)'; ctx.fillRect(0,0,W,H);
  const r = m*0.05 + (Math.max(W,H)*0.6*(j.fatal?1.15:1) - m*0.05)*e;
  const sh = settings.reduceFlash ? 3 : 4 + 26*e*(1-p*0.6);
  drawFace(W/2 + (Math.random()-0.5)*sh, H/2 + (Math.random()-0.5)*sh, r, S.t, 1);
  scareTail(Math.min(r, Math.max(W,H)*0.6));
}

function scareGlitch(j, p){
  const m = Math.min(W,H), r = m*(0.4 + 0.22*Math.min(1,p*3))*(j.fatal?1.15:1);
  ctx.fillStyle = 'rgba(26,0,8,.92)'; ctx.fillRect(0,0,W,H);
  const cx = W/2 + (settings.reduceFlash ? 0 : (Math.floor(S.t*14)%3 - 1)*W*0.05), cy = H/2;
  if(!settings.reduceFlash){
    const k = 14 + Math.random()*10;
    ctx.save(); ctx.globalAlpha=0.5; ctx.globalCompositeOperation='screen';
    ctx.translate(k,0); drawFace(cx,cy,r,S.t,1); ctx.restore();
    ctx.save(); ctx.globalAlpha=0.5; ctx.globalCompositeOperation='screen';
    ctx.translate(-k,0); drawFace(cx,cy,r,S.t+0.4,1); ctx.restore();
  }
  drawFace(cx, cy, r, S.t, 1);
  if(!settings.reduceFlash){
    glitchSlices(1); glitchSlices(1);
    ctx.save();
    for(let i=0;i<5;i++){
      ctx.globalAlpha = 0.22; ctx.fillStyle = Math.random() < 0.5 ? '#FF1F3D' : '#8FE3F2';
      ctx.fillRect(0, Math.random()*H, W, 2 + Math.random()*10);
    }
    ctx.restore();
  }
  scareTail(r);
}

function drawEye(x, y, w, open, lx, ly, dil){
  const h = Math.max(0.5, w*0.55*open);
  ctx.save(); ctx.translate(x,y);
  ctx.shadowColor = '#FF1F3D'; ctx.shadowBlur = Math.min(w*0.4, 30);
  ctx.beginPath(); ctx.ellipse(0,0,w,h,0,0,6.2832);
  const g = ctx.createRadialGradient(0,0,w*0.1,0,0,w);
  g.addColorStop(0,'#E4DEDA'); g.addColorStop(1,'#6E1520');
  ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
  ctx.save(); ctx.clip();
  const ix = lx*w*0.4, iy = ly*h*0.5, ir = h*0.9;
  ctx.fillStyle = '#FF1F3D'; ctx.beginPath(); ctx.arc(ix,iy,ir,0,6.2832); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(ix,iy,Math.max(0.6, ir*(0.16+0.3*dil)), ir*0.85,0,0,6.2832); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,31,61,.85)'; ctx.lineWidth = Math.max(1, w*0.04);
  ctx.beginPath(); ctx.ellipse(0,0,w,h,0,0,6.2832); ctx.stroke();
  ctx.restore();
}

function scareEyes(j, p){
  const m = Math.min(W,H), sc = m/390, look = p > 0.55;
  ctx.fillStyle = 'rgba(5,0,3,.95)'; ctx.fillRect(0,0,W,H);
  for(let i=0;i<16;i++){
    const x = hash(j.seed + i*7.3)*W, y = hash(j.seed + i*3.1 + 50)*H;
    const w = (16 + hash(j.seed + i*1.7 + 90)*26)*sc;
    const open = Math.max(0, Math.min(1, (p - hash(j.seed + i*5.9 + 130)*0.45)/0.1));
    if(open <= 0) continue;
    const lx = look ? 0 : Math.max(-1, Math.min(1, (W/2 - x)/(W/2)));
    drawEye(x, y, w, open, lx, look ? 0.4 : 0.6, look ? 1 : 0.2);
  }
  const big = Math.max(0, Math.min(1, (p - 0.55)/0.1)), r = m*0.5*(j.fatal?1.15:1);
  if(big > 0) drawEye(W/2 + (settings.reduceFlash ? 0 : (Math.random()-0.5)*8), H/2, r*0.9*(0.85+0.15*big), big, Math.sin(S.t*9)*0.3, 0.1, 1);
  scareTail(big > 0 ? r*0.9 : m*0.2);
}

export function drawScare(){
  const j = S.jump, p = j.t / j.dur;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(j.kind === 'lunge') scareLunge(j, p);
  else if(j.kind === 'glitch') scareGlitch(j, p);
  else if(j.kind === 'eyes') scareEyes(j, p);
  else scareFace(j, p);
}
