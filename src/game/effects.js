// Effects on balls: sparks, ice and fire.
import { fireSound, iceSound } from '../audio/sfx.js';
import { S, basket } from '../state.js';

function sparks(x, y, r, fire){
  for(let i=0;i<(fire?9:7);i++){
    const a = Math.random()*6.2832, sp = 80 + Math.random()*120;
    S.parts.push(fire
      ? {f:1, x:x+(Math.random()-0.5)*r, y:y, vx:(Math.random()-0.5)*50, vy:-(60+Math.random()*130), t:0, life:0.5+Math.random()*0.4, s:r*(0.2+Math.random()*0.3)}
      : {f:0, x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, t:0, life:0.6, s:3});
  }
}

export function freezeAll(src){
  for(let j=0;j<S.objs.length;j++){ const b = S.objs[j]; sparks(b.x,b.y,b.r,0); }
  sparks(src.x, basket.y, 20, 0);
  S.frost = 4;
  iceSound();
}

export function burnAll(src){
  let n = 0;
  for(let j=0;j<S.objs.length;j++){
    const b = S.objs[j];
    if(b.burn > 0 || b.dead) continue;
    b.burn = 0.55; sparks(b.x,b.y,b.r,1);
    if(!b.v){ n++; S.floats.push({x:b.x, y:b.y, t:0, txt:'+1', hue:24}); }
  }
  S.score += n; S.caught++; S.combo++; S.fireT = 0.5;
  sparks(src.x, basket.y, 20, 1);
  fireSound();
}
