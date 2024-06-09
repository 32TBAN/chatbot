const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const userRoutes = require("./routes/users.routes.js")
const scheduleRoutes = require("./routes/schedule.routes.js")
const commentRoutes = require("./routes/commets.routes.js")

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json())

app.use(userRoutes);
app.use(scheduleRoutes);
app.use(commentRoutes);


app.use((err, req,res, next) => {
    return res.json({
        message: err.message
    })
})

app.listen(4000);
console.log(`Server on port 4000`);