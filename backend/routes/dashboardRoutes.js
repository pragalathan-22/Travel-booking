const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { getStats } = require("../controllers/dashboardController");

router.get("/", auth, role(["admin"]), getStats);

module.exports = router;
