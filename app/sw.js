const INBOX_CACHE = 'genesys-banca-inbox';
const INBOX_URL = 'inbox.json';
const MAX_INBOX = 20;

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function addToInbox(message) {
  const cache = await caches.open(INBOX_CACHE);
  const current = await cache.match(INBOX_URL);
  const inbox = current ? await current.json() : [];
  inbox.unshift(message);
  await cache.put(INBOX_URL, new Response(JSON.stringify(inbox.slice(0, MAX_INBOX)), { headers: { 'Content-Type': 'application/json' } }));
}

self.addEventListener('push', event => {
  const message = event.data ? event.data.json() : { title: 'Genesys Banca', body: 'Hai un nuovo avviso.' };
  event.waitUntil((async () => {
    await addToInbox(message);
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    windows.forEach(client => client.postMessage({ type: 'inbox-updated' }));
    await self.registration.showNotification(message.title, {
      body: message.body,
      tag: message.tag,
      icon: 'icons/icon-192.png',
      badge: 'icons/icon-192.png',
      data: { url: message.url || './' },
    });
  })());
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || './', self.registration.scope).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find(client => client.url.startsWith(self.registration.scope));
    if (open) {
      await open.focus();
      return open.navigate(target);
    }
    return self.clients.openWindow(target);
  })());
});
