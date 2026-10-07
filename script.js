(function(){
"use strict";

// CANVAS
var cv = document.getElementById('game');
var ctx = cv.getContext('2d');
var W = 0, H = 0, DPR = 1;

function resize(){
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  ctx.setTransform(DPR,0,0,DPR,0,0);
  basket.w = Math.max(84, Math.min(W*0.22, 168));
  basket.y = H - Math.max(70, H*0.13);
  basket.x = Math.max(basket.w/2, Math.min(W-basket.w/2, basket.x || W/2));
  basket.tx = Math.max(basket.w/2, Math.min(W-basket.w/2, basket.tx || basket.x));
  S.dirty = true;
}
window.addEventListener('resize', resize);

// STATUS _ TRẠNG THÁI
var reduceFlash = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
try{ var sc = localStorage.getItem('cireep_calm'); if(sc==='1'||sc==='0') reduceFlash = sc==='1'; }catch(e){}
var noScare = false;
try{ noScare = localStorage.getItem('cireep_noscare') === '1'; }catch(e){}
var S = {
  mode:'menu', t:0, score:0, caught:0, lives:3, chaos:0,
  objs:[], spawn:0, nextChaos:30,
  shake:0, flick:0, flickCol:'#fff', invuln:0,
  invert:0, invertPre:0, invertCd:0, jump:null, best:0, combo:0, floats:[],
  parts:[], frost:0, slow:1, boostCd:0, flickCd:0, fireT:0, nz:0, nzq:-1,
  phase:0, breather:0, banner:null, fake:null, fakeCd:10, revCd:0, cNum:0, lastScare:''
};
var basket = { x:0, y:0, w:120, tx:0, vx:0, lean:0 };

// LANGUAGE _ NGÔN NGỮ
var L = {
  vi: {
    docTitle:'CIREEP — Hứng gói dữ liệu', toEn:'English',
    fileTag:'cireep_0417.log',
    menuSub:'Gói dữ liệu rơi xuống luồng. Có thứ rơi lẫn trong đó, và nó <em>giả dạng</em> một gói bình thường.',
    r1:'Thu gói dữ liệu để ghi điểm.',
    r2:'Cireep giả dạng bóng thường và chỉ lộ mặt khi lại gần. Thu trúng là mất một trong ba bức tường lửa. Mặt chớp thoáng là giả, mặt giữ lại là thật.',
    r3:'Luồng càng lúc càng nhiễu: theo thời gian, theo số gói thu và mỗi lần mất lớp bảo vệ. Điều khiển có thể đảo chiều.',
    r4:'Kéo ngón tay hoặc dùng phím ← →.',
    r5:'Bóng băng làm chậm mọi bóng, kể cả bóng mới xuất hiện, trong 4 giây.',
    r6:'Bóng lửa thiêu cháy mọi bóng đang rơi, mỗi bóng +1 điểm. Cireep cũng cháy nhưng không có điểm.',
    start:'Bắt đầu', again:'Chơi lại',
    warn:'Game có ánh sáng nhấp nháy và hình ảnh doạ bất ngờ kèm âm thanh. Bật “Giảm nháy đèn” hoặc “Tắt <span class="nb">jump-scare</span>” nếu bạn nhạy cảm.',
    flash:'Giảm nháy đèn', mute:'Tắt tiếng', noScare:'Tắt jump-scare', score:'Điểm', packets:'Gói', best:'Kỷ lục',
    overTitle:'Cireep đang tiến vào máy bạn',
    over1:'Nó kiên nhẫn hơn bạn.', over2:'Nó vẫn ở đó, giữa những gói dữ liệu.',
    over3:'Bạn trụ lâu hơn hầu hết. Nhưng nó đã nhớ khuôn mặt bạn.',
    caught:'{n} gói đã thu', chaos:'Tín hiệu nhiễu · mức {n}', lives:'Còn {n} bức tường lửa',
    inv:'Điều khiển bị đảo ngược!', invWarn:'Cảnh báo: sắp đảo ngược điều khiển!',
    ph2:'Giai đoạn 2 · tín hiệu nhiễu', ph3:'Giai đoạn 3 · Cireep bắt đầu đánh lừa bạn', ph4:'Giai đoạn 4 · nó đã vào luồng',
    pause:'Tạm dừng', paused:'Tạm dừng', resume:'Tiếp tục', quit:'Về menu',
    warnTitle:'Khuyến cáo 16+',
    warnBody:'Game có <span class="nb">jump-scare</span> bất ngờ kèm âm thanh lớn và ánh sáng nhấp nháy, có thể gây ám ảnh hoặc khó chịu. Chỉ dành cho người từ 16 tuổi trở lên. Bạn chắc chắn muốn chơi chứ?',
    warnHint:'Muốn bớt đáng sợ? Quay lại và bật “Tắt <span class="nb">jump-scare</span>” hoặc “Giảm nháy đèn”.',
    warnBack:'Quay lại', warnOk:'OK, bắt đầu',
    w1:'nó đang theo dõi bạn', w2:'đừng chạm vào nó', w3:'bạn là người tiếp theo'
  },
  en: {
    docTitle:'CIREEP — Catch the data', toEn:'Tiếng Việt',
    fileTag:'cireep_0417.log',
    menuSub:'Data packets fall through the stream. Something falls with them, and it <em>poses</em> as a normal packet.',
    r1:'Catch data packets to score.',
    r2:'Cireep poses as a normal ball and only shows its face up close. Catching it costs one of your three firewall layers. A face that only flickers is fake; one that stays is real.',
    r3:'The stream keeps corrupting: over time, with packets caught, and every time you lose a layer. Controls can invert.',
    r4:'Drag your finger or use the ← → keys.',
    r5:'The ice ball slows every ball, including new ones, for 4 seconds.',
    r6:'The fire ball burns everything that is falling, +1 point per ball. Cireep burns too, for no points.',
    start:'Start', again:'Play again',
    warn:'This game has flashing lights and sudden scary images with sound. Turn on “Reduce flashing” or “No <span class="nb">jump-scare</span>” if you are sensitive.',
    flash:'Reduce flashing', mute:'Mute', noScare:'No jump-scare', score:'Score', packets:'Packets', best:'Best',
    overTitle:'Cireep infected you',
    over1:'It is more patient than you.', over2:'It is still there, among the data packets.',
    over3:'You lasted longer than most. But it has saved your face.',
    caught:'{n} packets caught', chaos:'Signal noise · level {n}', lives:'{n} firewall layers left',
    inv:'Controls inverted!', invWarn:'Warning: controls about to invert!',
    ph2:'Phase 2 · signal corrupting', ph3:'Phase 3 · Cireep starts to fool you', ph4:'Phase 4 · it is in the stream',
    pause:'Pause', paused:'Paused', resume:'Resume', quit:'Main menu',
    warnTitle:'16+ advisory',
    warnBody:'This game has sudden <span class="nb">jump-scares</span> with loud sound and flashing lights that may be disturbing or leave a lasting impression. Recommended for ages 16 and up. Are you sure you want to play?',
    warnHint:'Want it milder? Go back and turn on “No <span class="nb">jump-scare</span>” or “Reduce flashing”.',
    warnBack:'Go back', warnOk:'OK, start',
    w1:'It is watching you', w2:'Do not touch it', w3:'You are the next target'
  }
};
var lang = 'vi';
try{ var sl = localStorage.getItem('cireep_lang'); if(sl==='vi'||sl==='en') lang = sl; }catch(e){}
function t(k, n){ return (L[lang][k] || k).replace('{n}', n); }

function applyLang(){
  document.documentElement.lang = lang;
  document.title = t('docTitle');
  var els = document.querySelectorAll('[data-i18n]');
  for(var i=0;i<els.length;i++){
    var el = els[i], txt = t(el.getAttribute('data-i18n'));
    el.textContent = txt;
    if(el.hasAttribute('data-text')) el.setAttribute('data-text', txt);
  }
  els = document.querySelectorAll('[data-i18n-html]');
  for(i=0;i<els.length;i++) els[i].innerHTML = t(els[i].getAttribute('data-i18n-html'));
  syncSettings();
  document.getElementById('pauseBtn').setAttribute('aria-label', t('pause'));
  if(S.chaos > 0) document.getElementById('chaosTag').textContent = t('chaos', S.chaos);
  updateHUD(); paintEyes();
}
try{ S.best = parseInt(localStorage.getItem('cireep_best')||'0',10) || 0; }catch(e){}

// SOUND _ ÂM THANH
var AC = null, noiseBuf = null, master = null, muted = false;
try{ muted = localStorage.getItem('cireep_mute') === '1'; }catch(e){}
function audio(){
  if(AC){
    if(AC.state === 'suspended'){ var rp = AC.resume(); if(rp && rp.catch) rp.catch(function(){}); }
    return AC;
  }
  try{
    AC = new (window.AudioContext||window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = muted ? 0 : 0.8;
    var comp = AC.createDynamicsCompressor();
    comp.threshold.value = -10; comp.knee.value = 12; comp.ratio.value = 6; comp.attack.value = 0.004; comp.release.value = 0.2;
    master.connect(comp); comp.connect(AC.destination);
    var n = AC.sampleRate * 2, b = AC.createBuffer(1, n, AC.sampleRate), d = b.getChannelData(0);
    for(var i=0;i<n;i++) d[i] = Math.random()*2-1;
    noiseBuf = b;
    musicInit(); musicMode(S.mode);
  }catch(e){ AC = null; }
  return AC;
}
function blip(f1,f2,dur,type,vol){
  var a = audio(); if(!a) return;
  var o = a.createOscillator(), g = a.createGain();
  o.type = type||'sine';
  o.frequency.setValueAtTime(f1, a.currentTime);
  o.frequency.exponentialRampToValueAtTime(Math.max(30,f2), a.currentTime+dur);
  g.gain.setValueAtTime(0.0001, a.currentTime);
  g.gain.exponentialRampToValueAtTime(vol||0.16, a.currentTime+0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime+dur);
  o.connect(g); g.connect(master); if(MU) g.connect(MU.send); o.start(); o.stop(a.currentTime+dur+0.02);
}
function scream(big, delay){
  var a = audio(); if(!a || !noiseBuf) return;
  var t0 = a.currentTime + (delay || 0), dur = big ? 1.5 : 0.85;
  var src = a.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  var bp = a.createBiquadFilter(); bp.type='bandpass'; bp.Q.value=2.5;
  bp.frequency.setValueAtTime(2400,t0);
  bp.frequency.exponentialRampToValueAtTime(180,t0+dur);
  var g = a.createGain();
  g.gain.setValueAtTime(0.0001,t0);
  g.gain.exponentialRampToValueAtTime(0.3,t0+0.03);
  g.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  src.connect(bp); bp.connect(g); g.connect(master); if(MU) g.connect(MU.send);
  src.start(t0); src.stop(t0+dur+0.05);
  var o = a.createOscillator(), og = a.createGain();
  o.type='sawtooth';
  o.frequency.setValueAtTime(900,t0);
  o.frequency.exponentialRampToValueAtTime(42,t0+dur*0.9);
  og.gain.setValueAtTime(0.0001,t0);
  og.gain.exponentialRampToValueAtTime(0.2,t0+0.02);
  og.gain.exponentialRampToValueAtTime(0.0001,t0+dur);
  o.connect(og); og.connect(master); if(MU) og.connect(MU.send); o.start(t0); o.stop(t0+dur+0.05);
}
function hum(){ blip(70,46,0.5,'triangle',0.1); }
function stutter(){
  var a = audio(); if(!a || !noiseBuf) return;
  for(var i=0;i<5;i++){
    var t0 = a.currentTime + i*0.09, src = a.createBufferSource();
    src.buffer = noiseBuf;
    var bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900 + Math.random()*2600; bp.Q.value = 3;
    var g = a.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0+0.07);
    src.connect(bp); bp.connect(g); g.connect(master); if(MU) g.connect(MU.send); src.start(t0); src.stop(t0+0.08);
  }
}
function scareSound(kind, fatal){
  if(kind === 'calm'){ blip(fatal ? 120 : 170, 45, fatal ? 0.8 : 0.4, 'triangle', 0.1); return; }
  if(kind === 'lunge'){ blip(80, 1600, 0.3, 'sawtooth', 0.1); scream(fatal, 0.26); return; }
  if(kind === 'glitch'){ stutter(); scream(fatal, 0.3); return; }
  if(kind === 'eyes'){ blip(50, 38, 0.9, 'sawtooth', 0.1); scream(fatal, 0.45); return; }
  scream(fatal);
}

// MUSIC _ NHẠC NỀN & ÂM THANH KINH DỊ
var MU = null, MUSIC_VOL = 0.55, DRONE_VOL = 0.10;
var SEMI = [0, 1, 3, 5, 7, 8, 10];
function noteHz(deg, oct){ return 73.416 * Math.pow(2, (SEMI[((deg % 7) + 7) % 7] + 12*(oct + Math.floor(deg/7))) / 12); }

function impulse(a, sec, decay){
  var n = Math.floor(a.sampleRate*sec), b = a.createBuffer(2, n, a.sampleRate);
  for(var c=0;c<2;c++){
    var d = b.getChannelData(c), lp = 0;
    for(var i=0;i<n;i++){ lp += ((Math.random()*2-1) - lp)*0.3; d[i] = lp*Math.pow(1 - i/n, decay); }
  }
  return b;
}
function envG(a, t0, atk, peak, rel){
  var g = a.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(peak, t0+atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t0+atk+rel);
  return g;
}
function pan(a, node, p){
  if(!a.createStereoPanner) return node;
  var sp = a.createStereoPanner(); sp.pan.value = p; node.connect(sp); return sp;
}

function musicInit(){
  var a = AC; if(!a || MU) return;
  var M = MU = { mode:'menu', acc:0, tBox:2, tPad:3, tAmb:9, nextBeat:0, deg:2, phrase:0, I:0 };
  M.bus = a.createGain(); M.bus.gain.value = 0.0001;
  M.lp = a.createBiquadFilter(); M.lp.type = 'lowpass'; M.lp.frequency.value = 1500; M.lp.Q.value = 0.6;
  M.mg = a.createGain(); M.mg.gain.value = MUSIC_VOL;
  M.bus.connect(M.lp); M.lp.connect(M.mg); M.mg.connect(master);
  M.rev = a.createConvolver(); M.rev.buffer = impulse(a, 3.4, 2.2);
  var rg = a.createGain(); rg.gain.value = 0.9; M.rev.connect(rg); rg.connect(master);
  M.send = a.createGain(); M.send.gain.value = 0.45; M.send.connect(M.rev);
  var ms = a.createGain(); ms.gain.value = 0.5; M.mg.connect(ms); ms.connect(M.rev);
  M.hb = a.createGain(); M.hb.gain.value = 0.9; M.hb.connect(master);

  M.drone = a.createGain(); M.drone.gain.value = 0.0001; M.drone.connect(M.bus);
  var tg = a.createGain(); tg.gain.value = 0.8; tg.connect(M.drone);
  M.df = a.createBiquadFilter(); M.df.type = 'lowpass'; M.df.frequency.value = 200; M.df.Q.value = 3; M.df.connect(tg);
  [[36.71,'sawtooth',0.5,0],[73.42,'sawtooth',0.35,6],[77.78,'sawtooth',0.3,-4],[110,'triangle',0.22,3]].forEach(function(v){
    var o = a.createOscillator(), g = a.createGain();
    o.type = v[1]; o.frequency.value = v[0]; o.detune.value = v[3]; g.gain.value = v[2];
    o.connect(g); g.connect(M.df); o.start();
  });
  var tv = a.createOscillator(); M.tri = a.createGain(); M.tri.gain.value = 0.0001;
  tv.type = 'sawtooth'; tv.frequency.value = 103.83; tv.connect(M.tri); M.tri.connect(M.df); tv.start();
  var l1 = a.createOscillator(), l1g = a.createGain();
  l1.frequency.value = 0.07; l1g.gain.value = 90; l1.connect(l1g); l1g.connect(M.df.frequency); l1.start();
  var l2 = a.createOscillator(), l2g = a.createGain();
  l2.frequency.value = 0.19; l2g.gain.value = 0.18; l2.connect(l2g); l2g.connect(tg.gain); l2.start();
}

var MU_CFG = {
  menu:   { bus:0.9, lp:2200, dr:0.55, tc:0.8 },
  play:   { bus:1.0, lp:3400, dr:0.7,  tc:0.6 },
  resume: { bus:0.8, lp:1200, dr:0.6,  tc:0.4 },
  pause:  { bus:0.7, lp:420,  dr:0.5,  tc:0.25 },
  scare:  { bus:0.12,lp:600,  dr:0.4,  tc:0.04 },
  over:   { bus:0.9, lp:1500, dr:0.6,  tc:1.2 }
};
function musicMode(m){
  if(!MU) return;
  var c = MU_CFG[m] || MU_CFG.menu, t = AC.currentTime;
  MU.mode = m;
  MU.bus.gain.cancelScheduledValues(t);
  MU.bus.gain.setTargetAtTime(c.bus, t, c.tc);
  MU.lp.frequency.setTargetAtTime(c.lp, t, c.tc);
  MU.drone.gain.setTargetAtTime(c.dr*DRONE_VOL, t, c.tc*1.5);
  if(m !== 'play') MU.nextBeat = 0;
}
function silenceGap(dur, delay){
  if(!MU) return;
  var t = AC.currentTime + (delay || 0), c = MU_CFG[S.mode] || MU_CFG.play;
  MU.bus.gain.setTargetAtTime(0.05, t, 0.12);
  MU.bus.gain.setTargetAtTime(c.bus, t + dur, 0.5);
}

function padNote(f, vol){
  var a = AC, t0 = a.currentTime, atk = 1.6 + Math.random(), rel = 3 + Math.random()*2;
  var g = envG(a, t0, atk, vol, rel), lp = a.createBiquadFilter();
  lp.type = 'lowpass'; lp.frequency.value = 900; g.connect(lp); lp.connect(MU.bus);
  [['sine',-6],['triangle',6]].forEach(function(v){
    var o = a.createOscillator(); o.type = v[0]; o.frequency.value = f; o.detune.value = v[1];
    o.connect(g); o.start(t0); o.stop(t0 + atk + rel + 0.1);
  });
}
function padStep(){
  var I = MU.I, d = [0,1,2,4,5][(Math.random()*5)|0], oc = 1 + ((Math.random()*2)|0);
  padNote(noteHz(d, oc), 0.05);
  if(Math.random() < 0.25 + I*0.4) padNote(noteHz(d + 1, oc), 0.035);
  if(Math.random() < I*0.35) padNote(207.65, 0.03);
}

function boxNote(f, vol){
  var a = AC, t0 = a.currentTime + 0.02, det = (Math.random()-0.5)*40;
  var o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), g2 = a.createGain();
  o.type = 'sine'; o.frequency.value = f; o.detune.value = det;
  o2.type = 'sine'; o2.frequency.value = f*2.76; o2.detune.value = det; g2.gain.value = 0.25;
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0+0.004); g.gain.exponentialRampToValueAtTime(0.0001, t0+1.6);
  if(Math.random() < 0.25){ o.frequency.setValueAtTime(f, t0+0.1); o.frequency.exponentialRampToValueAtTime(f*0.94, t0+1.2); }
  o.connect(g); o2.connect(g2); g2.connect(g); g.connect(MU.bus);
  o.start(t0); o2.start(t0); o.stop(t0+1.7); o2.stop(t0+1.7);
}
function boxStep(){
  var M = MU, calm = S.mode !== 'play';
  if(!calm && M.I > 0.7){ M.tBox = 8; return; }
  if(M.phrase <= 0) M.phrase = 3 + ((Math.random()*4)|0);
  M.deg = Math.max(-2, Math.min(9, M.deg + [-2,-1,-1,1,1,2][(Math.random()*6)|0]));
  if(Math.random() > 0.12) boxNote(noteHz(M.deg, 3), calm ? 0.16 : 0.09);
  M.phrase--;
  M.tBox = M.phrase > 0 ? 0.45 + Math.random()*0.4 : (calm ? 3 + Math.random()*4 : 9 + Math.random()*9);
}

