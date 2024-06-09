const pool = require("../db");

const createComment = async (req, res, next) => {
    const { content, id_user } = req.body;
  
    try {
      const result = await pool.query(
        "INSERT INTO COMMENTS (CONTENT, ID_USER) VALUES ($1,$2) RETURNING *",
        [content,id_user]
      );
  
      res.json(result.rows[0]);
    } catch (error) {
      next(error);
    }
  };
  

module.exports = {createComment}