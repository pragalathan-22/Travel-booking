const router = require("express").Router();
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const { getUsers, deleteUser } = require("../controllers/userController");

// Get users (optionally filter by role, e.g. /api/users?role=driver)
router.get("/", auth, role(["admin"]), getUsers);

// Delete user
router.delete("/:id", auth, role(["admin"]), deleteUser);

module.exports = router;

