const { Router } = require("express")
const {
    createSchedule,
    getAllSchedule,
} =  require("../controllers/schedules.controller.js")

const router = Router();

router.post("/schedule", createSchedule);

router.get("/schedules", getAllSchedule);

module.exports = router;