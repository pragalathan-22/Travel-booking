const User = require("../models/User");

// Get all users (optionally filter by role via ?role=driver)
exports.getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) {
      filter.role = req.query.role;
    }

    const users = await User.find(filter);
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

// Delete a user by id
exports.deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: "User deleted" });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

