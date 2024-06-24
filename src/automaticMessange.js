import pkg from "whatsapp-web.js";
import messages from "./messages.js";
import path from "path";
import { fileURLToPath } from "url";
import schedule from "node-schedule";  // * Librería para programar tareas en Node.js
 
import { getReminders, searchUserById } from "./func/services.functions.js";

const { MessageMedia } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AutomatedMessageHandler {
  constructor(client) {
    this.client = client;
        // * Definición de las promociones y sus horarios
    this.promotions = [
      { message: messages.promo1, time: "35 10 * * *" },
      { message: messages.promo2, time: "34 10 * * *" },
      { message: messages.promo3, time: "33 10 * * *" },
      { message: messages.promo4, time: "32 10 * * *" },
      { message: messages.promotionMessage, time: "38 23 * * *" },
    ];
        // * Lista de números de teléfono a los que se enviarán los mensajes
    this.phones = [
      "593979353728@c.us",
      "593984635564@c.us",
      "593984493368@c.us",
      "593984725398@c.us",
    ];
    this.initialize();
  }

  initialize() {
    this.paymentReminder(); // * Configuración de recordatorios de pagos
    this.schedulePromotions(); // * Programación de mensajes promocionales
  }

    // * Programa el envío de mensajes promocionales según los horarios definidos
  schedulePromotions() {
    this.promotions.forEach((promo) => {
      schedule.scheduleJob(promo.time, () => {
        this.sendPromotionMessage(promo.message);
      });
    });
  }

    // * Envía mensajes promocionales a todos los números definidos
  async sendPromotionMessage(message) {
    try {
      for (const phone of this.phones) {
        await this.sendPromotion(phone, message);
        await this.sleep(10000); // * Esperar 10 segundos entre mensajes
      }
    } catch (error) {
      console.error("Error al enviar mensajes de promoción:", error);
    }
  }

    // * Envía un mensaje promocional a un número de teléfono específico
  async sendPromotion(to, message) {
    const logoPath = path.resolve(__dirname, "./assets/video/promov.mp4");
    const logo = MessageMedia.fromFilePath(logoPath);
    await this.client.sendMessage(to, logo, { caption: message });
  }

    // * Función para esperar un número de milisegundos especificado para que no bloquen el numero XD
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

    // * Configura y envía recordatorios de pago
  async paymentReminder() {
    const paymentReminders = await getReminders(); // * Obtiene todos los que debem
    for (const remiders of paymentReminders) {
      let formattedDueDate = new Date(remiders.due_date).toLocaleDateString(
        "es-ES"
      ); // * FORMATO de la fecha 
      let message = `Tiene un pago pendiente de $${remiders.amount}. Por favor, pague antes del ${formattedDueDate} para evitar recargos.`;

      let user = await searchUserById(remiders.id_user); // * BUsca el usuario por el id
      schedule.scheduleJob("21 01 * * *", async () => {
        await this.client
          .sendMessage(user.phone, message)
          .then(await this.sleep(10000));  // * Envía el recordatorio y espera 10 segundos
      });
    }
  }
}

export default AutomatedMessageHandler;
