// hud.js
// HUD: score text, REC timer and life icons (eyes).
import { $, recEl } from './dom.js';
import { t } from './i18n.js';
import { S } from './state.js';

export function paintEyes(){
  let box = $('eyes'), html = '';
  for(let i=0;i<3;i++){
    const gone = i >= S.lives ? ' gone' : '';
    html += '<svg class="eye'+gone+'" viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M1 12C4 6.5 8 4 12 4s8 2.5 11 8c-3 5.5-7 8-11 8S4 17.5 1 12Z" fill="none" stroke="#D8DDD3" stroke-width="1.6"/>'
      + '<circle cx="12" cy="12" r="4" fill="#FF1F3D"/></svg>';
  }
  box.innerHTML = html;
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', t('lives', S.lives));
}

export function updateRec(){
  const sec = S.t|0;
  if(sec === S.sec) return;
  S.sec = sec;
  const m = ('0'+((sec/60)|0)).slice(-2), s = ('0'+(sec%60)).slice(-2);
  recEl.textContent = '● REC ' + ((S.chaos >= 2 && Math.random() < 0.15) ? '??:??' : m+':'+s);
}

export function updateHUD(){
  $('score').textContent = S.score;
  $('caughtLbl').textContent = t('caught', S.caught);
}
