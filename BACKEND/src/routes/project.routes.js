const { Router } = require("express");
const { getProjectByPhone } = require("../controllers/project.controller.js");

const router = Router();

router.get("/project/:user_id", getProjectByPhone);

module.exports = router;