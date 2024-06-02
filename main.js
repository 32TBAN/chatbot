import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import MessageHandler from "./sendMessages.js";

const { Client, LocalAuth } = pkg;

const client = new Client({
  puppeteer: {
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
},
  authStrategy: new LocalAuth({
    dataPath: "sessions",
  }),
  webVersionCache: {
    type: "remote",
    remotePath:
      "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
  },
});

client.on("ready", () => {
  console.log("Client is ready!");
  new MessageHandler(client)
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.initialize().catch((err) => {
  console.error("Error al inicializar el cliente:", err);
});
