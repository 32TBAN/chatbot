const { Client, Buttons, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: "sessions",
    }),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
    }});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.on('message', msg => {
    console.log('Mensaje: ', msg.body);
    console.log('de: ', msg.from);

    if (msg.body.toLowerCase() === 'hola') {
        const response = 'Hola! 👋 soy un chatbot. ¿Cómo puedo ayudarte hoy?\n\n' +
                         '1. ✅ Servicios\n' +
                         '2. 📅 Agendar cita\n\n' +
                         'Responde con el número de la opción que deseas.';
        client.sendMessage(msg.from, response)
            .then(response => {
                console.log('Mensaje enviado exitosamente:');
            })
            .catch(err => {
                console.error('Error al enviar el mensaje:', err);
            });
    } else if (msg.body === '1') {
        client.sendMessage(msg.from, 'Has seleccionado ✅ Servicios. ¿En qué podemos ayudarte específicamente?')
            .then(response => {
                console.log('Mensaje enviado exitosamente:');
            })
            .catch(err => {
                console.error('Error al enviar el mensaje:', err);
            });
    } else if (msg.body === '2') {
        client.sendMessage(msg.from, 'Has seleccionado 📅 Agendar cita. Por favor, proporciona una fecha y hora para tu cita.')
            .then(response => {
                console.log('Mensaje enviado exitosamente:');
            })
            .catch(err => {
                console.error('Error al enviar el mensaje:', err);
            });
    } else {
        client.sendMessage(msg.from, 'Lo siento, no entendí tu mensaje. Por favor, responde con el número de la opción que deseas.')
            .then(response => {
                console.log('Mensaje enviado exitosamente:');
            })
            .catch(err => {
                console.error('Error al enviar el mensaje:', err);
            });
    }
});
 

client.initialize().catch(err => {
    console.error('Error al inicializar el cliente:', err);
  });
