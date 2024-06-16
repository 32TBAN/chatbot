const { Router } = require("express")
const {
  createUser,
  getAllUser,
  getUser,getUserID
} =  require("../controllers/users.controller.js")

const router = Router();

router.post("/user", createUser);

router.get("/users", getAllUser);

router.get("/user/:phone", getUser);

router.get("/userId/:id_user",getUserID)

module.exports = router;
