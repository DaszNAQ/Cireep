// Entry point: sets up modules and runs the game loop.
import { initAudio } from './audio/engine.js';
import { initMusic, musicUpdate } from './audio/music.js';
import { countTick } from './audio/sfx.js';
import { HUES } from './config.js';
import { countEl } from './dom.js';
import { afterScare, setMode } from './game/flow.js';
import { update } from './game/update.js';
import { initInput } from './input.js';
import { render } from './render/render.js';
import { S, loadSettings } from './state.js';
import { per, timing } from './timing.js';
import { initUI, refreshText } from './ui.js';
import { H, QUAL, W, lowerQuality, resize } from './view.js';

let last = performance.now();
let skipAcc = 0;
let pfT = 0;
let pfN = 0;

function watchPerf(raw){
  if(S.mode !== 'play' || S.t < 2 || raw > 250 || QUAL <= 0.5) return;
  pfT += raw; pfN++;
  if(pfT >= 3000){
    const avg = pfT/pfN; pfT = 0; pfN = 0;
    if(avg > 40) lowerQuality();
  }
}

function loop(now){
  let raw = now - last, dt = Math.min(0.05, raw/1000); last = now;
  timing.fdt = Math.max(dt, 0.001);
  timing.fxEma += (Math.min(raw, 100) - timing.fxEma)*0.1;
  timing.lowFx = S.mode === 'play' && timing.fxEma > 24;
  musicUpdate(dt);
  if(S.mode === 'menu' || S.mode === 'over'){
    skipAcc += dt;
    if(skipAcc < 0.03){ requestAnimationFrame(loop); return; }
    dt = skipAcc; skipAcc = 0; timing.fdt = Math.max(dt, 0.001);
  }
  if(S.mode === 'play') update(dt);
  else if(S.mode === 'scare'){
    S.t += dt; S.jump.t += dt;
    if(S.jump.t >= S.jump.dur) afterScare();
  } else if(S.mode === 'resume'){
    S.cd -= dt;
    const cn = Math.ceil(S.cd);
    if(cn > 0){ if(countEl.textContent !== String(cn)){ countEl.textContent = cn; countTick(cn); } }
    else { countEl.classList.add('hidden'); setMode('play'); }
  } else if(S.mode === 'pause'){
  } else {
    S.t += dt;
    if(S.objs.length < 6 && Math.random() < per(0.03)) {
      const r = 18;
      S.objs.push({v:Math.random()<0.2,x:r+Math.random()*(W-r*2),y:-40,r:r,
        vy:H*0.12,hue:HUES[(Math.random()*HUES.length)|0],ph:Math.random()*6,sway:10,dead:0});
    }
    for(let i=S.objs.length-1;i>=0;i--){
      const o=S.objs[i]; o.y+=o.vy*dt; o.ph+=dt*2;
      if(o.y-o.r>H) S.objs.splice(i,1);
    }
  }
  watchPerf(raw);
  if(S.mode !== 'pause' || S.dirty){ render(); S.dirty = false; }
  requestAnimationFrame(loop);
}

function registerServiceWorker(){
  const url = window.CIREEP_SW;
  if(!url || !('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  try{ if(window.self !== window.top) return; }catch(e){ return; }
  window.addEventListener('load', function(){
    try{ navigator.serviceWorker.register(url).catch(function(){}); }catch(e){}
  });
}

function boot(){
  loadSettings();
  initAudio();
  initMusic();
  initInput();
  initUI();
  window.addEventListener('resize', resize);
  resize();
  refreshText();
  if(document.fonts && document.fonts.load){
    document.fonts.load('600 16px "IBM Plex Mono"');
    document.fonts.load('700 16px "Chakra Petch"');
  }
  registerServiceWorker();
  requestAnimationFrame(loop);
}

boot();
