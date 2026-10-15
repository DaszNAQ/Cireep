// state.js
// Game state (S), the basket, player settings, and saved data (localStorage).

export const S = {
  mode: 'menu', t: 0, sec: -1, score: 0, caught: 0, lives: 3, chaos: 0, best: 0, combo: 0,
  objs: [], parts: [], floats: [], spawn: 0, nextChaos: 30,
  shake: 0, flick: 0, flickCol: '#fff', flickCd: 0, invuln: 0,
  invert: 0, invertPre: 0, invertCd: 0,
  frost: 0, slow: 1, fireT: 0, nz: 0, nzq: -1, boostCd: 0,
  phase: 0, breather: 0, banner: null, fake: null, fakeCd: 10, revCd: 0, cNum: 0,
  jump: null, lastScare: '', cd: 0, dirty: false
};

export const basket = { x: 0, y: 0, w: 120, tx: 0, vx: 0, lean: 0 };

export const settings = { reduceFlash: false, noScare: false, muted: false };

export function load(key){
  try{ return localStorage.getItem(key); }catch(e){ return null; }
}

export function store(key, value){
  try{ localStorage.setItem(key, value); }catch(e){}
}

export function loadSettings(){
  settings.reduceFlash = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const calm = load('cireep_calm');
  if(calm === '1' || calm === '0') settings.reduceFlash = calm === '1';
  settings.noScare = load('cireep_noscare') === '1';
  settings.muted = load('cireep_mute') === '1';
  S.best = parseInt(load('cireep_best') || '0', 10) || 0;
}

export function saveBest(){
  if(S.score > S.best){ S.best = S.score; store('cireep_best', String(S.best)); }
}