function creak(){
  var a = AC, t0 = a.currentTime, dur = 0.9 + Math.random()*0.9, f0 = 70 + Math.random()*50;
  var o = a.createOscillator(), bp = a.createBiquadFilter(), am = a.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(f0, t0); o.frequency.linearRampToValueAtTime(f0*(0.8 + Math.random()*0.7), t0+dur);
  bp.type = 'bandpass'; bp.Q.value = 6;
  bp.frequency.setValueAtTime(350, t0); bp.frequency.exponentialRampToValueAtTime(1100 + Math.random()*600, t0+dur);
  am.gain.value = 0.5;
  var lf = a.createOscillator(), lg = a.createGain();
  lf.frequency.value = 9 + Math.random()*10; lg.gain.value = 0.5; lf.connect(lg); lg.connect(am.gain);
  var g = envG(a, t0, dur*0.3, 1.0, dur*0.7);
  o.connect(bp); bp.connect(am); am.connect(g);
  pan(a, g, (Math.random()-0.5)*1.6).connect(MU.bus);
  o.start(t0); lf.start(t0); o.stop(t0+dur+0.05); lf.stop(t0+dur+0.05);
}
function whisper(delay){
  var a = AC, t0 = a.currentTime + 0.05 + (delay || 0), n = 3 + ((Math.random()*3)|0), tt = t0;
  var src = a.createBufferSource(); src.buffer = noiseBuf; src.loop = true;
  var f1 = a.createBiquadFilter(), f2 = a.createBiquadFilter(), g = a.createGain(), boost = a.createGain();
  f1.type = 'bandpass'; f1.frequency.value = 900 + Math.random()*300; f1.Q.value = 7;
  f2.type = 'bandpass'; f2.frequency.value = 2600 + Math.random()*700; f2.Q.value = 9;
  boost.gain.value = 4;
  g.gain.setValueAtTime(0.0001, t0);
  for(var i=0;i<n;i++){
    var d = 0.12 + Math.random()*0.16;
    g.gain.setValueAtTime(0.0001, tt);
    g.gain.exponentialRampToValueAtTime(0.14 + Math.random()*0.08, tt + d*0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, tt + d);
    tt += d + 0.05 + Math.random()*0.12;
  }
  src.connect(f1); src.connect(f2); f1.connect(boost); f2.connect(boost); boost.connect(g);
  pan(a, g, (Math.random() < 0.5 ? -1 : 1) * (0.5 + Math.random()*0.5)).connect(MU.bus);
  src.start(t0); src.stop(tt + 0.1);
}
function ping(){
  var a = AC, t0 = a.currentTime, f = 500 + Math.random()*1200;
  var c = a.createOscillator(), m = a.createOscillator(), mg = a.createGain(), g = a.createGain();
  c.type = 'sine'; c.frequency.value = f; m.type = 'sine'; m.frequency.value = f*1.414;
  mg.gain.setValueAtTime(f*3, t0); mg.gain.exponentialRampToValueAtTime(1, t0+0.9);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.28, t0+0.005); g.gain.exponentialRampToValueAtTime(0.0001, t0+1.1);
  m.connect(mg); mg.connect(c.frequency); c.connect(g);
  pan(a, g, (Math.random()-0.5)*1.8).connect(MU.bus);
  c.start(t0); m.start(t0); c.stop(t0+1.2); m.stop(t0+1.2);
}
function swell(dur){
  var a = AC, t0 = a.currentTime, src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
  src.buffer = noiseBuf; src.loop = true;
  bp.type = 'bandpass'; bp.Q.value = 1.5;
  bp.frequency.setValueAtTime(200, t0); bp.frequency.exponentialRampToValueAtTime(2400, t0+dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0+dur*0.92); g.gain.setValueAtTime(0.0001, t0+dur);
  src.connect(bp); bp.connect(g); g.connect(MU.bus);
  src.start(t0); src.stop(t0+dur+0.05);
}
function ambient(){
  var m = S.mode, r = Math.random();
  if(m === 'play' && MU.I > 0.3 && r < 0.16){ swell(1.8); silenceGap(1.6, 1.8); }
  else if(r < 0.3) creak();
  else if(r < 0.62) whisper();
  else if(r < 0.85) ping();
  else swell(2.2);
  MU.tAmb = (m === 'play' ? 14 - MU.I*7 : 14) + Math.random()*8;
}

