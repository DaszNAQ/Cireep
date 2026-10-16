// Service worker template. The build fills in version and files.

'use strict';

var VERSION = '__VERSION__';
var CORE = __CORE__;
var FONT_CSS = 'https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@600;700&display=swap';
var FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

function cacheFonts(cache){
  return fetch(FONT_CSS).then(function(res){
    if(!res.ok) throw new Error('font css');
    var copy = res.clone();
    return Promise.all([cache.put(FONT_CSS, copy), res.text()]);
  }).then(function(r){
    var urls = r[1].match(/https:\/\/[^)'"\s]+/g) || [];
    return Promise.all(urls.map(function(u){
      return fetch(u).then(function(res){ if(res.ok) return cache.put(u, res); }).catch(function(){});
    }));
  });
}

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(VERSION).then(function(cache){
      var fresh = CORE.map(function(u){ return new Request(u, { cache: 'reload' }); });
      return cache.addAll(fresh).then(function(){ return cacheFonts(cache).catch(function(){}); });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.filter(function(k){ return k !== VERSION; }).map(function(k){ return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

// Game files: network first, saved copy when offline.
function networkFirst(req){
  return caches.open(VERSION).then(function(cache){
    return Promise.race([
      fetch(req, { cache: 'no-cache' }), // always check the server, skip the HTTP cache
      new Promise(function(_, reject){ setTimeout(reject, 4000); })
    ]).then(function(res){
      if(res && res.ok && res.type === 'basic') cache.put(req, res.clone());
      return res;
    }).catch(function(){
      return cache.match(req, { ignoreSearch: true }).then(function(hit){
        if(hit) return hit;
        if(req.mode === 'navigate') return cache.match('index.html');
      });
    }).then(function(res){
      return res || Response.error();
    });
  });
}

// Google fonts: saved copy first.
function cacheFirst(req){
  return caches.open(VERSION).then(function(cache){
    return cache.match(req).then(function(hit){
      if(hit) return hit;
      return fetch(req).then(function(res){
        if(res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      });
    });
  });
}

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;
  var url = new URL(req.url);
  if(url.origin === self.location.origin) e.respondWith(networkFirst(req));
  else if(FONT_HOSTS.indexOf(url.hostname) >= 0) e.respondWith(cacheFirst(req));
});
