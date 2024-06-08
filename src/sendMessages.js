import pkg from "whatsapp-web.js";
import messages from "./messages.js";
import {
  searchPhone,
  validKeyWord,
  registerUser,
  validateEmail,
} from "./methods.js";
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
    // Manejo de registro pendiente
    if (this.pendingRegistrations[msg.from]) {
      console.log(this.pendingRegistrations);
      await this.handlePendingRegistration(msg);
      return;
    }

    const user = await searchPhone(msg.from);
    if (user != null) {
      await this.processMessageForRegisteredUser(msg, user);
    } else {
      await this.promptRegistration(msg.from);
    }
  }

  async handlePendingRegistration(msg) {
    const registrationState = this.pendingRegistrations[msg.from];
    if (registrationState.step === 1) {
      registrationState.name = msg.body.trim();
      registrationState.step = 2;
      await this.client.sendMessage(msg.from, messages.email);
    } else if (registrationState.step === 2) {
      registrationState.email = msg.body.trim();
      if (validateEmail(registrationState.email)) {
        await registerUser(registrationState);
        delete this.pendingRegistrations[msg.from];
        await this.client.sendMessage(msg.from, messages.register);
      } else {
        await this.client.sendMessage(msg.from, messages.invalidEmail);
      }
    }
  }

  async processMessageForRegisteredUser(msg, user) {
    const lowerCaseMessage = msg.body.toLowerCase();

    const greetings = ["hola", "buenos", "buenas", "hey", "hi", "hello"];

    if (validKeyWord(lowerCaseMessage, greetings)) {
      await this.sendGreetingMessage(msg.from, user.name);
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
    } else if (lowerCaseMessage === "c") {
      await this.sendDocuments(msg.from);
    } else {
      await this.sendDefaultResponse(msg);
    }
  }

  async promptRegistration(to) {
    if (!this.pendingRegistrations[to]) {
      const logoPath = path.resolve(__dirname, "./assets/img/logo.jpg");
      const logo = MessageMedia.fromFilePath(logoPath);
      await this.client.sendMessage(to, logo, {
        caption: messages.numberNotFound,
      });
      this.pendingRegistrations[to] = { phone: to, step: 0 };
    }

    const registrationHandler = async (responseMsg) => {
      if (responseMsg.from === to) {
        if (responseMsg.body.toLowerCase() === "si") {
          await this.client.sendMessage(to, messages.name);
          this.pendingRegistrations[to] = { phone: to, step: 1 };
        } else if (responseMsg.body.toLowerCase() === "no") {
          await this.client.sendMessage(to, messages.noRegister);
        }
      }
    };

    this.client.once("message_create", registrationHandler);
  }

  async sendGreetingMessage(to, name) {
    const logoPath = path.resolve(__dirname, "./assets/img/logo.jpg");
    const logo = MessageMedia.fromFilePath(logoPath);
    await this.client.sendMessage(to, logo, {
      caption: "Hola👋 *" + name + "* " + messages.greeting,
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

    const product3Path = path.resolve(__dirname, "./assets/video/product3.mp4");
    const product3 = MessageMedia.fromUrl(product3Path);
    await this.client.sendMessage(to, product3, {
      caption: messages.product3,sendVideoAsGif: true,
    });

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

    const pdfPath = path.resolve(__dirname, "./assets/install.pdf");
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
