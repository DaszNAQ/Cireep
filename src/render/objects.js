// Draws balls, ice ball, fire ball and the Cireep face.
import { sprite } from './sprites.js';
import { S } from '../state.js';
import { ctx } from '../view.js';

const MER = {};

function drawBall(o){
  const h = o.hue, r = o.r, pad = r + 24, spin = S.t*1.4 + o.ph;
  const sp = sprite('b' + h + ':' + r.toFixed(1), pad*2, pad*2, pad, pad, function(g){
    g.shadowColor = 'hsl('+h+' 100% 55% / .8)'; g.shadowBlur = 14;
    const gr = g.createRadialGradient(-r*0.3, -r*0.35, r*0.1, 0, 0, r);
    gr.addColorStop(0, 'hsl('+h+' 100% 50% / .95)'); gr.addColorStop(1, 'hsl('+h+' 100% 18% / .98)');
    g.beginPath(); g.arc(0, 0, r, 0, 6.2832); g.fillStyle = gr; g.fill();
    g.shadowBlur = 0;
    g.strokeStyle = 'hsl('+h+' 100% 62%)'; g.lineWidth = 1.3; g.stroke();
  });
  ctx.drawImage(sp.c, o.x - pad, o.y - pad, sp.sw, sp.sh);
  ctx.strokeStyle = MER[h] || (MER[h] = 'hsl('+h+' 100% 68% / .6)'); ctx.lineWidth = 1;
  ctx.beginPath();
  for(let i=0;i<3;i++){
    const w = Math.max(0.5, Math.abs(Math.cos(spin + i*1.047))*r);
    ctx.moveTo(o.x + w, o.y); ctx.ellipse(o.x, o.y, w, r, 0, 0, 6.2832);
  }
  ctx.moveTo(o.x + r, o.y); ctx.ellipse(o.x, o.y, r, r*0.3, 0, 0, 6.2832);
  ctx.stroke();
}

