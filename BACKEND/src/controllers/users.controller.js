const pool = require("../db");

const createUser = async (req, res, next) => {
  const { name, phone, email } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO USERS (NAME, PHONE, EMAIL) VALUES ($1,$2,$3) RETURNING *",
      [name, phone, email]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getAllUser = async (req, res, next) => {
  try {
    const users = await pool.query("SELECT * FROM USERS");
    res.json(users.rows);
  } catch (error) {
    next(error);
  }
};

const getUser = async (req, res, next) => {
  try {
    const { phone } = req.params;
    const user = await pool.query("SELECT * FROM USERS WHERE PHONE = $1", [
      phone,
    ]);

    if (user.rows.length === 0) {
      return res.status(400).json({ message: "user not found" });
    }
    res.json(user.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getUserID = async (req, res, next) => {
  try {
    const { id_user } = req.params;
    const user = await pool.query("SELECT * FROM USERS WHERE ID = $1", [
      id_user,
    ]);
    res.json(user.rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { createUser, getAllUser, getUser, getUserID };
