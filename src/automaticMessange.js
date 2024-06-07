import pkg from "whatsapp-web.js";
import messages from "./messages.js";
import path from 'path';
import { fileURLToPath } from 'url';

const { MessageMedia } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutomatedMessageHandler {
  constructor(client, intervalMinutes = 30) {
    this.client = client;
    this.intervalMinutes = intervalMinutes;
    this.initialize();
  }

  initialize() {
    this.scheduleMessages();
  }

  scheduleMessages() {
    setInterval(
      this.sendPromotionMessage.bind(this),
      this.intervalMinutes * 60 * 1000
    );
  }

  async sendPromotionMessage() {
    try {
      const phones = [
        "593979353728@c.us",
        "593984635564@c.us",
        "593984493368@c.us",
        "593984725398@c.us"
      ];
      for (const phone of phones) {
        function sleep(ms) {
          return new Promise((resolve) => setTimeout(resolve, ms));
        }

        await sleep(10000);
        await this.sendPromotion(phone);
      }
    } catch (error) {
      console.error("Error al enviar mensajes de promoción:", error);
    }
  }

  async sendPromotion(to) {
    const logoPath = path.resolve(__dirname, './assets/img/logo.jpg');
    const logo = MessageMedia.fromFilePath(logoPath);
    await this.client.sendMessage(to, logo);

    await this.client
      .sendMessage(to, messages.promotionMessage)
      .then((res) => {
        console.log("Mensaje de promoción enviado exitosamente a:", to);
      })
      .catch((err) => {
        console.error("Error al enviar el mensaje de promoción a:", to, err);
      });
  }
}

export default AutomatedMessageHandler;
