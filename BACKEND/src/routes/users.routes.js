const { Router } = require("express")
const {
  createUser,
  getAllUser,
  getUser,
} =  require("../controllers/users.controller.js")

const router = Router();

router.post("/user", createUser);

router.get("/users", getAllUser);

router.get("/user/:phone", getUser);

module.exports = router;