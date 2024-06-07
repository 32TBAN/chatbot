import pkg from "whatsapp-web.js";
import messages from "./messages.js";
import { searchPhone, validKeyWord, registerUser } from "./methods.js";
import path from "path";
import { fileURLToPath } from "url";

import {
  informacionKeywords,
  consultaKeywords,
  agendarKeywords,
  comentariosKeywords,
} from "./keysWord.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { MessageMedia } = pkg;

class MessageHandler {
  constructor(client) {
    this.client = client;
    this.pendingRegistrations = {}; // Para almacenar el estado de registro de los usuarios
    this.initialize();
  }

  initialize() {
    this.client.on("message", this.handleMessage.bind(this));
  }

  async handleMessage(msg) {
    console.log("De: ", msg.from);

    if (
      msg.from != "593979353728@c.us" &&
      msg.from != "593984635564@c.us" &&
      msg.from != "593984493368@c.us" &&
      msg.from != "593984725398@c.us"
    ) {
      console.log("Mensaje ignorado de:", msg.from);
      return;
    }

    console.log("Mensaje: ", msg.body);
    const lowerCaseMessage = msg.body.toLowerCase();

    if (this.pendingRegistrations[msg.from]) {
      const registrationState = this.pendingRegistrations[msg.from];
      if (registrationState.step === 1) {
        registrationState.name = msg.body.trim();
        registrationState.step = 2;
        await this.client.sendMessage(msg.from, "Por favor, ingresa tu email:");
      } else if (registrationState.step === 2) {
        registrationState.email = msg.body.trim();
        await registerUser(registrationState);
        delete this.pendingRegistrations[msg.from];
        await this.client.sendMessage(msg.from, "¡Registro completado! 🎉");
      }
      return;
    }

    const user = searchPhone(msg.from);
    if (user != null) {
      const logoPath = path.resolve(__dirname, "./assets/img/logo.jpg");
      const logo = MessageMedia.fromFilePath(logoPath);
      await this.client.sendMessage(msg.from, logo);

      await this.client.sendMessage(
        msg.from,
        " Hola👋 " + user.name + " " + messages.greeting
      );
    } else {
      const logoPath = path.resolve(__dirname, "./assets/img/logo.jpg");
      const logo = MessageMedia.fromFilePath(logoPath);
      await this.client.sendMessage(msg.from, logo);
      await this.client.sendMessage(
        msg.from,
        "No encontramos tu número en nuestra base de datos. ¿Deseas registrarte? (responde 'sí' o 'no')"
      );

      this.client.on("message_create", async (responseMsg) => {
        if (
          responseMsg.from === msg.from &&
          responseMsg.body.toLowerCase() === "sí"
        ) {
          this.pendingRegistrations[msg.from] = { phone: msg.from, step: 1 };
          await this.client.sendMessage(
            msg.from,
            "Por favor, ingresa tu nombre:"
          );
        } else if (
          responseMsg.from === msg.from &&
          responseMsg.body.toLowerCase() === "no"
        ) {
          await this.client.sendMessage(
            msg.from,
            "Entendido. Si cambias de opinión, no dudes en decírnoslo."
          );
        }
      });
    }

    const greetings = ["hola", "buenos", "buenas", "hey", "hi", "hello"];

    if (validKeyWord(lowerCaseMessage, greetings)) {
      await this.sendGreeting(msg.from);
    } else if (validKeyWord(lowerCaseMessage, informacionKeywords)) {
      await this.sendInformation(msg.from);
    } else if (validKeyWord(lowerCaseMessage, consultaKeywords)) {
      await this.sendQuery(msg.from);
    } else if (validKeyWord(lowerCaseMessage, agendarKeywords)) {
      await this.sendAgenda(msg.from);
    } else if (validKeyWord(lowerCaseMessage, comentariosKeywords)) {
      await this.sendComment(msg.from);
    } else if (lowerCaseMessage === "a") {
      await this.sendInstall(msg.from);
    } else if (lowerCaseMessage === "b") {
      await this.sendUpdate(msg.from);
    } else if (lowerCaseMessage == "c") {
      await this.sendDocuments(msg.from);
    } else {
      await this.sendDefaultResponse(msg);
    }
  }

  async sendGreeting(to) {
    const logoPath = path.resolve(__dirname, "./assets/img/logo.jpg");
    const logo = MessageMedia.fromFilePath(logoPath);
    await this.client.sendMessage(to, logo);

    await this.client
      .sendMessage(to, " Hola👋" + messages.greeting)
      .then((res) => {
        console.log("Saludo enviado exitosamente", res.body);
      })
      .catch((err) => {
        console.error("Error al enviar el saludo:", err);
      });
  }

