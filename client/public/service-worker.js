// Service Worker Sürümü
const CACHE_VERSION = "v1";
const CACHE_NAME = `repairshop-${CACHE_VERSION}`;

// Önbelleğe alınacak dosyalar
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  // CSS, JS ve diğer statik varlıklar otomatik olarak eklenecek
];

// Service Worker Kurulumu
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("Cache açıldı");
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Eski service worker'ı hemen değiştir
  );
});

// Eski önbellekleri temizler
self.addEventListener("activate", (event) => {
  const cacheAllowlist = [CACHE_NAME];

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheAllowlist.indexOf(cacheName) === -1) {
              console.log("Eski önbellek siliniyor:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Kontrol aktif olarak ele alındı
  );
});

// Fetch (ağ) isteklerini yakalar
self.addEventListener("fetch", (event) => {
  // API istekleri için ağa öncelik ver, sonra önbelleğe kaydet
  if (event.request.url.includes("/api/")) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Yanıt kopyası oluştur (yanıtı bir kez kullanabiliriz)
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            // Başarılı yanıtları önbelleğe al
            if (event.request.method === "GET" && response.status === 200) {
              cache.put(event.request, responseToCache);
            }
          });

          return response;
        })
        .catch(() => {
          // Ağ başarısız olursa önbellekten dene
          return caches.match(event.request);
        })
    );
  } else {
    // Statik varlıklar için önce önbelleği kontrol et, sonra ağa git
    event.respondWith(
      caches.match(event.request).then((response) => {
        // Önbellekte bulundu, önbellekten sun
        if (response) {
          return response;
        }

        // Önbellekte yok, ağdan iste
        return fetch(event.request).then((response) => {
          // Geçersiz yanıtları dikkate alma
          if (!response || response.status !== 200 || response.type !== "basic") {
            return response;
          }

          // Yanıt kopyası oluştur (yanıtı bir kez kullanabiliriz)
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
    );
  }
});

// Push bildirimleri
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();

    const options = {
      body: data.body || "Yeni bir bildirim var!",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/badge-72x72.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/",
      },
    };

    event.waitUntil(self.registration.showNotification(data.title || "Repair Shop", options));
  }
});

// Bildirime tıklama
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data.url));
});
