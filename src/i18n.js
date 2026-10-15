// i18n.js
// All game texts (English) and a function to put them into the page.
// t(key) returns a text. {n} in the text is replaced by a number.
// In index.html, data-i18n="key" sets plain text and data-i18n-html="key" sets text with HTML.

const TEXT = {
  docTitle:'CIREEP — Catch the data',
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
};

export function t(k, n){ return (TEXT[k] || k).replace('{n}', n); }

export function applyText(){
  document.title = t('docTitle');
  document.querySelectorAll('[data-i18n]').forEach(function(el){
    const txt = t(el.getAttribute('data-i18n'));
    el.textContent = txt;
    if(el.hasAttribute('data-text')) el.setAttribute('data-text', txt);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(function(el){
    el.innerHTML = t(el.getAttribute('data-i18n-html'));
  });
}
