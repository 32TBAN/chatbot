const pg = require('pg');
const { db } = require("./config.js");

// Crear un nuevo pool de conexiones utilizando la configuración proporcionada
const pool = new pg.Pool({
  user: db.user,         // Usuario de la base de datos
  password: db.password, // Contraseña del usuario
  host: db.host,         // Host de la base de datos
  port: db.port,         // Puerto de la base de datos
  database: db.database, // Nombre de la base de datos
});

// Escuchar el evento 'connect' para imprimir un mensaje cuando se conecte a la base de datos
pool.on('connect', () => console.log('DB connected'));

// Exportar el pool de conexiones para poder ser utilizado en otros módulos
module.exports = pool;