// render/sprites.js
// Sprite cache. Draws costly shapes once, then reuses the picture.
import { DPR, SPR } from '../view.js';

export function sprite(key, sw, sh, ox, oy, draw){
  const sp = SPR[key];
  if(sp) return sp;
  let c = document.createElement('canvas'), g;
  c.width = Math.ceil(sw*DPR); c.height = Math.ceil(sh*DPR);
  g = c.getContext('2d'); g.setTransform(c.width/sw, 0, 0, c.height/sh, 0, 0);
  g.translate(ox, oy); draw(g);
  return (SPR[key] = { c:c, sw:sw, sh:sh, ox:ox, oy:oy });
}
