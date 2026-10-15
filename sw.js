/* Service worker: o app abre sem internet.
   Arquivos do app: usa o cache e atualiza em segundo plano (a nova versão aparece na próxima abertura).
   Ao publicar mudanças grandes, aumente VERSAO para limpar o cache antigo. */
const VERSAO = 'smv-v3';
const ARQS = ['./', 'index.html', 'styles.css', 'app.js', 'plano.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonte = url.hostname.endsWith('fonts.googleapis.com') || url.hostname.endsWith('fonts.gstatic.com');
  if (url.origin !== location.origin && !fonte) return;
  e.respondWith(caches.open(VERSAO).then(async c => {
    const cache = await c.match(req, { ignoreSearch: url.origin === location.origin });
    const rede = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => cache);
    return cache || rede;
  }));
});
