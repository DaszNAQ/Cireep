// Buttons, keyboard shortcuts and settings buttons.
import { AC, master } from './audio/engine.js';
import { uiClick } from './audio/sfx.js';
import { $ } from './dom.js';
import { closeWarn, pauseGame, requestStart, resumeGame, start, toMenu, warnOpen } from './game/flow.js';
import { paintEyes, updateHUD } from './hud.js';
import { applyText, t } from './i18n.js';
import { releaseInput } from './input.js';
import { S, settings, store } from './state.js';

export function syncSettings(){
  const q = document.querySelectorAll('[data-act]');
  for(let i = 0; i < q.length; i++){
    const act = q[i].getAttribute('data-act');
    q[i].setAttribute('aria-pressed', (act === 'mute' ? settings.muted : act === 'flash' ? settings.reduceFlash : settings.noScare) ? 'true' : 'false');
  }
}

export function syncCalm(){
  document.body.classList.toggle('calm', settings.reduceFlash);
  syncSettings();
}

export function syncMute(){
  if(master) master.gain.value = settings.muted ? 0 : 0.8;
  syncSettings();
}

export function refreshText(){
  applyText();
  syncSettings();
  $('pauseBtn').setAttribute('aria-label', t('pause'));
  if(S.chaos > 0) $('chaosTag').textContent = t('chaos', S.chaos);
  updateHUD();
  paintEyes();
}

function onAway(){
  releaseInput();
  pauseGame();
}

const SETTING_BUTTONS = [
  { act: 'mute', i18n: 'mute' },
  { act: 'flash', i18n: 'flash' },
  { act: 'scare', i18n: 'noScare' }
];

// Same settings buttons on menu, pause and game over screens.
function buildSettings(){
  document.querySelectorAll('.settings').forEach(function(box){
    SETTING_BUTTONS.forEach(function(def){
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ghost';
      b.setAttribute('data-act', def.act);
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('data-i18n', def.i18n);
      box.appendChild(b);
    });
  });
}

export function initUI(){
  buildSettings();
  $('startBtn').addEventListener('click', requestStart);
  $('againBtn').addEventListener('click', start);
  $('warnBack').addEventListener('click', closeWarn);
  $('warnOk').addEventListener('click', start);
  $('pauseBtn').addEventListener('click', pauseGame);
  $('resumeBtn').addEventListener('click', resumeGame);
  $('quitBtn').addEventListener('click', toMenu);
  $('overMenuBtn').addEventListener('click', toMenu);

  document.addEventListener('click', function(e){
    if(e.target.closest && e.target.closest('button')) uiClick();
  }, true);

  document.addEventListener('click', function(e){
    const b = e.target.closest ? e.target.closest('[data-act]') : null;
    if(!b) return;
    const act = b.getAttribute('data-act');
    if(act === 'mute'){ settings.muted = !settings.muted; store('cireep_mute', settings.muted ? '1' : '0'); syncMute(); }
    else if(act === 'flash'){ settings.reduceFlash = !settings.reduceFlash; store('cireep_calm', settings.reduceFlash ? '1' : '0'); syncCalm(); }
    else if(act === 'scare'){ settings.noScare = !settings.noScare; store('cireep_noscare', settings.noScare ? '1' : '0'); syncSettings(); }
  });

  window.addEventListener('blur', onAway);
  document.addEventListener('visibilitychange', function(){
    if(document.hidden){ onAway(); if(AC && AC.state === 'running') AC.suspend(); }
    else if(AC && AC.state === 'suspended'){ const rp = AC.resume(); if(rp && rp.catch) rp.catch(function(){}); }
  });

  window.addEventListener('keydown', function(e){
    if(e.key === 'Escape' || e.key === 'p' || e.key === 'P'){
      if(S.mode === 'play') pauseGame();
      else if(S.mode === 'pause') resumeGame();
      else if(warnOpen) closeWarn();
    }
    if((e.key === ' ' || e.key === 'Enter') && e.target.tagName !== 'BUTTON' && !warnOpen){
      if(S.mode === 'menu'){ e.preventDefault(); requestStart(); }
      else if(S.mode === 'over'){ e.preventDefault(); start(); }
    }
  });

  syncCalm();
}