function heartbeat(t, vol){
  var a = AC;
  [[0,1],[0.23,0.7]].forEach(function(b){
    var tt = t + b[0], v = vol*b[1];
    var o = a.createOscillator(), g = a.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(95, tt); o.frequency.exponentialRampToValueAtTime(38, tt+0.14);
    g.gain.setValueAtTime(0.0001, tt); g.gain.exponentialRampToValueAtTime(v, tt+0.012); g.gain.exponentialRampToValueAtTime(0.0001, tt+0.2);
    o.connect(g); g.connect(MU.hb); o.start(tt); o.stop(tt+0.22);
    var s = a.createBufferSource(), lp = a.createBiquadFilter(), g2 = a.createGain();
    s.buffer = noiseBuf; lp.type = 'lowpass'; lp.frequency.value = 260;
    g2.gain.setValueAtTime(0.0001, tt); g2.gain.exponentialRampToValueAtTime(v*3, tt+0.008); g2.gain.exponentialRampToValueAtTime(0.0001, tt+0.09);
    s.connect(lp); lp.connect(g2); g2.connect(MU.hb); s.start(tt, Math.random()); s.stop(tt+0.1);
  });
}

function musicUpdate(dt){
  if(!MU || !AC || AC.state !== 'running') return;
  var M = MU, m = S.mode, now = AC.currentTime;
  var live = m === 'play' || m === 'scare' || m === 'pause' || m === 'resume';
  var I = live ? Math.min(1, S.phase*0.2 + S.chaos*0.05) : (m === 'over' ? 0.35 : 0.1);
  M.I += (I - M.I) * Math.min(1, dt*0.8);
  M.acc += dt;
  if(M.acc >= 0.5){
    M.acc = 0;
    M.df.frequency.setTargetAtTime(170 + M.I*520, now, 0.6);
    M.tri.gain.setTargetAtTime(0.0001 + M.I*0.35, now, 0.8);
  }
  if(muted) return;
  if(m === 'play'){
    var period = 60 / (50 + M.I*68);
    if(M.nextBeat < now - 0.5) M.nextBeat = now + 0.05;
    while(M.nextBeat < now + 0.15){ heartbeat(M.nextBeat, 0.1 + 0.14*M.I); M.nextBeat += period; }
  }
  if(m === 'scare' || m === 'resume') return;
  M.tPad -= dt; if(M.tPad <= 0){ padStep(); M.tPad = (m === 'play' ? 5 : 4) + Math.random()*4; }
  M.tBox -= dt; if(M.tBox <= 0) boxStep();
  if(m !== 'pause'){ M.tAmb -= dt; if(M.tAmb <= 0) ambient(); }
}

function impactAt(t, vol){
  if(!MU) return;
  var a = AC, o = a.createOscillator(), g = a.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(64, t); o.frequency.exponentialRampToValueAtTime(24, t+0.9);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.012); g.gain.exponentialRampToValueAtTime(0.0001, t+0.95);
  o.connect(g); g.connect(master); g.connect(MU.send); o.start(t); o.stop(t+1);
  var s = a.createBufferSource(), lp = a.createBiquadFilter(), g2 = a.createGain();
  s.buffer = noiseBuf; lp.type = 'lowpass'; lp.frequency.value = 400;
  g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(vol*1.2, t+0.01); g2.gain.exponentialRampToValueAtTime(0.0001, t+0.35);
  s.connect(lp); lp.connect(g2); g2.connect(master); s.start(t, Math.random()); s.stop(t+0.4);
}
function impact(vol){ if(MU) impactAt(AC.currentTime, vol); }
function thump(vol){
  if(!MU) return;
  var a = AC, t = a.currentTime, o = a.createOscillator(), g = a.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(130, t); o.frequency.exponentialRampToValueAtTime(48, t+0.14);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t+0.008); g.gain.exponentialRampToValueAtTime(0.0001, t+0.2);
  o.connect(g); g.connect(master); o.start(t); o.stop(t+0.22);
}
function riser(dur){
  if(!MU){ hum(); return; }
  var a = AC, t0 = a.currentTime, src = a.createBufferSource(), bp = a.createBiquadFilter(), g = a.createGain();
  src.buffer = noiseBuf; src.loop = true; bp.type = 'bandpass'; bp.Q.value = 2;
  bp.frequency.setValueAtTime(180, t0); bp.frequency.exponentialRampToValueAtTime(3200, t0+dur);
  g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.1, t0+dur); g.gain.setValueAtTime(0.0001, t0+dur+0.02);
  src.connect(bp); bp.connect(g); g.connect(master); g.connect(MU.send);
  src.start(t0); src.stop(t0+dur+0.05);
  [0, 17].forEach(function(det){
    var o = a.createOscillator(), lp = a.createBiquadFilter(), og = a.createGain();
    o.type = 'sawtooth'; o.detune.value = det;
    o.frequency.setValueAtTime(70, t0); o.frequency.exponentialRampToValueAtTime(280, t0+dur);
    lp.type = 'lowpass'; lp.frequency.value = 900;
    og.gain.setValueAtTime(0.0001, t0); og.gain.exponentialRampToValueAtTime(0.035, t0+dur); og.gain.setValueAtTime(0.0001, t0+dur+0.02);
    o.connect(lp); lp.connect(og); og.connect(master); og.connect(MU.send); o.start(t0); o.stop(t0+dur+0.05);
  });
  impactAt(t0 + dur, 0.25);
}
function infect(){
  if(!MU) return;
  var a = AC, t0 = a.currentTime + 0.1, dur = 3.2;
  [0, 23].forEach(function(det){
    var o = a.createOscillator(), lp = a.createBiquadFilter(), g = a.createGain();
    o.type = 'sawtooth'; o.detune.value = det;
    o.frequency.setValueAtTime(130, t0); o.frequency.exponentialRampToValueAtTime(52, t0+dur);
    lp.type = 'lowpass'; lp.frequency.value = 600;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.07, t0+0.4); g.gain.exponentialRampToValueAtTime(0.0001, t0+dur);
    o.connect(lp); lp.connect(g); g.connect(master); g.connect(MU.send); o.start(t0); o.stop(t0+dur+0.05);
  });
  whisper(0.9); whisper(1.9);
}
function chime(c){
  var k = Math.min(c, 13), f = 587.33 * Math.pow(2, (SEMI[k % 7] + 12*Math.floor(k/7)) / 12);
  blip(f, f*0.99, 0.22, 'sine', 0.26);
  blip(f*2.76, f*2.7, 0.12, 'sine', 0.07);
}

function unlockAudio(){
  if(!audio()) return;
  ['pointerdown','keydown','touchend'].forEach(function(ev){ window.removeEventListener(ev, unlockAudio, true); });
}
['pointerdown','keydown','touchend'].forEach(function(ev){ window.addEventListener(ev, unlockAudio, true); });

