const express = require("express")
const cors = require("cors")
const morgan = require("morgan")
const router = require("./routes/users.routes.js")

const app = express();

app.use(cors());
app.use(morgan("dev"));
app.use(express.json())

app.use(router);

app.use((err, req,res, next) => {
    return res.json({
        message: err.message
    })
})

app.listen(4000);
console.log(`Server on port 4000`);