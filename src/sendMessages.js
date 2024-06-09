import pkg from "whatsapp-web.js";
import messages from "./messages.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import {
  searchPhone,
  registerUser,
  addSchedule,
  existSchedule,
} from "./func/services.functions.js";

import {
  informacionKeywords,
  consultaKeywords,
  agendarKeywords,
  comentariosKeywords,
} from "./keysWord.js";

import {
  validKeyWord,
  validateEmail,
  formatIcsDateTime,
  incrementHour,
  validateDate,
  validateTime,
} from "./func/functions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const { MessageMedia, Location } = pkg;

class MessageHandler {
  constructor(client) {
    this.client = client;
    this.pendingRegistrations = {}; // Para almacenar el estado de registro de los usuarios
    this.pendingSchedules = {}; // Para almacenar el estado de las citas pendientes
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
    if (this.pendingSchedules[msg.from]) {
      await this.handlePendingSchedule(msg, user);
      return;
    }
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
    const product3 = MessageMedia.fromFilePath(product3Path);
    await this.client.sendMessage(to, product3, {
      caption: messages.product3,
      sendVideoAsGif: true,
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
    const latitude = -1.2693696;
    const longitude = -78.648095;
    const location = new Location(latitude, longitude, {
      url: "https://www.google.com/maps/place/Universidad+T%C3%A9cnica+de+Ambato/@-1.2693696,-78.648095,14z/data=!4m10!1m2!2m1!1suniversidad+tecnica+de+ambato!3m6!1s0x91d38225e088295f:0xb16c26da66e6e4b3!8m2!3d-1.2693706!4d-78.6259616!15sCh11bml2ZXJzaWRhZCB0ZWNuaWNhIGRlIGFtYmF0b5IBCnVuaXZlcnNpdHngAQA!16s%2Fm%2F0cpbjgr?entry=ttu",
    });

    await this.client.sendMessage(to, messages.schedule);
    await this.client.sendMessage(to, location);

    await this.client.sendMessage(to, messages.scheduleConfirmed);
    // Guardar el estado de la agenda pendiente
    this.pendingSchedules[to] = { step: 1 };
  }

  async handlePendingSchedule(msg, user) {
    const scheduleState = this.pendingSchedules[msg.from];

    if (scheduleState.step === 1) {
      if (msg.body.toLowerCase() === "si") {
        await this.client.sendMessage(msg.from, messages.formatDate);
        scheduleState.step = 2;
      } else if (msg.body.toLowerCase() === "no") {
        await this.client.sendMessage(msg.from, messages.noSchedule);
        delete this.pendingSchedules[msg.from];
      }
    } else if (scheduleState.step === 2) {
      const date = msg.body.trim();
      if (validateDate(date)) {
        scheduleState.date = date;
        await this.client.sendMessage(msg.from, messages.formatHour);
        scheduleState.step = 3;
      } else {
        await this.client.sendMessage(msg.from, messages.invalidDate);
      }
    } else if (scheduleState.step === 3) {
      const time = msg.body.trim();
      if (validateTime(time)) {
        scheduleState.time = time;
        await this.client.sendMessage(msg.from, messages.subjectAppointment);
        scheduleState.step = 4;
      } else {
        await this.client.sendMessage(msg.from, messages.invalidHour);
      }
      scheduleState.step = 4;

      if (existSchedule(scheduleState)) {
        await this.client.sendMessage(msg.from, messages.existSchedule);
        scheduleState.step = 1;
      }
    } else if (scheduleState.step === 4) {
      scheduleState.subject = msg.body.trim();

      // Crear y enviar el archivo de evento .ics
      const eventIcsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:${scheduleState.subject}
DTSTART:${formatIcsDateTime(scheduleState.date, scheduleState.time)}
DTEND:${formatIcsDateTime(
        scheduleState.date,
        incrementHour(scheduleState.time)
      )}
LOCATION:Universidad Técnica de Ambato
DESCRIPTION:Asunto: ${scheduleState.subject}
END:VEVENT
END:VCALENDAR`;

      const eventPath = path.resolve(__dirname, "./event.ics");
      fs.writeFileSync(eventPath, eventIcsContent);

      const eventMedia = MessageMedia.fromFilePath(eventPath);
      await this.client.sendMessage(msg.from, eventMedia, {
        caption: messages.addAppointment,
      });

      // Enviar video adicional
      const videoPath = path.resolve(__dirname, "./assets/video/v2.mp4");
      const v2 = MessageMedia.fromFilePath(videoPath);
      await this.client.sendMessage(msg.from, v2).then((res) => {
        console.log("Video enviado exitosamente");
      });

      await this.client.sendMessage(msg.from, messages.scheduleConfirmed);
      addSchedule(scheduleState, user);
      delete this.pendingSchedules[msg.from];
    }
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
