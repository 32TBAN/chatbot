const pool = require("../db");

const createSchedule = async (req, res, next) => {
  const { date, hour, description, id_user } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO SCHEDULES (DATE, HOUR, DESCRIPTION, ID_USER) VALUES ($1,$2,$3,$4) RETURNING *",
      [date, hour, description, id_user]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
};

const getAllSchedule = async (req, res, next) => {
  try {
    const schedules = await pool.query("SELECT * FROM SCHEDULES");
    res.json(schedules.rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { createSchedule, getAllSchedule };