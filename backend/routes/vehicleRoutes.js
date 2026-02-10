const router = require("express").Router();
const path = require("path");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { uploadVehicleFiles } = require("../middleware/uploadMiddleware");
const vc = require("../controllers/vehicleController");

// Admin: all vehicles
router.get("/", auth, vc.getVehicles);
// Public/User (optional auth): available vehicles for booking
router.get("/available", vc.getAvailable);
router.get("/nearby", vc.getNearby);

// Driver: add vehicle (with licence/image upload)
router.post("/", auth, role(["driver"]), uploadVehicleFiles, vc.addVehicle);
// Driver: my vehicles
router.get("/my", auth, role(["driver"]), vc.getMyVehicles);

// Admin: approve / reject / delete
router.put("/approve/:id", auth, role(["admin"]), vc.approveVehicle);
router.put("/reject/:id", auth, role(["admin"]), vc.rejectVehicle);
router.delete("/:id", auth, role(["admin"]), vc.deleteVehicle);

module.exports = router;
