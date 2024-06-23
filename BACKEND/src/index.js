const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const userRoutes = require("./routes/users.routes.js")
const scheduleRoutes = require("./routes/schedule.routes.js")
const commentRoutes = require("./routes/commets.routes.js")
const playmentsRoutes = require('./routes/playments.routes.js')
const projectsRoutes = require('./routes/project.routes.js')

const app = express();
// * Middleware (logica de intercambio)
app.use(cors()); // * Habilita CORS para permitir peticiones desde otros dominios
app.use(morgan("dev")); // * Logger de las peticiones HTTP en modo 'dev' solo es para desarrollo despues se quita
app.use(express.json()) // *  Middleware para parsear JSON en las peticiones HTTP

// * Rutas
app.use(userRoutes); // * Rutas para los usuarios
app.use(scheduleRoutes); // * Rutas para los horarios
app.use(commentRoutes); // * Rutas para los comentarios
app.use(paymentsRoutes); // * Rutas para los pagos
app.use(projectsRoutes); // * Rutas para los proyectos

// * Middleware de manejo de errores
app.use((err, req,res, next) => {
    return res.json({
        message: err.message
    })
})

app.listen(4000);
console.log(`Server on port 4000`);