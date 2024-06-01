import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import MessageHandler from "./sendMessages.js";

const { Client, LocalAuth, MessageMedia } = pkg;

const client = new Client({
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
  const stickerMedia = new MessageMedia('image/png', './Sin título.jpg');
  new MessageHandler(client, stickerMedia)
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});

client.initialize().catch((err) => {
  console.error("Error al inicializar el cliente:", err);
});