// CONTROL _ ĐIỀU KHIỂN
var pointerDown = false, hover = false, keyL = false, keyR = false, kbOn = false, rawX = null, lastInv = false;
var BASKET_V = 2.0;
function clampX(x){ return Math.max(basket.w/2, Math.min(W - basket.w/2, x)); }
function pointX(e){ return e.clientX - cv.getBoundingClientRect().left; }
function aim(x){
  rawX = x;
  basket.tx = clampX(S.invert > 0 ? W - x : x);
}
function releaseInput(){ pointerDown = false; keyL = false; keyR = false; }
cv.addEventListener('pointerdown', function(e){ pointerDown = true; hover = e.pointerType === 'mouse'; cv.setPointerCapture(e.pointerId); aim(pointX(e)); });
cv.addEventListener('pointermove', function(e){ if(e.pointerType === 'mouse') hover = true; if(pointerDown || hover) aim(pointX(e)); });
cv.addEventListener('pointerleave', function(e){ if(e.pointerType === 'mouse') hover = false; });
cv.addEventListener('pointerup', function(){ pointerDown = false; });
cv.addEventListener('pointercancel', function(){ pointerDown = false; });
function onAway(){ releaseInput(); pauseGame(); }
window.addEventListener('blur', onAway);
document.addEventListener('visibilitychange', function(){
  if(document.hidden){ onAway(); if(AC && AC.state === 'running') AC.suspend(); }
  else if(AC && AC.state === 'suspended'){ var rp = AC.resume(); if(rp && rp.catch) rp.catch(function(){}); }
});
window.addEventListener('keydown', function(e){
  if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') keyL = true;
  if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') keyR = true;
  if(e.key==='Escape' || e.key==='p' || e.key==='P'){
    if(S.mode === 'play') pauseGame();
    else if(S.mode === 'pause') resumeGame();
    else if(warnOpen) closeWarn();
  }
  if((e.key===' '||e.key==='Enter') && e.target.tagName!=='BUTTON' && !warnOpen){
    if(S.mode === 'menu'){ e.preventDefault(); requestStart(); }
    else if(S.mode === 'over'){ e.preventDefault(); start(); }
  }
});
window.addEventListener('keyup', function(e){
  if(e.key==='ArrowLeft'||e.key==='a'||e.key==='A') keyL = false;
  if(e.key==='ArrowRight'||e.key==='d'||e.key==='D') keyR = false;
});

// DIFFICULTY _ ĐỘ KHÓ
var CT = [0, 45, 100, 170, 260];
var C_SPD = [1.0, 1.5, 2.0, 2.35, 2.6];
var C_CIR = [0.06, 0.15, 0.24, 0.32, 0.38];
var C_GAP = [0.95, 0.70, 0.55, 0.46, 0.40];
function curve(a){
  var t = S.t;
  for(var i=1;i<CT.length;i++) if(t < CT[i]) return a[i-1] + (a[i]-a[i-1]) * (t-CT[i-1]) / (CT[i]-CT[i-1]);
  return a[a.length-1];
}
function phaseOf(t){ return t < 45 ? 0 : t < 100 ? 1 : t < 170 ? 2 : 3; }
function speedMul(){ return Math.min(2.8, curve(C_SPD) + S.chaos*0.05); }
function cireepChance(){ return Math.min(0.42, curve(C_CIR) + S.chaos*0.015); }
function spawnGap(){ return Math.max(0.36, curve(C_GAP) - S.chaos*0.02); }

var HUES = [160, 178, 192, 206, 228, 262]; // only cold theme, Cireep will red _ chỉ tông lạnh, để đỏ chỉ thuộc về Cireep

var REV = [0.85, 0.70, 0.55, 0.42], FALSE_RATE = [0, 0, 0.12, 0.22];
function revealTime(){ return Math.max(0.36, REV[S.phase] - S.chaos*0.01); }
function revealTick(){
  if(S.revCd > 0) return;
  S.revCd = 0.12;
  blip(240, 70, 0.14, 'square', 0.05);
  thump(0.35);
}

function ttl(o){ return (basket.y - o.y) / Math.max(1, o.vy * S.slow); }

function spaceFree(o){
  for(var i=0;i<S.objs.length;i++){
    var q = S.objs[i], gap = q.r + o.r*1.5;
    if(Math.abs(q.y - o.y) < gap && Math.abs(q.x - o.x) < gap) return false;
  }
  return true;
}

function laneSafe(c){
  var tc = ttl(c), wave = [c], tmin = tc, i, o, ti;
  for(i=0;i<S.objs.length;i++){
    o = S.objs[i];
    if(!o.v || o.dead || o.burn > 0) continue;
    ti = ttl(o);
    if(ti > -0.15 && Math.abs(ti - tc) <= 0.6){ wave.push(o); if(ti < tmin) tmin = ti; }
  }
  var lo = basket.w/2, hi = W - basket.w/2, iv = [];
  for(i=0;i<wave.length;i++){
    var pad = basket.w/2 + wave[i].r*0.35 + 6;
    iv.push([wave[i].x - pad, wave[i].x + pad]);
  }
  iv.sort(function(a,b){ return a[0] - b[0]; });
  var gaps = [], cur = lo;
  for(i=0;i<iv.length;i++){
    if(iv[i][0] - cur >= 6) gaps.push([cur, Math.min(iv[i][0], hi)]);
    if(iv[i][1] > cur) cur = iv[i][1];
  }
  if(hi - cur >= 6) gaps.push([cur, hi]);
  if(!gaps.length) return false;
  var worst = gaps[0][0] - lo;
  for(i=1;i<gaps.length;i++) worst = Math.max(worst, (gaps[i][0] - gaps[i-1][1]) / 2);
  worst = Math.max(worst, hi - gaps[gaps.length-1][1]);
  return worst <= W * BASKET_V * Math.max(0, Math.min(tmin, revealTime()) - 0.1);
}

function spawnOne(){
  var r = Math.max(15, Math.min(W*0.036, 29));
  var isV = S.breather <= 0 && Math.random() < cireepChance(), kind = isV ? 'v' : 'n';
  if(!isV && S.t > 6 && S.boostCd <= 0){
    var q = Math.random();
    if(q < 0.03) kind = 'ice'; else if(q < 0.06) kind = 'fire';
    if(kind !== 'n') S.boostCd = 8;
  }
  var o = {
    v: isV, k: kind, burn: 0,
    x: 0,
    y: -r*2 - Math.random()*40,
    r: r,
    vy: (H*0.32) * speedMul() * (0.85 + Math.random()*0.3),
    hue: kind==='ice' ? 196 : kind==='fire' ? 24 : HUES[(Math.random()*HUES.length)|0],
    sp: (Math.random()-0.5)*2,
    ph: Math.random()*Math.PI*2,
    sway: (Math.random()-0.5) * 18 * (1 + S.chaos*0.25),
    dead: 0
  };
  if(isV) o.tut = S.cNum < 2;
  else if(kind === 'n' && S.breather <= 0 && Math.random() < FALSE_RATE[S.phase]) o.faD = revealTime() + 0.15 + Math.random()*0.45;
  var ok = false;
  for(var n=0;n<8 && !ok;n++){
    o.x = r + Math.random()*(W - r*2);
    ok = spaceFree(o) && (!isV || laneSafe(o));
  }
  if(!ok && isV) return;
  if(isV) S.cNum++;
  S.objs.push(o);
}

function bumpChaos(){
  S.chaos++;
  S.nextChaos = S.caught + 20;
  S.flick = 0.6; S.flickCol = '#FF1F3D'; S.shake = 14;
  hum();
  var tag = document.getElementById('chaosTag');
  tag.textContent = t('chaos', S.chaos);
  tag.classList.add('on');
}

var SCARES = ['face', 'lunge', 'glitch', 'eyes'];
function pickScare(){
  var k;
  do{ k = SCARES[(Math.random()*SCARES.length)|0]; }while(k === S.lastScare);
  S.lastScare = k;
  return k;
}

function setMode(m){ S.mode = m; wrapEl.setAttribute('data-mode', m); musicMode(m); }

function loseLife(o){
  S.lives--;
  S.combo = 0;
  o.dead = 1;
  var fatal = S.lives <= 0;
  var kind = noScare ? 'calm' : pickScare();
  S.jump = { t:0, dur: kind === 'calm' ? (fatal ? 1.0 : 0.6) : (fatal ? 1.7 : 0.95), fatal: fatal, seed: Math.random()*1000, kind: kind };
  setMode('scare');
  S.fake = null;
  S.shake = kind === 'calm' ? 6 : 30;
  scareSound(kind, fatal);
  impact(kind === 'calm' ? 0.25 : 0.55);
  paintEyes();
  if(!fatal) bumpChaos();
}

function afterScare(){
  if(S.jump.fatal){ gameOver(); return; }
  S.jump = null; setMode('play'); S.invuln = 1.1;
  // clear Cireep for player _ dọn bớt Cireep đang rơi để người chơi có nhịp thở
  S.objs = S.objs.filter(function(o){ return !o.v; });
}

function saveBest(){
  if(S.score > S.best){ S.best = S.score; try{ localStorage.setItem('cireep_best', String(S.best)); }catch(err){} }
}

function gameOver(){
  setMode('over');
  infect();
  S.jump = null;
  S.frost = 0; S.slow = 1; S.fake = null; S.banner = null;
  var prevBest = S.best;
  saveBest();
  document.getElementById('fScore').textContent = S.score;
  document.getElementById('fCaught').textContent = S.caught;
  document.getElementById('fBest').textContent = S.best;
  document.getElementById('fBest').classList.toggle('record', S.score > 0 && S.score > prevBest);
  var ol = document.getElementById('overLine');
  ol.setAttribute('data-i18n', S.caught >= 60 ? 'over3' : S.caught >= 25 ? 'over2' : 'over1');
  ol.textContent = t(ol.getAttribute('data-i18n'));
  document.getElementById('over').classList.remove('hidden');
}

function paintEyes(){
  var box = document.getElementById('eyes'), html = '';
  for(var i=0;i<3;i++){
    var gone = i >= S.lives ? ' gone' : '';
    html += '<svg class="eye'+gone+'" viewBox="0 0 24 24" aria-hidden="true">'
      + '<path d="M1 12C4 6.5 8 4 12 4s8 2.5 11 8c-3 5.5-7 8-11 8S4 17.5 1 12Z" fill="none" stroke="#D8DDD3" stroke-width="1.6"/>'
      + '<circle cx="12" cy="12" r="4" fill="#FF1F3D"/></svg>';
  }
  box.innerHTML = html;
  box.setAttribute('role', 'img');
  box.setAttribute('aria-label', t('lives', S.lives));
}

function start(){
  audio();
  setMode('play'); S.t=0; S.sec=-1; S.score=0; S.caught=0; S.lives=3; S.chaos=0;
  S.objs=[]; S.spawn=0; S.nextChaos=30; S.shake=0; S.flick=0;
  S.invuln=0; S.invert=0; S.invertPre=0; S.invertCd=0; S.slow=1; S.boostCd=0; S.flickCd=0; lastInv=false; basket.tx=basket.x; S.jump=null; S.combo=0; S.floats=[];
  S.parts=[]; S.frost=0; S.fireT=0; S.nz=0; S.nzq=-1; wrapEl.style.setProperty('--n', 0);
  S.phase=0; S.breather=0; S.banner=null; S.fake=null; S.fakeCd=10; S.revCd=0; S.cNum=0;
  warnOpen = false; warnScr.classList.add('hidden'); pauseScr.classList.add('hidden'); countEl.classList.add('hidden');
  document.getElementById('menu').classList.add('hidden');
  document.getElementById('over').classList.add('hidden');
  document.getElementById('chaosTag').classList.remove('on');
  paintEyes(); updateHUD();
}
document.getElementById('startBtn').addEventListener('click', requestStart);
document.getElementById('againBtn').addEventListener('click', start);

