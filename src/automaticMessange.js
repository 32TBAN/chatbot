import pkg from "whatsapp-web.js";
import messages from "./messages.js";
import path from "path";
import { fileURLToPath } from "url";
import schedule from "node-schedule";

import { getReminders, searchUserById } from "./func/services.functions.js";

const { MessageMedia } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutomatedMessageHandler {
  constructor(client) {
    this.client = client;
    this.promotions = [
      { message: messages.promo1, time: "35 10 * * *" },
      { message: messages.promo2, time: "34 10 * * *" },
      { message: messages.promo3, time: "33 10 * * *" },
      { message: messages.promo4, time: "32 10 * * *" },
      { message: messages.promotionMessage, time: "30 10 * * *" },
    ];
    this.phones = [
      "593979353728@c.us",
      "593984635564@c.us",
      "593984493368@c.us",
      "593984725398@c.us",
    ];
    this.initialize();
  }

  initialize() {
    this.paymentReminder();
    this.schedulePromotions();
  }

  schedulePromotions() {
    this.promotions.forEach((promo) => {
      schedule.scheduleJob(promo.time, () => {
        this.sendPromotionMessage(promo.message);
      });
    });
  }

  async sendPromotionMessage(message) {
    try {
      for (const phone of this.phones) {
        await this.sendPromotion(phone, message);
        await this.sleep(10000); // Esperar 10 segundos entre mensajes
      }
    } catch (error) {
      console.error("Error al enviar mensajes de promoción:", error);
    }
  }

  async sendPromotion(to, message) {
    const logoPath = path.resolve(__dirname, "./assets/img/logo.jpg");
    const logo = MessageMedia.fromFilePath(logoPath);
    await this.client.sendMessage(to, logo, { caption: message });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async paymentReminder() {
    const paymentReminders = await getReminders();
    for (const remiders of paymentReminders) {
      let formattedDueDate = new Date(remiders.due_date).toLocaleDateString(
        "es-ES"
      );
      let message = `Tiene un pago pendiente de $${remiders.amount}. Por favor, pague antes del ${formattedDueDate} para evitar recargos.`;

      let user = await searchUserById(remiders.id_user);
      schedule.scheduleJob("39 11 * * *", async () => {
        await this.client
          .sendMessage(user.phone, message)
          .then(await this.sleep(10000));
      });
    }
  }
}

export default AutomatedMessageHandler;
