// Canvas size, sharpness and window resize.
import { cv } from './dom.js';
import { S, basket } from './state.js';

export const ctx = cv.getContext('2d');
export let W = 0;
export let H = 0;
export let DPR = 1;
export let QUAL = 1;
export let SPR = {};

function rescale(kx, ky){
  let i, o;
  for(i=0;i<S.objs.length;i++){ o = S.objs[i]; o.x *= kx; o.y *= ky; if(o.vy) o.vy *= ky; }
  for(i=0;i<S.parts.length;i++){ o = S.parts[i]; o.x *= kx; o.y *= ky; o.vx *= kx; o.vy *= ky; }
  for(i=0;i<S.floats.length;i++){ S.floats[i].x *= kx; S.floats[i].y *= ky; }
  if(S.fake){ S.fake.x *= kx; S.fake.y *= ky; }
  basket.x *= kx; basket.tx *= kx;
}

export function resize(){
  DPR = Math.max(0.75, Math.min(window.devicePixelRatio || 1, 2) * QUAL);
  const oW = W, oH = H;
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  SPR = {};
  if(oW && oH && (oW !== W || oH !== H)) rescale(W/oW, H/oH);
  basket.w = Math.max(84, Math.min(W*0.22, 168));
  basket.y = H - Math.max(70, H*0.13);
  basket.x = Math.max(basket.w/2, Math.min(W-basket.w/2, basket.x || W/2));
  basket.tx = Math.max(basket.w/2, Math.min(W-basket.w/2, basket.tx || basket.x));
  S.dirty = true;
}

export function lowerQuality(){
  QUAL = Math.max(0.5, QUAL - 0.25);
  resize();
}