var warnScr = document.getElementById('warnScr'), pauseScr = document.getElementById('pauseScr'), countEl = document.getElementById('count');
var warnOpen = false;

function requestStart(){
  if(noScare){ start(); return; }
  warnOpen = true;
  document.getElementById('menu').classList.add('hidden');
  warnScr.classList.remove('hidden');
  document.getElementById('warnBack').focus();
}
function closeWarn(){
  warnOpen = false;
  warnScr.classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  document.getElementById('startBtn').focus();
}
function pauseGame(){
  if(S.mode !== 'play') return;
  releaseInput();
  S.shake = 0; S.flick = 0;
  setMode('pause');
  pauseScr.classList.remove('hidden');
  document.getElementById('resumeBtn').focus();
}
function resumeGame(){
  if(S.mode !== 'pause') return;
  pauseScr.classList.add('hidden');
  S.cd = 3;
  countEl.textContent = '3';
  countEl.classList.remove('hidden');
  setMode('resume');
}
function toMenu(){
  saveBest();
  pauseScr.classList.add('hidden'); warnScr.classList.add('hidden'); countEl.classList.add('hidden');
  document.getElementById('over').classList.add('hidden');
  document.getElementById('menu').classList.remove('hidden');
  warnOpen = false;
  setMode('menu');
  S.objs = []; S.parts = []; S.floats = []; S.jump = null; S.fake = null; S.banner = null;
  S.frost = 0; S.slow = 1; S.chaos = 0; S.nz = 0; S.nzq = -1; S.flick = 0; S.shake = 0; S.invert = 0; S.invertPre = 0;
  S.score = 0; S.caught = 0; S.lives = 3;
  wrapEl.style.setProperty('--n', 0);
  S.dirty = true;
}
document.getElementById('warnBack').addEventListener('click', closeWarn);
document.getElementById('warnOk').addEventListener('click', start);
document.getElementById('pauseBtn').addEventListener('click', pauseGame);
document.getElementById('resumeBtn').addEventListener('click', resumeGame);
document.getElementById('quitBtn').addEventListener('click', toMenu);
document.getElementById('overMenuBtn').addEventListener('click', toMenu);
function syncSettings(){
  var q = document.querySelectorAll('[data-act]');
  for(var i=0;i<q.length;i++){
    var act = q[i].getAttribute('data-act');
    if(act === 'lang'){
      q[i].textContent = t('toEn');
      q[i].setAttribute('lang', lang === 'vi' ? 'en' : 'vi');
    } else {
      q[i].setAttribute('aria-pressed', (act === 'mute' ? muted : act === 'flash' ? reduceFlash : noScare) ? 'true' : 'false');
    }
  }
}
function syncCalm(){ document.body.classList.toggle('calm', reduceFlash); syncSettings(); }
function syncMute(){ if(master) master.gain.value = muted ? 0 : 0.8; syncSettings(); }
function store(k, v){ try{ localStorage.setItem(k, v); }catch(err){} }
document.addEventListener('click', function(e){
  var b = e.target.closest ? e.target.closest('[data-act]') : null;
  if(!b) return;
  var act = b.getAttribute('data-act');
  if(act === 'lang'){ lang = lang === 'vi' ? 'en' : 'vi'; store('cireep_lang', lang); applyLang(); }
  else if(act === 'mute'){ muted = !muted; store('cireep_mute', muted ? '1' : '0'); syncMute(); }
  else if(act === 'flash'){ reduceFlash = !reduceFlash; store('cireep_calm', reduceFlash ? '1' : '0'); syncCalm(); }
  else if(act === 'scare'){ noScare = !noScare; store('cireep_noscare', noScare ? '1' : '0'); syncSettings(); }
});
syncCalm();

var recEl = document.getElementById('rec');
var wrapEl = document.getElementById('wrap');
function updateRec(){
  var sec = S.t|0;
  if(sec === S.sec) return;
  S.sec = sec;
  var m = ('0'+((sec/60)|0)).slice(-2), s = ('0'+(sec%60)).slice(-2);
  recEl.textContent = '● REC ' + ((S.chaos >= 2 && Math.random() < 0.15) ? '??:??' : m+':'+s);
}

function updateHUD(){
  document.getElementById('score').textContent = S.score;
  document.getElementById('caughtLbl').textContent = t('caught', S.caught);
}

