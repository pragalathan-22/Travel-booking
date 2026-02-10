const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const bc = require("../controllers/bookingController");

// User: create booking (with or without vehicleId; distanceKm, durationMinutes, totalPrice from app)
router.post("/", auth, role(["user"]), bc.createBooking);
// User: my bookings
router.get("/my", auth, role(["user"]), bc.getMyBookings);
// User: confirm booking with selected vehicle (body: { vehicleId })
router.put("/:id/confirm", auth, role(["user"]), bc.confirmBooking);

// Driver: my bookings (for my vehicles)
router.get("/driver", auth, role(["driver"]), bc.getDriverBookings);
// Driver: accept trip
router.put("/:id/confirm-driver", auth, role(["driver"]), bc.driverConfirm);
// Driver: start trip
router.put("/:id/start", auth, role(["driver"]), bc.startTrip);
// Driver: complete trip
router.put("/:id/complete", auth, role(["driver"]), bc.completeTrip);

// Admin: all bookings
router.get("/", auth, role(["admin"]), bc.getBookings);
router.get("/:id", auth, role(["admin"]), bc.getBookingById);
router.put("/:id", auth, role(["admin"]), bc.updateBooking);
router.delete("/:id", auth, role(["admin"]), bc.deleteBooking);

module.exports = router;

