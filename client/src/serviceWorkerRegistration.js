// Service worker kayıt işlevi
export function register() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const swUrl = "/service-worker.js";

      navigator.serviceWorker
        .register(swUrl)
        .then((registration) => {
          console.log("Service Worker başarıyla kaydedildi:", registration);

          // Güncelleme kontrolü için event listener
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (installingWorker == null) {
              return;
            }

            installingWorker.addEventListener("statechange", () => {
              if (installingWorker.state === "installed") {
                if (navigator.serviceWorker.controller) {
                  // Yeni içerik mevcut
                  console.log("Yeni içerik yüklendi ve önbelleğe alındı.");
                } else {
                  // İçerik önbelleğe alındı
                  console.log("İçerik çevrimdışı kullanım için önbelleğe alındı.");
                }
              }
            });
          });
        })
        .catch((error) => {
          console.error("Service Worker kaydı başarısız oldu:", error);
        });

      // Sayfa yüklendiğinde mevcut service worker'ı kontrol et
      if (navigator.serviceWorker.controller) {
        console.log("Aktif bir service worker bulundu");
      }
    });
  }
}

// Service worker'ı kaldırma işlevi
export function unregister() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error("Service Worker kaldırma başarısız oldu:", error);
      });
  }
}
