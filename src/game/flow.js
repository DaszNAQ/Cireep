// Game flow: start, pause, life loss, game over, menu.
import { audio } from '../audio/engine.js';
import { musicMode } from '../audio/music.js';
import { scareSound } from '../audio/scare.js';
import { countTick, impact, infect, omen, pauseSound, startSound } from '../audio/sfx.js';
import { FLASH_STEP, SCARES } from '../config.js';
import { $, countEl, pauseScr, warnScr, wrapEl } from '../dom.js';
import { bumpChaos } from './spawn.js';
import { paintEyes, updateHUD } from '../hud.js';
import { t } from '../i18n.js';
import { releaseInput, resetInput } from '../input.js';
import { S, saveBest, settings } from '../state.js';

function pickScare(){
  let k;
  do{ k = SCARES[(Math.random()*SCARES.length)|0]; }while(k === S.lastScare);
  S.lastScare = k;
  return k;
}

export function setMode(m){ S.mode = m; wrapEl.setAttribute('data-mode', m); musicMode(m); }

export function loseLife(o){
  S.lives--;
  S.combo = 0;
  o.dead = 1;
  const fatal = S.lives <= 0;
  const kind = settings.noScare ? 'calm' : pickScare();
  S.jump = { t:0, dur: kind === 'calm' ? (fatal ? 1.0 : 0.6) : (fatal ? 1.7 : 0.95), fatal: fatal, seed: Math.random()*1000, kind: kind };
  setMode('scare');
  S.fake = null;
  S.shake = kind === 'calm' ? 6 : 30;
  scareSound(kind, fatal, S.jump);
  impact(kind === 'calm' ? 0.25 : 0.55);
  paintEyes();
  if(!fatal) bumpChaos();
}

export function afterScare(){
  if(S.jump.fatal){ gameOver(); return; }
  S.jump = null; setMode('play'); S.invuln = 1.1;
  // Clear falling Cireep so the player can catch a breath
  S.objs = S.objs.filter(function(o){ return !o.v; });
}

function gameOver(){
  setMode('over');
  infect();
  S.jump = null;
  S.frost = 0; S.slow = 1; S.fake = null; S.banner = null;
  const prevBest = S.best;
  saveBest();
  $('fScore').textContent = S.score;
  $('fCaught').textContent = S.caught;
  $('fBest').textContent = S.best;
  $('fBest').classList.toggle('record', S.score > 0 && S.score > prevBest);
  const ol = $('overLine');
  ol.setAttribute('data-i18n', S.caught >= 60 ? 'over3' : S.caught >= 25 ? 'over2' : 'over1');
  ol.textContent = t(ol.getAttribute('data-i18n'));
  $('over').classList.remove('hidden');
}

export function start(){
  audio();
  startSound();
  setMode('play'); S.t=0; S.sec=-1; S.score=0; S.caught=0; S.lives=3; S.chaos=0;
  S.objs=[]; S.spawn=0; S.nextChaos=30; S.nextFlash=FLASH_STEP; S.shake=0; S.flick=0;
  S.invuln=0; S.invert=0; S.invertPre=0; S.invertCd=0; S.slow=1; S.boostCd=0; S.flickCd=0; resetInput(); S.jump=null; S.combo=0; S.floats=[];
  S.parts=[]; S.frost=0; S.fireT=0; S.nz=0; S.nzq=-1; wrapEl.style.setProperty('--n', 0);
  S.phase=0; S.breather=0; S.banner=null; S.fake=null; S.fakeCd=10; S.revCd=0; S.cNum=0;
  warnOpen = false; warnScr.classList.add('hidden'); pauseScr.classList.add('hidden'); countEl.classList.add('hidden');
  $('menu').classList.add('hidden');
  $('over').classList.add('hidden');
  $('chaosTag').classList.remove('on');
  paintEyes(); updateHUD();
}

export let warnOpen = false;

export function requestStart(){
  if(settings.noScare){ start(); return; }
  warnOpen = true;
  omen();
  $('menu').classList.add('hidden');
  warnScr.classList.remove('hidden');
  $('warnBack').focus();
}

export function closeWarn(){
  warnOpen = false;
  warnScr.classList.add('hidden');
  $('menu').classList.remove('hidden');
  $('startBtn').focus();
}

export function pauseGame(){
  if(S.mode !== 'play') return;
  releaseInput();
  pauseSound();
  S.shake = 0; S.flick = 0;
  setMode('pause');
  pauseScr.classList.remove('hidden');
  $('resumeBtn').focus();
}

export function resumeGame(){
  if(S.mode !== 'pause') return;
  pauseScr.classList.add('hidden');
  S.cd = 3;
  countEl.textContent = '3';
  countTick(3);
  countEl.classList.remove('hidden');
  setMode('resume');
}

export function toMenu(){
  saveBest();
  pauseScr.classList.add('hidden'); warnScr.classList.add('hidden'); countEl.classList.add('hidden');
  $('over').classList.add('hidden');
  $('menu').classList.remove('hidden');
  warnOpen = false;
  setMode('menu');
  S.objs = []; S.parts = []; S.floats = []; S.jump = null; S.fake = null; S.banner = null;
  S.frost = 0; S.slow = 1; S.chaos = 0; S.nz = 0; S.nzq = -1; S.flick = 0; S.shake = 0; S.invert = 0; S.invertPre = 0;
  S.score = 0; S.caught = 0; S.lives = 3;
  wrapEl.style.setProperty('--n', 0);
  S.dirty = true;
}
