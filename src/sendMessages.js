import pkg from "whatsapp-web.js";
import path from "path"; // * MOdulo para manejar rutas
import { fileURLToPath } from "url"; // * Es para una URl convertirla en rutas de arhivo
import fs from "fs"; // * para manejar el sistema de archivos
import messages from "./messages.js"; // * mensajes de respuesta del chatbot

import {
  searchPhone,
  registerUser,
  addSchedule,
  existSchedule,
  addComment,
  projectByPhone,
  generateReports,
  paymentByProyect,
  messageReports,
  addProject,
} from "./func/services.functions.js"; // * Funciones para el manejo con la base de datos

import {
  informacionKeywords,
  consultaKeywords,
  agendarKeywords,
  comentariosKeywords,
} from "./keysWord.js"; // * utilizado para respuesta que de el cliente

import {
  validKeyWord,
  validateEmail,
  formatIcsDateTime,
  incrementHour,
  validateDate,
  validateTime,
} from "./func/functions.js"; // * funciones varias para funcionamiento del chatbot

import { generatePDF } from "./repots.js"; // * Generacion de un reportes pedidos

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename); //*para obtener rutas de assets o ducumentos

const { MessageMedia, Location } = pkg;

// * Clase para el manejo mensajes
class MessageHandler {
  constructor(client) {
    this.client = client;
    this.pendingRegistrations = {}; // * Para almacenar el estado de registro de los usuarios
    this.pendingSchedules = {}; // * Para almacenar el estado de las citas pendientes
    this.pendingComment = {}; // * Para almacenar el estado del comentario
    this.initialize();
  }

  initialize() {
    this.client.on("message", this.handleMessage.bind(this));
  }
  // * Manejo de mensajes
  async handleMessage(msg) {
    console.log("De: ", msg.from);

    if (
      msg.from != "593979353728@c.us" &&
      msg.from != "593984635564@c.us" &&
      msg.from != "593984493368@c.us" &&
      msg.from != "593984725398@c.us" &&
      msg.from != "593995547555@c.us" &&
      msg.from != "593994054631@c.us"
    ) {
      // * Adicional para pruebas, ignora numeros que no esten en el if
      console.log("Mensaje ignorado de:", msg.from);
      return;
    }

    console.log("Mensaje: ", msg.body);

    // * Manejo de registro pendiente
    if (this.pendingRegistrations[msg.from]) {
      console.log(this.pendingRegistrations);
      await this.handlePendingRegistration(msg);
      return;
    }

    // * busca al usuario por el numero
    const user = await searchPhone(msg.from);
    if (user != null) {
      // * si el usuario ya esta registrado muestra las opciones
      await this.processMessageForRegisteredUser(msg, user);
    } else {
      // * si no lo regitra
      await this.promptRegistration(msg.from);
    }
  }

  // * Manejo de registro pendiente
  // * Dependiendo el paso en el que se encuentre se mostrara un mensaje diferente
  async handlePendingRegistration(msg) {
    const registrationState = this.pendingRegistrations[msg.from];
    if (registrationState.step === 1) {
      registrationState.name = msg.body.trim();
      registrationState.step = 2;
      await this.client.sendMessage(msg.from, messages.email);
    } else if (registrationState.step === 2) {
      registrationState.email = msg.body.trim();
      if (validateEmail(registrationState.email)) {
        // * valida el email
        await registerUser(registrationState);
        delete this.pendingRegistrations[msg.from];
        await this.client.sendMessage(msg.from, messages.register);
      } else {
        await this.client.sendMessage(msg.from, messages.invalidEmail);
      }
    }
  }