// DRAW _ VẼ
function drawBall(o){
  var h = o.hue, r = o.r, spin = S.t*1.4 + o.ph;
  ctx.save();
  ctx.shadowColor = 'hsl('+h+' 100% 55% / .8)'; ctx.shadowBlur = 14;
  var g = ctx.createRadialGradient(o.x - r*0.3, o.y - r*0.35, r*0.1, o.x, o.y, r);
  g.addColorStop(0, 'hsl('+h+' 100% 50% / .95)');
  g.addColorStop(1, 'hsl('+h+' 100% 18% / .98)');
  ctx.beginPath(); ctx.arc(o.x, o.y, r, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = 'hsl('+h+' 100% 62%)'; ctx.lineWidth = 1.3; ctx.stroke();
  ctx.lineWidth = 1; ctx.strokeStyle = 'hsl('+h+' 100% 68% / .6)';
  for(var i=0;i<3;i++){
    var w = Math.abs(Math.cos(spin + i*1.047))*r;
    ctx.beginPath(); ctx.ellipse(o.x, o.y, Math.max(0.5,w), r, 0, 0, 6.2832); ctx.stroke();
  }
  ctx.beginPath(); ctx.ellipse(o.x, o.y, r, r*0.3, 0, 0, 6.2832); ctx.stroke();
  ctx.restore();
}

// CIREEP FACE, USE FOR FALLING AND JUMPSCARE
function drawFace(x, y, r, t, rage){
  var sd = Math.floor(t*9);
  function R(i){ var s = Math.sin((sd+1)*12.9898 + i*78.233)*43758.5453; return s - Math.floor(s); }
  ctx.save(); ctx.translate(x,y);
  var ga0 = ctx.globalAlpha;
  // thorn virus 
  ctx.strokeStyle = 'rgba(255,31,61,'+(0.55+0.3*rage)+')'; ctx.fillStyle = '#FF1F3D';
  ctx.lineWidth = Math.max(1.2, r*0.09); ctx.lineCap = 'round';
  for(var i=0;i<12;i++){
    var a = i/12*6.2832 + t*0.5, L = r*(1.28 + 0.22*Math.sin(t*4+i*1.7) + 0.18*rage);
    ctx.beginPath(); ctx.moveTo(Math.cos(a)*r*0.9, Math.sin(a)*r*0.9); ctx.lineTo(Math.cos(a)*L, Math.sin(a)*L); ctx.stroke();
    ctx.beginPath(); ctx.arc(Math.cos(a)*L, Math.sin(a)*L, Math.max(1.4, r*0.1), 0, 6.2832); ctx.fill();
  }
  // black body
  var g = ctx.createRadialGradient(-r*0.25,-r*0.3,r*0.1,0,0,r);
  g.addColorStop(0,'#2A0A14'); g.addColorStop(0.7,'#0F0409'); g.addColorStop(1,'#030105');
  ctx.beginPath(); ctx.arc(0,0,r*(1+0.05*Math.sin(t*6)),0,6.2832); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = 'rgba(255,31,61,.7)'; ctx.lineWidth = Math.max(1, r*0.05); ctx.stroke();
  // misaligned, bleeding eye sockets
  var ex = r*0.36, ey = -r*0.18;
  var eyes = [[-ex, ey, r*0.26, r*0.34], [ex, ey+r*0.05, r*0.15, r*0.2]];
  for(var k=0;k<2;k++){
    var e = eyes[k];
    ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(e[0],e[1],e[2],e[3],k?-0.2:0.2,0,6.2832); ctx.fill();
    ctx.shadowColor = '#FF1F3D'; ctx.shadowBlur = Math.min(r*0.4, 60); ctx.fillStyle = '#FF1F3D';
    ctx.beginPath(); ctx.arc(e[0]+Math.sin(t*3+k)*e[2]*0.3, e[1], Math.max(1,e[2]*0.28), 0, 6.2832); ctx.fill();
    ctx.shadowBlur = 0;
    var dl = r*(0.35 + 0.3*rage + 0.25*Math.abs(Math.sin(t*1.3+k*2)));
    ctx.strokeStyle = 'rgba(200,10,40,.9)'; ctx.lineWidth = Math.max(1, r*0.07);
    ctx.beginPath(); ctx.moveTo(e[0], e[1]+e[3]*0.8); ctx.lineTo(e[0]+(k?r*0.02:-r*0.03), e[1]+e[3]+dl); ctx.stroke();
  }
  // a smile stretching to the cheeks, sharp teeth
  var my = r*0.4, mw = r*(0.78+0.1*rage), open = r*(0.1+0.32*rage) + Math.sin(t*5)*r*0.03, ly = my - r*0.1;
  ctx.beginPath(); ctx.moveTo(-mw,ly); ctx.quadraticCurveTo(0,my+open*2.4,mw,ly); ctx.quadraticCurveTo(0,my-open*0.2,-mw,ly);
  ctx.fillStyle = '#050103'; ctx.fill(); ctx.strokeStyle = '#FF1F3D'; ctx.lineWidth = Math.max(1, r*0.05); ctx.stroke();
  ctx.fillStyle = '#D8DDD3';
  for(var q=0;q<11;q++){
    var u = (q+0.5)/11*2-1, tx = u*mw*0.92, ty = ly - (1-u*u)*open*0.1, th = r*(0.12+0.1*R(q));
    ctx.beginPath(); ctx.moveTo(tx-mw/11*0.45,ty); ctx.lineTo(tx+mw/11*0.45,ty); ctx.lineTo(tx,ty+th); ctx.fill();
  }
  // error data array
  var nb = (2 + rage*5)|0;
  ctx.globalAlpha = ga0*0.7;
  for(var b=0;b<nb;b++){
    if(R(30+b) < 0.5) continue;
    ctx.fillStyle = R(80+b) < 0.5 ? '#FF1F3D' : '#8FE3F2';
    ctx.fillRect((R(40+b)*2-1)*r*0.9, (R(50+b)*2-1)*r*0.9, r*(0.2+R(60+b)*0.5), r*(0.04+R(70+b)*0.1));
  }
  ctx.globalAlpha = ga0;
  if(r > 40){
    ctx.fillStyle = 'rgba(255,31,61,.5)'; ctx.font = Math.round(r*0.12)+'px "IBM Plex Mono", monospace';
    for(var z=0;z<7;z++) ctx.fillText(R(90+z)<0.5?'01':'10', (R(100+z)*2-1)*r*0.8, (R(110+z)*2-1)*r*0.85);
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

          // BOOSTER

// ICE BALL
function drawIce(o){
  var r = o.r*1.08;
  ctx.save();
  ctx.shadowColor = 'rgba(120,220,255,.9)'; ctx.shadowBlur = 18;
  var g = ctx.createRadialGradient(o.x-r*0.3,o.y-r*0.35,r*0.1,o.x,o.y,r);
  g.addColorStop(0,'#BFF3FF'); g.addColorStop(0.6,'#1B7FC4'); g.addColorStop(1,'#07264A');
  ctx.beginPath(); ctx.arc(o.x,o.y,r,0,6.2832); ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
  ctx.strokeStyle = '#E6FBFF'; ctx.lineWidth = Math.max(1.2, r*0.1); ctx.lineCap = 'round';
  ctx.translate(o.x,o.y); ctx.rotate(S.t*0.6);
  for(var i=0;i<3;i++){
    ctx.rotate(1.0472); ctx.beginPath(); ctx.moveTo(-r*0.62,0); ctx.lineTo(r*0.62,0);
    for(var s=-1;s<=1;s+=2){
      ctx.moveTo(s*r*0.38,0); ctx.lineTo(s*r*0.55,-r*0.16);
      ctx.moveTo(s*r*0.38,0); ctx.lineTo(s*r*0.55,r*0.16);
    }
    ctx.stroke();
  }
  ctx.restore();
}

// FIRE BALL
function drawFireBall(o){
  var r = o.r*1.08, f = 1 + Math.sin(S.t*12+o.ph)*0.06;
  ctx.save();
  ctx.shadowColor = 'rgba(255,120,20,.95)'; ctx.shadowBlur = 20;
  var g = ctx.createRadialGradient(o.x-r*0.3,o.y-r*0.35,r*0.1,o.x,o.y,r);
  g.addColorStop(0,'#FFB347'); g.addColorStop(0.6,'#D8330B'); g.addColorStop(1,'#3A0903');
  ctx.beginPath(); ctx.arc(o.x,o.y,r,0,6.2832); ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
  ctx.translate(o.x,o.y+r*0.04); ctx.scale(f,f);
  flameShape(r*0.62); ctx.fillStyle = '#FFE08A'; ctx.fill();
  ctx.translate(0,r*0.2); flameShape(r*0.34); ctx.fillStyle = '#FF5A1F'; ctx.fill();
  ctx.restore();
}

function drawFrost(o){
  ctx.beginPath(); ctx.arc(o.x,o.y,o.r*1.05,0,6.2832);
  ctx.fillStyle = 'rgba(170,230,255,.35)'; ctx.fill();
  ctx.strokeStyle = 'rgba(235,252,255,.9)'; ctx.lineWidth = 1.5; ctx.stroke();
  for(var i=0;i<6;i++){
    var a = i*1.0472 + 0.3;
    ctx.beginPath(); ctx.moveTo(o.x+Math.cos(a)*o.r, o.y+Math.sin(a)*o.r);
    ctx.lineTo(o.x+Math.cos(a)*o.r*1.4, o.y+Math.sin(a)*o.r*1.4); ctx.stroke();
  }
}

function drawBurn(o){
  var p = o.burn/0.55;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  var g = ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r*1.7);
  g.addColorStop(0,'rgba(255,200,80,'+(0.8*p)+')'); g.addColorStop(1,'rgba(255,60,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(o.x,o.y,o.r*1.7,0,6.2832); ctx.fill();
  ctx.restore();
  for(var i=0;i<3;i++){
    ctx.save(); ctx.translate(o.x+(i-1)*o.r*0.55, o.y - o.r*0.5*(1-p));
    ctx.scale(1, 1+0.3*Math.sin(S.t*20+i)); flameShape(o.r*(0.55+0.2*p));
    ctx.fillStyle = 'rgba(255,'+(100+i*50)+',30,'+(0.85*p+0.1)+')'; ctx.fill(); ctx.restore();
  }
}

function drawTell(o){
  var a = 0.55 - S.chaos*0.08 - S.phase*0.1;
  if(a <= 0) return;
  var k = Math.sin(S.t*6 + o.ph*3);
  if(k < 0.55) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,31,61,' + (a*(k-0.55)/0.45) + ')'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(o.x, o.y, o.r*1.12, 0, 6.2832); ctx.stroke();
  ctx.restore();
}

function drawObj(o){
  ctx.save();
  if(o.burn > 0) ctx.globalAlpha = Math.max(0.15, o.burn/0.55);
  if(o.v){
    var rv = o.rev === undefined ? 1 : o.rev, rage = Math.min(1, S.chaos*0.25);
    if(rv >= 1) drawFace(o.x, o.y, o.r, S.t + o.ph, rage);
    else {
      var ga = ctx.globalAlpha;
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

// SPECIAL EFFECT
function sparks(x, y, r, fire){
  for(var i=0;i<(fire?9:7);i++){
    var a = Math.random()*6.2832, sp = 80 + Math.random()*120;
    S.parts.push(fire
      ? {f:1, x:x+(Math.random()-0.5)*r, y:y, vx:(Math.random()-0.5)*50, vy:-(60+Math.random()*130), t:0, life:0.5+Math.random()*0.4, s:r*(0.2+Math.random()*0.3)}
      : {f:0, x:x, y:y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, t:0, life:0.6, s:3});
  }
}
function freezeAll(src){
  for(var j=0;j<S.objs.length;j++){ var b = S.objs[j]; sparks(b.x,b.y,b.r,0); }
  sparks(src.x, basket.y, 20, 0);
  S.frost = 4;
  blip(1400,500,0.35,'triangle',0.1); blip(2200,900,0.2,'sine',0.06);
}
function burnAll(src){
  var n = 0;
  for(var j=0;j<S.objs.length;j++){
    var b = S.objs[j];
    if(b.burn > 0 || b.dead) continue;
    b.burn = 0.55; sparks(b.x,b.y,b.r,1);
    if(!b.v){ n++; S.floats.push({x:b.x, y:b.y, t:0, txt:'+1', hue:24}); }
  }
  S.score += n; S.caught++; S.combo++; S.fireT = 0.5;
  sparks(src.x, basket.y, 20, 1);
  blip(320,70,0.45,'sawtooth',0.14); blip(180,50,0.6,'triangle',0.12);
}

// DISTURBANCE INCREASES OVER TIME
var fdt = 1/60;
function per(p){ return Math.min(1, p*60*fdt); }

function glitchSlices(l){
  ctx.save(); ctx.setTransform(1,0,0,1,0,0);
  var n = 1 + ((l*4)|0);
  for(var i=0;i<n;i++){
    var h = ((8 + Math.random()*60*l)*DPR)|0, y = (Math.random()*(cv.height-h))|0, dx = ((Math.random()-0.5)*60*l*DPR)|0;
    ctx.drawImage(cv, 0, y, cv.width, h, dx, y, cv.width, h);
    if(Math.random() < 0.4){
      ctx.globalAlpha = 0.25; ctx.fillStyle = Math.random() < 0.5 ? '#FF1F3D' : '#8FE3F2';
      ctx.fillRect(0, y, cv.width, Math.max(1, h*0.15)); ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}
function decay(){
  var l = S.nz; if(l <= 0) return;
  if(reduceFlash){ if(Math.random() < per(l*0.3)) noise(0.03, 2); return; }
  if(Math.random() < per(0.1 + l*0.5)) noise(0.03 + l*0.12, 2 + l*2);
  if(l > 0.12 && Math.random() < per(l*0.55)) glitchSlices(l);
}

function drawBasket(){
  var x = basket.x, y = basket.y, w = basket.w, h = Math.max(26, w*0.26);
  ctx.save();
  ctx.translate(x,y);
  ctx.rotate(basket.lean);
  ctx.shadowColor='rgba(143,227,242,.7)'; ctx.shadowBlur=22;
  ctx.beginPath();
  ctx.moveTo(-w/2, 0);
  ctx.lineTo(-w/2*0.78, h);
  ctx.quadraticCurveTo(0, h*1.45, w/2*0.78, h);
  ctx.lineTo(w/2, 0);
  ctx.closePath();
  var g = ctx.createLinearGradient(0,0,0,h);
  g.addColorStop(0,'#8FE3F2'); g.addColorStop(1,'#0E3A44');
  ctx.fillStyle=g; ctx.fill();
  ctx.shadowBlur=0;
  ctx.beginPath(); ctx.moveTo(-w/2-4,0); ctx.lineTo(w/2+4,0);
  ctx.strokeStyle='#EAFBFF'; ctx.lineWidth=4; ctx.lineCap='round'; ctx.stroke();
  ctx.strokeStyle='rgba(5,7,10,.35)'; ctx.lineWidth=1.5;
  for(var i=1;i<5;i++){
    var px = -w/2 + i*(w/5);
    ctx.beginPath(); ctx.moveTo(px,2); ctx.lineTo(px*0.8, h*1.1); ctx.stroke();
  }
  ctx.restore();
}

function drawBackdrop(){
  var g = ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'#070A10'); g.addColorStop(0.6,'#05070A'); g.addColorStop(1,'#0B1016');
  ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle='rgba(143,227,242,.06)'; ctx.lineWidth=1; ctx.beginPath();
  var off = reduceFlash ? 0 : (S.t*18)%40;
  for(var gy=off; gy<H; gy+=40){ ctx.moveTo(0,gy); ctx.lineTo(W,gy); }
  for(var gx=0; gx<W; gx+=40){ ctx.moveTo(gx,0); ctx.lineTo(gx,H); }
  ctx.stroke();
  if(!reduceFlash){
    var by = (S.t*90)%(H+160) - 80, bg = ctx.createLinearGradient(0,by-60,0,by+60);
    bg.addColorStop(0,'rgba(143,227,242,0)'); bg.addColorStop(0.5,'rgba(143,227,242,.07)'); bg.addColorStop(1,'rgba(143,227,242,0)');
    ctx.fillStyle=bg; ctx.fillRect(0,by-60,W,120);
  }
  // BLURRED EYES IN THE BACKGROUND, THICKENING IN STEP WITH THE TURBULENCE 
  var n = Math.min(10, S.chaos*2);
  for(var i=0;i<n;i++){
    var sx = ((i*137.5)%100)/100*W, sy = ((i*79.3)%70)/100*H + H*0.08;
    var a = 0.05 + 0.05*Math.abs(Math.sin(S.t*1.3 + i));
    ctx.save(); ctx.globalAlpha=a; ctx.fillStyle='#FF1F3D';
    ctx.beginPath(); ctx.ellipse(sx,sy,26,13,0,0,6.2832); ctx.fill();
    ctx.fillStyle='#0A0208';
    ctx.beginPath(); ctx.arc(sx,sy,6,0,6.2832); ctx.fill();
    ctx.restore();
  }
  // FLOOR MARKING 
  ctx.strokeStyle='rgba(107,118,132,.25)'; ctx.lineWidth=1;
  ctx.beginPath(); ctx.moveTo(0,H-12); ctx.lineTo(W,H-12); ctx.stroke();
}

function noise(alpha, cell){
  ctx.save(); ctx.globalAlpha = alpha;
  for(var i=0;i<140;i++){
    ctx.fillStyle = Math.random()>0.5 ? '#FFFFFF' : '#FF1F3D';
    ctx.fillRect(Math.random()*W, Math.random()*H, cell*(0.5+Math.random()*2), cell*0.6);
  }
  ctx.restore();
}

function hash(n){ var q = Math.sin(n*127.1 + 311.7)*43758.5453; return q - Math.floor(q); }

function scareTail(r){
  noise(reduceFlash ? 0.08 : 0.3, 4);
  var v = ctx.createRadialGradient(W/2,H/2,r*0.6,W/2,H/2,Math.max(W,H)*0.8);
  v.addColorStop(0,'rgba(0,0,0,0)'); v.addColorStop(1,'rgba(0,0,0,.85)');
  ctx.fillStyle=v; ctx.fillRect(0,0,W,H);
}

function scareFace(j, p){
  var flash = reduceFlash ? 0.55 : (p < 0.12 ? 1 : 0.8);
  ctx.fillStyle = p < 0.1 && !reduceFlash ? '#9AA3AF' : 'rgba(30,2,10,'+flash+')';
  ctx.fillRect(0,0,W,H);
  var sh = reduceFlash ? 4 : 22*(1-p*0.4);
  var ox = (Math.random()-0.5)*sh, oy = (Math.random()-0.5)*sh;
  var r = Math.min(W,H) * (0.22 + 0.42*Math.min(1,p*2.6)) * (j.fatal?1.15:1);
  var cx = W/2 + ox, cy = H/2 + oy;
  if(!reduceFlash){
    ctx.save(); ctx.globalAlpha=0.5; ctx.globalCompositeOperation='screen';
    ctx.translate(6,0); drawFace(cx,cy,r,S.t,1); ctx.restore();
    ctx.save(); ctx.globalAlpha=0.5; ctx.globalCompositeOperation='screen';
    ctx.translate(-6,0); drawFace(cx,cy,r,S.t+0.3,1); ctx.restore();
  }
  drawFace(cx, cy, r, S.t, 1);
  scareTail(r);
}

function scareLunge(j, p){
  var m = Math.min(W,H), e = Math.min(1, p/0.38); e = e*e*e;
  ctx.fillStyle = 'rgba(8,0,3,.94)'; ctx.fillRect(0,0,W,H);
  var r = m*0.05 + (Math.max(W,H)*0.6*(j.fatal?1.15:1) - m*0.05)*e;
  var sh = reduceFlash ? 3 : 4 + 26*e*(1-p*0.6);
  drawFace(W/2 + (Math.random()-0.5)*sh, H/2 + (Math.random()-0.5)*sh, r, S.t, 1);
  scareTail(Math.min(r, Math.max(W,H)*0.6));
}

function scareGlitch(j, p){
  var m = Math.min(W,H), r = m*(0.4 + 0.22*Math.min(1,p*3))*(j.fatal?1.15:1);
  ctx.fillStyle = 'rgba(26,0,8,.92)'; ctx.fillRect(0,0,W,H);
  var cx = W/2 + (reduceFlash ? 0 : (Math.floor(S.t*14)%3 - 1)*W*0.05), cy = H/2;
  if(!reduceFlash){
    var k = 14 + Math.random()*10;
    ctx.save(); ctx.globalAlpha=0.5; ctx.globalCompositeOperation='screen';
    ctx.translate(k,0); drawFace(cx,cy,r,S.t,1); ctx.restore();
    ctx.save(); ctx.globalAlpha=0.5; ctx.globalCompositeOperation='screen';
    ctx.translate(-k,0); drawFace(cx,cy,r,S.t+0.4,1); ctx.restore();
  }
  drawFace(cx, cy, r, S.t, 1);
  if(!reduceFlash){
    glitchSlices(1); glitchSlices(1);
    ctx.save();
    for(var i=0;i<5;i++){
      ctx.globalAlpha = 0.22; ctx.fillStyle = Math.random() < 0.5 ? '#FF1F3D' : '#8FE3F2';
      ctx.fillRect(0, Math.random()*H, W, 2 + Math.random()*10);
    }
    ctx.restore();
  }
  scareTail(r);
}

function drawEye(x, y, w, open, lx, ly, dil){
  var h = Math.max(0.5, w*0.55*open);
  ctx.save(); ctx.translate(x,y);
  ctx.shadowColor = '#FF1F3D'; ctx.shadowBlur = Math.min(w*0.4, 30);
  ctx.beginPath(); ctx.ellipse(0,0,w,h,0,0,6.2832);
  var g = ctx.createRadialGradient(0,0,w*0.1,0,0,w);
  g.addColorStop(0,'#E4DEDA'); g.addColorStop(1,'#6E1520');
  ctx.fillStyle = g; ctx.fill(); ctx.shadowBlur = 0;
  ctx.save(); ctx.clip();
  var ix = lx*w*0.4, iy = ly*h*0.5, ir = h*0.9;
  ctx.fillStyle = '#FF1F3D'; ctx.beginPath(); ctx.arc(ix,iy,ir,0,6.2832); ctx.fill();
  ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(ix,iy,Math.max(0.6, ir*(0.16+0.3*dil)), ir*0.85,0,0,6.2832); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = 'rgba(255,31,61,.85)'; ctx.lineWidth = Math.max(1, w*0.04);
  ctx.beginPath(); ctx.ellipse(0,0,w,h,0,0,6.2832); ctx.stroke();
  ctx.restore();
}

function scareEyes(j, p){
  var m = Math.min(W,H), sc = m/390, look = p > 0.55;
  ctx.fillStyle = 'rgba(5,0,3,.95)'; ctx.fillRect(0,0,W,H);
  for(var i=0;i<16;i++){
    var x = hash(j.seed + i*7.3)*W, y = hash(j.seed + i*3.1 + 50)*H;
    var w = (16 + hash(j.seed + i*1.7 + 90)*26)*sc;
    var open = Math.max(0, Math.min(1, (p - hash(j.seed + i*5.9 + 130)*0.45)/0.1));
    if(open <= 0) continue;
    var lx = look ? 0 : Math.max(-1, Math.min(1, (W/2 - x)/(W/2)));
    drawEye(x, y, w, open, lx, look ? 0.4 : 0.6, look ? 1 : 0.2);
  }
  var big = Math.max(0, Math.min(1, (p - 0.55)/0.1)), r = m*0.5*(j.fatal?1.15:1);
  if(big > 0) drawEye(W/2 + (reduceFlash ? 0 : (Math.random()-0.5)*8), H/2, r*0.9*(0.85+0.15*big), big, Math.sin(S.t*9)*0.3, 0.1, 1);
  scareTail(big > 0 ? r*0.9 : m*0.2);
}

function drawScare(){
  var j = S.jump, p = j.t / j.dur;
  ctx.setTransform(DPR,0,0,DPR,0,0);
  if(j.kind === 'lunge') scareLunge(j, p);
  else if(j.kind === 'glitch') scareGlitch(j, p);
  else if(j.kind === 'eyes') scareEyes(j, p);
  else scareFace(j, p);
}

// UPDATE _ CẬP NHẬT
function update(dt){
  S.t += dt;
  updateRec();
  S.slow += ((S.frost > 0 ? 0.3 : 1) - S.slow) * Math.min(1, dt*10);
  var ph = phaseOf(S.t);
  if(ph !== S.phase){ S.phase = ph; S.breather = 3.5; S.banner = { txt:'ph' + (ph+1), t:0 }; riser(2); }
  if(S.breather > 0) S.breather -= dt;
  if(S.fakeCd > 0) S.fakeCd -= dt;
  if(S.revCd > 0) S.revCd -= dt;
  if(S.banner){ S.banner.t += dt; if(S.banner.t > 2.6) S.banner = null; }

  if(S.invuln > 0) S.invuln -= dt;
  if(S.invert > 0) S.invert -= dt;
  if(S.invertCd > 0) S.invertCd -= dt;
  if(S.flickCd > 0) S.flickCd -= dt;
  if(S.boostCd > 0) S.boostCd -= dt;
  if(S.invertPre > 0){ S.invertPre -= dt; if(S.invertPre <= 0) S.invert = 2.6; }
  var invNow = S.invert > 0;
  if(invNow !== lastInv){ lastInv = invNow; if(rawX !== null && (pointerDown || hover)) aim(rawX); }

  if(keyL || keyR){
    var dir = (keyR?1:0) - (keyL?1:0);
    if(S.invert > 0) dir = -dir;
    basket.tx = dir === 0 ? basket.x : clampX(dir > 0 ? W : 0);
    kbOn = true;
  } else if(kbOn){ basket.tx = basket.x; kbOn = false; }
  var step = W*BASKET_V*dt, mvx = Math.max(-step, Math.min(step, basket.tx - basket.x));
  basket.x += mvx;
  basket.vx = dt > 0 ? mvx/dt : 0;
  basket.lean += (basket.vx*0.00018 - basket.lean) * Math.min(1, dt*12);

  if(S.shake > 0) S.shake = Math.max(0, S.shake - dt*36);
  if(S.flick > 0) S.flick -= dt;
  if(S.frost > 0) S.frost -= dt;
  if(S.fireT > 0) S.fireT -= dt;
  S.nz = Math.min(1, S.t/150 + S.chaos*0.1);
  var nzq = Math.round(S.nz*20)/20;
  if(nzq !== S.nzq){ S.nzq = nzq; wrapEl.style.setProperty('--n', nzq); }

  // MORE RANDOM NOISE
  if(S.chaos >= 1 && S.flick <= 0 && S.flickCd <= 0 && Math.random() < dt * (0.5 + S.chaos*0.45 + S.nz*2)){
    S.flick = 0.06 + Math.random()*0.16; S.flickCd = 0.4;
    S.flickCol = Math.random() < 0.6 ? '#000000' : '#FF1F3D';
  }
  if(S.phase >= 1 && S.invert <= 0 && S.invertPre <= 0 && S.invertCd <= 0 && Math.random() < dt*[0, 0.08, 0.1, 0.16][S.phase]){
    S.invertPre = 0.8; S.invertCd = S.phase >= 3 ? 6 : 8; hum();
  }

  if(!noScare && S.chaos >= 1 && !S.fake && S.fakeCd <= 0 && Math.random() < dt*(0.03 + S.chaos*0.015)){
    var fr = Math.min(W,H)*(0.12 + Math.random()*0.1);
    S.fake = { t:0, dur:0.3 + Math.random()*0.2, x: fr + Math.random()*(W - fr*2), y: H*0.15 + Math.random()*H*0.4, r: fr };
    S.fakeCd = 14;
    blip(300, 60, 0.18, 'square', 0.04);
  }
  if(S.fake){ S.fake.t += dt; if(S.fake.t >= S.fake.dur) S.fake = null; }

  // SPAWN
  S.spawn -= dt * S.slow;
  if(S.spawn <= 0){
    spawnOne();
    if(S.phase >= 1 && S.chaos >= 2 && Math.random() < 0.3) spawnOne();
    S.spawn = spawnGap();
  }

  // FALLING 
  var top = basket.y, half = basket.w/2;
  for(var i=S.objs.length-1;i>=0;i--){
    var o = S.objs[i], sm = S.slow;
    if(o.burn > 0){ o.burn -= dt; if(o.burn <= 0) S.objs.splice(i,1); continue; }
    o.y += o.vy * dt * sm;
    o.ph += dt*2.4*sm;
    o.x += Math.sin(o.ph) * o.sway * (o.v ? 1 + (o.rev || 0)*1.4 : 1) * dt * sm;
    o.x = Math.max(o.r, Math.min(W-o.r, o.x));
    if(o.dead){ S.objs.splice(i,1); continue; }
    if(o.v){
      var rt = (basket.y - o.y) / o.vy, rvT = o.tut ? 1.6 : revealTime();
      o.rev = Math.max(0, Math.min(1, (rvT - rt)/0.12));
      if(o.rev > 0 && !o.seen){ o.seen = 1; revealTick(); }
    } else if(o.faD > 0){
      if(o.flash > 0) o.flash -= dt;
      if(!o.faDone && (basket.y - o.y) / o.vy <= o.faD){ o.faDone = 1; o.flash = 0.14; revealTick(); }
    }

    if(o.y + o.r >= top && o.y - o.r <= top + 40 && Math.abs(o.x - basket.x) < half + o.r*0.35){
      if(o.v){
        if(S.invuln > 0){ S.objs.splice(i,1); continue; }
        S.objs.splice(i,1);
        loseLife(o);
        return;
      } else {
        S.objs.splice(i,1);
        if(o.k === 'fire'){ burnAll(o); updateHUD(); if(S.caught >= S.nextChaos) bumpChaos(); continue; }
        if(o.k === 'ice') freezeAll(o);
        S.caught++; S.combo++;
        S.score += 1 + Math.floor(S.combo/10) + S.chaos;
        S.floats.push({x:o.x, y:top-10, t:0, txt:'+'+(1+Math.floor(S.combo/10)+S.chaos), hue:o.hue});
        chime(S.combo);
        updateHUD();
        if(S.caught >= S.nextChaos) bumpChaos();
        continue;
      }
    }
    if(o.y - o.r > H){
      S.objs.splice(i,1);
      if(!o.v) S.combo = 0;
    }
  }

  for(var pk=S.parts.length-1;pk>=0;pk--){
    var p = S.parts[pk]; p.t += dt; p.x += p.vx*dt; p.y += p.vy*dt;
    if(!p.f) p.vy += 300*dt;
    if(p.t > p.life) S.parts.splice(pk,1);
  }
  for(var k=S.floats.length-1;k>=0;k--){
    var f = S.floats[k]; f.t += dt; f.y -= dt*46;
    if(f.t > 0.8) S.floats.splice(k,1);
  }
}

// RENDER
function render(){
  ctx.setTransform(DPR,0,0,DPR,0,0);
  ctx.clearRect(0,0,W,H);

  if(S.mode === 'scare' && S.jump.kind !== 'calm'){ drawScare(); return; }

  var sx = 0, sy = 0;
  if(S.shake > 0){ sx = (Math.random()-0.5)*S.shake; sy = (Math.random()-0.5)*S.shake; }
  ctx.save(); ctx.translate(sx,sy);

  drawBackdrop();

  for(var i=0;i<S.objs.length;i++){
    drawObj(S.objs[i]);
  }

  if(S.invuln > 0 && Math.floor(S.t*12)%2===0) ctx.globalAlpha = 0.45;
  drawBasket();
  ctx.globalAlpha = 1;

  for(var k=0;k<S.floats.length;k++){
    var f = S.floats[k];
    ctx.save();
    ctx.globalAlpha = Math.max(0, 1 - f.t/0.8);
    ctx.fillStyle = 'hsl('+f.hue+' 90% 72%)';
    ctx.font = '600 16px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(f.txt, f.x, f.y);
    ctx.restore();
  }

  for(var pi=0;pi<S.parts.length;pi++){
    var pp = S.parts[pi], u = pp.t/pp.life;
    ctx.save(); ctx.globalAlpha = Math.max(0, 1-u);
    if(pp.f){
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'hsl('+(10+u*40)+' 100% '+(60-u*20)+'%)';
      ctx.beginPath(); ctx.arc(pp.x, pp.y, pp.s*(1-u*0.6), 0, 6.2832); ctx.fill();
    } else {
      ctx.strokeStyle = '#DFF8FF'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(pp.x,pp.y); ctx.lineTo(pp.x-pp.vx*0.05, pp.y-pp.vy*0.05); ctx.stroke();
    }
    ctx.restore();
  }
  if(S.chaos >= 2 && (S.t % 6) < 0.9){
    ctx.save(); ctx.globalAlpha = 0.16; ctx.fillStyle = '#FF1F3D';
    ctx.font = '600 ' + Math.round(Math.max(16, Math.min(W*0.06, 34))) + 'px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t('w' + (((S.t/6)|0) % 3 + 1)), W/2, H*0.52);
    ctx.restore();
  }
  if(S.invert > 0){
    ctx.save();
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = '#FF1F3D';
    ctx.font = '700 ' + Math.round(Math.max(18, Math.min(W*0.05, 28))) + 'px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('inv'), W/2, H*0.34);
    ctx.restore();
  } else if(S.invertPre > 0){
    ctx.save();
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#FF1F3D';
    ctx.font = '700 ' + Math.round(Math.max(16, Math.min(W*0.045, 24))) + 'px "Chakra Petch", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('invWarn'), W/2, H*0.34);
    ctx.restore();
  }
  if(S.banner){
    var bt = S.banner.t, ba = Math.max(0, Math.min(1, bt/0.4, (2.6 - bt)/0.6));
    ctx.save();
    ctx.globalAlpha = 0.85*ba; ctx.fillStyle = '#8FE3F2';
    ctx.font = '600 ' + Math.round(Math.max(13, Math.min(W*0.04, 20))) + 'px "IBM Plex Mono", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(t(S.banner.txt), W/2, H*0.2);
    ctx.restore();
  }
  if(S.fake){
    var fk = S.fake;
    ctx.save();
    ctx.globalAlpha = (reduceFlash ? 0.22 : 0.5) * Math.sin(Math.PI * Math.min(1, fk.t/fk.dur));
    drawFace(fk.x, fk.y, fk.r, S.t, 0.6);
    ctx.restore();
  }

  ctx.restore();

  if(S.frost > 0){
    var fa = Math.min(1, S.frost/1.2) * (reduceFlash ? 0.12 : 0.28);
    var fg = ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*0.3,W/2,H/2,Math.max(W,H)*0.75);
    fg.addColorStop(0,'rgba(140,220,255,0)'); fg.addColorStop(1,'rgba(140,220,255,'+fa+')');
    ctx.fillStyle = fg; ctx.fillRect(0,0,W,H);
  }
  if(S.fireT > 0){
    ctx.fillStyle = 'rgba(255,110,20,'+(S.fireT/0.5*(reduceFlash ? 0.06 : 0.22))+')'; ctx.fillRect(0,0,W,H);
  }
  // FLICK / NOISE
  if(S.flick > 0){
    if(reduceFlash){
      ctx.save(); ctx.globalAlpha = 0.18; ctx.fillStyle = S.flickCol;
      ctx.fillRect(0,0,W,H); ctx.restore();
    } else {
      ctx.save();
      ctx.globalAlpha = S.flickCol === '#000000' ? 0.72 : 0.3;
      ctx.fillStyle = S.flickCol; ctx.fillRect(0,0,W,H);
      ctx.restore();
      if(Math.random() < per(0.5)) noise(0.18, 3);
    }
  }
  decay();

  // VIGNETTE
  var v = ctx.createRadialGradient(W/2,H*0.5,Math.min(W,H)*0.35,W/2,H*0.5,Math.max(W,H)*0.78);
  v.addColorStop(0,'rgba(0,0,0,0)');
  v.addColorStop(1,'rgba(0,0,0,'+(0.5 + S.nz*0.35)+')');
  ctx.fillStyle = v; ctx.fillRect(0,0,W,H);
  if(S.mode === 'scare'){
    var cp = S.jump.t / S.jump.dur;
    ctx.fillStyle = 'rgba(20,2,8,' + (0.62*(1 - cp*0.4)) + ')'; ctx.fillRect(0,0,W,H);
    drawFace(W/2, H/2, Math.min(W,H)*0.16*(1 + 0.1*cp), S.t, 0.5);
  }
}

// LOOP
var last = performance.now();
function loop(now){
  var dt = Math.min(0.05, (now - last)/1000); last = now;
  fdt = Math.max(dt, 0.001);
  if(S.mode === 'play') update(dt);
  else if(S.mode === 'scare'){
    S.t += dt; S.jump.t += dt;
    if(S.jump.t >= S.jump.dur) afterScare();
  } else if(S.mode === 'resume'){
    S.cd -= dt;
    var cn = Math.ceil(S.cd);
    if(cn > 0){ if(countEl.textContent !== String(cn)) countEl.textContent = cn; }
    else { countEl.classList.add('hidden'); setMode('play'); }
  } else if(S.mode === 'pause'){
  } else {
    S.t += dt;
    if(S.objs.length < 6 && Math.random() < per(0.03)) {
      var r = 18;
      S.objs.push({v:Math.random()<0.2,x:r+Math.random()*(W-r*2),y:-40,r:r,
        vy:H*0.12,hue:HUES[(Math.random()*HUES.length)|0],ph:Math.random()*6,sway:10,dead:0});
    }
    for(var i=S.objs.length-1;i>=0;i--){
      var o=S.objs[i]; o.y+=o.vy*dt; o.ph+=dt*2;
      if(o.y-o.r>H) S.objs.splice(i,1);
    }
  }
  musicUpdate(dt);
  if(S.mode !== 'pause' || S.dirty){ render(); S.dirty = false; }
  requestAnimationFrame(loop);
}

resize();
applyLang();
requestAnimationFrame(loop);
})();
