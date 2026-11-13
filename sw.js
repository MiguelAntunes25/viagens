// Guarda a "casca" da app para abrir sem rede. Os dados vêm da Supabase (com cópia local na app).
const VERSAO = 'roteiros-v23';
const BASE = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/data.js', 'js/util.js', 'js/config.js', 'manifest.webmanifest', 'icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(BASE)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('roteiros-') && k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.hostname.endsWith('supabase.co')) return;
  const ehBiblioteca = u.hostname === 'esm.sh' || u.hostname.includes('fonts.g');
  if (ehBiblioteca) {
    e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const cp = res.clone(); caches.open(VERSAO).then((c) => c.put(e.request, cp)); return res; })));
  } else if (u.origin === location.origin) {
    // rede primeiro (para receber atualizações), cópia local se não houver rede
    e.respondWith(fetch(e.request).then((res) => { const cp = res.clone(); caches.open(VERSAO).then((c) => c.put(e.request, cp)); return res; }).catch(() => caches.match(e.request).then((r) => r || caches.match('index.html'))));
  }
});
