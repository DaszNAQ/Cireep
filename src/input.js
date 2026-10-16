// Mouse, touch and keyboard input. Moves the basket.
import { BASKET_V } from './config.js';
import { cv } from './dom.js';
import { S, basket } from './state.js';
import { W } from './view.js';

let pointerDown = false;
let hover = false;
let keyL = false;
let keyR = false;
let kbOn = false;
let rawX = null;
let lastInv = false;

function clampX(x){ return Math.max(basket.w/2, Math.min(W - basket.w/2, x)); }

function pointX(e){ return e.clientX - cv.getBoundingClientRect().left; }

function aim(x){
  rawX = x;
  basket.tx = clampX(S.invert > 0 ? W - x : x);
}

export function releaseInput(){ pointerDown = false; keyL = false; keyR = false; }

export function resetInput(){
  lastInv = false;
  basket.tx = basket.x;
}

export function moveBasket(dt){
  const invNow = S.invert > 0;
  if(invNow !== lastInv){ lastInv = invNow; if(rawX !== null && (pointerDown || hover)) aim(rawX); }

  if(keyL || keyR){
    let dir = (keyR?1:0) - (keyL?1:0);
    if(S.invert > 0) dir = -dir;
    basket.tx = dir === 0 ? basket.x : clampX(dir > 0 ? W : 0);
    kbOn = true;
  } else if(kbOn){ basket.tx = basket.x; kbOn = false; }
  const step = W*BASKET_V*dt, mvx = Math.max(-step, Math.min(step, basket.tx - basket.x));
  basket.x += mvx;
  basket.vx = dt > 0 ? mvx/dt : 0;
  basket.lean += (basket.vx*0.00018 - basket.lean) * Math.min(1, dt*12);
}

export function initInput(){
  cv.addEventListener('pointerdown', function(e){ pointerDown = true; hover = e.pointerType === 'mouse'; cv.setPointerCapture(e.pointerId); aim(pointX(e)); });
  cv.addEventListener('pointermove', function(e){ if(e.pointerType === 'mouse') hover = true; if(pointerDown || hover) aim(pointX(e)); });
  cv.addEventListener('pointerleave', function(e){ if(e.pointerType === 'mouse') hover = false; });
  cv.addEventListener('pointerup', function(){ pointerDown = false; });
  cv.addEventListener('pointercancel', function(){ pointerDown = false; });
  window.addEventListener('keydown', function(e){
    if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyL = true;
    if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyR = true;
  });
  window.addEventListener('keyup', function(e){
    if(e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyL = false;
    if(e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyR = false;
  });
}
