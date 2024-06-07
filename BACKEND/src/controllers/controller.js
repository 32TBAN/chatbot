const pool = require("../db")

const createUser = async (req, res) => {
    res.send("Crear usuario")
}

const getAllUser = async (req, res) => {
    res.send("Todos los usuarios")
}


const getUser = async (req, res) => {
    res.send("Un usuario")
}

module.exports = { createUser, getAllUser, getUser }