// Cireep face, used on falling balls and jump-scares.
export function drawFace(x, y, r, t, rage){
  const sd = Math.floor(t*9);
  function R(i){ const s = Math.sin((sd+1)*12.9898 + i*78.233)*43758.5453; return s - Math.floor(s); }
  ctx.save(); ctx.translate(x,y);
  const ga0 = ctx.globalAlpha;
  // Spikes around the body
  ctx.strokeStyle = 'rgba(255,31,61,'+(0.55+0.3*rage)+')'; ctx.fillStyle = '#FF1F3D';
  ctx.lineWidth = Math.max(1.2, r*0.09); ctx.lineCap = 'round';
  for(let i=0;i<12;i++){
    const a = i/12*6.2832 + t*0.5, L = r*(1.28 + 0.22*Math.sin(t*4+i*1.7) + 0.18*rage);
    ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*0.9, Math.sin(a)*r*0.9); ctx.lineTo(Math.cos(a)*L, Math.sin(a)*L); ctx.stroke();
    ctx.beginPath(); ctx.arc(Math.cos(a)*L, Math.sin(a)*L, Math.max(1.4, r*0.1), 0, 6.2832); ctx.fill();
  }
  // Dark round body
  const g = ctx.createRadialGradient(-r*0.25,-r*0.3,r*0.1,0,0,r);
  g.addColorStop(0,'#2A0A14'); g.addColorStop(0.7,'#0F0409'); g.addColorStop(1,'#030105');
  ctx.beginPath(); ctx.arc(0,0,r*(1+0.05*Math.sin(t*6)),0,6.2832); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,31,61,.7)'; ctx.lineWidth = Math.max(1, r*0.05); ctx.stroke();
  // Uneven eyes that drip red
  const ex = r*0.36, ey = -r*0.18;
  const eyes = [[-ex, ey, r*0.26, r*0.34], [ex, ey+r*0.05, r*0.15, r*0.2]];
  for(let k=0;k<2;k++){
    const e = eyes[k];
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(e[0],e[1],e[2],e[3],k?-0.2:0.2,0,6.2832); ctx.fill();
    const px = e[0]+Math.sin(t*3+k)*e[2]*0.3, pr = Math.max(1,e[2]*0.28);
    if(r > 60){ ctx.shadowColor = '#FF1F3D'; ctx.shadowBlur = Math.min(r*0.4, 60); }
    else { ctx.fillStyle = 'rgba(255,31,61,.28)'; ctx.beginPath(); ctx.arc(px, e[1], pr*2.6, 0, 6.2832); ctx.fill(); }
    ctx.fillStyle = '#FF1F3D';
    ctx.beginPath(); ctx.arc(px, e[1], pr, 0, 6.2832); ctx.fill();
    ctx.shadowBlur = 0;
    const dl = r*(0.35 + 0.3*rage + 0.25*Math.abs(Math.sin(t*1.3+k*2)));
    ctx.strokeStyle = 'rgba(200,10,40,.9)'; ctx.lineWidth = Math.max(1, r*0.07);
    ctx.beginPath(); ctx.moveTo(e[0], e[1]+e[3]*0.8); ctx.lineTo(e[0]+(k?r*0.02:-r*0.03), e[1]+e[3]+dl); ctx.stroke();
  }
  // Wide smile with sharp teeth
  const my = r*0.4, mw = r*(0.78+0.1*rage), open = r*(0.1+0.32*rage) + Math.sin(t*5)*r*0.03, ly = my - r*0.1;
  ctx.beginPath(); ctx.moveTo(-mw,ly); ctx.quadraticCurveTo(0,my+open*2.4,mw,ly); ctx.quadraticCurveTo(0,my-open*0.2,-mw,ly);
  ctx.fillStyle = '#050103'; ctx.fill(); ctx.strokeStyle = '#FF1F3D'; ctx.lineWidth = Math.max(1, r*0.05); ctx.stroke();
  ctx.fillStyle = '#D8DDD3';
  for(let q=0;q<11;q++){
    const u = (q+0.5)/11*2-1, tx = u*mw*0.92, ty = ly - (1-u*u)*open*0.1, th = r*(0.12+0.1*R(q));
    ctx.beginPath(); ctx.moveTo(tx-mw/11*0.45,ty); ctx.lineTo(tx+mw/11*0.45,ty); ctx.lineTo(tx,ty+th); ctx.fill();
  }
  // Random glitch bars
  const nb = (2 + rage*5)|0;
  ctx.globalAlpha = ga0*0.7;
  for(let b=0;b<nb;b++){
    if(R(30+b) < 0.5) continue;
    ctx.fillStyle = R(80+b) < 0.5 ? '#FF1F3D' : '#8FE3F2';
    ctx.fillRect((R(40+b)*2-1)*r*0.9, (R(50+b)*2-1)*r*0.9, r*(0.2+R(60+b)*0.5), r*(0.04+R(70+b)*0.1));
  }
  ctx.globalAlpha = ga0;
  // Binary text (only on a big face)
  if(r > 40){
    ctx.fillStyle = 'rgba(255,31,61,.5)'; ctx.font = Math.round(r*0.12)+'px "IBM Plex Mono", monospace';
    for(let z=0;z<7;z++) ctx.fillText(R(90+z)<0.5?'01':'10', (R(100+z)*2-1)*r*0.8, (R(110+z)*2-1)*r*0.85);
  }
  ctx.restore();
}

function flameShape(s){
  ctx.beginPath(); ctx.moveTo(0,-s);
  ctx.bezierCurveTo(s*0.2,-s*0.4,s*0.85,-s*0.1,s*0.7,s*0.4);
  ctx.bezierCurveTo(s*0.6,s*0.85,s*0.2,s,0,s);
  ctx.bezierCurveTo(-s*0.5,s,-s*0.85,s*0.6,-s*0.7,s*0.15);
  ctx.bezierCurveTo(-s*0.55,-s*0.15,-s*0.1,-s*0.45,0,-s);
  ctx.closePath();
}

