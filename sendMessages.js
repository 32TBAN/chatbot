import pkg from "whatsapp-web.js";
import fs from 'fs';
import messages from "./messages.js";

const { MessageMedia } = pkg;

class MessageHandler {
    constructor(client) {
        this.client = client;
        this.initialize();
    }

    initialize() {
        this.client.on('message', this.handleMessage.bind(this));
    }

    async handleMessage(msg) {
        console.log('Mensaje: ', msg.body);
        console.log('De: ', msg.from);
        
        function sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms));
        }
        
        //await sleep(10000);

        const lowerCaseMessage = msg.body.toLowerCase();

        if (lowerCaseMessage.includes('hola')) {
            await this.sendGreeting(msg.from);
        } else if (lowerCaseMessage === '1') {
            await this.sendSupport(msg.from);
        } else if (lowerCaseMessage === '2') {
            await this.sendInformation(msg.from);
        } else if (lowerCaseMessage === '3') {
            await this.sendQuery(msg.from);
        } else if (lowerCaseMessage === '4') {
            await this.sendFollow(msg.from);
        } else if (lowerCaseMessage === '5') {
            await this.sendError(msg.from);
        } else if (lowerCaseMessage === 'a') {
            await this.sendInstall(msg.from);
        } else if (lowerCaseMessage === 'b') {
            await this.sendUpdate(msg.from);
        } else if (lowerCaseMessage == 'c'){
            await this.sendDocuments(msg.from)
        } else {
            await this.sendDefaultResponse(msg.from);
        }
    }

    async sendGreeting(to) {
        await this.client.sendMessage(to, messages.greeting)
            .then(res => {
                console.log('Saludo enviado exitosamente',res.body);
            })
            .catch(err => {
                console.error('Error al enviar el saludo:', err);
            });

            const stickerPath = './Sin título.jpg'; 
            const stickerMedia = MessageMedia.fromFilePath(stickerPath);

            await this.client.sendMessage(to, stickerMedia, { sendMediaAsSticker: true })
    }

    async sendInformation(to) {
        await this.client.sendMessage(to, messages.information)
            .then(res => {
                console.log('Menú enviado exitosamente:', res.body);
            })
            .catch(err => {
                console.error('Error al enviar el menú:', err);
            });
    }

    async sendSupport(to) {
        await this.client.sendMessage(to, messages.support)
            .then(res => {
                console.log('Pedidos enviados exitosamente:', res.body);
            })
            .catch(err => {
                console.error('Error al enviar los pedidos:', err);
            });
    }

    async sendInstall(to) {
        await this.client.sendMessage(to, messages.install)
            .then(res => {
                console.log('Pedidos enviados exitosamente:', res.body);
            })
            .catch(err => {
                console.error('Error al enviar los pedidos:', err);
            });

            const pdfPath = './install.pdf';
            const pdfMedia = MessageMedia.fromFilePath(pdfPath);
        
            await this.client.sendMessage(to, pdfMedia)
              .then(res => {
                console.log('PDF enviado exitosamente');
              })
              .catch(err => {
                console.error('Error al enviar el PDF:', err);
              });
    }

    async sendUpdate(to) {
        await this.client.sendMessage(to, messages.updates)
            .then(res => {
                console.log('Pedidos enviados exitosamente:', res.body);
            })
            .catch(err => {
                console.error('Error al enviar los pedidos:', err);
            });
    }

    async sendDocuments(to){
        await this.client.sendMessage(to,messages.ducumentsGuide)
    }

    
    async sendQuery(to) {
            const videoMedia  = MessageMedia.fromUrl("");
        
            await this.client.sendMessage(to, videoMedia)
              .then(res => {
                console.log('video enviado exitosamente',res);
              })
              .catch(err => {
                console.error('Error al enviar el video:', err);
              });
    }

    async sendFollow(to) {
        const pdfPath = './SHIKANOKO NOKONOKO KOSHITANTAN.mp4';
        const pdfMedia = MessageMedia.fromFilePath(pdfPath);
    
        await this.client.sendMessage(to, pdfMedia)
          .then(res => {
            console.log('PDF enviado exitosamente');
          })
          .catch(err => {
            console.error('Error al enviar el PDF:', err);
          });          
    }

    async sendFollow(to) {
        const pdfPath = './ラヴィ アクガキコア 【歌ってみた】 Lavie Surii (Akugaki Koa cover).mp4';
        const pdfMedia = MessageMedia.fromFilePath(pdfPath);
    
        await this.client.sendMessage(to, pdfMedia)
          .then(res => {
            console.log('PDF enviado exitosamente');
          })
          .catch(err => {
            console.error('Error al enviar el PDF:', err);
          });
        }

    async sendDefaultResponse(to) {
        const defaultMessage = 'Lo siento, no entendí tu mensaje. Por favor elige una opción:\n\n' + messages.greeting;
        await this.client.sendMessage(to, defaultMessage)
            .then(res => {
                console.log('Respuesta predeterminada enviada exitosamente:', res.body);
            })
            .catch(err => {
                console.error('Error al enviar la respuesta predeterminada:', err);
            });
    }
}

export default MessageHandler