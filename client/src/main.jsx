import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration.js";
import "jquery";
import "@popperjs/core";
import "bootstrap";
import "./assets/vendor/js/helpers.js";
import "./assets/js/config.js";
import "node-waves";
import "perfect-scrollbar";
import "./assets/vendor/js/menu.js";
import "apexcharts";
import "./assets/js/main.js";
import "./assets/js/dashboards-analytics.js";
import "./assets/vendor/fonts/remixicon/remixicon.css";
import "./assets/vendor/libs/node-waves/node-waves.css";
import "./assets/vendor/css/core.css";
import "./assets/vendor/css/theme-default.css";
import "./assets/css/demo.css";
import "./assets/vendor/libs/perfect-scrollbar/perfect-scrollbar.css";
import "./assets/vendor/libs/apex-charts/apex-charts.css";
import "./assets/vendor/css/pages/page-auth.css";
import "./assets/js/config.js";

// PWA Yükleme İşlevi
let deferredPrompt;

// PWA Yükleme İndikatörünü Gösterme/Gizleme
function showInstallPrompt() {
  const installPrompt = document.getElementById("pwa-install-prompt");
  const installButton = document.getElementById("pwa-install-button");
  const dismissButton = document.getElementById("pwa-dismiss-button");

  if (installPrompt && installButton && dismissButton) {
    installPrompt.style.display = "block";

    installButton.addEventListener("click", async () => {
      installPrompt.style.display = "none";

      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`Kurulum sonucu: ${outcome}`);
        deferredPrompt = null;
      }
    });

    dismissButton.addEventListener("click", () => {
      installPrompt.style.display = "none";
      // 7 gün için kullanıcı tercihini localStorage'e kaydedebiliriz
      localStorage.setItem("pwaInstallDismissed", Date.now().toString());
    });
  }
}

// Tarayıcı uygulamayı yüklemeye hazır olduğunda
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // Kullanıcı daha önce reddettiyse ve 7 gün geçmediyse gösterme
  const dismissedTime = localStorage.getItem("pwaInstallDismissed");
  if (dismissedTime) {
    const dismissedDays = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
    if (dismissedDays < 7) return;
  }

  // Yükleme mesajını göster
  showInstallPrompt();
});

// Uygulama yüklendiğinde
window.addEventListener("appinstalled", () => {
  console.log("RepairShop başarıyla yüklendi!");
  deferredPrompt = null;
});

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Service worker'ı kaydet
serviceWorkerRegistration.register();
