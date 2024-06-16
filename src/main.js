import pkg from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import MessageHandler from "./sendMessages.js";
import AutomatedMessageHandler from "./automaticMessange.js";

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
    remotePath: 'https://raw.githubusercontent.com/guigo613/alternative-wa-version/main/html/2.2412.54v2.html',
  },
});

client.on("ready", () => {
  console.log("Client is ready!");
  new MessageHandler(client)//* clase de envio de mensajes
  new AutomatedMessageHandler(client); // * Enviar mensajes de promoción cada n minutos
});

client.on("qr", (qr) => {
  qrcode.generate(qr, { small: true });
});


client.initialize().catch((err) => {
  console.error("Error al inicializar el cliente:", err);
});
