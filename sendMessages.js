import pkg from "whatsapp-web.js";
import messages from "./messages.js";
import {
  informacionKeywords,
  consultaKeywords,
  agendarKeywords,
  comentariosKeywords,
} from "./keysWord.js";

const { MessageMedia } = pkg;

class MessageHandler {
  constructor(client) {
    this.client = client;
    this.initialize();
  }

  initialize() {
    this.client.on("message", this.handleMessage.bind(this));
  }

  validKeyWord(word, keysWords) {
    return keysWords.some((keyWord) => word.includes(keyWord));
  }

  async handleMessage(msg) {
    console.log("De: ", msg.from);

    if (
      msg.from != "593979353728@c.us" &&
      msg.from != "593984635564@c.us" &&
      msg.from != "593984493368@c.us"
    ) {
      console.log("Mensaje ignorado de:", msg.from);
      return;
    }

    console.log("Mensaje: ", msg.body);

    // function sleep(ms) {
    //     return new Promise(resolve => setTimeout(resolve, ms));
    // }

    // await sleep(10000);

    const lowerCaseMessage = msg.body.toLowerCase();
    const greetings = ["hola", "buenos", "buenas", "hey", "hi", "hello"];

    if (this.validKeyWord(lowerCaseMessage, greetings)) {
      await this.sendGreeting(msg.from);
    } else if (this.validKeyWord(lowerCaseMessage, informacionKeywords)) {
      await this.sendInformation(msg.from);
    } else if (this.validKeyWord(lowerCaseMessage, consultaKeywords)) {
      await this.sendQuery(msg.from);
    } else if (this.validKeyWord(lowerCaseMessage, agendarKeywords)) {
      await this.sendAgenda(msg.from);
    } else if (this.validKeyWord(lowerCaseMessage, comentariosKeywords)) {
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
    const logo = MessageMedia.fromFilePath("./assets/img/logo.jpg");
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

    const product1 = MessageMedia.fromFilePath("./assets/img/product1.png");
    await this.client.sendMessage(to, product1, { caption: messages.product1 });

    const product2 = MessageMedia.fromFilePath("./assets/img/product2.png");
    await this.client.sendMessage(to, product2, { caption: messages.product2 });

    const product3 = MessageMedia.fromFilePath("./assets/img/product3.gif");
    await this.client.sendMessage(to, product3, { caption: messages.product3 });

    const product4 = MessageMedia.fromFilePath("./assets/img/product4.png");
    await this.client.sendMessage(to, product4, { caption: messages.product4 });

    const product5 = MessageMedia.fromFilePath("./assets/img/product4.png");
    await this.client.sendMessage(to, product5, { caption: messages.product4 });
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

    const media = MessageMedia.fromFilePath("./v1.mp4");
    await this.client.sendMessage(to, media).then((res) => {
      console.log("video enviado exitosamente");
    });
  }

  async sendAgenda(to) {
    
    const media = MessageMedia.fromFilePath("./v2.mp4");
    await this.client.sendMessage(to, media).then((res) => {
      console.log("video enviado exitosamente");
    });
  }

  async sendComment(to) {
    const media = MessageMedia.fromFilePath("./v3.mp4");
    await this.client.sendMessage(to, media).then((res) => {
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
        console.log("PDF enviado exitosamente",res.body);
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

    const stickerPath = "./assets/img/sitcke1.jpg";
    const stickerMedia = MessageMedia.fromFilePath(stickerPath);

    await this.client.sendMessage(to, stickerMedia, {
      sendMediaAsSticker: true,
    });
  }
}

export default MessageHandler;
