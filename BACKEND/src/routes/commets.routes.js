const { Router } = require("express");
const { createComment } = require("../controllers/commets.controller.js");

const router = Router();

router.post("/comment", createComment);

module.exports = router;
