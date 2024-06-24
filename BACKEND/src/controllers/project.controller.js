const pool = require("../db");

const getProjectByPhone = async (req, res, next) => {
  const { user_id } = req.params;
  try {
    const result = await pool.query(
      "SELECT p.id, p.name, p.status " +
        "FROM projects AS p " +
        "JOIN schedules AS s ON p.id_schedule = s.id " +
        "WHERE s.id_user = $1;",
      [user_id]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

const addProject = async (req, res, next) => {
  const { name, deliverDate, status, idSchedule} = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO PROJECTS (NAME, DELIVER_DATE, STATUS, ID_SCHEDULE) VALUES ($1,$2,$3,$4) RETURNING *",
      [name, deliverDate, status, idSchedule]
    );

    res.json(result.rows[0]);
  } catch (error) {
    next(error)
  }
}

module.exports = { getProjectByPhone , addProject};
