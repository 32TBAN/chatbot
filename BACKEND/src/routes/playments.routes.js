const { Router } = require("express");
const {
  getPaymentByIdProject,
  getNewClients,
  getPortfolio,
  getCollectedPortfolio,
  getAllPlatments
} = require("../controllers/payments.controllers.js");

const router = Router();

router.get("/payment/:idProject", getPaymentByIdProject);

router.get("/getNewClients", getNewClients);

//* proyectos o ventas que han sido registrados o reportados como realizadas o en progreso
router.get("/getPortfolio", getPortfolio);

//* proyectos o ventas en los cuales el pago ha sido recibido completamente.
router.get("/getCollectedPortfolio", getCollectedPortfolio);

router.get("/getAllPlatments",getAllPlatments)

module.exports = router;
