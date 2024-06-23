import pkg from "whatsapp-web.js"; // * Módulo para interactuar con WhatsApp Web
import qrcode from "qrcode-terminal"; // * Módulo para generar códigos QR en la terminal
import MessageHandler from "./sendMessages.js"; // * Manejador personalizado para enviar mensajes del chatbot
import AutomatedMessageHandler from "./automaticMessange.js"; // * Manejador personalizado para enviar mensajes automatizados como promos y pagos

const { Client, LocalAuth } = pkg; // * Extraemos las clases necesarias del paquete whatsapp-web.js clients es para cliente de whatsspa y localAut para guardar las credenciales 

const client = new Client({
  puppeteer: {
    // * esto solo es necesario solo si se quiere obtener medias con URL
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
},
  authStrategy: new LocalAuth({
    dataPath: "sessions", // * Aqui se almacenaran datos de session
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
  // * se genera un código QR
  qrcode.generate(qr, { small: true });
});


client.initialize().catch((err) => {
  console.error("Error al inicializar el cliente:", err);
});