function drawIce(o){
  const r = o.r*1.08, pad = r + 28;
  const sp = sprite('i:' + r.toFixed(1), pad*2, pad*2, pad, pad, function(g){
    g.shadowColor = 'rgba(120,220,255,.9)'; g.shadowBlur = 18;
    const gr = g.createRadialGradient(-r*0.3,-r*0.35,r*0.1,0,0,r);
    gr.addColorStop(0,'#BFF3FF'); gr.addColorStop(0.6,'#1B7FC4'); gr.addColorStop(1,'#07264A');
    g.beginPath(); g.arc(0,0,r,0,6.2832); g.fillStyle = gr; g.fill();
  });
  ctx.drawImage(sp.c, o.x - pad, o.y - pad, sp.sw, sp.sh);
  ctx.save();
  ctx.strokeStyle = '#E6FBFF'; ctx.lineWidth = Math.max(1.2, r*0.1); ctx.lineCap = 'round';
  ctx.translate(o.x,o.y); ctx.rotate(S.t*0.6);
  for(let i=0;i<3;i++){
    ctx.rotate(1.0472); ctx.beginPath(); ctx.moveTo(-r*0.62,0); ctx.lineTo(r*0.62,0);
    for(let s=-1;s<=1;s+=2){
      ctx.moveTo(s*r*0.38,0); ctx.lineTo(s*r*0.55,-r*0.16);
      ctx.moveTo(s*r*0.38,0); ctx.lineTo(s*r*0.55,r*0.16);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawFireBall(o){
  const r = o.r*1.08, f = 1 + Math.sin(S.t*12+o.ph)*0.06, pad = r + 30;
  const sp = sprite('f:' + r.toFixed(1), pad*2, pad*2, pad, pad, function(g){
    g.shadowColor = 'rgba(255,120,20,.95)'; g.shadowBlur = 20;
    const gr = g.createRadialGradient(-r*0.3,-r*0.35,r*0.1,0,0,r);
    gr.addColorStop(0,'#FFB347'); gr.addColorStop(0.6,'#D8330B'); gr.addColorStop(1,'#3A0903');
    g.beginPath(); g.arc(0,0,r,0,6.2832); g.fillStyle = gr; g.fill();
  });
  ctx.drawImage(sp.c, o.x - pad, o.y - pad, sp.sw, sp.sh);
  ctx.save();
  ctx.translate(o.x,o.y+r*0.04); ctx.scale(f,f);
  flameShape(r*0.62); ctx.fillStyle = '#FFE08A'; ctx.fill();
  ctx.translate(0,r*0.2); flameShape(r*0.34); ctx.fillStyle = '#FF5A1F'; ctx.fill();
  ctx.restore();
}

function drawFrost(o){
  ctx.beginPath(); ctx.arc(o.x,o.y,o.r*1.05,0,6.2832);
  ctx.fillStyle = 'rgba(170,230,255,.35)'; ctx.fill();
  ctx.strokeStyle = 'rgba(235,252,255,.9)'; ctx.lineWidth = 1.5; ctx.stroke();
  for(let i=0;i<6;i++){
    const a = i*1.0472 + 0.3;
    ctx.beginPath(); ctx.moveTo(o.x+Math.cos(a)*o.r, o.y+Math.sin(a)*o.r);
    ctx.lineTo(o.x+Math.cos(a)*o.r*1.4, o.y+Math.sin(a)*o.r*1.4); ctx.stroke();
  }
}

function drawBurn(o){
  const p = o.burn/0.55;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*1.7);
  g.addColorStop(0,'rgba(255,200,80,'+(0.8*p)+')'); g.addColorStop(1,'rgba(255,60,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x,o.y,o.r*1.7,0,6.2832); ctx.fill();
  ctx.restore();
  for(let i=0;i<3;i++){
    ctx.save(); ctx.translate(o.x+(i-1)*o.r*0.55, o.y - o.r*0.5*(1-p));
    ctx.scale(1, 1+0.3*Math.sin(S.t*20+i)); flameShape(o.r*(0.55+0.2*p));
    ctx.fillStyle = 'rgba(255,'+(100+i*50)+',30,'+(0.85*p+0.1)+')'; ctx.fill(); ctx.restore();
  }
}

function drawTell(o){
  const a = 0.55 - S.chaos*0.08 - S.phase*0.1;
  if(a <= 0) return;
  const k = Math.sin(S.t*6 + o.ph*3);
  if(k < 0.55) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,31,61,' + (a*(k-0.55)/0.45) + ')'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(o.x, o.y, o.r*1.12, 0, 6.2832); ctx.stroke();
  ctx.restore();
}

export function drawObj(o){
  ctx.save();
  if(o.burn > 0) ctx.globalAlpha = Math.max(0.15, o.burn/0.55);
  if(o.v){
    const rv = o.rev === undefined ? 1 : o.rev, rage = Math.min(1, S.chaos*0.25);
    if(rv >= 1) drawFace(o.x, o.y, o.r, S.t + o.ph, rage);
    else {
      const ga = ctx.globalAlpha;
      ctx.globalAlpha = ga * (1 - rv); drawBall(o);
      if(rv > 0){ ctx.globalAlpha = ga * rv; drawFace(o.x, o.y, o.r, S.t + o.ph, rage); }
      ctx.globalAlpha = ga;
      if(rv <= 0) drawTell(o);
    }
  }
  else if(o.k === 'ice') drawIce(o);
  else if(o.k === 'fire') drawFireBall(o);
  else drawBall(o);
  ctx.restore();
  if(!o.v && o.flash > 0){
    ctx.save();
    ctx.globalAlpha = Math.sin(Math.PI * (1 - o.flash/0.14));
    drawFace(o.x, o.y, o.r, S.t + o.ph, 0.3);
    ctx.restore();
  }
  if(S.frost > 0) drawFrost(o);
  if(o.burn > 0) drawBurn(o);
}
