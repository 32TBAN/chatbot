const { Router } = require("express");
const { getProjectByPhone, addProject } = require("../controllers/project.controller.js");

const router = Router();

router.get("/project/:user_id", getProjectByPhone);

router.post("/project", addProject);


module.exports = router;