  // * Procesa mensajes para usuarios registrados
  async processMessageForRegisteredUser(msg, user) {
    const lowerCaseMessage = msg.body.toLowerCase();

    const greetings = ["hola", "buenos", "buenas", "hey", "hi", "hello"];
    if (this.pendingSchedules[msg.from]) {
      await this.handlePendingSchedule(msg, user);
      return;
    }
    if (this.pendingComment[msg.from]) {
      await this.handlePendingComment(msg, user);
      return;
    }
    // * En todos los if valida si el usurio dijo una palabra relasionado para mostrar el mensaje o solo la letra o numero
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
      await this.sendPrice(msg.from);
    } else if (lowerCaseMessage === "d") {
      await this.sendPromo(msg.from);
    } else if (lowerCaseMessage == "e") {
      await this.sendProjectStatus(msg.from);
    } else if (lowerCaseMessage == "!reportes") {
      await this.sendReports(msg.from);
    } else if (lowerCaseMessage == "!videos") {
      await this.sendVideos(msg.from);
    } else {
      await this.sendDefaultResponse(msg);
    }
  }

  // * Solicita el registro de un nuevo usuario entrando despues al registro pendiente
  async promptRegistration(to) {
    if (!this.pendingRegistrations[to] || this.pendingRegistrations[to].step == 0) {
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
          this.pendingRegistrations[to] = { phone: to, step: 0 };
        }
      }
    };

    this.client.once("message_create", registrationHandler);
  }

  // * desde aqui hay Metodos para enviar mensajes dependiendo de la opcion
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

    // const videoPath = path.resolve(__dirname, "./assets/video/v1.mp4");
    // const v1 = MessageMedia.fromFilePath(videoPath);
    // await this.client.sendMessage(to, v1).then((res) => {
    //   console.log("video enviado exitosamente");
    // });
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

  // * manejo para agendar una cita y denpendiendo del paso en el que se encuentre mostrara un mensaje
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
        if (await existSchedule(scheduleState)) {
          await this.client.sendMessage(msg.from, messages.existSchedule);
          scheduleState.step = 1;
        } else {
          await this.client.sendMessage(msg.from, messages.subjectAppointment);
          scheduleState.step = 4;
        }
      } else {
        await this.client.sendMessage(msg.from, messages.invalidHour);
      }
      //scheduleState.step = 4;
    } else if (scheduleState.step === 4) {
      scheduleState.subject = msg.body.trim();

      // * Crear y enviar el archivo de evento .ics para guardar el evento en el calendario del celular
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

      await this.client.sendMessage(
        msg.from,
        `${messages.succesfullAppointment} *${scheduleState.date}* a las *${scheduleState.time}*`
      );
      const dataSchedule = await addSchedule(scheduleState, user);
      await addProject(dataSchedule, user);
      delete this.pendingSchedules[msg.from];
    }
  }

  ///** Activa el proceso de realizar un comentario o sugerencia*/
  async sendComment(to) {
    await this.client.sendMessage(to, messages.comments);
    this.pendingComment[to] = { step: 1 };
  }

  //** Anade el comentario a la base de datos*/
  async handlePendingComment(msg, user) {
    const comment = msg.body.trim();
    await addComment({ content: comment, id_user: user.id });
    await this.client.sendMessage(msg.from, messages.thankYouForComment);
    delete this.pendingComment[msg.from];

    // const videoPath = path.resolve(__dirname, "./assets/video/v3.mp4");
    // const v3 = MessageMedia.fromFilePath(videoPath);
    // await this.client.sendMessage(msg.from, v3).then((res) => {
    //   console.log("video enviado exitosamente");
    // });
  }

  // * envia el pdf ded instalasion
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

  //* envia informacion sobre actualizaciones
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

  // * envia precios de productos
  async sendPrice(to) {
    await this.client.sendMessage(to, messages.pricingMessage);
  }

  // * envia promociones
  async sendPromo(to) {
    await this.client.sendMessage(to, messages.promo1);
    await this.client.sendMessage(to, messages.promo2);
    await this.client.sendMessage(to, messages.promo3);
    await this.client.sendMessage(to, messages.promo4);
    await this.client.sendMessage(to, messages.promo5);
  }

  // * envia el estado de los proyectos si es que tiene
  async sendProjectStatus(to) {
    try {
      const projects = await projectByPhone(to);

      if (!projects || !Array.isArray(projects) || projects.length === 0) {
        await this.client.sendMessage(to, messages.noProject);
        return;
      }

      for (const project of projects) {
        const payproyect = await paymentByProyect(project.id);
        const formattedDueDate = new Date(payproyect[0].due_date)
          .toISOString()
          .split("T")[0];
        const message = `
        📋 *Estado del Proyecto*
        
        *Nombre del proyecto:* ${project.name}
        *Estado actual:* ${project.status}
        *Fecha límite de pago:* ${formattedDueDate}
        
        Por favor, asegúrese de realizar el pago antes de la fecha indicada.
        
        Gracias.
              `;
        await this.client.sendMessage(to, message.trim());
      }
    } catch (error) {
      console.error("Error al enviar el estado del proyecto:", error);
      await this.client.sendMessage(
        to,
        "Hubo un error al recuperar el estado del proyecto. Por favor, inténtelo de nuevo más tarde."
      );
    }
  }

  // * envia los reportes
  async sendReports(to) {
    const reports = await messageReports();
    await this.client.sendMessage(to, reports);

    try {
      const dataInfo = await generateReports();

      // * Crear el contenido HTML del PDF
      const htmlContent = `
        <html>
        <head>
          <title>Reportes</title>
          <style>
            body { font-family: Arial, sans-serif; }
            h1 { text-align: center; }
            .report { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Reportes</h1>
          <div class="report">
            <h2>Nuevos Clientes</h2>
            <pre>${dataInfo.newClientsReport}</pre>
          </div>
          <div class="report">
            <h2>Cartera Reportada</h2>
            <pre>${dataInfo.reportedPortfolioReport}</pre>
          </div>
          <div class="report">
            <h2>Cartera Cobrada</h2>
            <pre>${dataInfo.collectedPortfolioReport}</pre>
          </div>
        </body>
        </html>
      `;

      // Generar el PDF
      const pdfBuffer = await generatePDF(htmlContent);

      // Guardar el PDF en el sistema de archivos temporalmente
      const pdfPath = path.resolve(__dirname, "./reportes.pdf");
      fs.writeFileSync(pdfPath, pdfBuffer);

      // Enviar el PDF a través de WhatsApp
      const pdfMedia = MessageMedia.fromFilePath(pdfPath);
      await this.client.sendMessage(to, pdfMedia);

      // Eliminar el archivo temporal después de enviarlo
      fs.unlinkSync(pdfPath);
    } catch (error) {
      console.error("Error al generar o enviar el PDF:", error);
      await this.client.sendMessage(
        to,
        "Hubo un error al generar los reportes. Por favor, inténtelo de nuevo más tarde."
      );
    }
  }
  // * mensaje por defecto si no se reconoce una palabra clave o numero o letra
  async sendDefaultResponse(msg) {
    const stickerPath = path.resolve(__dirname, "./assets/img/sitcke1.jpg");
    const sticker1 = MessageMedia.fromFilePath(stickerPath);

    await this.client.sendMessage(msg.from, sticker1, {
      sendMediaAsSticker: true,
    });

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
  }

  async sendVideos(msg) {
    const videopath1 = path.resolve(__dirname, "./assets/video/v1.mp4");
    const v1 = MessageMedia.fromFilePath(videopath1);
    await this.client.sendMessage(msg.from, v1);

    const videopath2 = path.resolve(__dirname, "./assets/video/v2.mp4");
    const v2 = MessageMedia.fromFilePath(videopath2);
    await this.client.sendMessage(msg.from, v2);

    const videopath3 = path.resolve(__dirname, "./assets/video/v3.mp4");
    const v3 = MessageMedia.fromFilePath(videopath3);
    await this.client.sendMessage(msg.from, v3);

    const videopath4 = path.resolve(__dirname, "./assets/video/v4.mp4");
    const v4 = MessageMedia.fromFilePath(videopath4);
    await this.client.sendMessage(msg.from, v4);
  }
}

export default MessageHandler;
