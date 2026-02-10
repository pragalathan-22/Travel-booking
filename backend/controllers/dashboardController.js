const User = require("../models/User");
const Vehicle = require("../models/Vehicle");
const Booking = require("../models/Booking");

exports.getStats = async (req, res) => {
  try {
    const [totalUsers, totalDrivers, totalVehicles, totalBookings, pendingVehicles, approvedVehicles] = await Promise.all([
      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "driver" }),
      Vehicle.countDocuments(),
      Booking.countDocuments(),
      Vehicle.countDocuments({ status: "pending" }),
      Vehicle.countDocuments({ status: "approved" })
    ]);

    const completedBookings = await Booking.countDocuments({ status: "completed" });
    const totalRevenue = await Booking.aggregate([
      { $match: { status: "completed" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } }
    ]);
    const revenue = totalRevenue[0]?.total || 0;

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("user", "name email")
      .populate("vehicle", "name type numberPlate");

    const pendingVehiclesList = await Vehicle.find({ status: "pending" })
      .populate("driver", "name email");

    res.json({
      totalUsers,
      totalDrivers,
      totalVehicles,
      totalBookings,
      pendingVehicles,
      approvedVehicles,
      completedBookings,
      revenue,
      recentBookings,
      pendingVehiclesList
    });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
