const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const mensajes = require('./mensajes')

const client = new Client({
    webVersionCache: {
      type: "remote",
      remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
  });

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('message', msg => {
    console.log('Mensaje: ', msg.body)
    console.log('de: ', msg.from)
    msg.reply(mensajes.managen_chatbot(msg.body, msg.from))
}) 

client.initialize();