  async sendInformation(to) {
    await this.client
      .sendMessage(to, messages.information)
      .then((res) => {
        console.log("Mensaje enviado exitosamente:", res.body);
      })
      .catch((err) => {
        console.error("Error al enviar el menú:", err);
      });

    const product1Path = path.resolve(__dirname, "./assets/img/product1.png");
    const product1 = MessageMedia.fromFilePath(product1Path);
    await this.client.sendMessage(to, product1, { caption: messages.product1 });

    const product2Path = path.resolve(__dirname, "./assets/img/product2.png");
    const product2 = MessageMedia.fromFilePath(product2Path);
    await this.client.sendMessage(to, product2, { caption: messages.product2 });

    const product3Path = path.resolve(__dirname, "./assets/img/product3.gif");
    const product3 = MessageMedia.fromFilePath(product3Path);
    await this.client.sendMessage(to, product3, { caption: messages.product3 });

    const product4Path = path.resolve(__dirname, "./assets/img/product4.png");
    const product4 = MessageMedia.fromFilePath(product4Path);
    await this.client.sendMessage(to, product4, { caption: messages.product4 });

    const product5Path = path.resolve(__dirname, "./assets/img/product5.png");
    const product5 = MessageMedia.fromFilePath(product5Path);
    await this.client.sendMessage(to, product5, { caption: messages.product5 });
  }

  async sendQuery(to) {
    await this.client
      .sendMessage(to, messages.support)
      .then((res) => {
        console.log("Mensaje enviados exitosamente:", res.body);
      })
      .catch((err) => {
        console.error("Error al enviar:", err);
      });

    const videoPath = path.resolve(__dirname, "./assets/video/v1.mp4");
    const v1 = MessageMedia.fromFilePath(videoPath);
    await this.client.sendMessage(to, v1).then((res) => {
      console.log("video enviado exitosamente");
    });
  }

  async sendAgenda(to) {
    //TODO: Primero ver si existe el usuario si no registrar
    //TODO: Una vez registrado se puede agendar la cita
    //TODO: la cita debe llevar hora y asunto.
    //TODO: Una vez regitrado la cita se debe mostrar la ubicacion en donde se llevara la cita (UTA)
    const videoPath = path.resolve(__dirname, "./assets/video/v2.mp4");
    const v2 = MessageMedia.fromFilePath(videoPath);
    await this.client.sendMessage(to, v2).then((res) => {
      console.log("video enviado exitosamente");
    });
  }

  async sendComment(to) {
    //TODO: Debe estar registrado si no lo esta registrar
    //TODO: Ingresar el comentario
    const videoPath = path.resolve(__dirname, "./assets/video/v3.mp4");
    const v3 = MessageMedia.fromFilePath(videoPath);
    await this.client.sendMessage(to, v3).then((res) => {
      console.log("video enviado exitosamente");
    });
  }

  async sendInstall(to) {
    await this.client
      .sendMessage(to, messages.install)
      .then((res) => {
        console.log("Pedidos enviados exitosamente:", res.body);
      })
      .catch((err) => {
        console.error("Error al enviar los pedidos:", err);
      });

    const pdfPath = "./assets/install.pdf";
    const pdfMedia = MessageMedia.fromFilePath(pdfPath);

    await this.client
      .sendMessage(to, pdfMedia)
      .then((res) => {
        console.log("PDF enviado exitosamente", res.body);
      })
      .catch((err) => {
        console.error("Error al enviar el PDF:", err);
      });
  }

  async sendUpdate(to) {
    await this.client
      .sendMessage(to, messages.updates)
      .then((res) => {
        console.log("Pedidos enviados exitosamente:", res.body);
      })
      .catch((err) => {
        console.error("Error al enviar los pedidos:", err);
      });
  }

  async sendDocuments(to) {
    await this.client.sendMessage(to, messages.ducumentsGuide);
  }

  async sendDefaultResponse(msg) {
    const defaultMessage =
      "Lo siento, no entendí tu mensaje. Por favor elige una opción:\n\n" +
      messages.greeting;
    await this.client
      .sendMessage(msg.from, defaultMessage)
      .then((res) => {
        console.log("Respuesta predeterminada enviada exitosamente:", res.body);
      })
      .catch((err) => {
        console.error("Error al enviar la respuesta predeterminada:", err);
      });

    const stickerPath = path.resolve(__dirname, "./assets/img/sitcke1.jpg");
    const sticker1 = MessageMedia.fromFilePath(stickerPath);

    await this.client.sendMessage(msg.from, sticker1, {
      sendMediaAsSticker: true,
    });
  }
}

export default MessageHandler;
