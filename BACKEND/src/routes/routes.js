const { Router } = require("express")
const {
  createUser,
  getAllUser,
  getUser,
} =  require("../controllers/controller.js")

const router = Router();

router.post("/user", createUser);

router.get("/users", getAllUser);

router.get("/user/:id", getUser);

module.exports = router;